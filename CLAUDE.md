# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`envoi` is a CLI tool for environment-agnostic configuration orchestration. It provides a single source of truth (`envoi.yml`) for managing environment variables across different environments (local, staging, production) with support for multiple providers like `.env` files, HashiCorp Vault, and OpenBao.

## Common Commands

### Development
```bash
# Build the project
npm run build

# Run in development mode
npm run dev

# Run tests
npm test
npm run test:watch

# Linting
npm run lint
npm run lint:fix

# Clean build artifacts
npm run clean
```

### Testing the CLI
```bash
# Test the built CLI
node dist/index.js --help
node dist/index.js exec "echo \$VAR_NAME" --verbose
node dist/index.js exec -- echo \$VAR_NAME --verbose

# Test with example configuration
cp envoi.example.yml envoi.yml
cp .env.example .env
node dist/index.js exec "node -e \"console.log(process.env.DATABASE_URL)\""
node dist/index.js exec -- node -e "console.log(process.env.DATABASE_URL)"

# Test default command configuration
node dist/index.js exec  # Uses default command from envoi.yml
node dist/index.js exec "node server.js"  # Override default command

# Test env command with command configuration display
node dist/index.js env  # Shows variables and default command if configured
```

### Colored Logging
The CLI now features colorized logging for better user experience:
- 🔵 **Blue**: Information messages (config loading, execution)
- 🟡 **Yellow**: Warning messages (missing dependencies)
- 🔴 **Red**: Error messages (configuration issues, execution failures)
- ⚫ **Gray**: Debug messages (verbose mode details)
- 🟢 **Green**: Success messages
- 🔵 **Cyan**: Environment variable names in output

Use `--verbose` flag to see detailed debug information with colored output.

## Architecture

### Core Components

**Configuration System** (`src/config/`):
- `loader.ts`: Loads and parses `envoi.yml` files with YAML parsing
- `schema.ts`: Zod validation schemas for type safety

**Provider System** (`src/providers/`):
- `local.ts`: Reads variables from `.env` files using dotenv
- `vault.ts`: Integrates with HashiCorp Vault for secret management
- `openbao.ts`: Integrates with OpenBao for secret management
- `registry.ts`: Registry pattern for extensible provider system

**Core Engine** (`src/core/`):
- `resolver.ts`: Main logic for variable resolution and subprocess execution

**Utilities** (`src/utils/`):
- `logger.ts`: Centralized colorized logging system with support for different log levels

**CLI Entry Point** (`src/index.ts`):
- Commander.js-based CLI interface
- Provider registration on startup

### Key Design Patterns

**Provider Registry**: Extensible system for adding new providers (local, vault, openbao, etc.)
**Resolution Priority**: Variables resolve in order: existing env → configured sources → defaults
**Security**: No secret caching - variables loaded directly into subprocess environment
**Validation**: Zod schema validation ensures configuration integrity
**Provider Configuration**: Optional providers object for enabling/disabling specific providers

### Environment Variable Resolution Flow

1. Check if variable already exists in `process.env`
2. If not found, resolve from configured sources (`.env`, Vault, OpenBao)
3. If still not found, use default value from `envoi.yml`
4. If required and no value found, throw validation error

### Provider Implementation

New providers must implement the `Provider` interface:
```typescript
interface Provider {
  name: string;
  resolve(source: VariableSource): Promise<string>;
}
```

## Configuration Structure

`envoi.yml` defines:
- `variables`: Array of variable definitions with metadata
- `sources`: Mapping of variable names to provider configurations (legacy format)
- `providers`: Optional provider configuration object for enabling/disabling providers
- `command`: Optional default command configuration with override capability

### Command Configuration

Envoi supports defining a default command in `envoi.yml` that can be overridden by command-line arguments:

```yaml
# envoi.yml
variables:
  - name: NODE_ENV
    required: false
    default: "development"

command:
  default: "npm start"
  description: "Start the development server"
```

Usage:
```bash
# Uses default command from envoi.yml
envoi exec

# Override with command-line arguments
envoi exec "node server.js"
envoi exec -- node server.js --port 3000
```

**Command Priority**: command-line arguments > default command in envoi.yml > error if no command specified

**Environment Variable Display**: The `env` command now also shows the default command configuration from `envoi.yml` when available, providing a complete view of the configuration setup.

Example sources configuration:
```yaml
sources:
  DATABASE_URL:
    type: local
    file: .env
    key: DB_URL
  SECRET_TOKEN:
    type: vault
    path: secret/data/myapp
    key: api_token
  API_KEY:
    type: openbao
    path: secret/data/myapp
    key: api_key
```

### New Provider Configuration (Recommended)

The new provider configuration allows you to enable/disable specific providers:

```yaml
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

# Sources configuration (still supported for backward compatibility)
sources:
  DATABASE_URL:
    type: local
    file: .env
    key: DB_URL
  SECRET_TOKEN:
    type: openbao
    path: secret/data/myapp
    key: secret_token
```

### OpenBao Setup with Docker

For local development, you can use the provided Docker Compose setup:

```bash
# Start OpenBao and PostgreSQL
docker-compose up -d

# Verify OpenBao is running
curl http://localhost:8200/v1/sys/health

# Set environment variables
export OPENBAO_ADDR=http://localhost:8200
export OPENBAO_TOKEN=dev-only-token
```

## Error Handling

Custom error classes provide clear feedback:
- `EnvoiError`: Base error class
- `ValidationError`: Configuration validation failures
- `ProviderError`: Provider-specific failures

## Testing

Tests in `__tests__/` cover:
- Configuration loading and validation
- Provider functionality (local, vault, openbao)
- Variable resolution logic
- Provider configuration system

Test setup includes provider registration via `providerRegistry` to ensure isolation from main CLI initialization.