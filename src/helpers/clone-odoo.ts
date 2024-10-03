import { runCommand } from "@helpers/run-command";
import { Presets, SingleBar } from "cli-progress";
import path from 'path';
import pc from "picocolors";
import simpleGit from "simple-git";

export async function cloneOdoo(version: string, odooHome: string): Promise<void> {
    const repoUrl: string = "https://github.com/odoo/odoo.git";
    const odooPath: string = path.join(odooHome, "odoo-server");

    runCommand(`rm -rf ${odooPath}`); // todo: remove
  
    console.log(pc.magenta(`Cloning Odoo ${version} from GitHub...`));
  
    const progressBar: SingleBar = new SingleBar(
      {
        format:
          `Cloning Odoo ${version} [` +
          pc.magenta("{bar}") +
          "] {stage} {percentage}% Objects",
        hideCursor: true,
      },
      Presets.rect
    );
  
    progressBar.start(100, 0, {
      method: "clone",
      stage: "remote",
    });
  
    const progress = ({ method, stage, progress }: { method: string; stage: string; progress: number }) => {
      progressBar.update(progress, { method: method, stage: stage });
    };
  
    const options: { baseDir: string; progress: (data: { method: string; stage: string; progress: number }) => void } = {
      baseDir: odooHome,
      progress,
    };
    const git = simpleGit(options);
    await git.clone(repoUrl, odooPath, [`--branch=${version}`, "--depth=1"]);
    progressBar.stop();
  
    console.log(
      pc.green(`✅ Successfully cloned Odoo ${version} to ${odooPath}`)
    );
}



// import simpleGit from "simple-git";
// import { SingleBar, Presets } from "cli-progress";


// export async function cloneOdoo(version, odooHome) {
//     const repoUrl = "https://github.com/odoo/odoo.git";
//     const odooPath = path.join(odooHome, "odoo-server");

//     runCommand(`rm -rf ${odooPath}`); // todo: remove
  
//     console.log(pc.magenta(`Cloning Odoo ${version} from GitHub...`));
  
//     const progressBar = new SingleBar(
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
  
//     const progress = ({ method, stage, progress }) => {
//       progressBar.update(progress, { methos: method, stage: stage });
//       // console.log(`git.${method} ${stage} stage ${progress}% complete`);
//     };
  
//     // Initialize simple-git with options
//     const options = {
//       baseDir: odooHome,
//       progress,
//     };
//     const git = simpleGit(options);
//     await git.clone(repoUrl, odooPath, [`--branch=${version}`, "--depth=1"]);
//     progressBar.stop();
  
//     console.log(
//       pc.green.bold(`✅ Successfully cloned Odoo ${version} to ${odooPath}`)
//     );
  
//     // .clone(repoPath, [localPath, [options]])
//   }