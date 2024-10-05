import { execSync } from "child_process";
import ora from "ora";

type RunCommandOptions = {
  command: string;
  message?: string;
  successMessage?: string;
  mute?: boolean;
}

// Helper function to execute shell commands
export const runCommand = async (options: RunCommandOptions) => {
  const { command, message, successMessage, mute = false } = options;

  const spinnerMessage = message || `Executing: ${command}`;
  const spinnerSuccessMessage = successMessage || `Executed: ${command} Successfully.`;

  let spinner;
  if (!mute) {
    spinner = ora({ text: spinnerMessage, color: 'magenta', spinner: 'circleHalves' }).start();
  }

  try {
    execSync(command, { stdio: "inherit" });
    if (!mute) {
      spinner?.succeed(spinnerSuccessMessage);
    }
  } catch (error) {
    console.error(`Failed to execute ${command}`, error);
    if (!mute) {
      spinner?.fail(`Failed to execute: ${command}`);
    }
    process.exit(1);
  }
};