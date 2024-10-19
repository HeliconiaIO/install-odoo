import { runCommand } from "@helpers/run-command";
import { execSync } from "child_process";
import pc from "picocolors";

/**
 * Gets the Python version from the specified virtual environment.
 * @param {string} venvPath - The path to the virtual environment.
 * @returns {string | null} - The Python version or null if an error occurs.
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
 * Create a virtual environment in the specified directory.
 * 
 * @param {string} odooHome - The path to the Odoo home directory where the virtual environment will be created.
 * @param {string} odooUser - The name of the Odoo user.
 * @returns {Promise<void>} - A promise that resolves when the virtual environment has been created.
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
 * Install Python packages for Odoo in the virtual environment.
 * 
 * @param {string} odooHome - The path to the Odoo home directory containing the virtual environment.
 * @param {string} odooUser - The name of the Odoo user.
 * @returns {Promise<void>} - A promise that resolves when the packages have been installed.
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
