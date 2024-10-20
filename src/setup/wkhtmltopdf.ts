import { runCommand } from "@helpers/run-command"; // Adjust the import path as necessary
import { execSync } from "child_process";
import os from "os";
import path from "path";
import pc from "picocolors";


/**
 * Checks if wkhtmltopdf is installed on the system.
 *
 * This function attempts to execute the `wkhtmltopdf` command to retrieve its
 * version. If the command executes successfully, the version is returned. 
 * If it fails (e.g., wkhtmltopdf is not installed), the function returns false.
 *
 * @returns {string | false} - Returns the version of wkhtmltopdf if installed,
 *                             or false if it is not installed.
 */
export const isWkhtmltopdfInstalled = () => {
    try {
        const version = execSync('wkhtmltopdfc --version', { encoding: 'utf-8', stdio: "pipe" }).trim();
        return version;
    } catch (error) {
        return false;
    }
};

/**
 * Installs wkhtmltopdf on the system.
 *
 * This function executes the necessary commands to download and install
 * wkhtmltopdf. It ensures that the installation is performed with the required
 * permissions and provides feedback on the installation process.
 *
 * @returns {Promise<void>} - A promise that resolves when the installation is complete.
 *                            Throws an error if the installation fails.
 */
export const installWkhtmltopdf = async () => {
    const wkhtmltopdfVersion = isWkhtmltopdfInstalled()
    if (wkhtmltopdfVersion) {
        console.log(pc.green(`${wkhtmltopdfVersion} is already installed.`));
        return;
    }

    // Check if the OS is Ubuntu 22.04 or 24.04
    const version = execSync('lsb_release -r -s', { encoding: 'utf-8' }).trim();

    if (version !== '22.04' && version !== '24.04') {
        console.error(pc.red("This script is only supported on Ubuntu 22.04 or 24.04."));
        return;
    }

    // Determine the architecture
    const architecture = os.arch();
    const validArchitectures = ['x64', 'arm64', 'ppc64le'];

    // Check if the architecture is supported
    if (!validArchitectures.includes(architecture)) {
        console.error(`Unsupported architecture: ${architecture}`);
        process.exit(1);
    }

    // Construct the download URL dynamically
    const downloadUrl = `https://github.com/wkhtmltopdf/packaging/releases/download/0.12.6.1-2/wkhtmltox_0.12.6.1-2.jammy_${architecture}.deb`;

    // Extract the file name from the URL
    const fileName = path.basename(downloadUrl);

    // Download the package
    await runCommand({
        command: `sudo wget ${downloadUrl}`,
        message: "Downloading wkhtmltopdf package",
        successMessage: "Wkhtmltopdf Downloaded"
    })

    // Install the package
    await runCommand({
        command: `sudo gdebi --n ${fileName}`,
        message: "Installing wkhtmltopdf.",
        successMessage: "Wkhtmltopdf Installed."
    })

    // Clean up the downloaded .deb file
    await runCommand({
        command: `sudo rm -f ${fileName}`,
        mute: true
    });

    // Create symbolic links
    await runCommand({
        command: `sudo ln -sf /usr/local/bin/wkhtmltopdf /usr/bin`,
        mute: true
    });
    await runCommand({
        command: `sudo ln -sf /usr/local/bin/wkhtmltoimage /usr/bin`,
        mute: true
    });
};
