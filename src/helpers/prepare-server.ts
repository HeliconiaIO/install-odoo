import { runCommand } from "@helpers/run-command";
import ora from "ora";
import path from "path";
import pc from "picocolors";
import { cloneRepo } from "./clone-repo";


const requiredPackages = [
    "git",
    "wget",
    "python3-pip",
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
    "gdebi",
    "rtlcss"
];

const installRequiredPackages = async () => {
    console.log(pc.magenta(`Installing Required Packages`));
    const packageList = requiredPackages.join(" ");
    await runCommand({
        command: `sudo apt-get install -y ${packageList}`,
        message: "Installing Required packages",
        successMessage: "Packages Installed"
    })
};


export const prepareServer = async () => {

    console.log(pc.magenta(`Updating Server...`));

    await runCommand({
        command: `sudo apt-get update`,
    })

    console.log(pc.magenta(`Upgrading Server...`));

    await runCommand({
        command: `sudo apt-get upgrade -y`,
    })

    installRequiredPackages()

}


const createOdooDirs = async (odooHome: string, odooUser: string) => {
    const spinner = ora({ text: 'Creating Directories for Odoo', color: 'magenta', spinner: 'circleHalves' }).start();
    await runCommand({
        command: `sudo mkdir /var/log/${odooUser}`,
        mute: true
    })

    await runCommand({
        command: `sudo chown ${odooUser}:${odooUser} /var/log/${odooUser}`,
        mute: true
    })

    await runCommand({
        command: `sudo su ${odooUser} -c "mkdir ${odooHome}/custom"`,
        mute: true
    })

    await runCommand({
        command: `sudo su ${odooUser} -c "mkdir -p ${odooHome}/custom/addons"`,
        mute: true
    })

    await runCommand({
        command: `sudo chown -R ${odooUser}:${odooUser} ${odooHome}/*`,
        mute: true
    })

    spinner?.succeed("Directories for Odoo Created Successfully.");
}


export const setupOdoo = async (version: string, odooHome: string, odooUser: string) => {

    await runCommand({
        command: `sudo adduser --system --quiet --shell=/bin/bash --home=${odooHome} --gecos 'ODOO' --group ${odooUser}`,
        message: `Createing ${odooUser} system user.`,
        successMessage: `${odooUser} system user created.`
    })

    await runCommand({
        command: `sudo adduser ${odooUser} sudo`,
        mute: true
    })

    await cloneRepo({
        repoUrl: "https://github.com/odoo/odoo.git",
        branch: version,
        targetDir: path.join(odooHome, "odoo-server"),
    });

    await createOdooDirs(odooHome, odooUser)

}



// echo -e "\n---- Create custom module directory ----"
// sudo su $OE_USER -c "mkdir $OE_HOME/custom"
// sudo su $OE_USER -c "mkdir $OE_HOME/custom/addons"

// echo -e "\n---- Setting permissions on home folder ----"
// sudo chown -R $OE_USER:$OE_USER $OE_HOME/*