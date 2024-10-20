import { runCommand } from "@helpers/run-command";
import { execSync } from "child_process"; // todo: replace with runCommand
import pc from "picocolors";

/**
 * Checks whether PostgreSQL is installed on the system.
 *
 * @returns {Promise<boolean>} - Returns a promise that resolves to `true` if PostgreSQL is installed, otherwise `false`.
 *
 * @throws {Error} - Throws an error if the command execution to check PostgreSQL fails.
 */
const isPostgreSQLInstalled = async (): Promise<boolean> => {
    try {
        const result = execSync('pg_lsclusters', { stdio: 'ignore' });
        return true;
    } catch (error) {
        return false;
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
 * Creates a new PostgreSQL user with the specified username and password.
 *
 * @param {string} pgUser - The username for the new PostgreSQL user.
 * @param {string} pgPassword - The password for the new PostgreSQL user.
 *
 * @returns {Promise<void>} - Returns a promise that resolves when the user is successfully created.
 *
 * @throws {Error} - Throws an error if the command execution to create the PostgreSQL user fails.
 */
export const createPostgreSQLUser = async (pgUser: string, pgPassword: string) => {
    try {
        const result = execSync(`sudo -u postgres psql -t -c "SELECT 1 FROM pg_catalog.pg_user WHERE usename='${pgUser}'"`, { encoding: 'utf-8' });

        if (result.trim() === '1') {
            console.log(pc.green(`User "${pc.underline(pgUser)}" already exists in PostgreSQL.`));
            return;
        }
    } catch (error) {
        console.error(`Error checking if user "${pgUser}" exists:`);
        return;
    }

    await runCommand({
        command: `sudo su - postgres -c "psql -c \\"CREATE USER ${pgUser} WITH PASSWORD '${pgPassword}' CREATEDB;\\"" 2> /dev/null || true`,
        message: "Creating Postgres user for Odoo.",
        successMessage: `Postgres user ${pgUser} created.`,
    })

}

/**
 * Installs PostgreSQL on the system if it is not already installed.
 *
 * @returns {Promise<void>} - Returns a promise that resolves when the installation is complete.
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
        command: `wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /usr/share/keyrings/postgresql.gpg`,
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
        command: `sudo apt-get install -y postgresql-16`,
        message: "Installing PostgreSQL 16.",
        successMessage: "PostgreSQL 16 installed."
    })

    await runCommand({
        command: `/etc/init.d/postgresql start`,
        mute: true
    })

};


