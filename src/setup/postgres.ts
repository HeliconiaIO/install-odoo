import { runCommand } from "@helpers/run-command";
import { execSync } from "child_process"; // todo: replace with runCommand
import pc from "picocolors";


const isPostgreSQLInstalled = async (): Promise<boolean> => {
    try {
        const result = execSync('pg_lsclusters', { stdio: 'ignore' });
        return true;
    } catch (error) {
        return false;
    }
};

const getPostgreSQLVersion = async (): Promise<string | null> => {
    try {
        const result = execSync('pg_config --version', { encoding: 'utf-8' });
        return result.trim();
    } catch (error) {
        console.error("PostgreSQL is not installed or an error occurred while checking.");
        return null;
    }
};

export const createPostgreSQLUser = async (user: string) => {
    try {
        const result = execSync(`sudo -u postgres psql -t -c "SELECT 1 FROM pg_catalog.pg_user WHERE usename='${user}'"`, { encoding: 'utf-8' });

        if (result.trim() === '1') {
            console.log(pc.green(`User "${pc.underline(user)}" already exists in PostgreSQL.`));
            return;
        }
    } catch (error) {
        console.error(`Error checking if user "${user}" exists:`);
        return;
    }

    await runCommand({
        command: `sudo su - postgres -c "createuser -s ${user}" 2> /dev/null || true`,
        message: "Creating Postgres user for Odoo.",
        successMessage: `Postgres user ${user} created.`,
    })

}

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


