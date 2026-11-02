import { cloneRepo } from "@helpers/clone-repo";
import { runCommand } from "@helpers/run-command";
import { isDryRun, tryExec } from "@helpers/system";
import ora from "ora";
import path from "path";
import pc from "picocolors";

const APT_GET = "sudo DEBIAN_FRONTEND=noninteractive apt-get";

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
];

// Runtime packages from Odoo's official Debian packaging (debian/control). Their names differ between
// Ubuntu releases, so a missing one is skipped with a warning instead of aborting the installation.
const optionalPackages = [
    "postgresql-client",
    "fonts-noto-core",
    "fonts-inconsolata",
    "fonts-font-awesome",
    "fonts-roboto-unhinted",
    "fonts-urw-base35",
    "xfonts-75dpi",
    "xfonts-base",
];


/**
 * Installs the required system packages for Odoo setup, then the optional runtime packages
 * (fonts, PostgreSQL client) one by one.
 *
 * @throws {Error} - Throws an error if the installation of a required package fails.
 */
const installRequiredPackages = async () => {
    await runCommand({
        command: `${APT_GET} install -y ${requiredPackages.join(" ")}`,
        message: "Installing Required packages",
        successMessage: "Packages Installed"
    })

    for (const pkg of optionalPackages) {
        try {
            await runCommand({ command: `${APT_GET} install -y ${pkg}`, mute: true });
        } catch {
            console.log(pc.yellow(`! Optional package ${pkg} is not available on this system, skipping.`));
        }
    }
};

/**
 * Prepares the server environment for Odoo installation: refreshes the package index, installs the
 * system packages Odoo needs and the global Node.js packages used for RTL and LESS assets.
 *
 * @throws {Error} - Throws an error if any of the preparation steps fail.
 */
export const prepareServer = async () => {

    await runCommand({
        command: `${APT_GET} update`,
        message: "Updating Server..",
        successMessage: "Server Updated."
    })

    await installRequiredPackages()

    await runCommand({
        command: `sudo npm install -g rtlcss less less-plugin-clean-css`,
        message: "Installing Nodejs packages..",
        successMessage: "Nodejs packages installed."
    })

}

/**
 * Creates the necessary directories for Odoo installation, owned by the Odoo user.
 *
 * @param {string} odooHome - The base directory where Odoo is installed.
 * @param {string} odooUser - The user under which Odoo will run, used for setting directory permissions.
 */
const createOdooDirs = async (odooHome: string, odooUser: string) => {
    const spinner = ora({ text: 'Creating Directories for Odoo', color: 'magenta', spinner: 'circleHalves' }).start();
    await runCommand({
        command: `sudo mkdir -p /var/log/${odooUser} && sudo chown ${odooUser}:${odooUser} /var/log/${odooUser} && sudo chmod 750 /var/log/${odooUser}`,
        mute: true
    })

    await runCommand({
        command: `sudo mkdir -p ${odooHome}/custom/addons ${odooHome}/odoo-server`,
        mute: true
    })

    spinner?.succeed("Directories for Odoo Created Successfully.");
}

/**
 * Creates the Odoo system user (a non-login-capable service account without sudo rights) if it
 * does not exist yet.
 *
 * @param {string} odooUser - The user under which the Odoo server will run.
 * @param {string} odooHome - The directory to be used as the user's home directory.
 */
const createSystemUser = async (odooUser: string, odooHome: string): Promise<void> => {
    if (!isDryRun() && tryExec(`id -u ${odooUser}`) !== null) {
        return;
    }

    await runCommand({
        command: `sudo adduser --system --quiet --shell=/bin/bash --home=${odooHome} --gecos 'ODOO' --group ${odooUser}`,
        message: `Creating ${odooUser} system user.`,
        successMessage: `${odooUser} system user created.`
    });
};

/**
 * Sets up the Odoo installation environment: system user, directories and the Odoo source code.
 *
 * @param {string} version - The version of Odoo to be installed (e.g., "18.0").
 * @param {string} odooHome - The directory where Odoo will be installed.
 * @param {string} odooUser - The user under which the Odoo server will run.
 */
export const setupOdoo = async (version: string, odooHome: string, odooUser: string) => {

    // Check or create Odoo user with necessary configuration
    await createSystemUser(odooUser, odooHome);

    await createOdooDirs(odooHome, odooUser)

    await cloneRepo({
        repoUrl: "https://github.com/odoo/odoo.git",
        branch: version,
        targetDir: path.join(odooHome, "odoo-server"),
    });

    await runCommand({
        command: `sudo chown -R ${odooUser}:${odooUser} ${odooHome}/`,
        mute: true
    })

}

/**
 * Clones the Odoo Enterprise repository into the specified Odoo home directory using a GitHub access token.
 * The token is not stored in the cloned repository's remote URL.
 *
 * @param {string} version - The version of Odoo Enterprise to clone.
 * @param {string} odooHome - The path where Odoo Enterprise will be cloned.
 * @param {string} odooUser - The user account under which Odoo will run (used for permissions).
 * @param {string} accessToken - Your GitHub access token for authenticating the clone operation.
 */
export const cloneOdooEnterprise = async (version: string, odooHome: string, odooUser: string, accessToken: string): Promise<void> => {
    const repoUrl = `https://github.com/odoo/enterprise.git`;
    const targetDir = `${odooHome}/enterprise`;

    await cloneRepo({
        repoUrl: repoUrl,
        branch: version,
        targetDir: targetDir,
        accessToken: accessToken
    });

    await runCommand({
        command: `sudo chown -R ${odooUser}:${odooUser} ${odooHome}/`,
        mute: true
    })

};
