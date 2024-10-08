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
    console.log(`${venvPath}/bin/python --version`)
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
 * @returns {Promise<void>} - A promise that resolves when the virtual environment has been created.
 */
export const createVirtualEnv = async (venvPath: string) => {

    try {
        await runCommand({
            command: `python3 -m venv ${venvPath}`,
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
 * @param {string} version - The version of Odoo for which to install packages.
 * @param {string} odooHome - The path to the Odoo home directory containing the virtual environment.
 * @returns {Promise<void>} - A promise that resolves when the packages have been installed.
 */
export const installPipPackages = async (version: string, odooHome: string) => {
    const requirementsUrl = `https://github.com/odoo/odoo/raw/${version}/requirements.txt`;
    const venvPath = `${odooHome}/venv`;

    await createVirtualEnv(venvPath)

    // Install packages from requirements.txt
    await runCommand({
        command: `${venvPath}/bin/pip install -r ${requirementsUrl}`,
        message: "Installing Python packages for Odoo from requirements.txt...",
        successMessage: "Python packages from requirements.txt installed successfully.",
    });

    // Install additional necessary packages
    await runCommand({
        command: `${venvPath}/bin/pip install psycopg2-binary pdfminer.six num2words ofxparse dbfread ebaysdk firebase_admin pyOpenSSL`,
        mute: true
    });
};
