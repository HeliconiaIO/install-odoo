![install-odoo-cli](https://www.heliconia.io/images/extra/install-odoo-cli.png)

![NPM Version](https://img.shields.io/npm/v/install-odoo)
![NPM Downloads](https://img.shields.io/npm/dy/install-odoo)
![Node Current](https://img.shields.io/node/v/install-odoo)
![NPM Type Definitions](https://img.shields.io/npm/types/install-odoo)
![NPM License](https://img.shields.io/npm/l/install-odoo)

# Install Odoo CLI

A command-line tool to install Odoo with various configuration options.

## Prerequisites

Before you begin, ensure that you have the following:

-   An Ubuntu 22.04 or 24.04 server.
-   Node.js version 18.18.0 or higher, along with npm.

If Node.js and npm are not installed on your server, you can install them using the following command:

```bash
sudo apt install nodejs npm -y
```

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
    -   Odoo 19.0
    -   Odoo 18.0
    -   Odoo 17.0

2.  **Install Odoo Enterprise**  
    Do you want to install the Odoo Enterprise version?
    
    -   **Yes**: You will be prompted to enter your GitHub access token.
    -   **No**: Proceed to the next option.

3.  **GitHub Access Token**  
    If you choose to install the Enterprise version, you will need to provide your GitHub access token. This token must have access to the Odoo Enterprise repository.

4.  **Odoo Home Path**  
    Specify the path where Odoo will be installed (default is `/odoo`). Ensure that this path does not already exist.

5.  **System User for Odoo**
    Enter the name of the system user that will be used to run Odoo (default is `odoo`).

6.  **Generate Strong Odoo Super Admin Password**  
    Would you like to generate a random strong password for the Odoo super admin account?
    
    -   **Yes**: A strong password will be generated.
    -   **No**: You can provide a password in the next step.

7.  **Odoo Super Admin Password**  
    Enter your desired password for the Odoo super admin account if you choose to `No` in `Generate Strong Odoo Super Admin Password`.
   
8.  **Odoo HTTP Port**  
    Set the default HTTP port for Odoo (default is `8069`).
    
9.  **Odoo Gevent Port**  
    Set the default WebSocket port for Odoo (default is `8072`).

10.  **Install PostgreSQL**  
    Would you like to install PostgreSQL 16?
    
     -   **Yes**: You will be prompted for the PostgreSQL user and password.
     -   **No**: Skip to the next option.

11.  **PostgreSQL Host**  
    Enter the hostname or IP address of the PostgreSQL server (default is `localhost`).
    
12.   **PostgreSQL Port**  
    Enter the port for the PostgreSQL server (default is `5432`).

13.   **PostgreSQL User**  
    If PostgreSQL is being installed, enter the name of the PostgreSQL user (default is the same as the Odoo user).
    
14.   **PostgreSQL Password**  
    Enter the password for the PostgreSQL user.

15.  **Install WKHTMLTOPDF**  
    Would you like to install WKHTMLTOPDF for PDF rendering?
    
     -   **Yes**: WKHTMLTOPDF will be installed.
     -   **No**: Proceed to the end of the installation.

16.  **Install Nginx**  
    Would you like to install Nginx?
    
     -   **Yes**: You will be asked to enter a website name.
     -   **No**: Proceed to the next option.

17.  **Website Name**  
    Enter the name of the website to be configured with Nginx.
    
18.  **Enable SSL**  
    Do you want to enable SSL for your website?
    
     -   **Yes**: You will be prompted to enter an admin email for SSL certificates.
     -   **No**: Proceed to the next option.

19.  **Admin Email**  
    Enter the email address that will be used for SSL certificate registration.

20.  **PostgreSQL User**  
    If PostgreSQL is being installed, enter the name of the PostgreSQL user (default is the same as the Odoo user).
    
21.  **PostgreSQL Password**  
    Enter the password for the PostgreSQL user.


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any problems or have suggestions for improvements, please submit an [issue](https://github.com/HeliconiaIO/install-odoo/issues) on our GitHub repository. Your feedback is valuable to us!

## About Author

**Heliconia Solution Pvt. Ltd.**  
[Odoo Partner and Implementor](https://www.heliconia.io)
Specializes in end-to-end Odoo implementation, development, integration, customization, and support. We ensure seamless onboarding, agile development, and reliable post-implementation support, empowering businesses worldwide to optimize operations and drive growth with tailored ERP solutions across industries.