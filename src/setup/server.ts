import { cloneRepo } from "@helpers/clone-repo";
import { runCommand } from "@helpers/run-command";
import { execSync } from "child_process"; // todo: replace with runCommand
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


/**
 * Installs the required system packages for Odoo setup.
 *
 * This function checks for the presence of necessary packages and installs them if they are missing.
 * It may require elevated permissions to install certain packages.
 *
 * @returns {Promise<void>} - A promise that resolves when the required packages have been successfully installed.
 *
 * @throws {Error} - Throws an error if the installation of the required packages fails.
 */
const installRequiredPackages = async () => {
    const packageList = requiredPackages.join(" ");
    await runCommand({
        command: `sudo apt-get install -y ${packageList}`,
        message: "Installing Required packages",
        successMessage: "Packages Installed"
    })
};

/**
 * Prepares the server environment for Odoo installation.
 *
 * This function performs necessary checks and configurations required to set up the server for running Odoo.
 * It may involve tasks such as verifying required software installations, setting up directories, and
 * ensuring the correct permissions are in place for the Odoo user.
 *
 * @returns {Promise<void>} - A promise that resolves when the server is successfully prepared.
 *
 * @throws {Error} - Throws an error if any of the preparation steps fail.
 */
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
        message: "Installing Nodejs packages..",
        successMessage: "Nodejs packages installed."
    })

}

/**
 * Creates the necessary directories for Odoo installation.
 *
 * This function sets up the required directory structure within the specified Odoo home path,
 * ensuring that the directories have the appropriate ownership and permissions for the Odoo user.
 * The directories may include locations for addons, logs, and configuration files as needed by Odoo.
 *
 * @param {string} odooHome - The base directory where Odoo is installed.
 * @param {string} odooUser - The user under which Odoo will run, used for setting directory permissions.
 *
 * @returns {Promise<void>} - A promise that resolves when the directories have been created successfully.
 *
 * @throws {Error} - Throws an error if the directory creation fails or if permission issues occur.
 */
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

/**
 * Checks if the specified Odoo user exists and has the required configuration.
 * If the user does not exist, it creates the user with the necessary configuration.
 *
 * @param {string} odooUser - The user under which the Odoo server will run.
 * @param {string} odooHome - The directory to be used as the user's home directory.
 *
 * @returns {Promise<void>} - A promise that resolves when the user check or creation is complete.
 *
 * @throws {Error} - Throws an error if user creation or configuration update fails.
 */
const createSystemUSer = async (odooUser: string, odooHome: string): Promise<void> => {
    try {
        // Check if the user exists
        execSync(`id -u ${odooUser}`, { stdio: "pipe" }).toString().trim();
        console.log(`User ${odooUser} already exists. Verifying configuration...`);

        // Update user settings if necessary
        await runCommand({
            command: `sudo usermod --system --shell=/bin/bash --home=${odooHome} --gecos 'ODOO' --groups ${odooUser}`,
            message: `Updating ${odooUser} user configuration.`,
            successMessage: `${odooUser} user configuration updated.`
        });
    } catch (error) {
        console.log(`User ${odooUser} does not exist. Creating user...`);

        // Create the user with the required configuration
        await runCommand({
            command: `sudo adduser --system --quiet --shell=/bin/bash --home=${odooHome} --gecos 'ODOO' --group ${odooUser}`,
            message: `Creating ${odooUser} system user.`,
            successMessage: `${odooUser} system user created.`
        });
    }
};

/**
 * Sets up the Odoo installation environment.
 *
 * This function handles the complete setup process for Odoo, including
 * creating necessary directories, installing required packages, and
 * configuring the Odoo server for the specified version and user.
 *
 * @param {string} version - The version of Odoo to be installed (e.g., "14.0", "15.0").
 * @param {string} odooHome - The directory where Odoo will be installed.
 * @param {string} odooUser - The user under which the Odoo server will run.
 *
 * @returns {Promise<void>} - A promise that resolves when the setup process is complete.
 *
 * @throws {Error} - Throws an error if any part of the setup process fails,
 *                   such as directory creation, package installation, or configuration issues.
 */
export const setupOdoo = async (version: string, odooHome: string, odooUser: string) => {

    // Check or create Odoo user with necessary configuration
    await createSystemUSer(odooUser, odooHome);

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
    const repoUrl = `https://github.com/odoo/enterprise.git`;
    const targetDir = `${odooHome}/enterprise`;
    const venvPath = `${odooHome}/venv`;

    // Using cloneRepo to clone the Odoo Enterprise repo
    await runCommand({
        command: `sudo mkdir -p ${odooHome}/enterprise`,
        mute: true
    })

    await cloneRepo({
        repoUrl: repoUrl,
        branch: version,
        targetDir: targetDir,
        accessToken: accessToken
    });

    await runCommand({
        command: `sudo chown -R ${odooUser}:${odooUser} ${odooHome}/*`,
        mute: true
    })

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
 * Starts the Odoo service.
 *
 * This function initiates the Odoo server process, ensuring that the server
 * runs as expected. It may check for prerequisites before attempting to start
 * the service, such as ensuring that the required directories exist and
 * that the server configuration is valid.
 *
 * @returns {Promise<void>} - A promise that resolves when the Odoo service
 *                            has been successfully started.
 *
 * @throws {Error} - Throws an error if the service fails to start due to
 *                   configuration issues, missing dependencies, or other
 *                   unexpected problems.
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