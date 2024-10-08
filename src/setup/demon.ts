import { runCommand } from '@helpers/run-command';
import fs from 'fs';
import path from 'path';
import pc from 'picocolors';

/**
 * Setup the Odoo daemon file using fs module.
 * @param odooUser - The system user for running Odoo.
 * @param odooHome - The base directory for the Odoo installation.
 * @param configName - The name of the Odoo config file (without extension).
 */
export async function setupDaemon(odooUser: string, odooHome: string): Promise<void> {

  const configName = `${odooUser}-server`;
  const daemonPath = `/etc/init.d/${configName}`;
  const odooBinPath = path.join(odooHome, "odoo-server", "odoo-bin");
  const venvPath = `${odooHome}/venv`;

  console.log(pc.magenta(`* Creating Odoo daemon file at ${daemonPath}...`));

  // Daemon script content
  const daemonContent = `#!/bin/sh
### BEGIN INIT INFO
# Provides: ${configName}
# Required-Start: \$remote_fs \$syslog
# Required-Stop: \$remote_fs \$syslog
# Should-Start: \$network
# Should-Stop: \$network
# Default-Start: 2 3 4 5
# Default-Stop: 0 1 6
# Short-Description: Enterprise Business Applications
# Description: ODOO Business Applications
### END INIT INFO

# Set the PATH for the script execution environment
PATH=/sbin:/bin:/usr/sbin:/usr/bin:/usr/local/bin

# Specify the command to start the Odoo application
DAEMON=${venvPath}/bin/python3 ${odooBinPath}
NAME=${configName}
DESC=${configName}

# Specify the user under which the Odoo service will run
USER=${odooUser}

# Path to the Odoo configuration file
CONFIGFILE="/etc/odoo-${odooUser}.conf"

# PID file location
PIDFILE=/var/run/\${NAME}.pid

# Additional options that are passed to the Daemon
DAEMON_OPTS="-c \$CONFIGFILE"

# Check if the DAEMON executable exists and CONFIGFILE is present
[ -x \$DAEMON ] || { echo "DAEMON not found"; exit 1; }
[ -f \$CONFIGFILE ] || { echo "CONFIGFILE not found"; exit 1; }

# Function to check if the PID file exists and if the process is running
checkpid() {
  [ -f \$PIDFILE ] || return 1
  pid=\$(cat \$PIDFILE)
  [ -d /proc/\$pid ] && return 0
  return 1
}

case "\${1}" in
  start)
    echo -n "Starting \${DESC}: "
    start-stop-daemon --start --quiet --pidfile \$PIDFILE \\
      --chuid \$USER --background --make-pidfile \\
      --exec \$DAEMON -- \$DAEMON_OPTS
    echo "\${NAME} started."
    ;;
  stop)
    echo -n "Stopping \${DESC}: "
    start-stop-daemon --stop --quiet --pidfile \$PIDFILE \\
      --oknodo
    echo "\${NAME} stopped."
    ;;
  restart|force-reload)
    echo -n "Restarting \${DESC}: "
    start-stop-daemon --stop --quiet --pidfile \$PIDFILE \\
      --oknodo
    sleep 1
    start-stop-daemon --start --quiet --pidfile \$PIDFILE \\
      --chuid \$USER --background --make-pidfile \\
      --exec \$DAEMON -- \$DAEMON_OPTS
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
    echo "Usage: \$NAME {start|stop|restart|force-reload|status}" >&2
    exit 1
    ;;
esac
exit 0
`;

  try {
    // Write the daemon content to the specified path
    fs.writeFileSync(daemonPath, daemonContent, { encoding: 'utf-8', mode: 0o755 });

    // Set ownership to the specified user and group (odooUser:odooUser)
    await runCommand({
      command: `sudo chown ${odooUser}:${odooUser} ${daemonPath}`,
      mute: true
    })

    await runCommand({
      command: `sudo update-rc.d ${odooUser}-server defaults`,
      mute: true
    })

    console.log(pc.green(`✅ Daemon script ${daemonPath} created successfully!`));

  } catch (error) {
    console.error(pc.red(`❌ Failed to create the daemon script: ${error}`));
    process.exit(1);
  }
}


// createOdooDaemon("odoo", "/opt/odoo");
