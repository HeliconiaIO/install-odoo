import { runCommand } from '@helpers/run-command';
import { isDryRun, tryExec } from '@helpers/system';
import fs from 'fs';
import pc from 'picocolors';

export const siteName = (websiteName: string) => (websiteName === '_' ? 'odoo-default' : websiteName);
export const sitesAvailablePath = (websiteName: string) => `/etc/nginx/sites-available/${websiteName}.conf`;
export const sitesEnabledPath = (websiteName: string) => `/etc/nginx/sites-enabled/${websiteName}.conf`;

/**
 * Renders the Nginx server block that proxies `websiteName` to Odoo.
 *
 * `secure` cookie flags and HSTS are only emitted when `ssl` is enabled: a `Secure` cookie is never
 * sent back over plain HTTP, which would make logging in to Odoo impossible.
 */
export const renderNginxConfig = (httpPort: number, geventPort: number, websiteName: string, ssl = false): string => {
    const logName = siteName(websiteName);
    const sslOnly = ssl
        ? `    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    proxy_cookie_flags session_id samesite=lax secure;  # requires nginx 1.19.8
`
        : '';

    return `# ${websiteName} odoo server
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
  client_max_body_size 100m;

  # log
  access_log /var/log/nginx/${logName}.access.log;
  error_log /var/log/nginx/${logName}.error.log;

  # Redirect websocket requests to odoo gevent port
  location /websocket {
    proxy_pass http://127.0.0.1:${geventPort};
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $http_host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Real-IP $remote_addr;
${sslOnly}  }

  # Redirect requests to odoo backend server
  location / {
    # Add Headers for odoo proxy mode
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $http_host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_redirect off;
    proxy_buffers 16 64k;
    proxy_buffer_size 128k;
    proxy_pass http://127.0.0.1:${httpPort};
${sslOnly}  }

  # common gzip
  gzip_types text/css text/scss text/plain text/xml application/xml application/json application/javascript;
  gzip on;
}
`;
};

/**
 * Configures Nginx as a reverse proxy for Odoo by setting up the server blocks and forwarding
 * traffic from the specified `websiteName` domain to the Odoo instance. It maps the given
 * HTTP and Gevent ports to Nginx.
 *
 * @param {number} httpPort - The port Odoo uses for HTTP requests (default: 8069).
 * @param {number} geventPort - The port Odoo uses for websocket (Gevent) requests (default: 8072).
 * @param {string} websiteName - The domain name for which the Nginx server block is configured.
 * @param {boolean} ssl - Whether SSL will be enabled afterwards (adds HSTS and secure cookies).
 *
 * @throws {Error} - Throws an error if Nginx cannot be installed or the generated configuration is invalid.
 */
export const setupNginx = async (httpPort: number, geventPort: number, websiteName: string, ssl = false): Promise<void> => {
    if (tryExec('which nginx') !== null) {
        console.log(pc.green(`✔ `) + `Nginx is already installed.`);
    } else {
        await runCommand({
            command: 'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nginx',
            message: 'Installing Nginx...',
            successMessage: 'Nginx successfully installed!',
        });
    }

    const sitesAvailable = sitesAvailablePath(websiteName);
    const sitesEnabled = sitesEnabledPath(websiteName);

    if (!isDryRun()) {
        fs.writeFileSync(sitesAvailable, renderNginxConfig(httpPort, geventPort, websiteName, ssl), { encoding: 'utf-8' });
    }
    console.log(pc.green(`✔ `) + `Nginx configuration created at ${sitesAvailable}`);

    await runCommand({
        command: `sudo ln -sfn ${sitesAvailable} ${sitesEnabled}`,
        message: `Linking ${sitesAvailable} to sites-enabled...`,
        successMessage: `Linked ${sitesAvailable} to sites-enabled successfully.`,
    });

    // A catch-all site would otherwise answer requests before the Odoo server block for "_"
    if (websiteName === '_') {
        await runCommand({ command: 'sudo rm -f /etc/nginx/sites-enabled/default', mute: true });
    }

    // Check Nginx configuration for syntax errors before touching the running server
    await runCommand({
        command: 'sudo nginx -t',
        message: 'Testing Nginx configuration...',
        successMessage: 'Nginx configuration is valid.',
    });

    await runCommand({
        command: 'sudo systemctl enable nginx && sudo systemctl reload-or-restart nginx',
        message: `Restarting Nginx...`,
        successMessage: `Nginx restarted successfully!`,
    });

    console.log(pc.green(`✔ `) + `Nginx is set up and serving ${websiteName} on port 80.`);
}



/**
 * Enables SSL for the given website using Certbot by configuring SSL certificates.
 * This function installs Certbot (if not already installed), requests an SSL certificate
 * for the specified `websiteName`, and sets up the necessary configuration.
 * A failed certificate request (e.g. DNS not pointing to this server yet) is reported as a
 * warning and does not abort the installation.
 *
 * @param {string} websiteName - The domain name for which SSL needs to be enabled.
 * @param {string} sslEmail - The email address to be associated with the SSL certificate.
 *
 * @returns {Promise<boolean>} - Resolves to `true` when the certificate was obtained.
 */
export const enableSSL = async (websiteName: string, sslEmail: string): Promise<boolean> => {

    // Validate website name
    if (websiteName === '_') {
        console.error(pc.red(`✘ `) + `Website name is set as "${websiteName}". Cannot obtain SSL Certificate for "${websiteName}". You should use a real website address.`);
        return false;
    }

    try {
        if (tryExec('which snap') === null) {
            await runCommand({
                command: 'sudo apt-get update && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y snapd',
                message: 'Installing snap package manager...',
                successMessage: 'Snap installed successfully.',
            });
        }

        if (tryExec('which certbot') === null) {
            await runCommand({
                command: `sudo snap install core; sudo snap refresh core`,
                mute: true
            });

            await runCommand({
                command: 'sudo snap install certbot --classic && sudo ln -sf /snap/bin/certbot /usr/bin/certbot',
                message: 'Installing Certbot via Snap...',
                successMessage: 'Certbot successfully installed!',
            });
        }
        else {
            console.log(pc.green(`✔ `) + `Certbot is already installed.`);
        }

        await runCommand({
            command: `sudo certbot --nginx -d ${websiteName} --non-interactive --agree-tos --email ${sslEmail}`,
            message: `Requesting SSL certificate for ${websiteName}...`,
            successMessage: `SSL certificate for ${websiteName} obtained successfully!`,
        });

        await runCommand({
            command: 'sudo systemctl reload nginx',
            message: 'Reloading Nginx...',
            successMessage: 'Nginx reloaded successfully!',
        });
    } catch (error) {
        console.error(pc.yellow(`! `) + `SSL could not be enabled for ${websiteName}. Make sure its DNS points to this server, then run: sudo certbot --nginx -d ${websiteName}`);
        return false;
    }

    console.log(pc.green(`✔ `) + `SSL is enabled for ${websiteName}.`);
    return true;
}
