import fs from "fs";
import path from "path";
import pc from "picocolors";
import { runCommand } from "./run-command";

type configType = {
    odooUser: string;
    odooHome: string;
    dbUser: string;
    dbPassword: string;
    httpPort: number;
    geventPort: number;
    nginx: boolean;
}


export const prepareAddonsPath = (odooHome: string): string => {
    const serverAddonsPath = path.join(odooHome, 'odoo-server/addons');
    const customAddonsPath = path.join(odooHome, 'custom/addons');

    let addonsPath = `${serverAddonsPath},${customAddonsPath}`;

    // Base custom directory to look for other custom repositories
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

        console.log(pc.green(`Successfully prepared addons path: ${addonsPath}`));
    } catch (error) {
        console.error(pc.red(`Failed to prepare addons path: ${error}`));
        process.exit(1);
    }

    return addonsPath;
};

export const odooConfig = async (config: configType) => {

    const {
        odooUser,
        odooHome,
        dbUser,
        dbPassword,
        httpPort,
        geventPort,
        nginx
    } = config;

    const filePath = `/etc/${odooUser}.conf`



    console.log(pc.magenta(`Creating Odoo configuration file at: ${filePath}`));

    // Define the configuration content
    const configContent = `
[options]
; General settings
admin_passwd = admin
db_host = False
db_port = False
db_user = ${dbUser}
db_password = ${dbPassword}

; Addons path and other directories
addons_path = ${prepareAddonsPath(odooHome)}
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
            mute: true
        })

        console.log(pc.green(`Odoo configuration file created successfully at: ${filePath}`));
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
    const scriptContent = `#!/bin/sh\nsudo -u ${odooUser} ${odooBinPath} --config=/etc/${odooUser}.conf`;

    // Write the content to start.sh
    try {
        fs.writeFileSync(scriptPath, scriptContent, { mode: 0o755 });
        console.log(pc.green(`✅ Startup script ${scriptPath} created successfully!`));
    } catch (error) {
        console.error(pc.red(`❌ Failed to create the startup script: ${error}`));
        process.exit(1);
    }
}