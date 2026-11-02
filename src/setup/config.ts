import { runCommand } from "@helpers/run-command";
import { computeOdooTuning, isDryRun, OdooTuning } from "@helpers/system";
import crypto from 'crypto';
import fs from "fs";
import path from "path";
import pc from "picocolors";
import { OdooConfigType } from "types";


/**
 * Generates a strong password with a mix of characters.
 * @param length The desired length of the password (default is 16).
 * @returns A randomly generated strong password.
 */
export function generateStrongAdminPassword(length: number = 16): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    return Array.from(crypto.randomFillSync(new Uint32Array(length)))
        .map((x) => charset[x % charset.length])
        .join('');
}

/**
 * Prepares the addons path string by combining the default Odoo server addons, custom addons,
 * and optionally the enterprise addons if `isEnterprise` is enabled.
 *
 * @param {string} odooHome - The base directory of the Odoo installation.
 * @param {boolean} [isEnterprise] - Optional flag to include the enterprise addons path if set to true.
 *
 * @returns {string} - A comma-separated string of the addons paths.
 *
 * @throws {Error} - Throws an error if the custom addons directory cannot be accessed.
 */
export const prepareAddonsPath = (odooHome: string, isEnterprise?: boolean): string => {
    const serverAddonsPath = path.join(odooHome, 'odoo-server/addons');
    const customAddonsPath = path.join(odooHome, 'custom/addons');

    let addonsPath = `${serverAddonsPath}`;

    if (isEnterprise) {
        const enterprisePath = path.join(odooHome, 'enterprise');
        addonsPath += `,${enterprisePath}`;
    }

    addonsPath += `,${customAddonsPath}`;

    const customDirectory = path.join(odooHome, 'custom');

    try {
        if (fs.existsSync(customDirectory)) {
            const directories = fs.readdirSync(customDirectory, { withFileTypes: true });
            directories.forEach((dir) => {
                if (dir.isDirectory() && dir.name !== 'addons') {
                    const repoPath = path.join(customDirectory, dir.name);
                    addonsPath += `,${repoPath}`;
                }
            });
        }
    } catch (error) {
        console.error(pc.red(`Failed to prepare addons path: ${error}`));
        process.exit(1);
    }

    return addonsPath;
};

/**
 * Renders the `[options]` section of the Odoo configuration file.
 *
 * Worker and memory limits are derived from the server hardware (see `computeOdooTuning`) so a
 * runaway request is killed by Odoo itself instead of the kernel OOM killer taking the whole server down.
 */
export const renderOdooConfig = (
    config: Pick<OdooConfigType, 'odooUser' | 'odooHome' | 'isEnterprise' | 'pgHost' | 'pgPort' | 'pgUser' | 'pgPassword' | 'httpPort' | 'geventPort' | 'nginx'> & { adminPassword: string },
    tuning: OdooTuning = computeOdooTuning(),
): string => {
    const { odooUser, odooHome, isEnterprise, pgHost, pgPort, pgUser, pgPassword, adminPassword, httpPort, geventPort, nginx } = config;

    return `
[options]
; General settings
admin_passwd = ${adminPassword}
db_host = ${pgHost}
db_port = ${pgPort}
db_user = ${pgUser}
db_password = ${pgPassword}

; Addons path and other directories
addons_path = ${prepareAddonsPath(odooHome, isEnterprise)}
data_dir = ${path.join(odooHome, ".local/share/Odoo")}
logfile = /var/log/${odooUser}/${odooUser}-server.log

; HTTP and server settings
http_port = ${httpPort}
gevent_port = ${geventPort}
proxy_mode = ${nginx ? 'True' : 'False'}

; Workers and resource limits (sized for this server)
workers = ${tuning.workers}
max_cron_threads = ${tuning.maxCronThreads}
limit_memory_soft = ${tuning.limitMemorySoft}
limit_memory_hard = ${tuning.limitMemoryHard}
limit_time_cpu = ${tuning.limitTimeCpu}
limit_time_real = ${tuning.limitTimeReal}
`.trimStart();
};

/**
 * Sets up the Odoo configuration by writing `/etc/<user>-server.conf` for the provided `config`.
 *
 * @param {OdooConfigType} config - The configuration object containing all the details for setting up Odoo.
 *
 * @returns {Promise<void>} - Returns a promise that resolves when the configuration setup is complete.
 *
 * @throws {Error} - Throws an error if any step in the configuration process fails (e.g., file system issues).
 */
export const setupOdooConfig = async (config: OdooConfigType) => {
    const { odooUser, strongPassword, adminPassword } = config;

    const filePath = `/etc/${odooUser}-server.conf`

    const configContent = renderOdooConfig({
        ...config,
        adminPassword: strongPassword ? generateStrongAdminPassword(16) : adminPassword,
    });

    try {
        if (!isDryRun()) {
            // Create the file readable only by root first, then hand it over to the Odoo user
            fs.writeFileSync(filePath, configContent, { encoding: "utf-8", mode: 0o640 });
        }

        await runCommand({
            command: `sudo chown ${odooUser}:${odooUser} ${filePath} && sudo chmod 640 ${filePath}`,
            message: `Configuring Odoo configuration file.`,
            successMessage: `Odoo configuration file created successfully at: ${filePath}`
        })

    } catch (error) {
        console.error(pc.red(`Failed to create Odoo configuration file: ${error}`));
        process.exit(1);
    }
};
