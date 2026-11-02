import { SUPPORTED_ODOO_VERSIONS } from '../constants';
import { isSafeAbsolutePath, isValidIdentifier, isValidPgIdentifier } from '@helpers/system';
import { OdooConfigType } from 'types';

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HOSTNAME_REGEX = /^(_|([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)$/;

export const isPort = (p: unknown): p is number =>
  typeof p === 'number' && Number.isInteger(p) && p > 0 && p < 65536;

/**
 * Validates a complete installation config and returns a list of human readable problems
 * (empty when the config is valid).
 */
export const validateConfig = (c: Partial<OdooConfigType>): string[] => {
  const errors: string[] = [];

  if (!(SUPPORTED_ODOO_VERSIONS as readonly string[]).includes(c.version ?? '')) {
    errors.push(`version must be one of ${SUPPORTED_ODOO_VERSIONS.join(', ')} (got ${c.version}).`);
  }
  if (!isSafeAbsolutePath(c.odooHome) || c.odooHome === '/') {
    errors.push(`odooHome must be an absolute path made of letters, digits, "_", "-", "." and "/" (got ${c.odooHome}).`);
  }
  if (!isValidIdentifier(c.odooUser)) {
    errors.push(`odooUser must be a valid Linux user name: lowercase letters, digits, "_" or "-" (got ${c.odooUser}).`);
  }
  if (c.isEnterprise && !c.accessToken) errors.push('accessToken is required to install Odoo Enterprise.');
  if (!isPort(c.httpPort)) errors.push(`httpPort must be an integer between 1 and 65535 (got ${c.httpPort}).`);
  if (!isPort(c.geventPort)) errors.push(`geventPort must be an integer between 1 and 65535 (got ${c.geventPort}).`);
  if (isPort(c.httpPort) && c.httpPort === c.geventPort) errors.push('httpPort and geventPort must be different.');
  if (!c.pgHost || /\s/.test(c.pgHost)) errors.push(`pgHost is required (got ${c.pgHost}).`);
  if (!isPort(c.pgPort)) errors.push(`pgPort must be an integer between 1 and 65535 (got ${c.pgPort}).`);
  if (!isValidPgIdentifier(c.pgUser)) errors.push(`pgUser may only contain letters, digits, "_", "." and "-" (got ${c.pgUser}).`);
  if (!c.pgPassword) errors.push('pgPassword must not be empty.');
  if (!c.strongPassword && (c.adminPassword ?? '').length < 8) errors.push('adminPassword must be at least 8 characters.');

  if (c.nginx) {
    if (!c.websiteName || !HOSTNAME_REGEX.test(c.websiteName)) {
      errors.push(`websiteName must be a host name like "erp.example.com" or "_" (got ${c.websiteName}).`);
    }
    if (c.ssl) {
      if (c.websiteName === '_') errors.push('SSL needs a real website name, not "_".');
      if (!c.sslEmail || !EMAIL_REGEX.test(c.sslEmail)) errors.push(`sslEmail is not a valid email address (got ${c.sslEmail}).`);
    }
  }
  return errors;
};
