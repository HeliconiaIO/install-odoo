#!/usr/bin/env -S pnpm tsx
import { ScriptName } from "@helpers/misc";
import { setupOdooConfig } from "@setup/config";
import { setupDaemon } from "@setup/demon";
import { setupNginx } from "@setup/nginx";
import { createPostgreSQLUser, installPostgreSQL } from "@setup/postgres";
import { installPipPackages } from "@setup/python";
import { prepareServer, setupOdoo } from "@setup/server";
import { odooInstallSummary, odooInstallSummaryMarkdown } from "@setup/summary";
import { installWkhtmltopdf } from "@setup/wkhtmltopdf";
import { Command } from "commander";
import pc from "picocolors";
import prompts from "prompts";
import { OdooConfigType } from "types";

console.log(pc.magenta("Welcome to"));
console.log(pc.magenta(ScriptName))

const program = new Command();

program
  .version("1.0.0")
  .description("Odoo Installer CLI")
  .action(async () => {
    const response = await prompts([
      {
        type: "select",
        name: "version",
        message: "Select Odoo version to install:",
        choices: [
          { title: "Odoo 18.0", value: "18.0" },
          { title: "Odoo 17.0", value: "17.0" },
        ],
      },
      {
        type: "confirm",
        name: "isEnterprise",
        message: "Want to install the Odoo Enterprise?",
        initial: false,
      },
      {
        type: (prev, values) => (values.isEnterprise ? "password" : null), // If `isEnterprise` is `true`, ask for the github access token
        name: "accessToken",
        message: "Enter Github Access Token:",
      },
      {
        type: "confirm",
        name: "installPG",
        message: "Want to install Postgres 16?",
        initial: true,
      },
      {
        type: "confirm",
        name: "nginx",
        message: "Want to install Nginx?",
        initial: false,
      },
      {
        type: (prev, values) => (values.nginx ? "text" : null), // If `nginx` is `true`, ask for the website name
        name: "websiteName",
        message: "Enter the website name:",
        initial: "_",
        validate: (value) =>
          value.trim() !== "" ? true : "Website name cannot be empty",
      },
      {
        type: (prev, values) => (values.nginx ? "confirm" : null), // If `nginx` is `true`, ask to enable SSL
        name: "ssl",
        message: "Do you want to enable SSL?",
        initial: (prev, values) => (values.websiteName === "_" ? false : true),
      },
      {
        type: (prev, values) => (values.ssl ? "text" : null), // If `nginx` is `true`, ask to enable SSL
        name: "sslEmail",
        message: "Enter the admin Email:",
        validate: (value) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(value) ? true : "Please enter a valid email address.";
        }
      },
      {
        type: "confirm",
        name: "strongPassword",
        message: "Want to generate random strong odoo super admin password?",
        initial: true,
      },
      {
        type: (prev) => (prev === false ? "password" : null),
        name: "adminPassword",
        message: "Enter the Odoo super admin password:",
        validate: (value) =>
          value.length < 8 ? `Password must be at least 8 characters.` : true,
      },
      {
        type: "text",
        name: "odooUser",
        message: "Enter the Name of the system user for Odoo:",
        initial: "odoo",
      },
      {
        type: (prev, values) => (values.installPG ? "text" : null), // If `installPG` is `true`, ask to for PG User
        name: "pgUser",
        message: "Enter the Name of the PostgreSQL user for Odoo:",
        initial: (prev, values) => values.odooUser || "", // Set initial value to odooUser if it's provided
      },
      {
        type: (prev, values) => (values.installPG ? "password" : null), // If `installPG` is `true`, ask to for PG User
        name: "pgPassword",
        message: `Enter the Password for PostgreSQL user for Odoo:`,
        validate: (value) =>
          value.length < 8 ? `Password must be at least 8 characters.` : true,
      },
      {
        type: "text",
        name: "odooHome",
        message: "Enter the path for Odoo Home:",
        initial: "/odoo",
      },
      {
        type: "number",
        name: "httpPort",
        message: "Set the default Odoo port:",
        initial: 8069,
      },
      {
        type: "number",
        name: "geventPort",
        message: "Set the default Odoo port for websocket:",
        initial: 8072,
      },
      {
        type: "confirm",
        name: "wkhtmltopdf",
        message: "Want to install WKHTMLTOPDF?",
        initial: true,
      },
    ]);

    const { version, odooHome, odooUser, installPG, pgUser, pgPassword, strongPassword, adminPassword, httpPort, geventPort, nginx, websiteName, ssl, sslEmail, wkhtmltopdf } = response;

    const OdooConfig: OdooConfigType = {
      version: version,
      odooUser: odooUser,
      odooHome: odooHome,
      pgUser: pgUser,
      pgPassword: pgPassword,
      strongPassword: strongPassword,
      adminPassword: adminPassword,
      httpPort: httpPort,
      geventPort: geventPort,
      nginx: nginx,
      websiteName: websiteName,
      ssl: ssl,
      sslEmail: sslEmail,
      wkhtmltopdf: wkhtmltopdf
    }


    const summary = odooInstallSummary(OdooConfig);

    console.log(pc.magentaBright(summary));

    const confirmResponse = await prompts({
      type: 'toggle',
      name: 'value',
      message: 'Do you want to proceed with the installation based on the above summary?',
      initial: true,
      active: 'yes',
      inactive: 'no'
    });

    if (confirmResponse.value) {
      try {
        // Setup server
        await prepareServer();

        // Setup PostgreSQL
        if (installPG) {
          await installPostgreSQL();
        }

        // Create PostgreSQL user
        await createPostgreSQLUser(pgUser);

        // Setup Python packages
        await installPipPackages(version);

        // Setup wkhtmltopdf
        if (wkhtmltopdf) {
          await installWkhtmltopdf();
        }

        // Setup Odoo
        await setupOdoo(version, odooHome, odooUser);

        // Setup Odoo configuration
        await setupOdooConfig(OdooConfig);

        // Setup daemon
        await setupDaemon(odooUser, odooHome);

        // Setup Nginx
        if (nginx) {
          await setupNginx(httpPort, geventPort, websiteName);
        }

        // Generate Odoo installation summary
        await odooInstallSummaryMarkdown(OdooConfig);

        // Exit the CLI after completing the setup
        process.exit(0);

      } catch (error) {
        console.error(pc.red(`An error occurred during setup: ${error}`));
        process.exit(1);
      }
    } else {
      console.log(pc.red('Installation cancelled by the user.'));
      process.exit(0);
    }

  });


program.parse(process.argv);
