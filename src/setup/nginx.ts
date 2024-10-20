import { runCommand } from '@helpers/run-command';
import { execSync } from 'child_process';
import fs from 'fs';
import pc from 'picocolors';

/**
 * Configures Nginx as a reverse proxy for Odoo by setting up the server blocks and forwarding
 * traffic from the specified `websiteName` domain to the Odoo instance. It maps the given
 * HTTP and Gevent ports to Nginx.
 *
 * @param {number} httpPort - The port Odoo uses for HTTP requests (default: 8069).
 * @param {number} geventPort - The port Odoo uses for long-polling (Gevent) requests (default: 8072).
 * @param {string} websiteName - The domain name for which the Nginx server block is configured.
 *
 * @returns {Promise<void>} - Returns a promise that resolves when the Nginx configuration is complete.
 *
 * @throws {Error} - Throws an error if Nginx configuration or restart fails.
 */
export const setupNginx = async (httpPort: number, geventPort: number, websiteName: string): Promise<void> => {
    try {
        // Check if Nginx is installed
        execSync('which nginx', { stdio: 'ignore' });
        console.log(pc.green(`✔ `) + `Nginx is already installed.`);
    } catch (error) {
        // Install Nginx
        runCommand({
            command: 'sudo apt install nginx -y',
            message: 'Installing Nginx...',
            successMessage: 'Nginx successfully installed!',
            mute: false,
        });
    }

    // Define paths for configuration
    const sitesAvailable = `/etc/nginx/sites-available/${websiteName}.conf`;
    const sitesEnabled = `/etc/nginx/sites-enabled/${websiteName}.conf`;

    // Create Nginx configuration content
    const nginxConfig = `# ${websiteName} odoo server
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

  # log
  access_log /var/log/nginx/odoo.access.log;
  error_log /var/log/nginx/odoo.error.log;

  # Redirect websocket requests to odoo gevent port
  location /websocket {
    proxy_pass http://127.0.0.1:${geventPort};
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_set_header X-Forwarded-Host $http_host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Real-IP $remote_addr;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    proxy_cookie_flags session_id samesite=lax secure;  # requires nginx 1.19.8
  }

  # Redirect requests to odoo backend server
  location / {
    # Add Headers for odoo proxy mode
    proxy_set_header X-Forwarded-Host $http_host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_redirect off;
    proxy_pass http://127.0.0.1:${httpPort};

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    proxy_cookie_flags session_id samesite=lax secure;  # requires nginx 1.19.8
  }

  # common gzip
  gzip_types text/css text/scss text/plain text/xml application/xml application/json application/javascript;
  gzip on;
}`;

    // Write configuration to sites-available
    try {
        fs.writeFileSync(sitesAvailable, nginxConfig, { encoding: 'utf-8' });
        console.log(pc.green(`✔ `) + `Nginx configuration created at ${sitesAvailable}`);
    } catch (error) {
        console.error(pc.red(`❌ Failed to create Nginx configuration: ${error}`));
    }

    // Create a symbolic link in sites-enabled
    runCommand({
        command: `sudo ln -s ${sitesAvailable} ${sitesEnabled}`,
        message: `Linking ${sitesAvailable} to sites-enabled...`,
        successMessage: `Linked ${sitesAvailable} to sites-enabled successfully.`,
    });

    // Check Nginx configuration for syntax errors
    try {
        execSync('sudo nginx -t', { stdio: "pipe" });
        console.log(pc.green(`✔ `) + `Nginx configuration is valid.`);
    } catch (error) {
        console.error(pc.red(`✘ `) + `Nginx configuration test failed: ${error}`);
    }

    // Restart Nginx to apply changes
    runCommand({
        command: 'sudo service nginx restart',
        message: `Restarting Nginx...`,
        successMessage: `Nginx restarted successfully!`,
    });

    console.log(pc.green(`✔ `) + `Nginx is set up and serving ${websiteName} on port 80.`);

}



/**
 * Enables SSL for the given website using Certbot by configuring SSL certificates.
 * This function installs Certbot (if not already installed), requests an SSL certificate
 * for the specified `websiteName`, and sets up the necessary configuration.
 *
 * @param {string} websiteName - The domain name for which SSL needs to be enabled.
 * @param {string} sslEmail - The email address to be associated with the SSL certificate.
 *
 * @returns {Promise<void>} - Returns a promise that resolves when SSL setup is complete.
 *
 * @throws {Error} - Throws an error if Certbot installation or SSL certificate request fails.
 */
export const enableSSL = async (websiteName: string, sslEmail: string): Promise<void> => {

    // Validate website name
    if (websiteName === '_') {
        console.error(pc.red(`✘ `) + `Website name is set as "${websiteName}". Cannot obtain SSL Certificate for "${websiteName}". You should use a real website address.`);
        return; // Exit the function if the website name is invalid
    }

    // Check if 'snap' is installed
    const isSnapInstalled = () => {
        try {
            execSync('which snap', { stdio: 'ignore' });
            return true;
        } catch (error) {
            return false;
        }
    };

    // Check if 'certbot' is installed
    const isCertbotInstalled = () => {
        try {
            execSync('which certbot', { stdio: 'ignore' });
            return true;
        } catch (error) {
            return false;
        }
    };

    if (!isSnapInstalled()) {
        await runCommand({
            command: 'sudo apt update && sudo apt install snapd -y',
            message: 'Installing snap package manager...',
            successMessage: 'Snap installed successfully.',
        });
    }

    if (!isCertbotInstalled()) {

        await runCommand({
            command: `sudo snap install core; sudo snap refresh core`,
            mute: true
        });

        // Install Certbot using Snap
        runCommand({
            command: 'sudo snap install certbot --classic',
            message: 'Installing Certbot via Snap...',
            successMessage: 'Certbot successfully installed!',
        });
    }
    else {
        console.log(pc.green(`✔ `) + `Certbot is already installed.`);
    }

    // Obtain SSL Certificate
    runCommand({
        command: `sudo certbot --nginx -d ${websiteName} --non-interactive --agree-tos --email ${sslEmail}`,
        message: `Requesting SSL certificate for ${websiteName}...`,
        successMessage: `SSL certificate for ${websiteName} obtained successfully!`,
    });

    // Reload Nginx to apply SSL changes
    runCommand({
        command: 'sudo service nginx reload',
        message: 'Reloading Nginx...',
        successMessage: 'Nginx reloaded successfully!',
        mute: false,
    });
    console.error(pc.red(`✔ `) + `SSL is enabled for ${websiteName}.`);
}