import { runCommand } from "@helpers/run-command";
import { execSync } from "child_process";
import pc from "picocolors";

/**
 * Retrieves the Python version used in the specified Odoo home directory.
 *
 * @param {string} odooHome - The path to the Odoo home directory.
 * @returns {string} - Returns the Python version as a string.
 *
 * @throws {Error} - Throws an error if unable to determine the Python version.
 */
export const getPythonVersion = (odooHome: string) => {
    const venvPath = `${odooHome}/venv`;
    try {
        const command = `${venvPath}/bin/python --version`;
        const version = execSync(command, { encoding: 'utf-8' }).trim();

        return version;
    } catch (error) {
        console.error(pc.red(`Failed to get Python version from venv: ${error}`));
        return null;
    }
};


/**
 * Creates a Python virtual environment at the specified path for the given Odoo user.
 *
 * @param {string} venvPath - The path where the virtual environment will be created.
 * @param {string} odooUser - The Odoo user for whom the virtual environment is being created.
 *
 * @returns {Promise<void>} - A promise that resolves when the virtual environment has been created successfully.
 *
 * @throws {Error} - Throws an error if the virtual environment creation fails.
 */
export const createVirtualEnv = async (venvPath: string, odooUser: string) => {

    try {

        await runCommand({
            command: `sudo su ${odooUser} && python3 -m venv ${venvPath}`,
            message: 'Creating virtual environment...',
            successMessage: `Virtual environment created successfully at ${venvPath}`,
            mute: false
        });
    } catch (error) {
        console.error('Failed to create virtual environment:', error);
        throw error; // Rethrow the error after logging
    }
};


/**
 * Installs required Python packages using pip for the specified Odoo installation.
 *
 * @param {string} odooHome - The path to the Odoo installation directory.
 * @param {string} odooUser - The Odoo user under which the pip packages should be installed.
 *
 * @returns {Promise<void>} - A promise that resolves when the pip packages have been successfully installed.
 *
 * @throws {Error} - Throws an error if the installation of pip packages fails.
 */
export const installPipPackages = async (odooHome: string, odooUser: string) => {
    const venvPath = `${odooHome}/venv`;

    await createVirtualEnv(venvPath, odooUser)

    // Install packages from of the odoo
    await runCommand({
        command: `cd ${odooHome}/odoo-server && ${odooHome}/venv/bin/pip install .`,
        message: "Installing Python packages for Odoo.",
        successMessage: "Successfully installed python packages for Odoo.",
    });

    // Install additional necessary packages
    await runCommand({
        command: `${venvPath}/bin/pip install psycopg2-binary pdfminer.six ebaysdk lxml_html_clean`,
        mute: true
    });
};
