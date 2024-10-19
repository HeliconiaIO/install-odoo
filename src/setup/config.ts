import { runCommand } from "@helpers/run-command";
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
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
    return Array.from(crypto.randomFillSync(new Uint32Array(length)))
        .map((x) => charset[x % charset.length])
        .join('');
}


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

export const setupOdooConfig = async (config: OdooConfigType) => {

    const {
        odooUser,
        odooHome,
        isEnterprise,
        pgUser,
        pgPassword,
        strongPassword,
        adminPassword,
        httpPort,
        geventPort,
        nginx
    } = config;

    const filePath = `/etc/${odooUser}-server.conf`

    // Define the configuration content
    const configContent = `
[options]
; General settings
admin_passwd = ${strongPassword ? generateStrongAdminPassword(16) : adminPassword}
db_host = localhost
db_port = 5432
db_user = ${pgUser}
db_password = ${pgPassword}

; Addons path and other directories
addons_path = ${prepareAddonsPath(odooHome, isEnterprise)}
data_dir = ${path.join(odooHome, ".local/share/Odoo")}
logfile = /var/log/${odooUser}/odoo.log

; HTTP and server settings
http_port = ${httpPort}
gevent_port = ${geventPort}
proxy_mode = ${nginx}
  `.trim();

    try {
        // Create the directory for the configuration file if it does not exist
        const configDir = path.dirname(filePath);
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }

        // Write the configuration content to the specified file
        fs.writeFileSync(filePath, configContent, { encoding: "utf-8", mode: 0o640 });


        await runCommand({
            command: `sudo chown ${odooUser}:${odooUser} ${filePath}`,
            message: `Configuring Odoo configuration file.`,
            successMessage: `Odoo configuration file created successfully at: ${filePath}`
        })

    } catch (error) {
        console.error(pc.red(`Failed to create Odoo configuration file: ${error}`));
        process.exit(1);
    }
};


/**
 * Creates the start.sh script for the Odoo server using the fs module, sets permissions, and assigns ownership.
 * @param odooHome - The base directory for the Odoo installation.
 * @param odooUser - The system user for running Odoo.
 */
export function createOdooStartup(odooHome: string, odooUser: string): void {
    const scriptPath = path.join(odooHome, "odoo-server", "start.sh");

    console.log(pc.magenta("* Creating startup file using fs module..."));

    // Build the content of the start.sh script
    const odooBinPath = path.join(odooHome, "odoo-server", "odoo-bin");
    const scriptContent = `#!/bin/sh\nsudo -u ${odooUser} ${odooBinPath} --config=/etc/${odooUser}-server.conf`;

    // Write the content to start.sh
    try {
        fs.writeFileSync(scriptPath, scriptContent, { mode: 0o755 });
        console.log(pc.green(`✅ Startup script ${scriptPath} created successfully!`));
    } catch (error) {
        console.error(pc.red(`❌ Failed to create the startup script: ${error}`));
        process.exit(1);
    }
}