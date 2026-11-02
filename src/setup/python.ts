import { runCommand } from "@helpers/run-command";
import { execSync } from "child_process";
import path from "path";
import pc from "picocolors";

/**
 * Retrieves the Python version used in the specified Odoo home directory.
 *
 * @param {string} odooHome - The path to the Odoo home directory.
 * @returns {string | null} - Returns the Python version as a string, or null if it cannot be determined.
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
 * Creates a Python virtual environment owned by the Odoo user.
 *
 * @param {string} venvPath - The path where the virtual environment will be created.
 * @param {string} odooUser - The Odoo user for whom the virtual environment is being created.
 *
 * @throws {Error} - Throws an error if the virtual environment creation fails.
 */
export const createVirtualEnv = async (venvPath: string, odooUser: string) => {

    try {

        await runCommand({
            command: `cd ${path.dirname(venvPath)} && sudo -u ${odooUser} python3 -m venv ${venvPath}`,
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
 * Installs the required Python pip packages for Odoo, including both community and enterprise dependencies.
 * Packages are installed as the Odoo user from the `requirements.txt` of the cloned Odoo source.
 *
 * @param {string} version - The Odoo version (unused for the requirements file, kept for call compatibility).
 * @param {string} odooHome - The path to the Odoo installation directory.
 * @param {string} odooUser - The system user under which Odoo is running.
 * @param {boolean} isEnterprise - Indicates whether to install Odoo Enterprise dependencies (true) or only community dependencies (false).
 *
 * @throws Will throw an error if the installation process fails.
 */
export const installPipPackages = async (version: string, odooHome: string, odooUser: string, isEnterprise: boolean) => {
    const requirementsFile = `${odooHome}/odoo-server/requirements.txt`;
    const venvPath = `${odooHome}/venv`;
    const pip = `cd ${odooHome} && sudo -u ${odooUser} ${venvPath}/bin/pip`;

    await createVirtualEnv(venvPath, odooUser)

    await runCommand({
        command: `${pip} install --upgrade pip wheel setuptools`,
        mute: true
    });

    // Install packages of the odoo version that was cloned
    await runCommand({
        command: `${pip} install -r ${requirementsFile}`,
        message: "Installing Python packages for Odoo.",
        successMessage: "Successfully installed python packages for Odoo.",
    });

    // Install additional necessary packages
    await runCommand({
        command: `${pip} install psycopg2-binary pdfminer.six ebaysdk lxml_html_clean`,
        mute: true
    });

    // installing additional python dependancy for odoo enterprise
    if (isEnterprise) {
        await runCommand({
            command: `${pip} install dbfread google_auth xmlsec pyjwt phonenumbers`,
            message: "Installing python dependancy for Odoo enterprise.",
            successMessage: "Python dependancy for Odoo enterprise installed.",
        });
    }

};
