import { runCommand } from "@helpers/run-command";

export const installPipPackages = async (version: string) => {
    const requirementsUrl = `https://github.com/odoo/odoo/raw/${version}/requirements.txt`;

    await runCommand({
        command: `sudo -H pip3 install -r ${requirementsUrl}`,
        message: "Installing Python packages for Odoo",
        successMessage: "Python packages installed successfully.",
    })

    await runCommand({
        command: `sudo -H pip3 install psycopg2-binary pdfminer.six num2words ofxparse dbfread ebaysdk firebase_admin pyOpenSSL`,
        mute: true
    })

};
