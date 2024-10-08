

export interface RunCommandType {
    command: string;
    message?: string;
    successMessage?: string;
    mute?: boolean;
}

export interface CloneRepoType {
    repoUrl: string;            // The repository URL to clone
    branch: string;             // The branch name to clone
    targetDir: string;          // The target directory where the repo will be cloned
}


export interface OdooConfigType {
    version?: string;
    odooHome: string;
    odooUser: string;
    installPG?: boolean;
    pgUser: string;
    pgPassword: string;
    strongPassword: boolean;
    adminPassword: string;
    httpPort: number;
    geventPort: number;
    nginx: boolean;
    websiteName?: string;
    ssl?: boolean;
    sslEmail?: string;
    wkhtmltopdf?: boolean;
}
