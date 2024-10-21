import fs from 'fs';
import ora from "ora";
import path from 'path';
import pc from "picocolors";

import { emailLink, supportLink, websiteLink } from '@helpers/misc';
import { prepareAddonsPath } from '@setup/config';
import { checkPostgresConnection } from '@setup/postgres';
import { getPythonVersion } from '@setup/python';
import { OdooConfigType } from 'types';

const pgWarning = (configFilePath: string) => `
-----------------------------------------------------------------------------------
⚠️ Attention: PostgreSQL Not Installed or Unreachable
Unable to connect to PostgreSQL using the provided host, username, and password. 
Please ensure that you configure the database settings in the Odoo configuration file located at ${configFilePath} after installation, and restart the Odoo service.
-----------------------------------------------------------------------------------
    
`

/**
 * Generates a summary of the Odoo installation configuration.
 *
 * This function takes the configuration details for the Odoo installation
 * and generates a formatted string summarizing the chosen options, such as
 * the Odoo version, installation directory, user settings, PostgreSQL
 * configuration, network settings, and more.
 *
 * @param {OdooConfigType} config - The configuration object containing the
 *                                   details of the Odoo installation.
 * 
 * @returns {string} - A formatted string representing the summary of the
 *                     Odoo installation options.
 */
export const odooInstallSummary = async (config: OdooConfigType): Promise<string> => {
    // Enterprise info
    const enterpriseInfo = config.isEnterprise && config.accessToken
        ? `${pc.bold("- Install Odoo Enterprise:")} ${pc.green('Yes')}\n` +
        `${pc.bold("- Github Access Token:")} ${pc.green('*'.repeat(config.accessToken.length))}\n`
        : `${pc.bold("- Install Odoo Enterprise:")} ${pc.green('No')}\n`;

    // Nginx and website name info
    const nginxInfo = config.nginx
        ? `${pc.bold("- Nginx Enabled:")} ${pc.green('Yes')}\n` +
        `${pc.bold("- Website Name:")} ${pc.green(config.websiteName || "Not provided")}\n`
        : `${pc.bold("- Nginx Enabled:")} ${pc.green('No')}\n`;

    // SSL info (only if both Nginx and SSL are enabled)
    const sslInfo = config.nginx && config.ssl
        ? `${pc.bold("- SSL Enabled:")} ${pc.green('Yes')}\n` +
        `${pc.bold("- SSL Email:")} ${pc.green(config.sslEmail || "Not provided")}\n`
        : `${pc.bold("- SSL Enabled:")} ${pc.green(config.ssl ? 'Yes' : 'No')}\n`;

    const configPath = `/etc/${config.odooUser}-server.conf`;

    let summary = `
You Have Chosen the Following Options for Odoo Installation:

- ${pc.bold("Odoo Version:")} ${pc.green(config.version)}
${enterpriseInfo}- ${pc.bold("Odoo Home:")} ${pc.green(config.odooHome)}
- ${pc.bold("Odoo User:")} ${pc.green(config.odooUser)}
- ${pc.bold("Generate Strong Odoo Super Admin Password:")} ${pc.green(config.strongPassword ? 'Yes' : 'No')}
- ${pc.bold("Odoo Super Admin Password:")} ${pc.green(config.strongPassword ? 'Will be generated' : '*'.repeat(config.adminPassword.length))}
- ${pc.bold("HTTP Port:")} ${pc.green(config.httpPort)}
- ${pc.bold("Gevent Port:")} ${pc.green(config.geventPort)}
- ${pc.bold("Install Postgres:")} ${pc.green(config.installPG ? 'Yes' : 'No')}
- ${pc.bold("PostgreSQL Host:")} ${pc.green(config.pgHost)}
- ${pc.bold("PostgreSQL Port:")} ${pc.green(config.pgPort)}
- ${pc.bold("PostgreSQL User:")} ${pc.green(config.pgUser)}
- ${pc.bold("PostgreSQL Password:")} ${pc.green('*'.repeat(config.pgPassword.length))}
- ${pc.bold("Wkhtmltopdf:")} ${pc.green(config.wkhtmltopdf ? 'Yes' : 'No')}
${nginxInfo}${sslInfo}

${pc.blue('* NOTE: Password info will be shared in the odoo installation summary.')}
`;
    if (!config.installPG && !await checkPostgresConnection(config.pgHost, config.pgPort, config.pgUser, config.pgPassword)) {
        summary += `${pc.red(pgWarning(configPath))}`
    }

    return summary
};


/**
 * Generates a Markdown summary of the Odoo installation configuration.
 *
 * This asynchronous function constructs a detailed summary of the Odoo
 * installation options in Markdown format, including information such as
 * Odoo version, installation paths, PostgreSQL configuration, network settings,
 * and more. The summary is then saved to a Markdown file in the specified
 * Odoo home directory.
 *
 * @param {OdooConfigType} config - The configuration object containing the
 *                                   details of the Odoo installation.
 *
 * @returns {Promise<void>} - A promise that resolves when the summary has 
 *                            been successfully saved to a file.
 */
export const odooInstallSummaryMarkdown = async (config: OdooConfigType) => {
    const {
        version,
        isEnterprise,
        odooHome,
        odooUser,
        installPG,
        pgHost,
        pgPort,
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
    const addonsPathString = prepareAddonsPath(odooHome, isEnterprise);

    if (!addonsPathString) {
        spinner.fail("Failed to generate addons path.");
        return;
    }

    const pythonVersion = getPythonVersion(odooHome);

    // Convert the comma-separated addons path string into a list format
    const addonsList = addonsPathString
        .split(",")
        .map((path) => `- ${path}`)
        .join("\n");

    const configPath = `/etc/${config.odooUser}-server.conf`;

    // Constructing the summary content with addons path as a formatted list
    const summaryContent = `
# Odoo Installation Summary

**Odoo Version**: ${version}
**Odoo Installation Directory**: ${odooHome}
${isEnterprise ? `**Odoo Enterprise Directory**: ${odooHome}/enterprise` : ''}

**Odoo Configuration File**: ${configPath}
**Odoo User**: ${odooUser}

## Python Configuration
**Version**: ${pythonVersion}
**Virtual Environment**: ${odooHome}/venv

## PostgreSQL Configuration
**Is PostgreSQL Installed**: ${installPG ? 'Yes' : 'No'}
**PostgreSQL Host**: ${pgHost}
**PostgreSQL Port**: ${pgPort}
**PostgreSQL User**: ${pgUser}
**PostgreSQL Password**: ${'*'.repeat(pgPassword.length)}
<sub><sup>Check Odoo configuration file postgres user password</sup></sub>

## Odoo Admin Configuration
**Super Admin Password**: ${strongPassword ? '[Generated Strong Password]' : '*'.repeat(adminPassword.length)}
<sub><sup>Check Odoo configuration file for super admin password</sup></sub>

## Network Configuration
**Odoo HTTP Port**: ${httpPort}
**Odoo Gevent Port**: ${geventPort}

## Addons Path
The following addons paths have been configured:
${addonsList}

## Service Commands
- **Start Odoo**: \`sudo service ${odooUser}-server start\`
- **Stop Odoo**: \`sudo service ${odooUser}-server stop\`
- **Restart Odoo**: \`sudo service ${odooUser}-server restart\`
- **Check Status**: \`sudo service ${odooUser}-server status\`

${nginx ? `
## Nginx Configuration
**Website Name**: ${websiteName}
**Nginx Configuration File**: /etc/nginx/sites-available/${websiteName}.conf
**SSL Enabled**: ${ssl ? 'Yes' : 'No'}
${ssl ? `**SSL Certificate Email**: ${sslEmail}\n` : 'Cannot obtain SSL Certificate for this site. Use a real website address.'}
` : ''}

${wkhtmltopdf ? `
## WKHTMLTOPDF
WKHTMLTOPDF has been installed for rendering PDF reports.
` : ''}

---

### Thank You
Thank you for installing Odoo using the Odoo Install Script!  
**For support**, feel free to [contact us](https://www.heliconia.io/contact) or write an email to [hello@heliconia.io](mailto:hello@heliconia.io).

**Heliconia Solutions**  
[https://www.heliconia.io](https://www.heliconia.io)
`;

    // Save the summary to a markdown file
    const filePath = path.join('/tmp', 'odoo-install-summary.md');
    try {
        fs.writeFileSync(filePath, summaryContent.trim(), { encoding: 'utf-8', mode: 0o640 });
        spinner.succeed(`Installation summary saved to ${filePath}`);
    } catch (error) {
        spinner.fail(`Failed to save installation summary: ${error}`);
    }

    const configFilePath = `/etc/${odooUser}-server.conf`



    // Output a thank you message
    const thankYou = `
---------------------------------------------------------------------------------------------

Thank you for installing Odoo using the Odoo Install CLI!
For support or feature request, feel free to ${supportLink} or write an email to ${emailLink}.

Heliconia Solutions
${websiteLink}

---------------------------------------------------------------------------------------------
`;

    if (!installPG && await !checkPostgresConnection(pgHost, pgPort, pgUser, pgPassword)) {
        console.log(pc.red(pgWarning(configPath)));
    }

    console.log(pc.green(thankYou));
};
