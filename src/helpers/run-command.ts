import { execSync } from "child_process";
import ora from "ora";
import pc from "picocolors";
import { RunCommandType } from "types";


/**
 * Executes a shell command with optional messaging and spinner.
 * 
 * This function runs the specified shell command, displays a loading spinner while the command is executing, 
 * and shows success or error messages based on the outcome of the command. 
 * It can also suppress the spinner and messages based on the provided options.
 *
 * @param {RunCommandType} options - The options for running the command.
 * @param {string} options.command - The shell command to execute.
 * @param {string} [options.message] - Optional message to display while the command is executing.
 * @param {string} [options.successMessage] - Optional message to display upon successful execution of the command.
 * @param {boolean} [options.mute] - Optional flag to suppress the spinner and status messages.
 * @returns {Promise<void>} A promise that resolves when the command execution is complete.
 * @throws {Error} Throws an error if the command fails to execute.
 */
export const runCommand = async (options: RunCommandType) => {
  const { command, message, successMessage, mute = false } = options;

  const spinnerMessage = message || `Executing: ${command}`;
  const spinnerSuccessMessage = successMessage || `Executed: ${command} Successfully.`;

  let spinner;
  if (!mute) {
    spinner = ora({ text: spinnerMessage, color: 'magenta', spinner: 'circleHalves' }).start();
  }

  try {
    execSync(command, { stdio: "pipe" });
    if (!mute) {
      spinner?.succeed(spinnerSuccessMessage);
    }
  } catch (error) {
    console.error(`Failed to execute ${command}`, error, '\n');
    if (!mute) {
      spinner?.fail(pc.red(`Failed to execute: ${command}`));
    }
    return;
  }
};