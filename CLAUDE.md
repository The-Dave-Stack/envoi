# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`envoi` is a CLI tool for environment-agnostic configuration orchestration. It provides a single source of truth for managing environment variables across different environments (local, staging, production) with support for multiple providers like `.env` files and OpenBao. 

### Key Features
- **Named Configuration Execution**: Execute configurations with `envoi [config_name]` syntax
- **Dual Configuration System**: Support for user (~/.envoi/) and project (./.envoi/) directories
- **Configuration Management**: Create, list, show, edit, and remove named configurations
- **Priority-based Configuration Merging**: project > user > legacy for flexible configuration
- **Multiple Providers**: Support for `.env` files and OpenBao
- **Default Command Configuration**: Set default commands in configuration files with command-line override

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

# Test named configuration system
node dist/index.js config init              # Initialize configuration directories
node dist/index.js config create dev        # Create development config
node dist/index.js config ls                 # List configurations
node dist/index.js dev                       # Execute named configuration
node dist/index.js dev "npm run build"       # Override command in named config
node dist/index.js config show dev           # Show configuration details
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
- `local.ts`: Reads variables from `.env` files using dotenv (renamed to FileProvider)
- `openbao.ts`: Integrates with OpenBao for secret management
- `registry.ts`: Registry pattern for extensible provider system

**Core Engine** (`src/core/`):
- `resolver.ts`: Main logic for variable resolution and subprocess execution
- `commands/`: Command implementations (BaseCommand, ExecCommand, EnvCommand, ConfigCommand, MainConfigCommand)
- `infrastructure/`: Command infrastructure (CommandDiscovery, CommandRegistry)

**Configuration System** (`src/config/`):
- `loader.ts`: Loads and parses `envoi.yml` files with YAML parsing
- `schema.ts`: Zod validation schemas for type safety
- `discovery.ts`: Configuration discovery and loading system for dual configuration support

**Utilities** (`src/utils/`):
- `logger.ts`: Centralized colorized logging system with support for different log levels
- `errors.ts`: Custom error classes for better error handling

**CLI Entry Point** (`src/index.ts`):
- Commander.js-based CLI interface
- Dynamic command registration and discovery

### Key Design Patterns

**Provider Registry**: Extensible system for adding new providers (file, openbao, etc.)
**Resolution Priority**: Variables resolve in order: existing env → configured sources → defaults
**Security**: No secret caching - variables loaded directly into subprocess environment
**Validation**: Zod schema validation ensures configuration integrity
**Provider Configuration**: Optional providers object for enabling/disabling specific providers
**Command Discovery**: Dynamic command loading and registration system
**Dual Configuration System**: Support for user and project configuration directories with priority-based merging
**Named Configuration Execution**: Execute configurations by name with simple syntax

### Directory Structure

```
src/
├── config/           # Configuration loading and validation
├── core/             # Core engine and command system
│   ├── commands/     # Command implementations only
│   └── infrastructure/ # Command discovery and registry
├── providers/        # Variable providers (file, openbao)
├── utils/           # Utilities (logger, errors)
└── index.ts         # CLI entry point
```

### Environment Variable Resolution Flow

1. Check if variable already exists in `process.env`
2. If not found, resolve from configured sources (`.env`, OpenBao)
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

**Configuration Priority Order** (highest to lowest):
1. **Project configuration** (`./.envoi/{name}.yml`)
2. **User configuration** (`~/.envoi/{name}.yml`)  
3. **Legacy configuration** (`envoi.yml`)

### Configuration Files

Named configuration files follow the same structure as `envoi.yml` but are stored in the configuration directories:

```yaml
# .envoi/dev.yml
variables:
  - name: NODE_ENV
    default: "development"
  - name: DATABASE_URL
    required: true

providers:
  file:
    type: file
    enabled: true
    config:
      file: .env

sources:
  DATABASE_URL:
    type: file
    file: .env
    key: DEV_DATABASE_URL

command:
  default: "npm run dev"
  description: "Start development server"
```

### Legacy Configuration

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
    type: file
    file: .env
    key: DB_URL
  SECRET_TOKEN:
    type: openbao
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
  file:
    type: file
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
    type: file
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
- Configuration discovery and dual configuration system
- Provider functionality (file, openbao)
- Variable resolution logic
- Provider configuration system
- Command discovery and registration
- Named configuration execution

Test setup includes provider registration via `providerRegistry` and command discovery via `CommandDiscovery` to ensure isolation from main CLI initialization.

### Code Organization Principles

1. **Commands Directory**: Only contains actual command implementations (BaseCommand, ExecCommand, EnvCommand, ConfigCommand, MainConfigCommand)
2. **Infrastructure Directory**: Contains supporting infrastructure (CommandDiscovery, CommandRegistry)
3. **Clear Separation**: Commands are separated from their discovery and registration mechanisms
4. **Modular Design**: Each component has a single responsibility and can be tested independently