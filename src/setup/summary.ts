import { emailLink, supportLink, websiteLink } from '@helpers/misc';
import fs from 'fs';
import ora from "ora";
import path from 'path';
import pc from "picocolors";

import { prepareAddonsPath } from '@setup/config';
import { getPythonVersion } from '@setup/python';
import { OdooConfigType } from 'types';


export const odooInstallSummary = (config: OdooConfigType): string => {
    return `
You Have Chosen the Following Options for Odoo Installation:

- ${pc.bold("Odoo Version:")} ${pc.green(config.version)}
- ${pc.bold("Install Odoo Enterprise:")} ${pc.green(config.isEnterprise ? 'Yes' : 'No')}
- ${pc.bold("Odoo Home:")} ${pc.green(config.odooHome)}
- ${pc.bold("Odoo User:")} ${pc.green(config.odooUser)}
- ${pc.bold("Install Postgres:")} ${pc.green(config.installPG ? 'Yes' : 'No')}
- ${pc.bold("PostgreSQL User:")} ${pc.green(config.pgUser)}
- ${pc.bold("PostgreSQL Password:")} ${pc.green('*'.repeat(config.pgPassword.length))}
- ${pc.bold("Generate Strong Odoo Super Admin Password:")} ${pc.green(config.strongPassword ? 'Yes' : 'No')}
- ${pc.bold("Odoo Super Admin Password:")} ${pc.green(config.strongPassword ? 'Will Be Generated' : '*'.repeat(config.adminPassword.length))}
- ${pc.bold("HTTP Port:")} ${pc.green(config.httpPort)}
- ${pc.bold("Gevent Port:")} ${pc.green(config.geventPort)}
- ${pc.bold("Nginx Enabled:")} ${pc.green(config.nginx ? 'Yes' : 'No')}
- ${pc.bold("Website Name:")} ${pc.green(config.websiteName)}
- ${pc.bold("SSL Enabled:")} ${pc.green(config.ssl ? 'Yes' : 'No')}
- ${pc.bold("Wkhtmltopdf:")} ${pc.green(config.wkhtmltopdf ? 'Yes' : 'No')}

${pc.blue('* NOTE: Password info will be shared in the odoo installation summary.')}
`;
};


// Function to generate and store the installation summary
export const odooInstallSummaryMarkdown = async (config: OdooConfigType) => {
    const {
        version,
        odooHome,
        odooUser,
        installPG,
        pgUser,
        pgPassword,
        strongPassword,
        adminPassword,
        httpPort,
        geventPort,
        nginx,
        websiteName,
        ssl,
        sslEmail,
        wkhtmltopdf,
    } = config;

    const spinner = ora({ text: "Generating Odoo Setup Summary", color: 'magenta', spinner: 'circleHalves' }).start();

    // Use `prepareAddonsPath` to get the comma-separated addons path
    const addonsPathString = prepareAddonsPath(odooHome);

    const pythonVersion = getPythonVersion(odooHome);

    // Convert the comma-separated addons path string into a list format
    const addonsList = addonsPathString
        .split(",")
        .map((path) => `- ${path} `)
        .join("\n");

    // Constructing the summary content with addons path as a formatted list
    const summaryContent = `
# Odoo Installation Summary

    ** Odoo Version **: ${version}
** Odoo Installation Directory **: ${odooHome}
** Odoo Configuration File **: /etc/${odooUser}-server.conf
    ** Odoo User **: ${odooUser}

## Python Configuration
    ** Version **: ${pythonVersion}
** Virtual Enviroment **: ${odooHome}/venv

## PostgreSQL Configuration
    ** Install PostgreSQL **: ${installPG ? 'Yes' : 'No'}
** PostgreSQL User **: ${pgUser}
** PostgreSQL Password **: ${pgPassword}

## Odoo Admin Configuration
    ** Super Admin Password **: ${strongPassword ? '[Generated Strong Password]' : adminPassword}
<sub><sup>Check Odoo configuration file < /sup></sub >

## Network Configuration
    ** Odoo HTTP Port **: ${httpPort}
** Odoo Gevent Port **: ${geventPort}

## Addons Path
The following addons paths have been configured:
${addonsList}


## Service Commands
    -** Start Odoo **: \`sudo service ${odooUser}-server start\`
-**Stop Odoo**: \`sudo service ${odooUser}-server stop\`
-**Restart Odoo**: \`sudo service ${odooUser}-server restart\`
-**Check Status**: \`sudo service ${odooUser}-server status\`

${nginx ? `
## Nginx Configuration
**Website Name**: ${websiteName}
**Nginx Configuration File**: /etc/nginx/sites-available/${websiteName}.conf
**SSL Enabled**: ${ssl ? 'Yes' : 'No'}
${ssl
                ? `**SSL Certificate Email**: ${sslEmail}\n`
                : 'Cannot obtain SSL Certificate for this site. Use a real website address.\n'
            }`
            : ''
        }

${wkhtmltopdf
            ? `
## WKHTMLTOPDF
WKHTMLTOPDF has been installed for rendering PDF reports.
`
            : ''
        }

---

### Thank you

Thank you for installing Odoo using the Odoo Install Script!\\
**For support**, feel free to [contact us](https://www.heliconia.io/contact) or write an email to [hello@heliconia.io](mailto:hello@heliconia.io).


**Heliconia Solutions**\\
[https://www.heliconia.io](https://www.heliconia.io)
`;

    // Save the summary to a text file
    const filePath = path.join(odooHome, 'odoo-install-summary.md');
    fs.writeFileSync(filePath, summaryContent, { encoding: 'utf-8', mode: 0o640 });
    spinner.succeed(`Installation summary saved to ${filePath}`);

    const thankYou = `
---------------------------------------------------------------------------------------------
Thank you for installing Odoo using the Odoo Install CLI!
For support or feature request, feel free to ${supportLink} or write an email to ${emailLink}.

Heliconia Solutions
${websiteLink}
`

    console.log(pc.green(thankYou));

};