import { execSync } from "child_process";

// Helper function to execute shell commands
export const runCommand = (command: any) => {
  try {
    execSync(command, { stdio: "inherit" });
  } catch (error) {
    console.error(`Failed to execute ${command}`, error);
    process.exit(1);
  }
};