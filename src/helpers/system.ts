import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import pc from "picocolors";
import { ODOO_VERSION_REQUIREMENTS, SupportedOdooVersion } from "../constants";

/** Single-quotes a value so it can be embedded safely in a shell command. */
export const shellQuote = (value: string): string => `'${value.replace(/'/g, `'\\''`)}'`;

/** Linux user / group / PostgreSQL role names that are safe to embed in shell commands and SQL. */
export const isValidIdentifier = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-z_][a-z0-9_-]{0,31}$/.test(value);

/** PostgreSQL role names: wider than Linux user names, still safe inside a double-quoted SQL identifier. */
export const isValidPgIdentifier = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Za-z_][A-Za-z0-9_.-]{0,62}$/.test(value);

/** Absolute POSIX path without characters that are special to the shell. */
export const isSafeAbsolutePath = (value: unknown): value is string =>
  typeof value === 'string' && /^\/[A-Za-z0-9_./-]*$/.test(value) && !value.includes('..');

export const isDryRun = () => process.env.DRY_RUN === '1';

export const isLocalHost = (host: string) => ['localhost', '127.0.0.1', '::1'].includes(host);

/**
 * Exits with a helpful message unless the CLI runs as root (file writes in /etc need it).
 * Skipped in dry-run mode.
 */
export const assertRoot = () => {
  if (isDryRun()) return;
  if (typeof process.getuid === 'function' && process.getuid() !== 0) {
    console.error(pc.red('✘ ') + 'This command must run as root. Re-run it with sudo, e.g. `sudo npx install-odoo`.');
    process.exit(1);
  }
};

/** Reads `/etc/os-release` into a key/value map (empty when unavailable). */
export const readOsRelease = (): Record<string, string> => {
  try {
    return Object.fromEntries(
      fs
        .readFileSync('/etc/os-release', 'utf-8')
        .split('\n')
        .filter((line) => line.includes('='))
        .map((line) => {
          const [key, ...rest] = line.split('=');
          return [key, rest.join('=').replace(/^"|"$/g, '')];
        }),
    );
  } catch {
    return {};
  }
};

export const MIN_UBUNTU = '22.04';

/** True when Ubuntu release `version` (e.g. "24.04", "25.10") is `min` or newer. Compares year, then month. */
export const isUbuntuAtLeast = (version: string | undefined, min: string): boolean => {
  const parse = (v: string) => v.split('.').map(Number);
  const [year, month = 0] = parse(version ?? '');
  const [minYear, minMonth = 0] = parse(min);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return false;
  return year > minYear || (year === minYear && month >= minMonth);
};

/** Exits unless running on a supported Ubuntu release. Skipped in dry-run mode. */
export const assertSupportedOs = () => {
  if (isDryRun()) return;
  const { ID, VERSION_ID } = readOsRelease();
  if (ID !== 'ubuntu' || !isUbuntuAtLeast(VERSION_ID, MIN_UBUNTU)) {
    console.error(
      pc.red('✘ ') +
        `Unsupported OS (${ID ?? 'unknown'} ${VERSION_ID ?? ''}). Supported: Ubuntu ${MIN_UBUNTU} or newer.`,
    );
    process.exit(1);
  }
};

/**
 * Returns why `version` cannot be installed on Ubuntu `ubuntuVersion`, or `null` when it can.
 * Pure so it can be tested; the caller decides whether to enforce it (not in dry-run mode).
 */
export const odooVersionOsError = (version: string | undefined, ubuntuVersion: string | undefined): string | null => {
  const minUbuntu = ODOO_VERSION_REQUIREMENTS[version as SupportedOdooVersion]?.minUbuntu;
  if (!minUbuntu || !ubuntuVersion) return null;
  if (isUbuntuAtLeast(ubuntuVersion, minUbuntu)) return null;
  return `Odoo ${version} requires Python 3.12 or newer, which needs Ubuntu ${minUbuntu} or newer (this server runs Ubuntu ${ubuntuVersion}).`;
};

export interface OdooTuning {
  workers: number;
  maxCronThreads: number;
  limitMemorySoft: number;
  limitMemoryHard: number;
  limitTimeCpu: number;
  limitTimeReal: number;
}

/**
 * Derives Odoo worker / memory limits from the server's hardware.
 *
 * - at least 2 workers: with `workers = 0` Odoo runs threaded and nothing listens on the gevent
 *   (websocket) port, which breaks the nginx `/websocket` proxy.
 * - at most 2 workers per CPU and 1 worker per GB of RAM.
 * - the soft limit is a per-worker ceiling sized so all processes fit in ~75% of RAM (512MB-2GB).
 */
export const computeOdooTuning = (cpus: number = os.cpus().length, totalMemBytes: number = os.totalmem()): OdooTuning => {
  const memMb = Math.floor(totalMemBytes / 1024 / 1024);
  const workers = Math.max(2, Math.min(cpus * 2, Math.floor(memMb / 1024)));
  const maxCronThreads = memMb < 4096 ? 1 : 2;
  const perProcessMb = Math.floor((memMb * 0.75) / (workers + maxCronThreads));
  const softMb = Math.min(2048, Math.max(512, perProcessMb));
  const MB = 1024 * 1024;
  return {
    workers,
    maxCronThreads,
    limitMemorySoft: softMb * MB,
    limitMemoryHard: Math.floor(softMb * 1.25) * MB,
    limitTimeCpu: 600,
    limitTimeReal: 1200,
  };
};

/** Polls `url` until it answers with HTTP 2xx or the timeout is reached. */
export const waitForHttp = async (url: string, timeoutMs = 90_000): Promise<boolean> => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });
      if (response.ok) return true;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
  return false;
};

/** Runs a read-only command and returns trimmed stdout, or null when it fails. */
export const tryExec = (command: string): string | null => {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
};

/** Writes a file unless running in dry-run mode. */
export const writeFileUnlessDryRun = (file: string, content: string, mode = 0o644) => {
  if (isDryRun()) {
    console.log(pc.yellow(`[DRY RUN] write ${file}`));
    return;
  }
  fs.writeFileSync(file, content, { encoding: 'utf-8', mode });
};
