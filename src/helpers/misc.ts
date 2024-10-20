export const ScriptName = `
▗▄▄▄▖▗▖  ▗▖ ▗▄▄▖▗▄▄▄▖▗▄▖ ▗▖   ▗▖        ▗▄▖ ▗▄▄▄  ▗▄▖  ▗▄▖      ▗▄▄▖▗▖   ▗▄▄▄▖
  █  ▐▛▚▖▐▌▐▌     █ ▐▌ ▐▌▐▌   ▐▌       ▐▌ ▐▌▐▌  █▐▌ ▐▌▐▌ ▐▌    ▐▌   ▐▌     █  
  █  ▐▌ ▝▜▌ ▝▀▚▖  █ ▐▛▀▜▌▐▌   ▐▌       ▐▌ ▐▌▐▌  █▐▌ ▐▌▐▌ ▐▌    ▐▌   ▐▌     █  
▗▄█▄▖▐▌  ▐▌▗▄▄▞▘  █ ▐▌ ▐▌▐▙▄▄▖▐▙▄▄▖    ▝▚▄▞▘▐▙▄▄▀▝▚▄▞▘▝▚▄▞▘    ▝▚▄▄▖▐▙▄▄▖▗▄█▄▖
`
export const supportLink = "\x1b]8;;https://www.heliconia.io/contact\x1b\\contact us\x1b]8;;\x1b\\";
export const websiteLink = "\x1b]8;;https://www.heliconia.io\x1b\\https://www.heliconia.io\x1b]8;;\x1b\\";
export const emailLink = "\x1b]8;;mailto:hello@heliconia.io\x1b\\hello@heliconia.io\x1b]8;;\x1b\\";

/**
 * Validates the provided GitHub access token by making an authenticated request to the GitHub API.
 * This function checks if the token is valid and if it has access to the required repositories.
 *
 * @param {string} token - The GitHub access token to be validated.
 *
 * @returns {Promise<boolean>} - A promise that resolves to `true` if the token is valid, otherwise `false`.
 *
 * @throws {Error} - Throws an error if the request to the GitHub API fails for any reason.
 *
 */
export const validateGitHubToken = async (token: string) => {
  try {
    // Check if the token is valid by attempting to access the user's info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${token}`,
      },
    });

    if (!userResponse.ok) {
      return false; // Token is invalid
    }

    // Now check access to the Odoo enterprise repository
    const repoResponse = await fetch('https://api.github.com/repos/odoo/enterprise', {
      headers: {
        Authorization: `token ${token}`,
      },
    });

    // Check if the user has access to the repo
    if (repoResponse.status === 404) {
      return false; // Repository not found or no access
    }

    // Optionally, check if user has read access
    const repoData = await repoResponse.json();
    return repoData.private ? true : false; // True if the repo is private and accessible
  } catch (error) {
    console.error('Error validating token:', error);
    return false; // Return false if there's an error
  }
};