# envoi

Environment-agnostic configuration orchestrator for consistent application deployment.

## Overview

`envoi` is a CLI tool that manages environment variables and configuration across different environments (local, staging, production) from a single source of truth (`envoi.yml`). It ensures your application runs consistently everywhere while maintaining security best practices.

## Features

- **Single Source of Truth**: Define all required environment variables in `envoi.yml`
- **Multiple Providers**: Support for `.env` files and HashiCorp Vault
- **Flexible Command Syntax**: Use both `envoi exec "command"` and `envoi exec -- command` formats
- **Colored Logging**: Beautiful colorized output with clear visual hierarchy
- **Validation**: Ensure required variables are present before execution
- **Security**: No secret caching or disk writing - variables are loaded directly into memory
- **Zero Setup**: New developers can start immediately without manual configuration

## Installation

```bash
npm install -g envoi
```

## Quick Start

1. Create an `envoi.yml` configuration file:

```yaml
variables:
  - name: DATABASE_URL
    required: true
    description: "Database connection string"
  - name: API_KEY
    required: true
    description: "API key for external service"
  - name: NODE_ENV
    required: false
    default: "development"
    description: "Node.js environment"

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

2. Create a `.env` file:

```bash
DB_URL=postgresql://user:password@localhost:5432/mydb
EXTERNAL_API_KEY=your-api-key-here
```

3. Run your application with `envoi`:

```bash
# Traditional syntax
envoi exec "npm start"

# New -- separator syntax (recommended for complex commands)
envoi exec -- npm start
```

## Command Syntax Options

### Traditional Syntax (Quoted Commands)
```bash
envoi exec "npm start"
envoi exec "node server.js --port 3000"
envoi exec "npm run build && npm run test"
```

### -- Separator Syntax (Recommended)
```bash
envoi exec -- npm start
envoi exec -- node server.js --port 3000
envoi exec -- npm run build
envoi exec -- npm run test
```

**Why use the -- separator?**
- **Better argument handling**: Command arguments aren't misinterpreted as envoi options
- **No quoting needed**: Complex commands with spaces and quotes work naturally
- **Shell completion**: Works better with shell auto-completion
- **Clear separation**: Explicit distinction between envoi options and the target command

**When to use each syntax:**
- Use **-- separator** for most cases, especially with complex commands
- Use **quoted syntax** for simple commands or when you need shell operators (&&, ||, |)

## Configuration

### envoi.yml Structure

```yaml
variables:
  - name: VARIABLE_NAME          # Environment variable name
    required: true               # Whether the variable is required
    default: "default_value"     # Default value for optional variables
    description: "Description"    # Documentation for the variable

sources:
  VARIABLE_NAME:
    type: local                  # Provider type: 'local' or 'vault'
    file: .env                  # For local provider: .env file path
    key: ENV_KEY                # Key to look up in the source
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

Requires `VAULT_TOKEN` environment variable.

```yaml
sources:
  SECRET_TOKEN:
    type: vault
    path: secret/data/myapp
    key: api_token
```

## Usage

### Basic Usage

```bash
# Run a command with injected environment variables (traditional syntax)
envoi exec "npm start"

# Use the new -- separator syntax (better for complex commands)
envoi exec -- npm start

# Use with command arguments and options
envoi exec -- node server.js --port 3000 --debug

# Use a custom configuration file
envoi exec "node app.js" --config ./config/envoi.yml
envoi exec -- node app.js --config ./config/envoi.yml

# Enable verbose output with colored debugging information
envoi exec "npm test" --verbose
envoi exec -- npm test --verbose
```

### Listing Environment Variables

```bash
# Show all resolved environment variables with colorized output
envoi env

# Use custom configuration file
envoi env --config ./config/envoi.yml
```

### Environment Variables

`envoi` will resolve variables in this order:

1. **Existing Environment Variables**: Already set in the environment
2. **Configured Sources**: From `.env` files or Vault
3. **Default Values**: Specified in `envoi.yml`

### Colored Logging

`envoi` features beautiful colorized output to improve user experience:

- 🔵 **Blue**: Information messages (configuration loading, command execution)
- 🟡 **Yellow**: Warning messages (missing dependencies, configuration issues)
- 🔴 **Red**: Error messages (validation failures, execution errors)
- ⚫ **Gray**: Debug messages (verbose mode details)
- 🟢 **Green**: Success messages
- 🔵 **Cyan**: Environment variable names in listings

**Example Output:**
```bash
$ envoi exec -- npm start --verbose
⚠ Vault provider not registered. Ensure dependencies are installed if you plan to use Vault.
ℹ Loading configuration from: ./envoi.yml
ℹ Executing command: npm start
🐛 Resolved variables:
  DATABASE_URL: local:DB_URL
  API_KEY: local:EXTERNAL_API_KEY
  NODE_ENV: default
🐛 Executing: npm start
```

## Examples

### Development Environment

```yaml
# envoi.yml
variables:
  - name: NODE_ENV
    required: false
    default: "development"
  - name: PORT
    required: false
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
    required: false
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
export VAULT_TOKEN="your-vault-token"
export VAULT_ADDR="https://vault.yourcompany.com"

# Run with production configuration
envoi exec "npm start"
```

## Error Handling

`envoi` provides clear error messages for common issues:

```bash
# Missing required variable
❌ Required variable 'DATABASE_URL' was not found. Please define it in your environment or configure a source in envoi.yml.

# Configuration file not found
❌ Configuration file not found: ./envoi.yml

# Invalid YAML
❌ Invalid YAML in configuration file: ...
```

## Security

- **No Secret Caching**: Variables are loaded directly into memory and never written to disk
- **Runtime Resolution**: Secrets are fetched only when needed
- **Environment Variables**: `envoi` never overwrites existing environment variables without explicit configuration

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
npm run test:watch
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## Version History

### v1.0 (MVP)
- CLI framework with Commander.js
- `envoi.yml` configuration file support
- Local provider for `.env` files
- Variable validation and error handling
- Subprocess execution with environment injection

### v1.1
- HashiCorp Vault provider integration
- Token-based authentication
- Secure secret management

### v1.2 (Latest)
- **Flexible Command Syntax**: Added support for `--` separator in `envoi exec` commands
- **Colored Logging**: Beautiful colorized output with clear visual hierarchy
- **Centralized Logger**: Unified logging system with configurable debug output
- **Enhanced Error Handling**: Better error messages with context and color coding
- **Improved UX**: Environment variable listings with color-coded sources

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

MIT License - see LICENSE file for details.