
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
