#!/usr/bin/env -S pnpm tsx
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/helpers/misc.ts
var ScriptName = `
\u2597\u2584\u2584\u2584\u2596\u2597\u2596  \u2597\u2596 \u2597\u2584\u2584\u2596\u2597\u2584\u2584\u2584\u2596\u2597\u2584\u2596 \u2597\u2596   \u2597\u2596        \u2597\u2584\u2596 \u2597\u2584\u2584\u2584  \u2597\u2584\u2596  \u2597\u2584\u2596      \u2597\u2584\u2584\u2596\u2597\u2596   \u2597\u2584\u2584\u2584\u2596
  \u2588  \u2590\u259B\u259A\u2596\u2590\u258C\u2590\u258C     \u2588 \u2590\u258C \u2590\u258C\u2590\u258C   \u2590\u258C       \u2590\u258C \u2590\u258C\u2590\u258C  \u2588\u2590\u258C \u2590\u258C\u2590\u258C \u2590\u258C    \u2590\u258C   \u2590\u258C     \u2588  
  \u2588  \u2590\u258C \u259D\u259C\u258C \u259D\u2580\u259A\u2596  \u2588 \u2590\u259B\u2580\u259C\u258C\u2590\u258C   \u2590\u258C       \u2590\u258C \u2590\u258C\u2590\u258C  \u2588\u2590\u258C \u2590\u258C\u2590\u258C \u2590\u258C    \u2590\u258C   \u2590\u258C     \u2588  
\u2597\u2584\u2588\u2584\u2596\u2590\u258C  \u2590\u258C\u2597\u2584\u2584\u259E\u2598  \u2588 \u2590\u258C \u2590\u258C\u2590\u2599\u2584\u2584\u2596\u2590\u2599\u2584\u2584\u2596    \u259D\u259A\u2584\u259E\u2598\u2590\u2599\u2584\u2584\u2580\u259D\u259A\u2584\u259E\u2598\u259D\u259A\u2584\u259E\u2598    \u259D\u259A\u2584\u2584\u2596\u2590\u2599\u2584\u2584\u2596\u2597\u2584\u2588\u2584\u2596
`;
var supportLink = "\x1B]8;;https://www.heliconia.io/contact\x1B\\contact us\x1B]8;;\x1B\\";
var websiteLink = "\x1B]8;;https://www.heliconia.io\x1B\\https://www.heliconia.io\x1B]8;;\x1B\\";
var emailLink = "\x1B]8;;mailto:hello@heliconia.io\x1B\\hello@heliconia.io\x1B]8;;\x1B\\";
var validateGitHubToken = async (token) => {
  try {
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `token ${token}`
      }
    });
    if (!userResponse.ok) {
      return false;
    }
    const repoResponse = await fetch("https://api.github.com/repos/odoo/enterprise", {
      headers: {
        Authorization: `token ${token}`
      }
    });
    if (repoResponse.status === 404) {
      return false;
    }
    const repoData = await repoResponse.json();
    return repoData.private ? true : false;
  } catch (error) {
    console.error("Error validating token:", error);
    return false;
  }
};

// src/helpers/run-command.ts
var import_child_process = require("child_process");
var import_ora = __toESM(require("ora"));
var import_picocolors = __toESM(require("picocolors"));
var runCommand = async (options) => {
  const { command, message, successMessage, mute = false } = options;
  const spinnerMessage = message || `Executing: ${command}`;
  const spinnerSuccessMessage = successMessage || `Executed: ${command} Successfully.`;
  let spinner;
  if (!mute) {
    spinner = (0, import_ora.default)({ text: spinnerMessage, color: "magenta", spinner: "circleHalves" }).start();
  }
  try {
    (0, import_child_process.execSync)(command, { stdio: "pipe" });
    if (!mute) {
      spinner?.succeed(spinnerSuccessMessage);
    }
  } catch (error) {
    console.error(`Failed to execute ${command}`, error, "\n");
    if (!mute) {
      spinner?.fail(import_picocolors.default.red(`Failed to execute: ${command}`));
    }
    return;
  }
};

// src/setup/postgres.ts
var import_child_process2 = require("child_process");
var import_picocolors2 = __toESM(require("picocolors"));
var isPostgreSQLInstalled = async () => {
  try {
    const result = (0, import_child_process2.execSync)("pg_lsclusters", { stdio: "ignore" });
    return true;
  } catch (error) {
    return false;
  }
};
var getPostgreSQLVersion = async () => {
  try {
    const result = (0, import_child_process2.execSync)("pg_config --version", { encoding: "utf-8" });
    return result.trim();
  } catch (error) {
    console.error("PostgreSQL is not installed or an error occurred while checking.");
    return null;
  }
};
var createPostgreSQLUser = async (pgUser, pgPassword) => {
  try {
    const result = (0, import_child_process2.execSync)(`sudo -u postgres psql -t -c "SELECT 1 FROM pg_catalog.pg_user WHERE usename='${pgUser}'"`, { encoding: "utf-8" });
    if (result.trim() === "1") {
      console.log(import_picocolors2.default.green(`User "${import_picocolors2.default.underline(pgUser)}" already exists in PostgreSQL.`));
      return;
    }
  } catch (error) {
    console.error(`Error checking if user "${pgUser}" exists:`);
    return;
  }
  await runCommand({
    command: `sudo su - postgres -c "psql -c \\"CREATE USER ${pgUser} WITH PASSWORD '${pgPassword}' CREATEDB;\\"" 2> /dev/null || true`,
    message: "Creating Postgres user for Odoo.",
    successMessage: `Postgres user ${pgUser} created.`
  });
};
var installPostgreSQL = async () => {
  if (await isPostgreSQLInstalled()) {
    const pgVersion = await getPostgreSQLVersion();
    console.log(import_picocolors2.default.green(`${import_picocolors2.default.underline(pgVersion)} is already installed.`));
    return;
  }
  await runCommand({
    command: `wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /usr/share/keyrings/postgresql.gpg`,
    mute: true
  });
  await runCommand({
    command: `echo "deb [signed-by=/usr/share/keyrings/postgresql.gpg] http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list`,
    mute: true
  });
  await runCommand({
    command: `sudo apt-get update`,
    mute: true
  });
  await runCommand({
    command: `sudo apt-get install -y postgresql-16`,
    message: "Installing PostgreSQL 16.",
    successMessage: "PostgreSQL 16 installed."
  });
  await runCommand({
    command: `/etc/init.d/postgresql start`,
    mute: true
  });
};

// src/setup/config.ts
var import_crypto = __toESM(require("crypto"));
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_picocolors3 = __toESM(require("picocolors"));
function generateStrongAdminPassword(length = 16) {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=";
  return Array.from(import_crypto.default.randomFillSync(new Uint32Array(length))).map((x) => charset[x % charset.length]).join("");
}
var prepareAddonsPath = (odooHome, isEnterprise) => {
  const serverAddonsPath = import_path.default.join(odooHome, "odoo-server/addons");
  const customAddonsPath = import_path.default.join(odooHome, "custom/addons");
  let addonsPath = `${serverAddonsPath}`;
  if (isEnterprise) {
    const enterprisePath = import_path.default.join(odooHome, "enterprise");
    addonsPath += `,${enterprisePath}`;
  }
  addonsPath += `,${customAddonsPath}`;
  const customDirectory = import_path.default.join(odooHome, "custom");
  try {
    if (import_fs.default.existsSync(customDirectory)) {
      const directories = import_fs.default.readdirSync(customDirectory, { withFileTypes: true });
      directories.forEach((dir) => {
        if (dir.isDirectory() && dir.name !== "addons") {
          const repoPath = import_path.default.join(customDirectory, dir.name);
          addonsPath += `,${repoPath}`;
        }
      });
    }
  } catch (error) {
    console.error(import_picocolors3.default.red(`Failed to prepare addons path: ${error}`));
    process.exit(1);
  }
  return addonsPath;
};
var setupOdooConfig = async (config) => {
  const {
    odooUser,
    odooHome,
    isEnterprise,
    pgUser,
    pgPassword,
    strongPassword,
    adminPassword,
    httpPort,
    geventPort,
    nginx
  } = config;
  const filePath = `/etc/${odooUser}-server.conf`;
  const pgInstalled = await isPostgreSQLInstalled();
  const configContent = `
[options]
; General settings
admin_passwd = ${strongPassword ? generateStrongAdminPassword(16) : adminPassword}
db_host = ${pgInstalled ? "localhost" : ""}
db_port = ${pgInstalled ? "5432" : ""}
db_user = ${pgInstalled ? pgUser : ""}
db_password = ${pgInstalled ? pgPassword : ""}

; Addons path and other directories
addons_path = ${prepareAddonsPath(odooHome, isEnterprise)}
data_dir = ${import_path.default.join(odooHome, ".local/share/Odoo")}
logfile = /var/log/${odooUser}/${odooUser}-server.log

; HTTP and server settings
http_port = ${httpPort}
gevent_port = ${geventPort}
proxy_mode = ${nginx}
  `.trim();
  try {
    const configDir = import_path.default.dirname(filePath);
    if (!import_fs.default.existsSync(configDir)) {
      import_fs.default.mkdirSync(configDir, { recursive: true });
    }
    import_fs.default.writeFileSync(filePath, configContent, { encoding: "utf-8", mode: 416 });
    await runCommand({
      command: `sudo chown ${odooUser}:${odooUser} ${filePath}`,
      message: `Configuring Odoo configuration file.`,
      successMessage: `Odoo configuration file created successfully at: ${filePath}`
    });
  } catch (error) {
    console.error(import_picocolors3.default.red(`Failed to create Odoo configuration file: ${error}`));
    process.exit(1);
  }
};

// src/setup/demon.ts
var import_fs2 = __toESM(require("fs"));
var import_path2 = __toESM(require("path"));
var import_picocolors4 = __toESM(require("picocolors"));
async function setupDaemon(odooUser, odooHome) {
  const configName = `${odooUser}-server`;
  const daemonPath = `/etc/init.d/${configName}`;
  const odooBinPath = import_path2.default.join(odooHome, "odoo-server", "odoo-bin");
  const venvPath = `${odooHome}/venv`;
  const daemonContent = `#!/bin/sh
### BEGIN INIT INFO
# Provides: ${configName}
# Required-Start: $remote_fs $syslog
# Required-Stop: $remote_fs $syslog
# Should-Start: $network
# Should-Stop: $network
# Default-Start: 2 3 4 5
# Default-Stop: 0 1 6
# Short-Description: Enterprise Business Applications
# Description: ODOO Business Applications
### END INIT INFO


PATH=/opt/odoo/venv/bin:/sbin:/bin:/usr/sbin:/usr/bin:/usr/local/bin
DAEMON=${odooBinPath}
VENV=${venvPath}/bin/python3
NAME=${configName}
DESC=${configName}

# Specify the user under which the Odoo service will run
USER=${odooUser}

# Path to the Odoo configuration file
CONFIGFILE="/etc/${odooUser}-server.conf"

# PID file location
PIDFILE=/var/run/\${NAME}.pid

# Additional options that are passed to the Daemon
DAEMON_OPTS="-c $CONFIGFILE"

# Check if the DAEMON executable exists and CONFIGFILE is present
[ -x $DAEMON ] || { echo "DAEMON not found"; exit 1; }
[ -f $CONFIGFILE ] || { echo "CONFIGFILE not found"; exit 1; }

# Function to check if the PID file exists and if the process is running
checkpid() {
  [ -f $PIDFILE ] || return 1
  pid=$(cat $PIDFILE)
  [ -d /proc/$pid ] && return 0
  return 1
}

case "\${1}" in
  start)
    echo -n "Starting \${DESC}: "
    start-stop-daemon --start --quiet --pidfile $PIDFILE --chuid $USER --background --make-pidfile --exec $VENV $DAEMON -- $DAEMON_OPTS
    echo "\${NAME} started."
    ;;
  stop)
    echo -n "Stopping \${DESC}: "
    start-stop-daemon --stop --quiet --pidfile $PIDFILE --oknodo
    echo "\${NAME} stopped."
    ;;
  restart|force-reload)
    echo -n "Restarting \${DESC}: "
    start-stop-daemon --stop --quiet --pidfile $PIDFILE --oknodo
    sleep 5
    start-stop-daemon --start --quiet --pidfile $PIDFILE --chuid $USER --background --make-pidfile --exec $VENV $DAEMON -- $DAEMON_OPTS
    echo "\${NAME} restarted."
    ;;
  status)
    if checkpid; then
      echo "\${DESC} is running."
    else
      echo "\${DESC} is not running."
    fi
    ;;
  *)
    echo "Usage: $NAME {start|stop|restart|force-reload|status}" >&2
    exit 1
    ;;
esac
exit 0
`;
  try {
    import_fs2.default.writeFileSync(daemonPath, daemonContent, { encoding: "utf-8", mode: 493 });
    await runCommand({
      command: `sudo chown ${odooUser}:${odooUser} ${daemonPath}`,
      mute: true
    });
    await runCommand({
      command: `sudo update-rc.d ${odooUser}-server defaults`,
      message: `Creating Odoo demon file.`,
      successMessage: `Odoo Odoo demon created successfully at: ${daemonPath}`
    });
  } catch (error) {
    console.error(import_picocolors4.default.red(`\u2718 `) + `Failed to create the daemon script: ${error}`);
    process.exit(1);
  }
}

// src/setup/nginx.ts
var import_child_process3 = require("child_process");
var import_fs3 = __toESM(require("fs"));
var import_picocolors5 = __toESM(require("picocolors"));
var setupNginx = async (httpPort, geventPort, websiteName) => {
  try {
    (0, import_child_process3.execSync)("which nginx", { stdio: "ignore" });
    console.log(import_picocolors5.default.green(`\u2714 `) + `Nginx is already installed.`);
  } catch (error) {
    runCommand({
      command: "sudo apt install nginx -y",
      message: "Installing Nginx...",
      successMessage: "Nginx successfully installed!",
      mute: false
    });
  }
  const sitesAvailable = `/etc/nginx/sites-available/${websiteName}.conf`;
  const sitesEnabled = `/etc/nginx/sites-enabled/${websiteName}.conf`;
  const nginxConfig = `# ${websiteName} odoo server
map $http_upgrade $connection_upgrade {
  default upgrade;
  ''      close;
}

server {
  listen 80;
  server_name ${websiteName};
  proxy_read_timeout 720s;
  proxy_connect_timeout 720s;
  proxy_send_timeout 720s;

  # log
  access_log /var/log/nginx/odoo.access.log;
  error_log /var/log/nginx/odoo.error.log;

  # Redirect websocket requests to odoo gevent port
  location /websocket {
    proxy_pass http://127.0.0.1:${geventPort};
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_set_header X-Forwarded-Host $http_host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Real-IP $remote_addr;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    proxy_cookie_flags session_id samesite=lax secure;  # requires nginx 1.19.8
  }

  # Redirect requests to odoo backend server
  location / {
    # Add Headers for odoo proxy mode
    proxy_set_header X-Forwarded-Host $http_host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_redirect off;
    proxy_pass http://127.0.0.1:${httpPort};

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    proxy_cookie_flags session_id samesite=lax secure;  # requires nginx 1.19.8
  }

  # common gzip
  gzip_types text/css text/scss text/plain text/xml application/xml application/json application/javascript;
  gzip on;
}`;
  try {
    import_fs3.default.writeFileSync(sitesAvailable, nginxConfig, { encoding: "utf-8" });
    console.log(import_picocolors5.default.green(`\u2714 `) + `Nginx configuration created at ${sitesAvailable}`);
  } catch (error) {
    console.error(import_picocolors5.default.red(`\u274C Failed to create Nginx configuration: ${error}`));
  }
  runCommand({
    command: `sudo ln -s ${sitesAvailable} ${sitesEnabled}`,
    message: `Linking ${sitesAvailable} to sites-enabled...`,
    successMessage: `Linked ${sitesAvailable} to sites-enabled successfully.`
  });
  try {
    (0, import_child_process3.execSync)("sudo nginx -t", { stdio: "pipe" });
    console.log(import_picocolors5.default.green(`\u2714 `) + `Nginx configuration is valid.`);
  } catch (error) {
    console.error(import_picocolors5.default.red(`\u2718 `) + `Nginx configuration test failed: ${error}`);
  }
  runCommand({
    command: "sudo service nginx restart",
    message: `Restarting Nginx...`,
    successMessage: `Nginx restarted successfully!`
  });
  console.log(import_picocolors5.default.green(`\u2714 `) + `Nginx is set up and serving ${websiteName} on port 80.`);
};
var enableSSL = async (websiteName, sslEmail) => {
  if (websiteName === "_") {
    console.error(import_picocolors5.default.red(`\u2718 `) + `Website name is set as "${websiteName}". Cannot obtain SSL Certificate for "${websiteName}". You should use a real website address.`);
    return;
  }
  const isSnapInstalled = () => {
    try {
      (0, import_child_process3.execSync)("which snap", { stdio: "ignore" });
      return true;
    } catch (error) {
      return false;
    }
  };
  const isCertbotInstalled = () => {
    try {
      (0, import_child_process3.execSync)("which certbot", { stdio: "ignore" });
      return true;
    } catch (error) {
      return false;
    }
  };
  if (!isSnapInstalled()) {
    await runCommand({
      command: "sudo apt update && sudo apt install snapd -y",
      message: "Installing snap package manager...",
      successMessage: "Snap installed successfully."
    });
  }
  if (!isCertbotInstalled()) {
    await runCommand({
      command: `sudo snap install core; sudo snap refresh core`,
      mute: true
    });
    runCommand({
      command: "sudo snap install certbot --classic",
      message: "Installing Certbot via Snap...",
      successMessage: "Certbot successfully installed!"
    });
  } else {
    console.log(import_picocolors5.default.green(`\u2714 `) + `Certbot is already installed.`);
  }
  runCommand({
    command: `sudo certbot --nginx -d ${websiteName} --non-interactive --agree-tos --email ${sslEmail}`,
    message: `Requesting SSL certificate for ${websiteName}...`,
    successMessage: `SSL certificate for ${websiteName} obtained successfully!`
  });
  runCommand({
    command: "sudo service nginx reload",
    message: "Reloading Nginx...",
    successMessage: "Nginx reloaded successfully!",
    mute: false
  });
  console.error(import_picocolors5.default.red(`\u2714 `) + `SSL is enabled for ${websiteName}.`);
};

// src/setup/python.ts
var import_child_process4 = require("child_process");
var import_picocolors6 = __toESM(require("picocolors"));
var getPythonVersion = (odooHome) => {
  const venvPath = `${odooHome}/venv`;
  try {
    const command = `${venvPath}/bin/python --version`;
    const version = (0, import_child_process4.execSync)(command, { encoding: "utf-8" }).trim();
    return version;
  } catch (error) {
    console.error(import_picocolors6.default.red(`Failed to get Python version from venv: ${error}`));
    return null;
  }
};
var createVirtualEnv = async (venvPath, odooUser) => {
  try {
    await runCommand({
      command: `sudo su ${odooUser} && python3 -m venv ${venvPath}`,
      message: "Creating virtual environment...",
      successMessage: `Virtual environment created successfully at ${venvPath}`,
      mute: false
    });
  } catch (error) {
    console.error("Failed to create virtual environment:", error);
    throw error;
  }
};
var installPipPackages = async (odooHome, odooUser) => {
  const venvPath = `${odooHome}/venv`;
  await createVirtualEnv(venvPath, odooUser);
  await runCommand({
    command: `cd ${odooHome}/odoo-server && ${odooHome}/venv/bin/pip install .`,
    message: "Installing Python packages for Odoo.",
    successMessage: "Successfully installed python packages for Odoo."
  });
  await runCommand({
    command: `${venvPath}/bin/pip install psycopg2-binary pdfminer.six ebaysdk lxml_html_clean`,
    mute: true
  });
};

// src/helpers/clone-repo.ts
var import_cli_progress = require("cli-progress");
var import_fs4 = __toESM(require("fs"));
var import_path3 = __toESM(require("path"));
var import_picocolors7 = __toESM(require("picocolors"));
var import_simple_git = require("simple-git");
async function cloneRepo(options) {
  const { repoUrl, branch, targetDir, accessToken } = options;
  const repoName = import_path3.default.basename(repoUrl, ".git");
  const targetPath = import_path3.default.join(targetDir);
  if (import_fs4.default.existsSync(targetPath)) {
    runCommand({
      command: `rm -rf ${targetPath}`,
      mute: true
    });
    await runCommand({
      command: `sudo mkdir -p ${targetPath}`,
      mute: true
    });
  }
  const progressBar = new import_cli_progress.SingleBar(
    {
      format: import_picocolors7.default.green(`\u2714 `) + `Cloning ${repoName} (branch: ${branch}) [` + import_picocolors7.default.magenta("{bar}") + "] {stage} {percentage}% Objects",
      hideCursor: true
    },
    import_cli_progress.Presets.rect
  );
  progressBar.start(100, 0, {
    method: "clone",
    stage: "remote"
  });
  const progress = ({ method, stage, progress: progress2 }) => {
    progressBar.update(progress2, { method, stage });
  };
  const gitOptions = {
    baseDir: targetDir,
    progress
  };
  const git = (0, import_simple_git.simpleGit)(gitOptions);
  try {
    const clonedRepoUrl = accessToken ? repoUrl.replace(/^https?:\/\//, `https://${accessToken}:x-oauth-basic@`) : repoUrl;
    await git.clone(clonedRepoUrl, targetPath, [`--branch=${branch}`, "--depth=1"]);
    progressBar.stop();
    console.log(import_picocolors7.default.green(`\u2714 `) + `Successfully cloned ${repoName} (branch: ${branch}) to ${targetPath}`);
  } catch (error) {
    progressBar.stop();
    console.error(import_picocolors7.default.red(`\u2718 `) + `Failed to clone ${repoName}: ${error}`);
  }
}

// src/setup/server.ts
var import_fs5 = __toESM(require("fs"));
var import_ora2 = __toESM(require("ora"));
var import_path4 = __toESM(require("path"));
var requiredPackages = [
  "git",
  "wget",
  "python3-pip",
  "python3-venv",
  "build-essential",
  "libssl-dev",
  "libffi-dev",
  "python3-dev",
  "libxml2-dev",
  "libxslt1-dev",
  "zlib1g-dev",
  "libsasl2-dev",
  "libldap2-dev",
  "libjpeg-dev",
  "libpq-dev",
  "npm",
  "nodejs",
  // Additional packages to install
  "python3-cffi",
  "libzip-dev",
  "node-less",
  "libpng-dev",
  "gdebi"
];
var installRequiredPackages = async () => {
  const packageList = requiredPackages.join(" ");
  await runCommand({
    command: `sudo apt-get install -y ${packageList}`,
    message: "Installing Required packages",
    successMessage: "Packages Installed"
  });
};
var prepareServer = async () => {
  await runCommand({
    command: `sudo apt-get update`,
    message: "Updating Server..",
    successMessage: "Server Updated."
  });
  await runCommand({
    command: `sudo apt-get upgrade -y`,
    message: "Upgrading Server..",
    successMessage: "Server Upgraded."
  });
  installRequiredPackages();
  await runCommand({
    command: `sudo npm install -g rtlcss less less-plugin-clean-css`,
    message: "Installing Nodejs packages..",
    successMessage: "Nodejs packages installed."
  });
};
var createOdooDirs = async (odooHome, odooUser) => {
  const spinner = (0, import_ora2.default)({ text: "Creating Directories for Odoo", color: "magenta", spinner: "circleHalves" }).start();
  await runCommand({
    command: `sudo mkdir -p /var/log/${odooUser}`,
    mute: true
  });
  await runCommand({
    command: `sudo chown ${odooUser}:${odooUser} /var/log/${odooUser}`,
    mute: true
  });
  await runCommand({
    command: `sudo mkdir -p ${odooHome}/custom/addons ${odooHome}/odoo-server`,
    mute: true
  });
  spinner?.succeed("Directories for Odoo Created Successfully.");
};
var setupOdoo = async (version, odooHome, odooUser) => {
  await runCommand({
    command: `sudo adduser --system --quiet --shell=/bin/bash --home=${odooHome} --gecos 'ODOO' --group ${odooUser}`,
    message: `Createing ${odooUser} system user.`,
    successMessage: `${odooUser} system user created.`
  });
  await runCommand({
    command: `sudo adduser ${odooUser} sudo`,
    mute: true
  });
  await createOdooDirs(odooHome, odooUser);
  await cloneRepo({
    repoUrl: "https://github.com/odoo/odoo.git",
    branch: version,
    targetDir: import_path4.default.join(odooHome, "odoo-server")
  });
  await runCommand({
    command: `sudo chown -R ${odooUser}:${odooUser} ${odooHome}/*`,
    mute: true
  });
};
var cloneOdooEnterprise = async (version, odooHome, odooUser, accessToken) => {
  const repoUrl = `https://github.com/odoo/enterprise.git`;
  const targetDir = `${odooHome}/enterprise`;
  const venvPath = `${odooHome}/venv`;
  await runCommand({
    command: `sudo mkdir -p ${odooHome}/enterprise`,
    mute: true
  });
  await cloneRepo({
    repoUrl,
    branch: version,
    targetDir,
    accessToken
  });
  await runCommand({
    command: `sudo chown -R ${odooUser}:${odooUser} ${odooHome}/*`,
    mute: true
  });
  await runCommand({
    command: `${venvPath}/bin/pip install dbfread google_auth xmlsec pyjwt phonenumbers`,
    message: "Installing python dependancy for Odoo enterprise.",
    successMessage: "Python dependancy for Odoo enterprise installed."
  });
};
var rotateOdooLog = async (odooUser, odooHome) => {
  const spinner = (0, import_ora2.default)({ text: "Creating Directories for Odoo", color: "magenta", spinner: "circleHalves" }).start();
  const logFilePath = import_path4.default.join(odooHome, "logs", "odoo.log");
  const configName = `${odooUser}-server`;
  const logrotateConfigPath = `/etc/logrotate.d/${configName}`;
  const logrotateConfig = `
  ${logFilePath} {
      daily
      missingok
      rotate 30
      compress
      delaycompress
      notifempty
      create 0640 ${odooUser} ${odooUser}
      postrotate
          [ -f /var/run/${configName}.pid ] && kill -USR1 \`cat /var/run/${configName}.pid\`
      endscript
  }`;
  try {
    if (!import_fs5.default.existsSync(odooHome)) {
      console.error(`The Odoo home path ${odooHome} does not exist.`);
      return;
    }
    const logDirPath = import_path4.default.join(odooHome, "logs");
    if (!import_fs5.default.existsSync(logDirPath)) {
      import_fs5.default.mkdirSync(logDirPath, { recursive: true });
    }
    await import_fs5.default.promises.writeFile(logrotateConfigPath, logrotateConfig, { mode: 420 });
    spinner?.succeed(`Configured daily Odoo log rotation at ${logrotateConfigPath}.`);
  } catch (error) {
    spinner?.fail(`Failed to create logrotate configuration: ${error.message}.`);
  }
};
var startOdooService = async () => {
  try {
    await runCommand({
      command: "sudo service odoo-server start",
      message: "Starting Odoo service...",
      successMessage: "Odoo service started successfully."
    });
  } catch (error) {
    console.error("Failed to start Odoo service:", error);
    throw new Error("Could not start Odoo service. Please check the service status.");
  }
};

// src/setup/summary.ts
var import_fs6 = __toESM(require("fs"));
var import_ora3 = __toESM(require("ora"));
var import_path5 = __toESM(require("path"));
var import_picocolors8 = __toESM(require("picocolors"));
var pgWarning = (configFilePath) => `
---------------------------------------------------------------------------------------------
\u26A0\uFE0F Attention: PostgreSQL Not Installed
It seems that PostgreSQL is not installed or configured on your system.
To proceed, please configure the database settings in the Odoo configuration file located at: ${configFilePath}
---------------------------------------------------------------------------------------------    
    
`;
var odooInstallSummary = async (config) => {
  const enterpriseInfo = config.isEnterprise && config.accessToken ? `${import_picocolors8.default.bold("- Install Odoo Enterprise:")} ${import_picocolors8.default.green("Yes")}
${import_picocolors8.default.bold("- Github Access Token:")} ${import_picocolors8.default.green("*".repeat(config.accessToken.length))}
` : `${import_picocolors8.default.bold("- Install Odoo Enterprise:")} ${import_picocolors8.default.green("No")}
`;
  const nginxInfo = config.nginx ? `${import_picocolors8.default.bold("- Nginx Enabled:")} ${import_picocolors8.default.green("Yes")}
${import_picocolors8.default.bold("- Website Name:")} ${import_picocolors8.default.green(config.websiteName || "Not provided")}
` : `${import_picocolors8.default.bold("- Nginx Enabled:")} ${import_picocolors8.default.green("No")}
`;
  const sslInfo = config.nginx && config.ssl ? `${import_picocolors8.default.bold("- SSL Enabled:")} ${import_picocolors8.default.green("Yes")}
${import_picocolors8.default.bold("- SSL Email:")} ${import_picocolors8.default.green(config.sslEmail || "Not provided")}
` : `${import_picocolors8.default.bold("- SSL Enabled:")} ${import_picocolors8.default.green(config.ssl ? "Yes" : "No")}
`;
  const pgInstalled = await isPostgreSQLInstalled();
  const configPath = `/etc/${config.odooUser}-server.conf`;
  const installPostgresInfo = `${import_picocolors8.default.bold("- Install Postgres:")} ${import_picocolors8.default.green(config.installPG ? "Yes" : "No")}
`;
  const pgUserInfo = pgInstalled ? `${import_picocolors8.default.bold("- PostgreSQL User:")} ${import_picocolors8.default.green(config.pgUser)}
${import_picocolors8.default.bold("- PostgreSQL Password:")} ${import_picocolors8.default.green("*".repeat(config.pgPassword.length))}
` : "";
  return `
You Have Chosen the Following Options for Odoo Installation:

- ${import_picocolors8.default.bold("Odoo Version:")} ${import_picocolors8.default.green(config.version)}
${enterpriseInfo}- ${import_picocolors8.default.bold("Odoo Home:")} ${import_picocolors8.default.green(config.odooHome)}
- ${import_picocolors8.default.bold("Odoo User:")} ${import_picocolors8.default.green(config.odooUser)}
${installPostgresInfo}${pgUserInfo}- ${import_picocolors8.default.bold("Generate Strong Odoo Super Admin Password:")} ${import_picocolors8.default.green(config.strongPassword ? "Yes" : "No")}
- ${import_picocolors8.default.bold("Odoo Super Admin Password:")} ${import_picocolors8.default.green(config.strongPassword ? "Will be generated" : "*".repeat(config.adminPassword.length))}
- ${import_picocolors8.default.bold("HTTP Port:")} ${import_picocolors8.default.green(config.httpPort)}
- ${import_picocolors8.default.bold("Gevent Port:")} ${import_picocolors8.default.green(config.geventPort)}
${nginxInfo}${sslInfo}- ${import_picocolors8.default.bold("Wkhtmltopdf:")} ${import_picocolors8.default.green(config.wkhtmltopdf ? "Yes" : "No")}

${!pgInstalled ? pgWarning(configPath) : ""}
${import_picocolors8.default.blue("* NOTE: Password info will be shared in the odoo installation summary.")}
`;
};
var odooInstallSummaryMarkdown = async (config) => {
  const {
    version,
    isEnterprise,
    odooHome,
    odooUser,
    installPG,
    pgUser,
    pgPassword,
    strongPassword,
    adminPassword,
    httpPort,
    geventPort,
    nginx,
    websiteName,
    ssl,
    sslEmail,
    wkhtmltopdf
  } = config;
  const spinner = (0, import_ora3.default)({ text: "Generating Odoo Setup Summary", color: "magenta", spinner: "circleHalves" }).start();
  const addonsPathString = prepareAddonsPath(odooHome, isEnterprise);
  if (!addonsPathString) {
    spinner.fail("Failed to generate addons path.");
    return;
  }
  const pythonVersion = getPythonVersion(odooHome);
  const addonsList = addonsPathString.split(",").map((path7) => `- ${path7}`).join("\n");
  const configPath = `/etc/${config.odooUser}-server.conf`;
  const summaryContent = `
# Odoo Installation Summary

**Odoo Version**: ${version}
**Odoo Installation Directory**: ${odooHome}
${isEnterprise ? `**Odoo Enterprise Directory**: ${odooHome}/enterprise` : ""}

**Odoo Configuration File**: ${configPath}
**Odoo User**: ${odooUser}

## Python Configuration
**Version**: ${pythonVersion}
**Virtual Environment**: ${odooHome}/venv

## PostgreSQL Configuration
**Is PostgreSQL Installed**: ${installPG ? "Yes" : "No"}
${installPG ? `**PostgreSQL User**: ${pgUser}
**PostgreSQL Password**: ${"*".repeat(pgPassword.length)}` : ""}
<sub><sup>Check Odoo configuration file postgres user password</sup></sub>

## Odoo Admin Configuration
**Super Admin Password**: ${strongPassword ? "[Generated Strong Password]" : "*".repeat(adminPassword.length)}
<sub><sup>Check Odoo configuration file for super admin password</sup></sub>

## Network Configuration
**Odoo HTTP Port**: ${httpPort}
**Odoo Gevent Port**: ${geventPort}

## Addons Path
The following addons paths have been configured:
${addonsList}

## Service Commands
- **Start Odoo**: \`sudo service ${odooUser}-server start\`
- **Stop Odoo**: \`sudo service ${odooUser}-server stop\`
- **Restart Odoo**: \`sudo service ${odooUser}-server restart\`
- **Check Status**: \`sudo service ${odooUser}-server status\`

${nginx ? `
## Nginx Configuration
**Website Name**: ${websiteName}
**Nginx Configuration File**: /etc/nginx/sites-available/${websiteName}.conf
**SSL Enabled**: ${ssl ? "Yes" : "No"}
${ssl ? `**SSL Certificate Email**: ${sslEmail}
` : "Cannot obtain SSL Certificate for this site. Use a real website address."}
` : ""}

${wkhtmltopdf ? `
## WKHTMLTOPDF
WKHTMLTOPDF has been installed for rendering PDF reports.
` : ""}

---

### Thank You
Thank you for installing Odoo using the Odoo Install Script!  
**For support**, feel free to [contact us](https://www.heliconia.io/contact) or write an email to [hello@heliconia.io](mailto:hello@heliconia.io).

**Heliconia Solutions**  
[https://www.heliconia.io](https://www.heliconia.io)
`;
  const filePath = import_path5.default.join("/tmp", "odoo-install-summary.md");
  try {
    import_fs6.default.writeFileSync(filePath, summaryContent.trim(), { encoding: "utf-8", mode: 416 });
    spinner.succeed(`Installation summary saved to ${filePath}`);
  } catch (error) {
    spinner.fail(`Failed to save installation summary: ${error}`);
  }
  const configFilePath = `/etc/${odooUser}-server.conf`;
  const thankYou = `
---------------------------------------------------------------------------------------------

Thank you for installing Odoo using the Odoo Install CLI!
For support or feature request, feel free to ${supportLink} or write an email to ${emailLink}.

Heliconia Solutions
${websiteLink}

---------------------------------------------------------------------------------------------
`;
  if (await isPostgreSQLInstalled()) {
    console.log(import_picocolors8.default.red(pgWarning(configPath)));
  }
  console.log(import_picocolors8.default.green(thankYou));
};

// src/setup/wkhtmltopdf.ts
var import_child_process5 = require("child_process");
var import_os = __toESM(require("os"));
var import_path6 = __toESM(require("path"));
var import_picocolors9 = __toESM(require("picocolors"));
var isWkhtmltopdfInstalled = () => {
  try {
    const version = (0, import_child_process5.execSync)("wkhtmltopdfc --version", { encoding: "utf-8", stdio: "pipe" }).trim();
    return version;
  } catch (error) {
    return false;
  }
};
var installWkhtmltopdf = async () => {
  const wkhtmltopdfVersion = isWkhtmltopdfInstalled();
  if (wkhtmltopdfVersion) {
    console.log(import_picocolors9.default.green(`${wkhtmltopdfVersion} is already installed.`));
    return;
  }
  const version = (0, import_child_process5.execSync)("lsb_release -r -s", { encoding: "utf-8" }).trim();
  if (version !== "22.04" && version !== "24.04") {
    console.error(import_picocolors9.default.red("This script is only supported on Ubuntu 22.04 or 24.04."));
    return;
  }
  const architecture = import_os.default.arch();
  const validArchitectures = ["x64", "arm64", "ppc64le"];
  if (!validArchitectures.includes(architecture)) {
    console.error(`Unsupported architecture: ${architecture}`);
    process.exit(1);
  }
  const downloadUrl = `https://github.com/wkhtmltopdf/packaging/releases/download/0.12.6.1-2/wkhtmltox_0.12.6.1-2.jammy_${architecture}.deb`;
  const fileName = import_path6.default.basename(downloadUrl);
  await runCommand({
    command: `sudo wget ${downloadUrl}`,
    message: "Downloading wkhtmltopdf package",
    successMessage: "Wkhtmltopdf Downloaded"
  });
  await runCommand({
    command: `sudo gdebi --n ${fileName}`,
    message: "Installing wkhtmltopdf.",
    successMessage: "Wkhtmltopdf Installed."
  });
  await runCommand({
    command: `sudo rm -f ${fileName}`,
    mute: true
  });
  await runCommand({
    command: `sudo ln -sf /usr/local/bin/wkhtmltopdf /usr/bin`,
    mute: true
  });
  await runCommand({
    command: `sudo ln -sf /usr/local/bin/wkhtmltoimage /usr/bin`,
    mute: true
  });
};

// src/index.ts
var import_commander = require("commander");
var import_fs7 = __toESM(require("fs"));
var import_picocolors10 = __toESM(require("picocolors"));
var import_prompts = __toESM(require("prompts"));
console.log(import_picocolors10.default.magenta("Welcome to"));
console.log(import_picocolors10.default.magenta(ScriptName));
var program = new import_commander.Command();
program.version("1.0.0").description("Odoo Installer CLI").action(async () => {
  const onCancel = () => {
    console.log(import_picocolors10.default.red("You canceled the Odoo Installation CLI. Goodbye! \u{1F44B}"));
    process.exit(0);
  };
  const isPgInstalled = await isPostgreSQLInstalled();
  const response = await (0, import_prompts.default)([
    {
      type: "select",
      name: "version",
      message: "Select Odoo version to install:",
      choices: [
        { title: "Odoo 18.0", value: "18.0" },
        { title: "Odoo 17.0", value: "17.0" }
      ]
    },
    {
      type: "confirm",
      name: "isEnterprise",
      message: "Want to install the Odoo Enterprise?",
      initial: false
    },
    {
      type: (prev, values) => values.isEnterprise ? "password" : null,
      // If `isEnterprise` is `true`, ask for the github access token
      name: "accessToken",
      message: "Enter Github Access Token:",
      validate: async (token) => {
        const isValid = await validateGitHubToken(token);
        return isValid ? true : "Invalid GitHub access token or no access to Odoo enterprise repository. Please try again.";
      }
    },
    {
      type: "confirm",
      name: "installPG",
      message: "Want to install Postgres 16?",
      initial: true
    },
    {
      type: "confirm",
      name: "nginx",
      message: "Want to install Nginx?",
      initial: false
    },
    {
      type: (prev, values) => values.nginx ? "text" : null,
      // If `nginx` is `true`, ask for the website name
      name: "websiteName",
      message: "Enter the website name:",
      initial: "_",
      validate: (value) => value.trim() !== "" ? true : "Website name cannot be empty"
    },
    {
      type: (prev, values) => values.nginx ? "confirm" : null,
      // If `nginx` is `true`, ask to enable SSL
      name: "ssl",
      message: "Do you want to enable SSL?",
      initial: (prev, values) => values.websiteName === "_" ? false : true
    },
    {
      type: (prev, values) => values.ssl ? "text" : null,
      // If `nginx` is `true`, ask to enable SSL
      name: "sslEmail",
      message: "Enter the admin Email:",
      validate: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? true : "Please enter a valid email address.";
      }
    },
    {
      type: "confirm",
      name: "strongPassword",
      message: "Want to generate random strong odoo super admin password?",
      initial: true
    },
    {
      type: (prev) => prev === false ? "password" : null,
      name: "adminPassword",
      message: "Enter the Odoo super admin password:",
      validate: (value) => value.length < 8 ? `Password must be at least 8 characters.` : true
    },
    {
      type: "text",
      name: "odooUser",
      message: "Enter the Name of the system user for Odoo:",
      initial: "odoo"
    },
    {
      type: (prev, values) => isPgInstalled ? "text" : null,
      // If `installPG` is `true`, ask to for PG User
      name: "pgUser",
      message: "Enter the Name of the PostgreSQL user for Odoo:",
      initial: (prev, values) => values.odooUser || ""
      // Set initial value to odooUser if it's provided
    },
    {
      type: (prev, values) => isPgInstalled ? "password" : null,
      // If `installPG` is `true`, ask to for PG User
      name: "pgPassword",
      message: `Enter the Password for PostgreSQL user for Odoo:`,
      validate: (value) => value.length < 8 ? `Password must be at least 8 characters.` : true
    },
    {
      type: "text",
      name: "odooHome",
      message: "Enter the path for Odoo Home:",
      initial: "/odoo",
      validate: (odooHome2) => {
        return import_fs7.default.existsSync(odooHome2) ? `The path ${odooHome2} already exists. Please choose a different path.` : true;
      }
    },
    {
      type: "number",
      name: "httpPort",
      message: "Set the default Odoo port:",
      initial: 8069
    },
    {
      type: "number",
      name: "geventPort",
      message: "Set the default Odoo port for websocket:",
      initial: 8072
    },
    {
      type: "confirm",
      name: "wkhtmltopdf",
      message: "Want to install WKHTMLTOPDF?",
      initial: true
    }
  ], { onCancel });
  const { version, isEnterprise, accessToken, odooHome, odooUser, installPG, pgUser, pgPassword, strongPassword, adminPassword, httpPort, geventPort, nginx, websiteName, ssl, sslEmail, wkhtmltopdf } = response;
  const OdooConfig = {
    version,
    isEnterprise,
    accessToken,
    odooUser,
    odooHome,
    installPG,
    pgUser,
    pgPassword,
    strongPassword,
    adminPassword,
    httpPort,
    geventPort,
    nginx,
    websiteName,
    ssl,
    sslEmail,
    wkhtmltopdf
  };
  const summary = await odooInstallSummary(OdooConfig);
  console.log(import_picocolors10.default.magentaBright(summary));
  const confirmResponse = await (0, import_prompts.default)({
    type: "toggle",
    name: "value",
    message: "Proceed with Odoo installation using the selected options?",
    initial: true,
    active: "Yes",
    inactive: "No"
  });
  if (confirmResponse.value) {
    try {
      await prepareServer();
      if (installPG) {
        await installPostgreSQL();
      }
      if (await isPostgreSQLInstalled()) {
        await createPostgreSQLUser(pgUser, pgPassword);
      }
      await setupOdoo(version, odooHome, odooUser);
      if (isEnterprise) {
        await cloneOdooEnterprise(version, odooHome, odooUser, accessToken);
      }
      await installPipPackages(odooHome, odooUser);
      await setupOdooConfig(OdooConfig);
      await setupDaemon(odooUser, odooHome);
      if (wkhtmltopdf) {
        await installWkhtmltopdf();
      }
      if (nginx) {
        await setupNginx(httpPort, geventPort, websiteName);
        if (ssl) {
          enableSSL(websiteName, sslEmail);
        }
      }
      await rotateOdooLog(odooUser, odooHome);
      await startOdooService();
      await odooInstallSummaryMarkdown(OdooConfig);
      process.exit(0);
    } catch (error) {
      console.error(import_picocolors10.default.red(`An error occurred during setup: ${error}`));
      process.exit(1);
    }
  } else {
    console.log(import_picocolors10.default.red("Installation cancelled by the user."));
    process.exit(0);
  }
});
program.parse(process.argv);
