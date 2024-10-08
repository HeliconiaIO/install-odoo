import { cloneRepo } from "@helpers/clone-repo";
import { runCommand } from "@helpers/run-command";
import ora from "ora";
import path from "path";
import pc from "picocolors";


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
    console.log(pc.magenta(`Installing Required Packages`));
    const packageList = requiredPackages.join(" ");
    await runCommand({
        command: `sudo apt-get install -y ${packageList}`,
        message: "Installing Required packages",
        successMessage: "Packages Installed"
    })
};


export const prepareServer = async () => {

    console.log(pc.magenta(`Preparing Server...`));

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