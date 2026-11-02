#!/usr/bin/env node
import { Command } from "commander";
import fs from "fs";
import path from "path";
import pc from "picocolors";
import prompts from "prompts";
import { installCommand } from "./commands/install";
import { assertRoot } from "@helpers/system";
import { runDoctor } from "@setup/doctor";

const readVersion = (): string => {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf-8")).version;
  } catch {
    return "0.0.0";
  }
};

const program = new Command();

program
  .name("install-odoo")
  .version(readVersion())
  .description("Odoo Installer CLI");

program
  .command("install", { isDefault: true })
  .description("Install Odoo on this server (default command)")
  .option('--dry-run', 'Show actions that would be performed without executing them')
  .option('--config <file>', 'Read all answers from a JSON file instead of prompting')
  .option('-y, --yes', 'Do not ask for confirmation before installing')
  .action(installCommand);

program
  .command("doctor")
  .description("Check an Odoo installation (service, workers, logs, database, nginx) and optionally repair it")
  .option('--user <name>', 'Odoo system user of the installation to check (default: auto-detect)')
  .option('--fix', 'Repair the problems that can be fixed automatically')
  .option('-y, --yes', 'Do not ask for confirmation before applying fixes')
  .option('--dry-run', 'Show the fixes that would be applied without executing them')
  .action(async (options: { user?: string; fix?: boolean; yes?: boolean; dryRun?: boolean }) => {
    if (options.dryRun) process.env.DRY_RUN = '1';
    if (options.fix) assertRoot();

    const healthy = await runDoctor({
      odooUser: options.user,
      fix: options.fix,
      confirm: async (message) => {
        if (options.yes) return true;
        const { value } = await prompts({ type: "confirm", name: "value", message, initial: true });
        return !!value;
      },
    });
    process.exit(healthy ? 0 : 1);
  });

program.parseAsync(process.argv).catch((error) => {
  console.error(pc.red(String(error?.message ?? error)));
  process.exit(1);
});
