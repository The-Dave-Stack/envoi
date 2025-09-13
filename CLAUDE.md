# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`envoi` is a CLI tool for environment-agnostic configuration orchestration. It provides a single source of truth (`envoi.yml`) for managing environment variables across different environments (local, staging, production) with support for multiple providers like `.env` files and HashiCorp Vault.

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

# Test with example configuration
cp envoi.example.yml envoi.yml
cp .env.example .env
node dist/index.js exec "node -e \"console.log(process.env.DATABASE_URL)\""
```

## Architecture

### Core Components

**Configuration System** (`src/config/`):
- `loader.ts`: Loads and parses `envoi.yml` files with YAML parsing
- `schema.ts`: Zod validation schemas for type safety

**Provider System** (`src/providers/`):
- `local.ts`: Reads variables from `.env` files using dotenv
- `vault.ts`: Integrates with HashiCorp Vault for secret management
- `registry.ts`: Registry pattern for extensible provider system

**Core Engine** (`src/core/`):
- `resolver.ts`: Main logic for variable resolution and subprocess execution

**CLI Entry Point** (`src/index.ts`):
- Commander.js-based CLI interface
- Provider registration on startup

### Key Design Patterns

**Provider Registry**: Extensible system for adding new providers (local, vault, etc.)
**Resolution Priority**: Variables resolve in order: existing env → configured sources → defaults
**Security**: No secret caching - variables loaded directly into subprocess environment
**Validation**: Zod schema validation ensures configuration integrity

### Environment Variable Resolution Flow

1. Check if variable already exists in `process.env`
2. If not found, resolve from configured sources (`.env`, Vault)
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
- `sources`: Mapping of variable names to provider configurations

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
```

## Error Handling

Custom error classes provide clear feedback:
- `EnvoiError`: Base error class
- `ValidationError`: Configuration validation failures
- `ProviderError`: Provider-specific failures

## Testing

Tests in `__tests__/` cover:
- Configuration loading and validation
- Provider functionality (local, vault)
- Variable resolution logic

Test setup includes provider registration via `providerRegistry` to ensure isolation from main CLI initialization.