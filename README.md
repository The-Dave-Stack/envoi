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
  - [Executing Commands](#executing-commands)
  - [Listing Variables](#listing-variables)
  - [Default Command](#default-command)
  - [Advanced Options](#advanced-options)
- [Configuration Reference](#configuration-reference)
  - [`envoi.yml` Structure](#envoiyml-structure)
  - [Providers](#providers)
  - [Variable Resolution Order](#variable-resolution-order)
- [Examples](#examples)
- [Development](#development)
- [Version History](#version-history)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Single Source of Truth**: Define all required environment variables in `envoi.yml`.
- **Multiple Providers**: Support for `.env` files and HashiCorp Vault.
- **Default Command Configuration**: Set default commands in `envoi.yml` with command-line override capability.
- **Flexible Command Syntax**: Use both `envoi exec "command"` and `envoi exec -- command` formats.
- **Colored Logging**: Beautiful colorized output with a clear visual hierarchy.
- **Validation**: Ensure required variables are present before execution.
- **Security**: No secret caching or disk writing—variables are loaded directly into memory.
- **Zero Setup**: New developers can start immediately without manual configuration.

---

## Installation

```bash
npm install -g envoi
````

-----

## Usage

### Quick Start

Get started in 3 steps:

1.  **Define your configuration contract in `envoi.yml`:**

    ```yaml
    variables:
      - name: DATABASE_URL
        required: true
      - name: API_KEY
        required: true

    sources:
      DATABASE_URL:
        type: local
        file: .env
        key: DB_URL
      API_KEY:
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

-----

## Configuration Reference

### `envoi.yml` Structure

```yaml
# A list of variables your application expects in its environment.
variables:
  - name: VARIABLE_NAME          # The final environment variable name (e.g., API_KEY).
    required: true               # Fails if the variable cannot be resolved.
    default: "default_value"     # Optional: A fallback value if not found in sources.
    description: "Description"    # Documents the variable's purpose.

# Maps how each variable is sourced.
sources:
  VARIABLE_NAME:
    type: local                  # Provider type: 'local' or 'vault'.
    file: .env                  # For 'local' provider: the source file path.
    key: ENV_KEY                # The key to look up in the source file.

# Optional: A default command to run if none is provided via the command line.
command:
  default: "npm start"
  description: "Start the application server."
```

### Providers

#### Local Provider (`.env` files)

```yaml
sources:
  DATABASE_URL:
    type: local
    file: .env
    key: DB_URL
```

#### Vault Provider (v1.1)

Requires `VAULT_TOKEN` and `VAULT_ADDR` environment variables to be set.

```yaml
sources:
  SECRET_TOKEN:
    type: vault
    path: secret/data/myapp
    key: api_token
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
sources:
  DATABASE_URL:
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
  - name: API_KEY
    required: true
sources:
  DATABASE_URL:
    type: vault
    path: secret/data/production/myapp
    key: database_url
  API_KEY:
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

-----

## Version History

The detailed version history is available in the `CHANGELOG.md` file.

### v1.3 (Latest)

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