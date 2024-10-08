import { runCommand } from "@helpers/run-command"; // Adjust the import path as necessary
import { execSync } from "child_process";
import os from "os";
import path from "path";
import pc from "picocolors";


/**
 * Checks if wkhtmltopdf is installed on the system.
 * @returns {Promise<boolean>} - Returns true if installed, false otherwise.
 */
export const isWkhtmltopdfInstalled = async (): Promise<boolean> => {
    try {
        await runCommand({
            command: 'wkhtmltopdf --version',
            message: 'Checking if wkhtmltopdf is installed...',
            mute: true
        });
        return true;
    } catch (error) {
        console.error('wkhtmltopdf is not installed or not found in PATH.');
        return false;
    }
};


export const installWkhtmltopdf = async () => {

    if (await isWkhtmltopdfInstalled()) {
        console.log(pc.green(`Wkhtmltopdf is already installed.`));
        return;
    }

    // Check if the OS is Ubuntu 22.04 or 24.04
    const version = execSync('lsb_release -r -s', { encoding: 'utf-8' }).trim();

    if (version !== '22.04' && version !== '24.04') {
        console.error("This script is only supported on Ubuntu 22.04 or 24.04.");
        process.exit(1);
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
