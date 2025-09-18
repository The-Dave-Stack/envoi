# envoi
[![npm version](https://badge.fury.io/js/envoi.svg)](https://badge.fury.io/js/envoi)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

*Your trusted configuration messenger*

Environment-agnostic configuration orchestrator for consistent application deployment.

## Overview

`envoi` is a CLI tool that acts as your trusted configuration messenger, delivering environment variables from a single source of truth (`envoi.yml`) across all your environments. Like a diplomatic envoy, it ensures your application receives the right configuration securely and consistently, everywhere.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
  - [Quick Start](#quick-start)
  - [Named Configurations](#named-configurations)
  - [Executing Commands](#executing-commands)
  - [Configuration Management](#configuration-management)
  - [Listing Variables](#listing-variables)
  - [Default Command](#default-command)
  - [Advanced Options](#advanced-options)
- [Configuration Reference](#configuration-reference)
  - [`envoi.yml` Structure](#envoiyml-structure)
  - [Named Configuration Files](#named-configuration-files)
  - [Dual Configuration System](#dual-configuration-system)
  - [Providers](#providers)
  - [Variable Resolution Order](#variable-resolution-order)
- [Examples](#examples)
- [Development](#development)
- [Version History](#version-history)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Named Configuration Execution**: Execute configurations with `envoi [config_name]` syntax
- **Dual Configuration System**: Support for user (~/.envoi/) and project (./.envoi/) directories
- **Configuration Management**: Create, list, show, edit, and remove named configurations
- **Priority-based Configuration Merging**: project > user > legacy for flexible configuration
- **Multiple Providers**: Support for `.env` files, HashiCorp Vault, and OpenBao
- **Default Command Configuration**: Set default commands in configuration files with command-line override
- **Flexible Command Syntax**: Use both `envoi exec "command"` and `envoi exec -- command` formats
- **Colored Logging**: Beautiful colorized output with a clear visual hierarchy
- **Validation**: Ensure required variables are present before execution
- **Security**: No secret caching or disk writing—variables are loaded directly into memory
- **Zero Setup**: New developers can start immediately without manual configuration

---

## Installation

```bash
npm install -g envoi
```

-----

## Usage

### Quick Start

Get started in 3 steps:

1.  **Define your configuration contract in `envoi.yml`:**

    ```yaml
    variables:
      - name: DATABASE_URL
        required: true
        source:
          type: local
          file: .env
          key: DB_URL
      - name: API_KEY
        required: true
        source:
          type: local
          file: .env
          key: EXTERNAL_API_KEY
    ```

2.  **Provide the values in `.env`:**

    ```bash
    DB_URL=postgresql://user:password@localhost:5432/mydb
    EXTERNAL_API_KEY=your-api-key-here
    ```

3.  **Run your app with `envoi`:**

    ```bash
    # Use the -- separator for clear command execution
    envoi exec -- node your-app.js
    ```

### Named Configurations

Envoi supports named configurations for different environments and projects. You can create multiple configuration files and execute them using simple syntax.

**Create a named configuration:**

```bash
# Initialize configuration directories
envoi config init

# Create a development configuration
envoi config create dev

# Create a production configuration  
envoi config create prod
```

**Execute named configurations:**

```bash
# Execute development configuration
envoi dev

# Execute production configuration with command override
envoi prod "npm run build"

# List all available configurations
envoi config ls
```

**Configuration file locations:**
- **User configurations**: `~/.envoi/{name}.yml` (available across all projects)
- **Project configurations**: `./.envoi/{name}.yml` (project-specific)

### Executing Commands

`envoi` supports two syntax styles. The `--` separator is recommended for clarity and reliability.

  - **Recommended (`--` separator):** `envoi exec -- node server.js --port 3000`
  - **Quoted:** `envoi exec "node server.js --port 3000"`

**Why use the `--` separator?** It prevents your command's arguments from being misinterpreted as `envoi` options, works better with shell auto-completion, and requires no messy quoting for complex commands.

### Listing Variables

To preview the variables `envoi` will load without running the command, use `envoi env`:

```bash
$ envoi env
envoi environment variables:

  DATABASE_URL:  postgresql://user:password@localhost:5432/mydb (local:DB_URL)
  API_KEY:       sk-your-api-key-here (local:EXTERNAL_API_KEY)

Default Command:

  npm start - Start the application server
```

### Default Command

You can specify a default command in `envoi.yml` to run when you don't provide one.

```yaml
# envoi.yml
command:
  default: "npm start"
  description: "Start the development server"
```

Now, simply run `envoi exec` to execute `npm start`. Any command provided on the command line will override this default.

### Advanced Options

  - **Custom Config File:** Use a different configuration file with the `--config` flag.
    ```bash
    envoi exec -- node app.js --config ./config/envoi.prod.yml
    ```
  - **Verbose Output:** Get detailed debug information with the `--verbose` flag.
    ```bash
    envoi exec -- npm test --verbose
    ```

### Configuration Management

Envoi provides comprehensive configuration management commands:

```bash
# Initialize configuration directories
envoi config init

# List all available configurations
envoi config ls

# Create a new configuration
envoi config create <name>

# Show configuration details
envoi config show <name>

# Edit configuration file
envoi config edit <name>

# Remove configuration
envoi config rm <name>
```

**Configuration priority (highest to lowest):**
1. **Project configuration**: `./.envoi/{name}.yml`
2. **User configuration**: `~/.envoi/{name}.yml`
3. **Legacy configuration**: `envoi.yml`

-----

## Configuration Reference

### `envoi.yml` Structure

```yaml
# Optional: Provider configurations for enabling/disabling specific providers
providers:
  local:
    type: local
    enabled: true
    config:
      file: .env
  
  openbao:
    type: openbao
    enabled: true
    config:
      address: "http://localhost:8200"
      token: "${OPENBAO_TOKEN}"

# A list of variables your application expects in its environment.
variables:
  - name: VARIABLE_NAME          # The final environment variable name (e.g., API_KEY).
    required: true               # Fails if the variable cannot be resolved.
    default: "default_value"     # Optional: A fallback value if not found in sources.
    description: "Description"    # Documents the variable's purpose.
    source:                      # Optional: Inline source configuration for this variable.
      type: local                # Provider type: 'local', 'vault', or 'openbao'.
      file: .env                # For 'local' provider: the source file path.
      key: ENV_KEY              # The key to look up in the source file.

# Optional: A default command to run if none is provided via the command line.
command:
  default: "npm start"
  description: "Start the application server."
```

### Named Configuration Files

Named configuration files follow the same structure as `envoi.yml` but are stored in the configuration directories:

```yaml
# .envoi/dev.yml
variables:
  - name: NODE_ENV
    default: "development"
  - name: DATABASE_URL
    required: true
  - name: API_KEY
    required: true

providers:
  local:
    type: local
    enabled: true
    config:
      file: .env

variables:
  - name: DATABASE_URL
    source:
      type: local
      file: .env
      key: DEV_DATABASE_URL
  - name: API_KEY
    source:
      type: local
      file: .env
      key: DEV_API_KEY

command:
  default: "npm run dev"
  description: "Start development server"
```

### Dual Configuration System

Envoi supports a dual configuration system with different scopes:

**Project Configurations** (`./.envoi/`):
- Specific to the current project
- Stored in the project root directory
- Override user configurations
- Ideal for project-specific settings

**User Configurations** (`~/.envoi/`):
- Available across all projects
- Stored in the user's home directory
- Provide default configurations
- Perfect for personal development settings

**Priority Order** (highest to lowest):
1. **Project configuration** (`./.envoi/{name}.yml`)
2. **User configuration** (`~/.envoi/{name}.yml`)  
3. **Legacy configuration** (`envoi.yml`)

### Providers

#### Local Provider (`.env` files)

```yaml
variables:
  - name: DATABASE_URL
    source:
      type: local
      file: .env
      key: DB_URL
```

#### Vault Provider (v1.1)

Requires `VAULT_TOKEN` and `VAULT_ADDR` environment variables to be set.

```yaml
variables:
  - name: SECRET_TOKEN
    source:
      type: vault
      path: secret/data/myapp
      key: api_token
```

#### OpenBao Provider

Requires `OPENBAO_TOKEN` and `OPENBAO_ADDR` environment variables to be set.

```yaml
variables:
  - name: API_KEY
    source:
      type: openbao
      path: secret/data/myapp
      key: api_key
```

### Variable Resolution Order

`envoi` resolves and loads variables with the following priority (1 wins):

1.  **Existing Environment Variables**: Any variable already present in the shell environment will be used and **will not be overwritten** by `envoi` sources.
2.  **Configured Sources**: Values fetched from providers like `.env` files or Vault.
3.  **Default Values**: Fallback values specified in the `variables` section of `envoi.yml`.

-----

## Examples

### Development Environment

```yaml
# envoi.yml
variables:
  - name: NODE_ENV
    default: "development"
  - name: PORT
    default: "3000"
  - name: DATABASE_URL
    required: true
    source:
      type: local
      file: .env
      key: DEV_DATABASE_URL
```

```bash
# .env
DEV_DATABASE_URL=postgresql://localhost:5432/myapp_dev
```

### Production with Vault

```yaml
# envoi.yml
variables:
  - name: NODE_ENV
    default: "production"
  - name: DATABASE_URL
    required: true
    source:
      type: vault
      path: secret/data/production/myapp
      key: database_url
  - name: API_KEY
    required: true
    source:
      type: vault
      path: secret/data/production/myapp
      key: external_api_key
```

```bash
# Set up Vault authentication
export VAULT_TOKEN="..."
export VAULT_ADDR="..."

# Run with production configuration
envoi exec -- npm start
```

-----

## Development

  - **Build:** `npm run build`
  - **Test:** `npm test` or `npm run test:watch`
  - **Lint:** `npm run lint` or `npm run lint:fix`

## Release Process

Envoi uses a manual release process with automated changelog management to ensure proper versioning. Follow these steps to create a new release:

### 1. Prepare the Release

1. **Verify Changelog**: Check current changelog status
   ```bash
   npm run changelog:verify
   ```

2. **Update Changelog**: Add changes to the [Unreleased] section manually in `CHANGELOG.md`

3. **Run Tests**: Ensure all tests pass and code is properly linted
   ```bash
   npm test && npm run lint
   ```

4. **Build Project**: Verify the build completes successfully
   ```bash
   npm run build
   ```

### 2. Version Bump

Update the version in `package.json` following semantic versioning:

```bash
# Patch version (bug fixes)
npm version patch --no-git-tag-version

# Minor version (new features)
npm version minor --no-git-tag-version

# Major version (breaking changes)
npm version major --no-git-tag-version
```

### 3. Update Changelog for Release

Use the automated script to create the release section:

```bash
# This will move [Unreleased] content to a new version section
npm run changelog:release <version>
# Example: npm run changelog:release 0.1.1
```

The script will:
- Move all content from [Unreleased] to a new version section
- Add the current date
- Create a new [Unreleased] section
- Update version links at the bottom of the file

### 4. Add New Unreleased Section (Optional)

If you're planning multiple releases, add a new unreleased section:

```bash
npm run changelog:add
```

### 5. Commit and Tag

```bash
# Commit changes
git add package.json CHANGELOG.md
git commit -m "chore(release): 0.1.1"

# Create tag
git tag v0.1.1

# Push to GitHub
git push origin main --follow-tags
```

### 6. Create GitHub Release

1. Go to: https://github.com/The-Dave-Stack/envoi/releases
2. Click "Create a new release"
3. Select the tag you just created (e.g., v0.1.1)
4. Add release notes from the changelog
5. Click "Publish release"

### 7. Automated npm Publish

Once the release is created and pushed to main, the CI/CD workflow will automatically:
- Run all tests
- Build the project
- Publish to npm registry

### Release Checklist

- [ ] All tests pass
- [ ] Code is properly linted
- [ ] Changelog is updated
- [ ] Version is bumped correctly
- [ ] Git tag is created
- [ ] GitHub release is created
- [ ] npm publish completes successfully

### CI/CD Workflow

The `.github/workflows/ci.yml` workflow:
- Runs tests on every push and pull request
- Publishes to npm only on pushes to main branch
- Can be manually triggered via GitHub Actions UI

-----

## Version History

The detailed version history is available in the `CHANGELOG.md` file.

### v0.1.0 (Latest)

  - **Named Configuration Execution**: Execute configurations with `envoi [config_name]` syntax
  - **Dual Configuration System**: Support for user (~/.envoi/) and project (./.envoi/) directories
  - **Configuration Management**: Create, list, show, edit, and remove named configurations
  - **Priority-based Configuration Merging**: project > user > legacy for flexible configuration
  - **Enhanced CLI Help**: Comprehensive help system with all new features and examples
  - **Code Structure Reorganization**: Separated command infrastructure from command implementations
  - **OpenBao Provider**: Added support for OpenBao secret management
  - **Inline Variable Sources**: New configuration format with sources defined inline with variables

### v1.3

  - **Default Command Configuration** & Priority Logic.
  - Enhanced CLI Help and `envoi env` output.
  - Comprehensive integration testing.

### v1.2

  - **Flexible `--` Command Syntax** added.
  - **Colored Logging** for improved UX.
  - Centralized logger and enhanced error handling.

### v1.1

  - **HashiCorp Vault Provider** integration.
  - Token-based authentication for Vault.

### v1.0 (MVP)

  - Initial release with `envoi.yml` support and local `.env` provider.

-----

## Contributing

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Make your changes and add tests.
4.  Ensure all tests pass (`npm test`).
5.  Submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](https://www.google.com/search?q=LICENSE) file for details.