import { runCommand } from "@helpers/run-command";
import { isDryRun, isValidPgIdentifier, tryExec } from "@helpers/system";
import { execSync } from "child_process";
import { Client } from 'pg';
import pc from "picocolors";

/**
 * Checks whether PostgreSQL is installed on the system.
 *
 * @returns {Promise<boolean>} - Returns a promise that resolves to `true` if PostgreSQL is installed, otherwise `false`.
 *
 * @throws {Error} - Throws an error if the command execution to check PostgreSQL fails.
 */
export const isPostgreSQLInstalled = async (): Promise<boolean> => {
    try {
        const result = execSync('pg_lsclusters', { stdio: 'ignore' });
        return true;
    } catch (error) {
        return false;
    }
};


/**
 * Checks the connection to a PostgreSQL database using the provided host, user, password, and port.
 *
 * @param {string} pgHost - The hostname or IP address of the PostgreSQL server.
 * @param {string} pgUser - The PostgreSQL username to authenticate with.
 * @param {string} pgPassword - The PostgreSQL password for the provided user.
 * @param {number} pgPort - The port on which the PostgreSQL server is running (default: 5432).
 * 
 * @returns {Promise<boolean>} - Resolves to `true` if the connection is successful, otherwise `false`.
 * 
 * @throws {Error} - Throws an error if the connection attempt encounters a problem.
 *
 */
export const checkPostgresConnection = async (
    pgHost: string,
    pgPort: number,
    pgUser: string,
    pgPassword: string,
): Promise<boolean> => {
    const client = new Client({
        host: pgHost,
        port: pgPort,  // Add the port to the connection configuration
        user: pgUser,
        password: pgPassword,
        database: 'postgres',  // Connect to the default database
    });

    try {
        await client.connect(); // Attempt to connect to the PostgreSQL server
        return true; // Connection succeeded
    } catch (error) {
        return false; // Connection failed
    } finally {
        await client.end(); // Close the client connection
    }
};


/**
 * Retrieves the installed PostgreSQL version.
 *
 * @returns {Promise<string | null>} - Returns a promise that resolves to the PostgreSQL version string if installed, or `null` if not found.
 *
 * @throws {Error} - Throws an error if the command execution to retrieve the PostgreSQL version fails.
 */
const getPostgreSQLVersion = async (): Promise<string | null> => {
    try {
        const result = execSync('pg_config --version', { encoding: 'utf-8' });
        return result.trim();
    } catch (error) {
        console.error("PostgreSQL is not installed or an error occurred while checking.");
        return null;
    }
};


/**
 * Waits until the local PostgreSQL server accepts connections.
 *
 * @throws {Error} - Throws an error if PostgreSQL is not ready after `timeoutSec` seconds.
 */
const waitForPostgres = async (timeoutSec = 30) => {
    await runCommand({
        command: `for i in $(seq 1 ${timeoutSec}); do pg_isready -q && exit 0; sleep 1; done; exit 1`,
        message: "Waiting for PostgreSQL to accept connections.",
        successMessage: "PostgreSQL is ready.",
    });
};

/**
 * Creates a new PostgreSQL user with the specified username and password.
 * The SQL is sent over stdin, so neither the role name nor the password ever reaches a shell.
 *
 * @param {string} pgUser - The username for the new PostgreSQL user.
 * @param {string} pgPassword - The password for the new PostgreSQL user.
 *
 * @throws {Error} - Throws an error if the role name is invalid or the user cannot be created.
 */
export const createPostgreSQLUser = async (pgUser: string, pgPassword: string) => {
    if (!isValidPgIdentifier(pgUser)) {
        throw new Error(`Invalid PostgreSQL user name: ${pgUser}`);
    }

    if (!isDryRun()) {
        const exists = tryExec(`sudo -u postgres psql -tAc "SELECT 1 FROM pg_catalog.pg_roles WHERE rolname='${pgUser}'"`);
        if (exists === '1') {
            console.log(pc.green(`User "${pc.underline(pgUser)}" already exists in PostgreSQL.`));
            return;
        }
    }

    const quotedPassword = `'${pgPassword.replace(/'/g, "''")}'`;

    await runCommand({
        command: `sudo -u postgres psql -v ON_ERROR_STOP=1 -q`,
        input: `CREATE USER "${pgUser}" WITH PASSWORD ${quotedPassword} CREATEDB;\n`,
        message: "Creating Postgres user for Odoo.",
        successMessage: `Postgres user ${pgUser} created.`,
    })

}

/**
 * Installs PostgreSQL on the system if it is not already installed.
 *
 * @throws {Error} - Throws an error if the PostgreSQL installation fails.
 */
export const installPostgreSQL = async () => {
    if (await isPostgreSQLInstalled()) {
        const pgVersion = await getPostgreSQLVersion()
        console.log(pc.green(`${pc.underline(pgVersion)} is already installed.`));
        return;
    }

    await runCommand({
        command: `wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor --yes -o /usr/share/keyrings/postgresql.gpg`,
        mute: true
    })

    await runCommand({
        command: `echo "deb [signed-by=/usr/share/keyrings/postgresql.gpg] http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list`,
        mute: true
    });

    await runCommand({
        command: `sudo apt-get update`,
        mute: true
    })
    await runCommand({
        command: `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql-16`,
        message: "Installing PostgreSQL 16.",
        successMessage: "PostgreSQL 16 installed."
    })

    await runCommand({
        command: `sudo systemctl enable --now postgresql`,
        mute: true
    })

    await waitForPostgres();
};
