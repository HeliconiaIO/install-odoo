# Odoo Install CLI - Copilot Instructions

## Project Overview
This is a Node.js CLI tool that automates Odoo ERP installation on Ubuntu servers. It orchestrates a complex multi-step installation process including system dependencies, PostgreSQL, Python environments, Nginx reverse proxy, SSL certificates, and Odoo configuration.

## Architecture & Core Concepts

### Module Organization
- **`src/index.ts`**: CLI entry point (`commander`): `install` (default) and `doctor` commands
- **`src/commands/install.ts`**: interactive prompts / `--config` file, validation and the installation sequence
- **`src/helpers/`**: Shared utilities (`@helpers/*` path mapping)
  - `run-command.ts`: Core command execution with `ora` spinners
  - `clone-repo.ts`: Git operations with progress bars using `simple-git`
  - `misc.ts`: GitHub token validation and branded output
  - `system.ts`: root/OS checks, input validation helpers, worker/memory tuning, HTTP wait
  - `validate.ts`: `validateConfig` for the whole install config
- **`src/setup/`**: Installation modules (`@setup/*` path mapping)
  - Each module handles one aspect: `postgres.ts`, `nginx.ts`, `python.ts`, etc.
- **`src/types.ts`**: Central type definitions, especially `OdooConfigType`

### Installation Flow (Critical Sequence)
The installation follows a strict order in `runInstallation()` (`src/commands/install.ts`):
1. `prepareServer()` - Updates system, installs base packages
2. `installPostgreSQL()` - If requested
3. `createPostgreSQLUser()` - If local PostgreSQL
4. `setupOdoo()` - Clones Odoo source, creates system user
5. `cloneOdooEnterprise()` - If Enterprise edition
6. `installPipPackages()` - Creates venv, installs Python dependencies
7. `setupOdooConfig()` - Generates `/etc/[user]-server.conf`
8. `setupService()` - Writes and enables the native systemd unit (`src/setup/service.ts`)
9. `installWkhtmltopdf()` - PDF rendering support
10. `setupNginx()` + `enableSSL()` - Reverse proxy with optional SSL
11. `rotateOdooLog()` + `startOdooService()` - Final setup; waits for `/web/health`

## Key Patterns & Conventions

### Command Execution Pattern
All system commands use `runCommand()` from `@helpers/run-command`:
```typescript
await runCommand({
  command: "sudo apt-get update",
  message: "Updating Server..",
  successMessage: "Server Updated.",
  mute: false // Optional: suppresses spinner
});
```

### Configuration Management
- Central config object: `OdooConfigType` collected from prompts
- Path building: Uses `path.join()` consistently for file paths
- File operations: Direct `fs` usage with error handling via try/catch

### Validation Patterns
- **Async validation**: GitHub token validation via API calls
- **Path validation**: Checks existing directories in prompts
- **Service detection**: Uses `execSync('which command')` pattern for installed software

### Progress Indication
- **Spinners**: `ora` with consistent colors (`magenta`) and styles (`circleHalves`)
- **Progress bars**: `cli-progress` for git cloning operations
- **Success/error states**: Consistent `pc.green()` and `pc.red()` coloring

## Development Workflow

### Build & Development
```bash
npm run dev      # Development with tsx
npm run build    # Production build with tsup
npm run start    # Run built CLI
npm run typecheck # tsc --noEmit
npm test         # unit tests
npm run format   # Prettier formatting
```

### Testing Installation
- **Development**: Use `npm run dev` to test prompts without building
- **Production testing**: `npm run build && npm start` 
- **Local testing**: Install globally with `npm link` then run `install-odoo`

### Path Mapping Usage
Always use TypeScript path mappings:
- `@helpers/run-command` not `../helpers/run-command`
- `@setup/config` not `./config`

## Integration Points & Dependencies

### External Service Dependencies
- **GitHub API**: Token validation for enterprise access (`validateGitHubToken`)
- **PostgreSQL APT repos**: Custom package source setup
- **Snap packages**: For Certbot SSL certificates
- **wkhtmltopdf releases**: GitHub releases API for PDF rendering

### System Integration
- **systemd**: Native unit `/etc/systemd/system/<user>-server.service` (`Type=simple`, `Restart=on-failure`). Never use an init.d script: systemd wraps it with `RemainAfterExit=yes` and stops tracking Odoo
- **Nginx**: Site configs in `/etc/nginx/sites-available/`
- **File permissions**: Consistent `chown odooUser:odooUser` pattern
- **Virtual environments**: Python venv in `${odooHome}/venv`

### Cross-Module Communication
- **Configuration propagation**: `OdooConfigType` passed through setup chain
- **Addon path building**: `prepareAddonsPath()` builds comma-separated paths
- **Service checks**: Modules verify existing installations before proceeding

## Project-Specific Quirks

### Ubuntu Version Constraints
- Supports only Ubuntu 22.04 and 24.04
- Architecture detection for `wkhtmltopdf` downloads (`archMap` in `wkhtmltopdf.ts`)
- Uses `lsb_release` for version detection

### Enterprise vs Community
- Enterprise requires GitHub token with private repo access
- Different Python dependencies for enterprise (`dbfread`, `google_auth`, etc.)
- Addon paths differ: community only vs. community + enterprise

### Error Handling Strategy
- **Graceful failures**: Many operations check existing installations first
- **Process exits**: Critical failures use `process.exit(1)`
- **Validation warnings**: PostgreSQL connection issues show warnings but continue

### Security Considerations
- GitHub tokens masked in output (`'*'.repeat(token.length)`)
- File permissions: Config files get `0o640` mode
- User isolation: Dedicated system user for Odoo service

## Doctor (`src/setup/doctor.ts`)
`install-odoo doctor [--fix]` runs read-only checks and offers fixes; each check returns a `CheckResult` with an optional `fix`.
New fixes must be idempotent, back up files they change, and never overwrite values the user set.

## Tests
`pnpm test` runs `node --test` through `tsx`. Keep generators pure (`renderServiceUnit`, `renderOdooConfig`, `renderNginxConfig`, ...) so they can be tested without root.

## Common Debugging Points
- **Command failures**: Check `runCommand` error outputs first
- **Permission issues**: Verify `sudo` access and file ownership
- **Path problems**: All paths should be absolute, check `odooHome` usage
- **Service startup**: Check daemon script creation and systemd service status
- **Network issues**: GitHub token validation and package downloads may fail

When modifying installation steps, always consider the dependency chain and test the full installation flow on a clean Ubuntu system.