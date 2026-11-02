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
 * @param {string} [options.input] - Optional data written to the command's stdin (keeps secrets out of the shell string).
 * @returns {Promise<string>} A promise that resolves with the command's stdout.
 * @throws {Error} Throws an error if the command fails to execute.
 */
export const runCommand = async (options: RunCommandType) => {
  const { command, message, successMessage, mute = false, input } = options;

  const spinnerMessage = message || `Executing: ${command}`;
  const spinnerSuccessMessage = successMessage || `Executed: ${command} Successfully.`;

  let spinner;
  if (!mute) {
    spinner = ora({ text: spinnerMessage, color: 'magenta', spinner: 'circleHalves' }).start();
  }
  // Respect dry-run mode set via environment variable
  if (process.env.DRY_RUN === '1') {
    if (!mute) {
      spinner?.succeed(pc.yellow(`[DRY RUN] ${spinnerMessage}`));
    }
    if (!mute) {
      console.log(pc.yellow(`[DRY RUN] ${command}`));
    }
    return '';
  }

  try {
    const stdout = execSync(command, { stdio: "pipe", input });
    if (!mute) {
      spinner?.succeed(spinnerSuccessMessage);
    }
    return stdout?.toString?.() || '';
  } catch (error: any) {
    // Capture stderr/stdout if available to aid debugging
    const stdout = error?.stdout ? error.stdout.toString() : '';
    const stderr = error?.stderr ? error.stderr.toString() : '';
    if (!mute) {
      spinner?.fail(pc.red(`Failed to execute: ${command}`));
    } else {
      console.error(pc.red(`Failed to execute: ${command}`));
    }
    if (stdout) console.error(pc.red(`stdout: ${stdout}`));
    if (stderr) console.error(pc.red(`stderr: ${stderr}`));
    // Re-throw so callers can decide how to handle failures
    throw new Error(`Command failed: ${command} - ${error?.message || String(error)}`);
  }
};
