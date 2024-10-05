import { runCommand } from "@helpers/run-command";

export const installPipPackages = async (version: string) => {
    const requirementsUrl = `https://github.com/odoo/odoo/raw/${version}/requirements.txt`;

    await runCommand({
        command: `sudo -H pip3 install -r ${requirementsUrl}`,
        message: "Installing Python packages for Odoo",
        successMessage: "Python packages installed successfully.",
    })

};
