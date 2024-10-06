#!/usr/bin/env -S pnpm tsx
import { Command } from "commander";
import pc from "picocolors";
import prompts from "prompts";

console.log(pc.magenta("Welcome to"));
console.log(
  pc.magenta(
    `
▗▄▄▄▖▗▖  ▗▖ ▗▄▄▖▗▄▄▄▖▗▄▖ ▗▖   ▗▖        ▗▄▖ ▗▄▄▄  ▗▄▖  ▗▄▖      ▗▄▄▖▗▖   ▗▄▄▄▖
  █  ▐▛▚▖▐▌▐▌     █ ▐▌ ▐▌▐▌   ▐▌       ▐▌ ▐▌▐▌  █▐▌ ▐▌▐▌ ▐▌    ▐▌   ▐▌     █  
  █  ▐▌ ▝▜▌ ▝▀▚▖  █ ▐▛▀▜▌▐▌   ▐▌       ▐▌ ▐▌▐▌  █▐▌ ▐▌▐▌ ▐▌    ▐▌   ▐▌     █  
▗▄█▄▖▐▌  ▐▌▗▄▄▞▘  █ ▐▌ ▐▌▐▙▄▄▖▐▙▄▄▖    ▝▚▄▞▘▐▙▄▄▀▝▚▄▞▘▝▚▄▞▘    ▝▚▄▄▖▐▙▄▄▖▗▄█▄▖
`
  )
)

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
        name: "adminEmail",
        message: "Enter the admin Email:",
        validate: (value) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(value) ? true : "Please enter a valid email address.";
        }
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
        message: "Enter the Name of the system user for Odoo:",
        initial: "odoo",
      },
      {
        type: (prev, values) => (values.installPG ? "text" : null), // If `nginx` is `true`, ask to enable SSL
        name: "pgUser",
        message: "Enter the Name of the PostgreSQL user for Odoo:",
        initial: (prev, values) => values.odooUser || "", // Set initial value to odooUser if it's provided
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
        name: "installWkhtmltopdf",
        message: "Want to install WKHTMLTOPDF?",
        initial: true,
      },
    ]);

    const { version, odooHome, installPG, pgUser, installWkhtmltopdf } = response;

    if (!version || !odooHome) {
      console.log(pc.red("Invalid input. Exiting..."));
      return;
    }

    console.log(pc.green(`✔ Created directory ${pc.italic(odooHome)}`));


    // setup server
    // setup postgres
    // setup python
    // setup wkhtmltopdf
    // setup server.setupOdoo
    // setup config
    // setup demon
    // setup nginx
    // setup summary

  });


program.parse(process.argv);
