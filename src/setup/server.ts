import { cloneRepo } from "@helpers/clone-repo";
import { runCommand } from "@helpers/run-command";
import fs from 'fs';
import ora from "ora";
import path from "path";


const requiredPackages = [
    "git",
    "wget",
    "python3-pip",
    "python3-venv",
    "build-essential",
    "libssl-dev",
    "libffi-dev",
    "python3-dev",
    "libxml2-dev",
    "libxslt1-dev",
    "zlib1g-dev",
    "libsasl2-dev",
    "libldap2-dev",
    "libjpeg-dev",
    "libpq-dev",
    "npm",
    "nodejs",
    // Additional packages to install
    "python3-cffi",
    "libzip-dev",
    "node-less",
    "libpng-dev",
    "gdebi"
];

const installRequiredPackages = async () => {
    const packageList = requiredPackages.join(" ");
    await runCommand({
        command: `sudo apt-get install -y ${packageList}`,
        message: "Installing Required packages",
        successMessage: "Packages Installed"
    })
};


export const prepareServer = async () => {

    await runCommand({
        command: `sudo apt-get update`,
        message: "Updating Server..",
        successMessage: "Server Updated."
    })

    await runCommand({
        command: `sudo apt-get upgrade -y`,
        message: "Upgrading Server..",
        successMessage: "Server Upgraded."
    })

    installRequiredPackages()

    await runCommand({
        command: `sudo npm install -g rtlcss less less-plugin-clean-css`,
        mute: true
    })

}


const createOdooDirs = async (odooHome: string, odooUser: string) => {
    const spinner = ora({ text: 'Creating Directories for Odoo', color: 'magenta', spinner: 'circleHalves' }).start();
    await runCommand({
        command: `sudo mkdir -p /var/log/${odooUser}`,
        mute: true
    })

    await runCommand({
        command: `sudo chown ${odooUser}:${odooUser} /var/log/${odooUser}`,
        mute: true
    })

    await runCommand({
        command: `sudo mkdir -p ${odooHome}/custom/addons ${odooHome}/odoo-server`,
        mute: true
    })

    spinner?.succeed("Directories for Odoo Created Successfully.");
}


export const setupOdoo = async (version: string, odooHome: string, odooUser: string) => {

    await runCommand({
        command: `sudo adduser --system --quiet --shell=/bin/bash --home=${odooHome} --gecos 'ODOO' --group ${odooUser}`,
        message: `Createing ${odooUser} system user.`,
        successMessage: `${odooUser} system user created.`
    })

    await runCommand({
        command: `sudo adduser ${odooUser} sudo`,
        mute: true
    })

    await createOdooDirs(odooHome, odooUser)

    await cloneRepo({
        repoUrl: "https://github.com/odoo/odoo.git",
        branch: version,
        targetDir: path.join(odooHome, "odoo-server"),
    });

    await runCommand({
        command: `sudo chown -R ${odooUser}:${odooUser} ${odooHome}/*`,
        mute: true
    })

}

/**
 * Clones the Odoo Enterprise repository into the specified Odoo home directory using a GitHub access token.
 *
 * @param {string} version - The version of Odoo Enterprise to clone.
 * @param {string} odooHome - The path where Odoo Enterprise will be cloned.
 * @param {string} odooUser - The user account under which Odoo will run (used for permissions).
 * @param {string} accessToken - Your GitHub access token for authenticating the clone operation.
 * @returns {Promise<void>} A promise that resolves when the cloning operation is complete.
 *
 * @throws {Error} Throws an error if the cloning operation fails.
 */
export const cloneOdooEnterprise = async (version: string, odooHome: string, odooUser: string, accessToken: string): Promise<void> => {
    const repoUrl = `https://${accessToken}@github.com/odoo/enterprise.git`;
    const targetDir = `${odooHome}/enterprise`;
    // Using cloneRepo to clone the Odoo Enterprise repo
    await cloneRepo({
        repoUrl: repoUrl,
        branch: version,
        targetDir: targetDir,
    });
};


/**
 * Enable log rotation for Odoo logs by creating a logrotate configuration based on Odoo user and home directory.
 * @param odooUser - The user running the Odoo service.
 * @param odooHome - The Odoo home directory (where the log files are located).
 * @returns A promise indicating the success or failure of the log rotation setup.
 */
export const rotateOdooLog = async (odooUser: string, odooHome: string): Promise<void> => {

    const spinner = ora({ text: 'Creating Directories for Odoo', color: 'magenta', spinner: 'circleHalves' }).start();

    const logFilePath = path.join(odooHome, 'logs', 'odoo.log');
    const configName = `${odooUser}-server`;
    const logrotateConfigPath = `/etc/logrotate.d/${configName}`;


    const logrotateConfig = `
  ${logFilePath} {
      daily
      missingok
      rotate 30
      compress
      delaycompress
      notifempty
      create 0640 ${odooUser} ${odooUser}
      postrotate
          [ -f /var/run/${configName}.pid ] && kill -USR1 \`cat /var/run/${configName}.pid\`
      endscript
  }`;

    try {
        // Check if the Odoo home path exists
        if (!fs.existsSync(odooHome)) {
            console.error(`The Odoo home path ${odooHome} does not exist.`);
            return;
        }

        // Ensure the log directory exists inside odooHome
        const logDirPath = path.join(odooHome, 'logs');
        if (!fs.existsSync(logDirPath)) {
            fs.mkdirSync(logDirPath, { recursive: true });
        }

        // Write the logrotate configuration to the specified path
        await fs.promises.writeFile(logrotateConfigPath, logrotateConfig, { mode: 0o644 });
        spinner?.succeed(`Configured daily Odoo log rotation at ${logrotateConfigPath}.`);
    } catch (error) {
        spinner?.fail(`Failed to create logrotate configuration: ${(error as Error).message}.`);
    }
};



/**
 * Starts the Odoo server using the system service command.
 * @returns {Promise<void>} - A promise that resolves when the Odoo server has been started.
 */
export const startOdooService = async (): Promise<void> => {
    try {
        // Run the command to start the Odoo server
        await runCommand({
            command: 'sudo service odoo-server start',
            message: 'Starting Odoo service...',
            successMessage: 'Odoo service started successfully.'
        });
    } catch (error) {
        console.error('Failed to start Odoo service:', error);
        throw new Error('Could not start Odoo service. Please check the service status.');
    }
};