# Install Odoo Source

A command-line tool to install Odoo with various configuration options.

## Installation

You can easily install Odoo using the following command:

```bash
npx install-odoo
```

## Usage

When you run `npx install-odoo`, you will be prompted to provide various configuration options. Here’s what you can expect:

### Configuration Options

1.  **Select Odoo Version**  
    Choose the version of Odoo you wish to install. Options include:
    
    -   Odoo 18.0
    -   Odoo 17.0
2.  **Install Odoo Enterprise**  
    Do you want to install the Odoo Enterprise version?
    
    -   **Yes**: You will be prompted to enter your GitHub access token.
    -   **No**: Proceed to the next option.
3.  **GitHub Access Token**  
    If you choose to install the Enterprise version, you will need to provide your GitHub access token. This token must have access to the Odoo Enterprise repository.
    
4.  **Install PostgreSQL**  
    Would you like to install PostgreSQL 16?
    
    -   **Yes**: You will be prompted for the PostgreSQL user and password.
    -   **No**: Skip to the next option.
5.  **Install Nginx**  
    Would you like to install Nginx?
    
    -   **Yes**: You will be asked to enter a website name.
    -   **No**: Proceed to the next option.
6.  **Website Name**  
    Enter the name of the website to be configured with Nginx.
    
7.  **Enable SSL**  
    Do you want to enable SSL for your website?
    
    -   **Yes**: You will be prompted to enter an admin email for SSL certificates.
    -   **No**: Proceed to the next option.
8.  **Admin Email**  
    Enter the email address that will be used for SSL certificate registration.
    
9.  **Generate Strong Odoo Super Admin Password**  
    Would you like to generate a random strong password for the Odoo super admin account?
    
    -   **Yes**: A strong password will be generated.
    -   **No**: You can provide a password in the next step.
10.  **Odoo Super Admin Password**  
    Enter your desired password for the Odoo super admin account.
    
11.  **System User for Odoo**  
    Enter the name of the system user that will be used to run Odoo (default is `odoo`).
    
12.  **PostgreSQL User**  
    If PostgreSQL is being installed, enter the name of the PostgreSQL user (default is the same as the Odoo user).
    
13.  **PostgreSQL Password**  
    Enter the password for the PostgreSQL user.
    
14.  **Odoo Home Path**  
    Specify the path where Odoo will be installed (default is `/odoo`). Ensure that this path does not already exist.
    
15.  **Odoo HTTP Port**  
    Set the default HTTP port for Odoo (default is `8069`).
    
16.  **Odoo Gevent Port**  
    Set the default WebSocket port for Odoo (default is `8072`).
    
17.  **Install WKHTMLTOPDF**  
    Would you like to install WKHTMLTOPDF for PDF rendering?
    
     -   **Yes**: WKHTMLTOPDF will be installed.
     -   **No**: Proceed to the end of the installation.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For any issues or feature requests, feel free to reach out to us at [Heliconia Solutions](https://www.heliconia.io/contact) or email us at [hello@heliconia.io](mailto:hello@heliconia.io).