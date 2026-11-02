import { runCommand } from "@helpers/run-command";
import { tryExec } from "@helpers/system";
import os from "os";
import path from "path";
import pc from "picocolors";

const WKHTMLTOPDF_VERSION = "0.12.6.1-3";

// Architectures that the upstream Ubuntu (jammy) packages are built for. The jammy package also
// works on Ubuntu 24.04.
const archMap: Record<string, string> = {
    x64: "amd64",
    arm64: "arm64",
    ppc64: "ppc64el",
};

/**
 * Checks if wkhtmltopdf is installed on the system.
 *
 * @returns {string | false} - Returns the version of wkhtmltopdf if installed, or false if it is not.
 */
export const isWkhtmltopdfInstalled = () => {
    return tryExec('wkhtmltopdf --version') || false;
};

/**
 * Installs wkhtmltopdf (with patched Qt, as Odoo requires) from the upstream packaging releases.
 *
 * The package is downloaded to the temp directory and installed with apt so its dependencies
 * are resolved automatically.
 *
 * @throws {Error} - Throws an error if the download or installation fails.
 */
export const installWkhtmltopdf = async () => {
    const wkhtmltopdfVersion = isWkhtmltopdfInstalled()
    if (wkhtmltopdfVersion) {
        console.log(pc.green(`${wkhtmltopdfVersion} is already installed.`));
        return;
    }

    const arch = os.arch();
    const normalizedArch = archMap[arch];

    if (!normalizedArch) {
        console.error(pc.yellow(`! No wkhtmltopdf package is available for architecture "${arch}". Install it manually to print PDF reports.`));
        return;
    }

    const downloadUrl = `https://github.com/wkhtmltopdf/packaging/releases/download/${WKHTMLTOPDF_VERSION}/wkhtmltox_${WKHTMLTOPDF_VERSION}.jammy_${normalizedArch}.deb`;
    const debPath = path.join(os.tmpdir(), path.basename(downloadUrl));

    try {
        await runCommand({
            command: `wget --quiet -O ${debPath} ${downloadUrl}`,
            message: "Downloading wkhtmltopdf package",
            successMessage: "Wkhtmltopdf Downloaded"
        })

        await runCommand({
            command: `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ${debPath}`,
            message: "Installing wkhtmltopdf.",
            successMessage: "Wkhtmltopdf Installed."
        })
    } finally {
        await runCommand({
            command: `rm -f ${debPath}`,
            mute: true
        }).catch(() => undefined);
    }

    // Make the binaries available on the default PATH of every service
    await runCommand({
        command: `sudo ln -sf /usr/local/bin/wkhtmltopdf /usr/bin/wkhtmltopdf && sudo ln -sf /usr/local/bin/wkhtmltoimage /usr/bin/wkhtmltoimage`,
        mute: true
    });
};
