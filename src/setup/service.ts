import { runCommand } from '@helpers/run-command';
import { isDryRun, isLocalHost, tryExec, waitForHttp } from '@helpers/system';
import fs from 'fs';
import path from 'path';
import pc from 'picocolors';

export const serviceName = (odooUser: string) => `${odooUser}-server`;
export const configPath = (odooUser: string) => `/etc/${odooUser}-server.conf`;
export const unitPath = (odooUser: string) => `/etc/systemd/system/${serviceName(odooUser)}.service`;
export const logrotatePath = (odooUser: string) => `/etc/logrotate.d/${serviceName(odooUser)}`;
export const legacyInitPath = (odooUser: string) => `/etc/init.d/${serviceName(odooUser)}`;
export const logFilePath = (odooUser: string) => `/var/log/${odooUser}/${serviceName(odooUser)}.log`;

export interface ServiceUnitOptions {
  odooUser: string;
  odooHome: string;
  /** Order the unit after (and pull in) the local PostgreSQL service. */
  localPostgres?: boolean;
}

/**
 * Renders a native systemd unit for Odoo.
 *
 * Unlike an init.d script (which systemd wraps as `RemainAfterExit=yes` and therefore keeps
 * "active" after Odoo died) the unit runs Odoo in the foreground, so systemd tracks the real
 * process and restarts it when it crashes or gets OOM-killed.
 */
export const renderServiceUnit = ({ odooUser, odooHome, localPostgres = false }: ServiceUnitOptions): string => {
  const name = serviceName(odooUser);
  const python = path.join(odooHome, 'venv', 'bin', 'python3');
  const odooBin = path.join(odooHome, 'odoo-server', 'odoo-bin');
  const postgres = localPostgres ? 'Wants=postgresql.service\nAfter=network.target postgresql.service' : 'After=network.target';

  return `[Unit]
Description=Odoo (${name})
Documentation=https://www.odoo.com/documentation
${postgres}
StartLimitIntervalSec=300
StartLimitBurst=5

[Service]
Type=simple
User=${odooUser}
Group=${odooUser}
WorkingDirectory=${odooHome}
ExecStart=${python} ${odooBin} --config=${configPath(odooUser)}
SyslogIdentifier=${name}
Restart=on-failure
RestartSec=5s
KillMode=mixed
TimeoutStopSec=120
LimitNOFILE=65536
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
`;
};

/** Logrotate rule for Odoo's log file. `copytruncate` keeps Odoo writing without needing a signal. */
export const renderLogrotate = (odooUser: string, logGlob: string = `/var/log/${odooUser}/*.log`): string => `${logGlob} {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
}
`;

/** Disables and removes an init.d script left behind by older versions of this CLI. */
export const removeLegacyInitScript = async (odooUser: string): Promise<void> => {
  if (!isDryRun() && !fs.existsSync(legacyInitPath(odooUser))) return;
  await runCommand({
    command: `sudo systemctl stop ${serviceName(odooUser)} 2>/dev/null || true; sudo update-rc.d -f ${serviceName(odooUser)} remove; sudo rm -f ${legacyInitPath(odooUser)}`,
    message: 'Removing legacy init.d script.',
    successMessage: 'Legacy init.d script removed.',
  });
};

/**
 * Installs the systemd unit for Odoo and enables it at boot (does not start it).
 */
export async function setupService(odooUser: string, odooHome: string, pgHost: string): Promise<void> {
  const unit = renderServiceUnit({ odooUser, odooHome, localPostgres: isLocalHost(pgHost) });

  try {
    await removeLegacyInitScript(odooUser);

    if (!isDryRun()) {
      fs.writeFileSync(unitPath(odooUser), unit, { encoding: 'utf-8', mode: 0o644 });
    }

    await runCommand({
      command: `sudo systemctl daemon-reload && sudo systemctl enable ${serviceName(odooUser)}`,
      message: 'Creating Odoo systemd service.',
      successMessage: `Odoo systemd service created at: ${unitPath(odooUser)}`,
    });
  } catch (error) {
    console.error(pc.red(`✘ `) + `Failed to create the systemd service: ${error}`);
    process.exit(1);
  }
}

/**
 * Enables log rotation for the Odoo log file.
 */
export const rotateOdooLog = async (odooUser: string): Promise<void> => {
  try {
    if (!isDryRun()) {
      fs.writeFileSync(logrotatePath(odooUser), renderLogrotate(odooUser), { mode: 0o644 });
    }
    console.log(pc.green(`✔ `) + `Configured daily Odoo log rotation at ${logrotatePath(odooUser)}.`);
  } catch (error) {
    console.error(pc.red(`✘ `) + `Failed to create logrotate configuration: ${(error as Error).message}.`);
  }
};

/** Prints the last lines of the systemd journal and Odoo log to help diagnose a failed start. */
export const printServiceDiagnostics = (odooUser: string): void => {
  const journal = tryExec(`journalctl -u ${serviceName(odooUser)} -n 30 --no-pager`);
  const log = tryExec(`tail -n 30 ${logFilePath(odooUser)}`);
  if (journal) console.error(pc.yellow(`--- journalctl -u ${serviceName(odooUser)} ---\n`) + journal);
  if (log) console.error(pc.yellow(`--- ${logFilePath(odooUser)} ---\n`) + log);
};

/**
 * Starts the Odoo service and waits until Odoo answers on its health endpoint.
 *
 * @throws {Error} when systemd cannot start the service or Odoo does not become healthy in time.
 */
export const startOdooService = async (odooUser: string, httpPort: number): Promise<void> => {
  const name = serviceName(odooUser);
  try {
    await runCommand({
      command: `sudo systemctl restart ${name}`,
      message: 'Starting Odoo service...',
      successMessage: 'Odoo service started.',
    });
  } catch (error) {
    printServiceDiagnostics(odooUser);
    throw new Error(`Could not start ${name}. Check: journalctl -u ${name} -n 100`);
  }

  if (isDryRun()) return;

  const healthy = await waitForHttp(`http://127.0.0.1:${httpPort}/web/health`);
  if (!healthy) {
    printServiceDiagnostics(odooUser);
    throw new Error(`${name} is running but Odoo did not respond on port ${httpPort} within 90s.`);
  }
  console.log(pc.green(`✔ `) + `Odoo is up and answering on port ${httpPort}.`);
};
