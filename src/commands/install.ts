import { ScriptName, validateGitHubToken } from "@helpers/misc";
import { assertRoot, assertSupportedOs, isDryRun, isLocalHost, isSafeAbsolutePath, isValidIdentifier, isValidPgIdentifier, odooVersionOsError, readOsRelease } from "@helpers/system";
import { EMAIL_REGEX, validateConfig } from "@helpers/validate";
import { setupOdooConfig } from "@setup/config";
import { enableSSL, setupNginx } from "@setup/nginx";
import { createPostgreSQLUser, installPostgreSQL, isPostgreSQLInstalled } from "@setup/postgres";
import { installPipPackages } from "@setup/python";
import { cloneOdooEnterprise, prepareServer, setupOdoo } from "@setup/server";
import { rotateOdooLog, setupService, startOdooService } from "@setup/service";
import { odooInstallSummary, odooInstallSummaryMarkdown } from "@setup/summary";
import { installWkhtmltopdf } from "@setup/wkhtmltopdf";
import fs from "fs";
import pc from "picocolors";
import prompts from "prompts";
import { OdooConfigType } from "types";
import { DEFAULT_ODOO_VERSION, ODOO_VERSION_REQUIREMENTS, SUPPORTED_ODOO_VERSIONS, SupportedOdooVersion } from "../constants";

export interface InstallOptions {
  dryRun?: boolean;
  /** Path to a JSON file with the answers to all prompts (non-interactive install). */
  config?: string;
  /** Skip the final confirmation. */
  yes?: boolean;
}

const onCancel = () => {
  console.log(pc.red('Odoo Installation Cancelled. Goodbye! 👋'));
  process.exit(0);
};

/** Defaults used for every option missing from a `--config` file (same as the prompt defaults). */
const configFileDefaults = (): Partial<OdooConfigType> => ({
  version: DEFAULT_ODOO_VERSION,
  isEnterprise: false,
  odooHome: '/odoo',
  odooUser: 'odoo',
  strongPassword: true,
  httpPort: 8069,
  geventPort: 8072,
  installPG: true,
  pgHost: 'localhost',
  pgPort: 5432,
  wkhtmltopdf: true,
  nginx: false,
  websiteName: '_',
  ssl: false,
});

const loadConfigFile = (file: string): OdooConfigType => {
  let raw: Partial<OdooConfigType>;
  try {
    raw = JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (error) {
    console.error(pc.red(`Cannot read config file ${file}: ${error}`));
    process.exit(1);
  }
  const config = { ...configFileDefaults(), ...raw } as OdooConfigType;
  config.pgUser ??= config.odooUser;
  config.accessToken ??= process.env.ODOO_GITHUB_TOKEN;
  return config;
};

/** Asks every installation question and returns the answers. */
const promptConfig = async (): Promise<OdooConfigType> => {
  const response = await prompts([
    {
      type: "select",
      name: "version",
      message: "Select Odoo version to install:",
      choices: SUPPORTED_ODOO_VERSIONS.map((v) => ({
        title: `Odoo ${v}`,
        value: v,
        description: ODOO_VERSION_REQUIREMENTS[v] ? `Needs Ubuntu ${ODOO_VERSION_REQUIREMENTS[v]!.minUbuntu} or newer` : undefined,
      })),
      initial: SUPPORTED_ODOO_VERSIONS.indexOf(DEFAULT_ODOO_VERSION),
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
      validate: async (token) => {
        const isValid = await validateGitHubToken(token);
        return isValid ? true : 'Invalid GitHub access token or no access to Odoo enterprise repository. Please try again.'; // Validation message
      },
    },
    {
      type: "text",
      name: "odooHome",
      message: "Enter the path for Odoo home directory:",
      initial: "/odoo",
      validate: (odooHome) => {
        if (!isSafeAbsolutePath(odooHome) || odooHome === '/') {
          return 'Use an absolute path with letters, digits, "_", "-", "." and "/" only.';
        }
        // Check if the path exists
        return fs.existsSync(odooHome)
          ? `The path ${odooHome} already exists. Please choose a different path.`
          : true;
      }
    },
    {
      type: "text",
      name: "odooUser",
      message: "Enter the Name of Odoo system user:",
      initial: "odoo",
      validate: (value) =>
        isValidIdentifier(value) ? true : 'Use lowercase letters, digits, "_" or "-" (max 32 characters).',
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
      type: "number",
      name: "httpPort",
      message: "Set the default Odoo port:",
      initial: 8069,
    },
    {
      type: "number",
      name: "geventPort",
      message: "Set the default Odoo websocket port:",
      initial: 8072,
    },
    {
      type: "confirm",
      name: "installPG",
      message: "Want to install Postgres 16?",
      initial: true,
    },
    {
      type: "text",
      name: "pgHost",
      message: "Enter the PostgreSQL hostname:",
      initial: "localhost",
    },
    {
      type: "number",
      name: "pgPort",
      message: "Enter the PostgreSQL port:",
      initial: 5432,
    },
    {
      type: "text",
      name: "pgUser",
      message: "Enter the PostgreSQL user:",
      initial: (prev, values) => values.installPG && values.odooUser || "", // Set initial value to odooUser if it's provided
      validate: (value) =>
        isValidPgIdentifier(value) ? true : 'Use letters, digits, "_", "." or "-" only.',
    },
    {
      type: "password",
      name: "pgPassword",
      message: `Enter the PostgreSQL password`,
      validate: (value) => (value ? true : 'The password cannot be empty.'),
    },
    {
      type: "confirm",
      name: "wkhtmltopdf",
      message: "Want to install WKHTMLTOPDF?",
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
      type: (prev, values) => (values.ssl ? "text" : null), // If `ssl` is `true`, ask for the certificate email
      name: "sslEmail",
      message: "Enter the admin Email:",
      validate: (value) => (EMAIL_REGEX.test(value) ? true : "Please enter a valid email address."),
    },
  ], { onCancel });

  return response as OdooConfigType;
};

/** Runs every installation step in order. */
const runInstallation = async (OdooConfig: OdooConfigType) => {
  const { version, isEnterprise, accessToken, odooHome, odooUser, installPG, pgHost, pgUser, pgPassword, httpPort, geventPort, nginx, websiteName, ssl, sslEmail, wkhtmltopdf } = OdooConfig;

  // Setup server
  await prepareServer();

  // Setup PostgreSQL
  if (installPG) {
    await installPostgreSQL();
  }

  // Create PostgreSQL user
  if (isLocalHost(pgHost) && (installPG || (await isPostgreSQLInstalled()))) {
    await createPostgreSQLUser(pgUser, pgPassword);
  }

  // Setup Odoo
  await setupOdoo(version!, odooHome, odooUser);

  if (isEnterprise) {
    await cloneOdooEnterprise(version!, odooHome, odooUser, accessToken!)
  }

  // Setup Python packages
  await installPipPackages(version!, odooHome, odooUser, !!isEnterprise);

  // Setup Odoo configuration
  await setupOdooConfig(OdooConfig);

  // Setup the systemd service
  await setupService(odooUser, odooHome, pgHost);

  // Setup wkhtmltopdf (PDF reports are optional: do not abort the installation)
  if (wkhtmltopdf) {
    try {
      await installWkhtmltopdf();
    } catch (error) {
      console.error(pc.yellow(`! wkhtmltopdf could not be installed, PDF reports will not work: ${error}`));
    }
  }

  // Setup Nginx
  if (nginx) {
    await setupNginx(httpPort, geventPort, websiteName!, !!ssl);
    if (ssl) {
      await enableSSL(websiteName!, sslEmail!);
    }
  }

  await rotateOdooLog(odooUser);

  // Start the Odoo Service and wait until it answers
  await startOdooService(odooUser, httpPort);

  // Generate Odoo installation summary
  await odooInstallSummaryMarkdown(OdooConfig);
};

export const installCommand = async (options: InstallOptions) => {
  if (options.dryRun) process.env.DRY_RUN = '1';

  console.log(pc.magenta("Welcome to"));
  console.log(pc.magenta(ScriptName))
  console.log(pc.cyan("Press Ctrl+C to exit at any time.\n"));

  assertSupportedOs();
  assertRoot();

  const OdooConfig = options.config ? loadConfigFile(options.config) : await promptConfig();

  const errors = validateConfig(OdooConfig);
  if (!errors.length && !isDryRun()) {
    const osError = odooVersionOsError(OdooConfig.version, readOsRelease().VERSION_ID);
    if (osError) errors.push(osError);
  }
  if (!errors.length && fs.existsSync(OdooConfig.odooHome) && !options.dryRun) {
    errors.push(`The path ${OdooConfig.odooHome} already exists. Please choose a different path.`);
  }
  if (!errors.length && OdooConfig.isEnterprise && !(await validateGitHubToken(OdooConfig.accessToken!))) {
    errors.push('Invalid GitHub access token or no access to the Odoo enterprise repository.');
  }
  if (errors.length) {
    errors.forEach((error) => console.error(pc.red(`✘ ${error}`)));
    process.exit(1);
  }

  const minPostgres = ODOO_VERSION_REQUIREMENTS[OdooConfig.version as SupportedOdooVersion]?.minPostgres;
  if (minPostgres && !OdooConfig.installPG) {
    console.log(pc.yellow(`! Odoo ${OdooConfig.version} needs PostgreSQL ${minPostgres} or newer: make sure ${OdooConfig.pgHost} runs it.`));
  }

  console.log(pc.magentaBright(await odooInstallSummary(OdooConfig)));

  let proceed = !!options.yes;
  if (!proceed) {
    const confirmResponse = await prompts({
      type: 'toggle',
      name: 'value',
      message: 'Proceed with Odoo installation using the selected options?',
      initial: true,
      active: 'Yes',
      inactive: 'No'
    }, { onCancel });
    proceed = !!confirmResponse.value;
  }

  if (!proceed) {
    console.log(pc.red('Odoo Installation Cancelled. Goodbye! 👋'));
    process.exit(0);
  }

  try {
    await runInstallation(OdooConfig);
    process.exit(0);
  } catch (error) {
    console.error(pc.red(`An error occurred during setup: ${error}`));
    console.error(pc.yellow(`Fix the problem and, if Odoo was installed, check it with: sudo npx install-odoo doctor`));
    process.exit(1);
  }
};
