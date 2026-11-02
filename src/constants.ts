// Central constants for the CLI
export const SUPPORTED_ODOO_VERSIONS = ['20.0', '19.0', '18.0', '17.0'] as const;
export type SupportedOdooVersion = (typeof SUPPORTED_ODOO_VERSIONS)[number];

export const DEFAULT_ODOO_VERSION = '19.0';

/**
 * What a release needs beyond the baseline (Ubuntu 22.04, PostgreSQL 16). Odoo 20.0 requires Python 3.12 or newer
 * (`MIN_PY_VERSION` in `odoo/release.py`), which only ships with Ubuntu 24.04, and PostgreSQL 16 (`MIN_PG_VERSION`).
 */
export const ODOO_VERSION_REQUIREMENTS: Partial<Record<SupportedOdooVersion, { minUbuntu: string; minPostgres: number }>> = {
  '20.0': { minUbuntu: '24.04', minPostgres: 16 },
};
