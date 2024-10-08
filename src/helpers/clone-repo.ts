import { Presets, SingleBar } from "cli-progress";
import path from 'path';
import pc from "picocolors";
import { simpleGit, SimpleGit } from "simple-git";


import { CloneRepoType } from "types";


/**
 * Clones a specified repository to a target directory with a specific branch.
 * @param options CloneRepoType object containing repoUrl, branch, and targetDir.
 */
export async function cloneRepo(options: CloneRepoType): Promise<void> {

  const { repoUrl, branch, targetDir } = options;
  
  // Extract the repository name from the URL
  const repoName = path.basename(repoUrl, ".git");
  
  // Construct the full path to the target directory
  const targetPath: string = path.join(targetDir);

  console.log(pc.magenta(`Cloning ${repoName} (branch: ${branch}) from GitHub...`));

  // Set up a CLI progress bar
  const progressBar: SingleBar = new SingleBar(
    {
      format: `Cloning ${repoName} (branch: ${branch}) [` + pc.magenta("{bar}") + "] {stage} {percentage}% Objects",
      hideCursor: true,
    },
    Presets.rect
  );

  progressBar.start(100, 0, {
    method: "clone",
    stage: "remote",
  });

  // Track cloning progress
  const progress = ({ method, stage, progress }: { method: string; stage: string; progress: number }) => {
    progressBar.update(progress, { method: method, stage: stage });
  };

  // Define options for simpleGit
  const gitOptions: { baseDir: string; progress: (data: { method: string; stage: string; progress: number }) => void } = {
    baseDir: targetDir,
    progress,
  };

  // Initialize simpleGit with the specified base directory
  const git: SimpleGit = simpleGit(gitOptions);

  try {
    // Clone the specified repo with the given branch and depth
    await git.clone(repoUrl, targetPath, [`--branch=${branch}`, "--depth=1"]);
    progressBar.stop();

    console.log(pc.green(`✅ Successfully cloned ${repoName} (branch: ${branch}) to ${targetPath}`));
  } catch (error) {
    progressBar.stop();
    console.error(pc.red(`❌ Failed to clone ${repoName}: ${error}`));
  }
}


// export async function cloneOdoo(version: string, odooHome: string): Promise<void> {
//     const repoUrl: string = "https://github.com/odoo/odoo.git";
//     const odooPath: string = path.join(odooHome, "odoo-server");

//     runCommand({
//       command:`rm -rf ${odooPath}`,
//       message: "Removing Odoo",
//       successMessage: "Odoo Removed",
//       mute: false
//     }) // todo: remove

  
//     console.log(pc.magenta(`Cloning Odoo ${version} from GitHub...`));
  
//     const progressBar: SingleBar = new SingleBar(
//       {
//         format:
//           `Cloning Odoo ${version} [` +
//           pc.magenta("{bar}") +
//           "] {stage} {percentage}% Objects",
//         hideCursor: true,
//       },
//       Presets.rect
//     );
  
//     progressBar.start(100, 0, {
//       method: "clone",
//       stage: "remote",
//     });
  
//     const progress = ({ method, stage, progress }: { method: string; stage: string; progress: number }) => {
//       progressBar.update(progress, { method: method, stage: stage });
//     };
  
//     const options: { baseDir: string; progress: (data: { method: string; stage: string; progress: number }) => void } = {
//       baseDir: odooHome,
//       progress,
//     };
//     const git = simpleGit(options);
//     await git.clone(repoUrl, odooPath, [`--branch=${version}`, "--depth=1"]);
//     progressBar.stop();
  
//     console.log(
//       pc.green(`✅ Successfully cloned Odoo ${version} to ${odooPath}`)
//     );
// }

