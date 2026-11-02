import { runCommand } from '@helpers/run-command';
import { computeOdooTuning, isLocalHost, isDryRun, tryExec, waitForHttp, writeFileUnlessDryRun } from '@helpers/system';
import { checkPostgresConnection } from '@setup/postgres';
import {
  configPath,
  legacyInitPath,
  logFilePath,
  logrotatePath,
  renderLogrotate,
  serviceName,
  setupService,
  startOdooService,
  unitPath,
} from '@setup/service';
import { isWkhtmltopdfInstalled } from '@setup/wkhtmltopdf';
import fs from 'fs';
import path from 'path';
import pc from 'picocolors';

export type CheckStatus = 'ok' | 'warn' | 'fail';

export interface CheckResult {
  id: string;
  title: string;
  status: CheckStatus;
  detail?: string;
  /** Present when the problem can be repaired automatically. */
  fix?: {
    description: string;
    /** The Odoo service must be restarted for the fix to take effect. */
    needsRestart?: boolean;
    apply: () => Promise<void>;
  };
}

export interface OdooInstall {
  odooUser: string;
  odooHome: string;
  configFile: string;
  config: Record<string, string>;
}

const SERVICE_SUFFIX = '-server';

/** Parses the `[options]` section of an Odoo configuration file into a key/value map. */
export const parseOdooConf = (text: string): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith(';') || line.startsWith('#') || line.startsWith('[')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    result[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return result;
};

/** Sets `key = value` in an Odoo configuration text, replacing an existing line or appending one. */
export const upsertOdooConf = (text: string, key: string, value: string | number): string => {
  const pattern = new RegExp(`^\\s*${key}\\s*=.*$`, 'm');
  const line = `${key} = ${value}`;
  if (pattern.test(text)) return text.replace(pattern, line);
  return `${text.replace(/\s*$/, '')}\n${line}\n`;
};

/** Finds the installs created by this CLI (`/etc/<user>-server.conf`). */
export const discoverInstalls = (): string[] => {
  try {
    return fs
      .readdirSync('/etc')
      .map((file) => file.match(/^(.+)-server\.conf$/)?.[1])
      .filter((user): user is string => !!user)
      .filter((user) => /addons_path/.test(fs.readFileSync(configPath(user), 'utf-8')));
  } catch {
    return [];
  }
};

export const loadInstall = (odooUser: string): OdooInstall => {
  const configFile = configPath(odooUser);
  const config = parseOdooConf(fs.readFileSync(configFile, 'utf-8'));
  const firstAddons = (config.addons_path || '').split(',')[0]?.trim() ?? '';
  const odooHome = firstAddons.endsWith('/odoo-server/addons')
    ? firstAddons.slice(0, -'/odoo-server/addons'.length)
    : tryExec(`getent passwd ${odooUser}`)?.split(':')[5] || `/home/${odooUser}`;
  return { odooUser, odooHome, configFile, config };
};

const systemctlShow = (name: string, props: string[]): Record<string, string> => {
  const out = tryExec(`systemctl show ${name} --no-pager -p ${props.join(',')}`) ?? '';
  return Object.fromEntries(
    out
      .split('\n')
      .filter((line) => line.includes('='))
      .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]),
  );
};

const backup = (file: string) => {
  const target = `${file}.bak-${Date.now()}`;
  if (!isDryRun()) fs.copyFileSync(file, target);
  return target;
};

const httpPortOf = (install: OdooInstall) => Number(install.config.http_port || install.config.xmlrpc_port || 8069);
const geventPortOf = (install: OdooInstall) => Number(install.config.gevent_port || install.config.longpolling_port || 8072);

// ---------------------------------------------------------------------------------------------
// Individual checks
// ---------------------------------------------------------------------------------------------

export const checkServiceDefinition = (install: OdooInstall): CheckResult[] => {
  const { odooUser, odooHome, config } = install;
  const name = serviceName(odooUser);
  const hasLegacy = fs.existsSync(legacyInitPath(odooUser));
  const hasUnit = fs.existsSync(unitPath(odooUser));
  const reinstall = {
    description: 'Replace the init.d script with a native systemd unit that restarts Odoo on failure',
    needsRestart: true,
    apply: () => setupService(odooUser, odooHome, config.db_host || 'localhost'),
  };

  if (hasLegacy && !hasUnit) {
    return [{
      id: 'service-definition',
      title: 'Service definition',
      status: 'fail',
      detail: `${legacyInitPath(odooUser)} is a legacy init.d script. systemd cannot track the Odoo process, so the service stays "active" even after Odoo has crashed and is never restarted.`,
      fix: reinstall,
    }];
  }

  if (!hasUnit) {
    return [{ id: 'service-definition', title: 'Service definition', status: 'fail', detail: `${unitPath(odooUser)} not found.`, fix: reinstall }];
  }

  const props = systemctlShow(name, ['Type', 'Restart', 'RemainAfterExit']);
  const problems: string[] = [];
  if (hasLegacy) problems.push(`legacy ${legacyInitPath(odooUser)} still exists next to the systemd unit`);
  if (props.Restart && !['on-failure', 'always', 'on-abnormal'].includes(props.Restart)) problems.push(`Restart=${props.Restart} (Odoo is not restarted after a crash)`);
  if (props.RemainAfterExit === 'yes') problems.push('RemainAfterExit=yes (service stays active after Odoo exits)');

  return [problems.length
    ? { id: 'service-definition', title: 'Service definition', status: 'fail', detail: problems.join('; '), fix: reinstall }
    : { id: 'service-definition', title: 'Service definition', status: 'ok', detail: `${unitPath(odooUser)} (Restart=${props.Restart})` }];
};

export const checkServiceState = (install: OdooInstall): CheckResult[] => {
  const name = serviceName(install.odooUser);
  const props = systemctlShow(name, ['ActiveState', 'SubState', 'MainPID', 'Result', 'NRestarts']);
  const restart = {
    description: `Restart ${name}`,
    needsRestart: true,
    apply: async () => undefined,
  };
  const { ActiveState, SubState, MainPID, Result, NRestarts } = props;

  if (!ActiveState) {
    return [{ id: 'service-state', title: 'Service state', status: 'fail', detail: `systemd does not know ${name}.` }];
  }
  if (ActiveState === 'active' && (SubState === 'exited' || MainPID === '0')) {
    return [{ id: 'service-state', title: 'Service state', status: 'fail', detail: `active (${SubState}) with no running Odoo process: the service reports "active" but Odoo is not running.`, fix: restart }];
  }
  if (ActiveState !== 'active') {
    return [{ id: 'service-state', title: 'Service state', status: 'fail', detail: `${ActiveState} (${SubState}, result: ${Result}). See: journalctl -u ${name} -n 100`, fix: restart }];
  }
  if (Number(NRestarts) > 0) {
    return [{ id: 'service-state', title: 'Service state', status: 'warn', detail: `running (pid ${MainPID}) but systemd restarted it ${NRestarts} time(s) since boot. Check: journalctl -u ${name} -n 200` }];
  }
  return [{ id: 'service-state', title: 'Service state', status: 'ok', detail: `running (pid ${MainPID})` }];
};

export const checkHttpHealth = async (install: OdooInstall): Promise<CheckResult[]> => {
  const port = httpPortOf(install);
  const url = `http://127.0.0.1:${port}/web/health`;
  const healthy = await waitForHttp(url, 5_000);
  return [healthy
    ? { id: 'http-health', title: 'HTTP health', status: 'ok', detail: `${url} answers` }
    : { id: 'http-health', title: 'HTTP health', status: 'fail', detail: `${url} does not answer. Odoo is down, still starting, or listening on another port.` }];
};

export const checkWorkerConfig = (install: OdooInstall): CheckResult[] => {
  const { config, configFile } = install;
  const tuning = computeOdooTuning();
  const wanted: Record<string, number> = {
    workers: tuning.workers,
    max_cron_threads: tuning.maxCronThreads,
    limit_memory_soft: tuning.limitMemorySoft,
    limit_memory_hard: tuning.limitMemoryHard,
    limit_time_cpu: tuning.limitTimeCpu,
    limit_time_real: tuning.limitTimeReal,
  };

  const missing = Object.keys(wanted).filter((key) => !config[key]);
  const threaded = Number(config.workers || 0) === 0;
  if (threaded) {
    if (!missing.includes('workers')) missing.push('workers');
  }

  if (!missing.length) {
    return [{ id: 'worker-config', title: 'Workers & memory limits', status: 'ok', detail: `workers = ${config.workers}, limit_memory_soft = ${config.limit_memory_soft}` }];
  }

  return [{
    id: 'worker-config',
    title: 'Workers & memory limits',
    status: 'warn',
    detail: `${missing.join(', ')} not set${threaded ? ' (workers = 0 runs Odoo threaded: no websocket on the gevent port and no memory protection)' : ''}. Without limits a runaway request can get Odoo OOM-killed.`,
    fix: {
      description: `Set ${missing.map((key) => `${key} = ${wanted[key]}`).join(', ')} in ${configFile} (existing values are kept)`,
      needsRestart: true,
      apply: async () => {
        const original = fs.readFileSync(configFile, 'utf-8');
        let updated = original;
        for (const key of missing) updated = upsertOdooConf(updated, key, wanted[key]);
        backup(configFile);
        writeFileUnlessDryRun(configFile, updated, 0o640);
      },
    },
  }];
};

export const checkLogging = (install: OdooInstall): CheckResult[] => {
  const { odooUser, config } = install;
  const logfile = config.logfile;
  if (!logfile) {
    return [{ id: 'logging', title: 'Log rotation', status: 'ok', detail: 'Odoo logs to stdout/journald (rotated by journald).' }];
  }

  const results: CheckResult[] = [];
  const rotate = logrotatePath(odooUser);
  const rotateText = fs.existsSync(rotate) ? fs.readFileSync(rotate, 'utf-8') : '';
  const logGlob = path.join(path.dirname(logfile), '*.log');
  const rotated = rotateText.includes(logGlob) && rotateText.includes('copytruncate');

  results.push(rotated
    ? { id: 'logrotate', title: 'Log rotation', status: 'ok', detail: `${rotate} covers ${logGlob}` }
    : {
        id: 'logrotate',
        title: 'Log rotation',
        status: 'warn',
        detail: `${rotate} ${rotateText ? `does not rotate ${logGlob}` : 'is missing'}: ${logfile} grows without limit and can fill the disk.`,
        fix: {
          description: `Write ${rotate} (daily, 30 days, compressed, copytruncate)`,
          apply: async () => writeFileUnlessDryRun(rotate, renderLogrotate(odooUser, logGlob)),
        },
      });

  try {
    const sizeMb = Math.round(fs.statSync(logfile).size / 1024 / 1024);
    if (sizeMb > 1024) {
      results.push({ id: 'log-size', title: 'Log size', status: 'warn', detail: `${logfile} is ${sizeMb} MB. Run: sudo logrotate -f ${rotate}` });
    }
  } catch {
    // log file not created yet
  }

  const usedPercent = Number(tryExec(`df --output=pcent ${path.dirname(logfile)} | tail -1`)?.replace('%', ''));
  if (usedPercent >= 90) {
    results.push({ id: 'disk', title: 'Disk space', status: 'warn', detail: `${path.dirname(logfile)} is on a filesystem that is ${usedPercent}% full.` });
  }
  return results;
};

export const checkPermissions = (install: OdooInstall): CheckResult[] => {
  const { odooUser, odooHome } = install;
  const results: CheckResult[] = [];

  const groups = tryExec(`id -nG ${odooUser}`)?.split(/\s+/) ?? [];
  results.push(groups.includes('sudo')
    ? {
        id: 'sudo-group',
        title: 'Service account privileges',
        status: 'warn',
        detail: `${odooUser} is in the sudo group: a vulnerability in Odoo or a custom module would give an attacker root.`,
        fix: {
          description: `Remove ${odooUser} from the sudo group`,
          apply: async () => { await runCommand({ command: `sudo deluser ${odooUser} sudo`, mute: true }); },
        },
      }
    : { id: 'sudo-group', title: 'Service account privileges', status: 'ok', detail: `${odooUser} has no sudo rights` });

  const venv = path.join(odooHome, 'venv');
  const venvOwner = tryExec(`stat -c %U ${venv}`);
  if (venvOwner && venvOwner !== odooUser) {
    results.push({
      id: 'venv-owner',
      title: 'Python virtualenv ownership',
      status: 'warn',
      detail: `${venv} is owned by ${venvOwner}, not ${odooUser} (installing Python modules as ${odooUser} fails).`,
      fix: { description: `chown -R ${odooUser}:${odooUser} ${venv}`, apply: async () => { await runCommand({ command: `sudo chown -R ${odooUser}:${odooUser} ${venv}`, mute: true }); } },
    });
  }

  const logDir = path.dirname(install.config.logfile || logFilePath(odooUser));
  const logOwner = tryExec(`stat -c %U ${logDir}`);
  if (logOwner && logOwner !== odooUser) {
    results.push({
      id: 'log-owner',
      title: 'Log directory ownership',
      status: 'fail',
      detail: `${logDir} is owned by ${logOwner}: Odoo cannot write its log file.`,
      fix: { description: `chown ${odooUser}:${odooUser} ${logDir}`, needsRestart: true, apply: async () => { await runCommand({ command: `sudo chown -R ${odooUser}:${odooUser} ${logDir}`, mute: true }); } },
    });
  }
  return results;
};

export const checkOutOfMemory = (): CheckResult[] => {
  const out = tryExec(`journalctl -k --no-pager --since "30 days ago" -g "Out of memory|oom-kill"`);
  const kills = (out ?? '').split('\n').filter((line) => /Killed process/i.test(line) && /(python|odoo)/i.test(line));
  const swap = tryExec('swapon --show --noheadings') ?? '';
  const swapHint = swap ? '' : ' The server has no swap.';
  return [kills.length
    ? { id: 'oom', title: 'Out-of-memory kills', status: 'fail', detail: `${kills.length} Odoo/Python process(es) were killed by the kernel in the last 30 days.${swapHint} Add RAM or swap, or lower workers / limit_memory_soft. Last: ${kills[kills.length - 1].trim()}` }
    : { id: 'oom', title: 'Out-of-memory kills', status: 'ok', detail: `none in the last 30 days.${swapHint}` }];
};

export const checkPostgres = async (install: OdooInstall): Promise<CheckResult[]> => {
  const { config } = install;
  const host = config.db_host && config.db_host !== 'False' ? config.db_host : 'localhost';
  const results: CheckResult[] = [];

  if (isLocalHost(host) && tryExec('systemctl cat postgresql') !== null) {
    const active = tryExec('systemctl is-active postgresql') === 'active';
    if (!active) {
      results.push({
        id: 'postgres-service',
        title: 'PostgreSQL service',
        status: 'fail',
        detail: 'postgresql is not running.',
        fix: { description: 'systemctl enable --now postgresql', needsRestart: true, apply: async () => { await runCommand({ command: 'sudo systemctl enable --now postgresql', mute: true }); } },
      });
    }
  }

  const connected = await checkPostgresConnection(host, Number(config.db_port || 5432), config.db_user, config.db_password);
  results.push(connected
    ? { id: 'postgres', title: 'PostgreSQL connection', status: 'ok', detail: `${config.db_user}@${host}:${config.db_port}` }
    : { id: 'postgres', title: 'PostgreSQL connection', status: 'fail', detail: `Cannot connect as ${config.db_user}@${host}:${config.db_port}. Check db_* settings in ${install.configFile}.` });
  return results;
};

export const checkWkhtmltopdf = (): CheckResult[] =>
  [isWkhtmltopdfInstalled()
    ? { id: 'wkhtmltopdf', title: 'wkhtmltopdf', status: 'ok', detail: String(isWkhtmltopdfInstalled()) }
    : { id: 'wkhtmltopdf', title: 'wkhtmltopdf', status: 'warn', detail: 'not installed: PDF reports cannot be printed.' }];

/** Nginx sites that proxy to this Odoo instance. */
const findNginxSites = (install: OdooInstall): string[] => {
  const dir = '/etc/nginx/sites-enabled';
  const port = httpPortOf(install);
  try {
    return fs
      .readdirSync(dir)
      .map((file) => path.join(dir, file))
      .filter((file) => fs.readFileSync(file, 'utf-8').includes(`127.0.0.1:${port}`));
  } catch {
    return [];
  }
};

/** Applies the nginx corrections to `text`; returns the same text when nothing needs changing. */
export const fixNginxConfigText = (text: string, geventPort: number): string => {
  let result = text;
  const hasTls = /listen\s+443|ssl_certificate/.test(result);

  if (!/proxy_http_version\s+1\.1/.test(result)) {
    result = result.replace(
      new RegExp(`(proxy_pass\\s+http://127\\.0\\.0\\.1:${geventPort};)`),
      '$1\n    proxy_http_version 1.1;',
    );
  }
  if (!/client_max_body_size/.test(result)) {
    result = result.replace(/(server_name\s+[^;]+;)/, '$1\n  client_max_body_size 100m;');
  }
  if (!hasTls) {
    // Secure cookies are never sent back over plain HTTP, which makes logging in impossible
    result = result
      .split('\n')
      .filter((line) => !/proxy_cookie_flags\s+\S+\s+.*\bsecure\b/.test(line) && !/Strict-Transport-Security/.test(line))
      .join('\n');
  }
  return result;
};

export const checkNginx = (install: OdooInstall): CheckResult[] => {
  if (tryExec('which nginx') === null) return [];
  const sites = findNginxSites(install);
  if (!sites.length) return [];

  const results: CheckResult[] = [];
  for (const site of sites) {
    const text = fs.readFileSync(site, 'utf-8');
    const fixed = fixNginxConfigText(text, geventPortOf(install));
    results.push(fixed === text
      ? { id: `nginx:${site}`, title: `Nginx ${path.basename(site)}`, status: 'ok', detail: 'proxy settings look right' }
      : {
          id: `nginx:${site}`,
          title: `Nginx ${path.basename(site)}`,
          status: 'warn',
          detail: 'websocket proxy without HTTP/1.1, no upload size limit, or Secure cookies without SSL (login fails over plain HTTP).',
          fix: {
            description: `Patch ${site} (backup kept), validate with nginx -t and reload`,
            apply: async () => {
              const saved = backup(site);
              writeFileUnlessDryRun(site, fixed);
              try {
                await runCommand({ command: 'sudo nginx -t', mute: true });
                await runCommand({ command: 'sudo systemctl reload nginx', mute: true });
              } catch (error) {
                if (!isDryRun()) fs.copyFileSync(saved, site);
                throw new Error(`nginx rejected the patched configuration; ${site} was restored from ${saved}`);
              }
            },
          },
        });
  }
  return results;
};

// ---------------------------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------------------------

export const runChecks = async (install: OdooInstall): Promise<CheckResult[]> => [
  ...checkServiceDefinition(install),
  ...checkServiceState(install),
  ...(await checkHttpHealth(install)),
  ...checkWorkerConfig(install),
  ...checkLogging(install),
  ...checkPermissions(install),
  ...(await checkPostgres(install)),
  ...checkNginx(install),
  ...checkOutOfMemory(),
  ...checkWkhtmltopdf(),
];

const icon = (status: CheckStatus) =>
  status === 'ok' ? pc.green('✔') : status === 'warn' ? pc.yellow('!') : pc.red('✘');

const printResults = (results: CheckResult[]) => {
  for (const r of results) {
    console.log(`${icon(r.status)} ${pc.bold(r.title)}${r.detail ? pc.dim(` - ${r.detail}`) : ''}`);
    if (r.fix && r.status !== 'ok') console.log(`    ${pc.cyan('fix:')} ${r.fix.description}`);
  }
};

export interface DoctorOptions {
  odooUser?: string;
  fix?: boolean;
  confirm: (message: string) => Promise<boolean>;
}

/**
 * Diagnoses (and with `fix` repairs) Odoo installations created by this CLI.
 *
 * @returns {Promise<boolean>} `true` when no failing check remains.
 */
export const runDoctor = async ({ odooUser, fix = false, confirm }: DoctorOptions): Promise<boolean> => {
  const users = odooUser ? [odooUser] : discoverInstalls();
  if (!users.length) {
    console.error(pc.red('✘ ') + `No Odoo installation found (looked for /etc/*-server.conf). Use --user <name> to point at one.`);
    return false;
  }

  let healthy = true;
  for (const user of users) {
    if (!fs.existsSync(configPath(user))) {
      console.error(pc.red('✘ ') + `${configPath(user)} not found.`);
      healthy = false;
      continue;
    }

    const install = loadInstall(user);
    console.log(pc.magenta(`\nChecking ${serviceName(user)} (home: ${install.odooHome})\n`));

    let results = await runChecks(install);
    printResults(results);

    const fixable = results.filter((r) => r.status !== 'ok' && r.fix);
    if (fix && fixable.length) {
      if (await confirm(`Apply ${fixable.length} fix(es) listed above?`)) {
        let restart = false;
        for (const r of fixable) {
          try {
            await r.fix!.apply();
            restart ||= !!r.fix!.needsRestart;
            console.log(pc.green('✔ ') + `fixed: ${r.title}`);
          } catch (error) {
            console.error(pc.red('✘ ') + `could not fix ${r.title}: ${error instanceof Error ? error.message : error}`);
          }
        }
        if (restart) {
          await startOdooService(user, httpPortOf(install)).catch((error) => console.error(pc.red('✘ ') + String(error.message ?? error)));
        }
        console.log(pc.magenta('\nRe-checking...\n'));
        results = await runChecks(loadInstall(user));
        printResults(results);
      }
    } else if (fixable.length) {
      console.log(pc.cyan(`\n${fixable.length} issue(s) can be fixed automatically: re-run with --fix.`));
    }

    const failed = results.filter((r) => r.status === 'fail').length;
    const warned = results.filter((r) => r.status === 'warn').length;
    console.log(`\n${failed ? pc.red(`${failed} failing`) : pc.green('0 failing')}, ${warned ? pc.yellow(`${warned} warning(s)`) : '0 warnings'}`);
    if (failed) healthy = false;
  }
  return healthy;
};
