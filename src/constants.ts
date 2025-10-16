// Central constants for the CLI
export const SUPPORTED_ODOO_VERSIONS = ['19.0', '18.0', '17.0'] as const;
export type SupportedOdooVersion = (typeof SUPPORTED_ODOO_VERSIONS)[number];

export const DEFAULT_ODOO_VERSION = '19.0';
