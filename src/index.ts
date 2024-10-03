#!/usr/bin/env -S ts-node --files
import { Command } from "commander";
import * as fs from "fs";
import pc from "picocolors";
import prompts from "prompts";

import { cloneOdoo } from "@helpers/clone-odoo";

const program = new Command();


program
  .version("1.0.0")
  .description("Odoo Installer CLI")
  .action(async () => {
    // Step 1: Gather Information from User
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
        message: "Want to install the Odoo enterprise?",
        initial: false,
      },
      {
        type: "confirm",
        name: "installPostgres",
        message: "Want to install Postgres 16?",
        initial: true,
      },
      {
        type: "confirm",
        name: "installNginx",
        message: "Want to install Nginx?",
        initial: false,
      },
      {
        type: (prev) => (prev ? "text" : null), // If `installNginx` is `true`, ask for the website name
        name: "websiteName",
        message: "Enter the website name:",
        initial: "_",
        validate: (value) =>
          value.trim() !== "" ? true : "Website name cannot be empty",
      },
      {
        type: (prev, values) => (values.installNginx ? "confirm" : null), // If `installNginx` is `true`, ask to enable SSL
        name: "enableSSL",
        message: "Do you want to enable SSL?",
        initial: true,
      },
      {
        type: (prev, values) => (values.enableSSL ? "text" : null), // If `installNginx` is `true`, ask to enable SSL
        name: "adminEmail",
        message: "Enter the admin Email:",
        initial: "odoo@example.com",
      },
      {
        type: "confirm",
        name: "strongAdminPassword",
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
        message: "Enter the Name of the system user",
        initial: "odoo",
      },
      {
        type: "text",
        name: "odooHome",
        message: "Enter the path for Odoo Home",
        initial: "/odoo",
      },
      {
        type: "number",
        name: "odooPort",
        message: "Set the default Odoo port",
        initial: 8069,
      },
      {
        type: "number",
        name: "longpollingPort",
        message: "Set the default Odoo port for websocket",
        initial: 8072,
      },
      {
        type: "confirm",
        name: "installWkhtmltopdf",
        message: "Want to install WKHTMLTOPDF?",
        initial: true,
      },
    ]);

    const { version, odooHome } = response;

    if (!version || !odooHome) {
      console.log(pc.red("Invalid input. Exiting..."));
      return;
    }

    console.log(pc.green(`✔ Created directory ${pc.italic(odooHome)}`));

    if (fs.existsSync(odooHome)) {
      cloneOdoo(version, odooHome);
    }

  });

console.log(pc.magenta(`Welcome to ${pc.bgMagentaBright('odoo-install')} CLI`));
program.parse(process.argv);
