# envoi
[![CI](https://github.com/The-Dave-Stack/envoi/actions/workflows/ci.yml/badge.svg)](https://github.com/The-Dave-Stack/envoi/actions/workflows/ci.yml)
[![Release](https://github.com/The-Dave-Stack/envoi/actions/workflows/release.yml/badge.svg)](https://github.com/The-Dave-Stack/envoi/actions/workflows/release.yml)
[![npm version](https://badge.fury.io/js/%40thedavestack%2Fenvoi.svg)](https://badge.fury.io/js/%40thedavestack%2Fenvoi)
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
- [Release Process](#release-process)
- [CI/CD Pipeline](#cicd-pipeline)
- [Project Roadmap](#project-roadmap)
- [Version History](#version-history)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Named Configuration Execution**: Execute configurations with `envoi [config_name]` syntax
- **Dual Configuration System**: Support for user (~/.envoi/) and project (./.envoi/) directories
- **Configuration Management**: Create, list, show, edit, and remove named configurations
- **Priority-based Configuration Merging**: project > user > legacy for flexible configuration
- **Multiple Providers**: Support for `.env` files and OpenBao
- **Default Command Configuration**: Set default commands in configuration files with command-line override
- **Flexible Command Syntax**: Use both `envoi exec "command"` and `envoi exec -- command` formats
- **Colored Logging**: Beautiful colorized output with a clear visual hierarchy
- **Validation**: Ensure required variables are present before execution
- **Security**: No secret caching or disk writing—variables are loaded directly into memory
- **Zero Setup**: New developers can start immediately without manual configuration

---

## Installation

```bash
npm install -g @thedavestack/envoi
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
          type: file
          file: .env
          key: DB_URL
      - name: API_KEY
        required: true
        source:
          type: file
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

  DATABASE_URL:  postgresql://user:password@localhost:5432/mydb (file:DB_URL)
  API_KEY:       sk-your-api-key-here (file:EXTERNAL_API_KEY)

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

# A list of variables your application expects in its environment.
variables:
  - name: VARIABLE_NAME          # The final environment variable name (e.g., API_KEY).
    required: true               # Fails if the variable cannot be resolved.
    default: "default_value"     # Optional: A fallback value if not found in sources.
    description: "Description"    # Documents the variable's purpose.
    source:                      # Optional: Inline source configuration for this variable.
      type: file                # Provider type: 'file' or 'openbao'.
      file: .env                # For 'file' provider: the source file path.
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
  file:
    type: file
    enabled: true
    config:
      file: .env

variables:
  - name: DATABASE_URL
    source:
      type: file
      file: .env
      key: DEV_DATABASE_URL
  - name: API_KEY
    source:
      type: file
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

Envoi loads secrets and configuration from different sources called "Providers". You can enable and configure providers in the `providers` section of your `envoi.yml`. While you can configure multiple instances of the built-in providers, adding new *types* of providers (e.g., for other cloud services) requires code changes.

#### File Provider (`.env` files)

This provider reads variables from standard `.env` files.

```yaml
variables:
  - name: DATABASE_URL
    source:
      type: file
      file: .env
      key: DB_URL
```

#### OpenBao Provider

This provider fetches secrets from an OpenBao (or HashiCorp Vault) instance. It requires `OPENBAO_TOKEN` and `OPENBAO_ADDR` environment variables to be set for authentication.

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
2.  **Configured Sources**: Values fetched from providers like `.env` files or OpenBao.
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
      type: file
      file: .env
      key: DEV_DATABASE_URL
```

```bash
# .env
DEV_DATABASE_URL=postgresql://localhost:5432/myapp_dev
```

### Production with OpenBao

```yaml
# envoi.yml
variables:
  - name: NODE_ENV
    default: "production"
  - name: DATABASE_URL
    required: true
    source:
      type: openbao
      path: secret/data/production/myapp
      key: database_url
  - name: API_KEY
    required: true
    source:
      type: openbao
      path: secret/data/production/myapp
      key: external_api_key
```

```bash
# Set up OpenBao authentication
export OPENBAO_TOKEN="..."
export OPENBAO_ADDR="..."

# Run with production configuration
envoi exec -- npm start
```

-----

## Development

### Quick Start for Developers

1. **Install dependencies:** `npm install`
2. **Run validation:** `npm run validate-cicd` (ensures your setup is ready)
3. **Make changes** using conventional commits: `npm run commit`
4. **Test locally:** `npm test && npm run lint && npm run build`

### Available Scripts

- **`npm run validate-cicd`** - Comprehensive project validation
- **`npm run build`** - Compile TypeScript to JavaScript
- **`npm test`** - Run test suite
- **`npm run test:watch`** - Run tests in watch mode
- **`npm run lint`** - Check code style and syntax
- **`npm run lint:fix`** - Automatically fix linting issues
- **`npm run dev`** - Run in development mode
- **`npm run clean`** - Remove build artifacts
- **`npm run clean:all`** - Clean everything including node_modules
- **`npm run commit`** - Guided conventional commit creation

### Conventional Commits

This project uses automated releases based on conventional commits. Use `npm run commit` for a guided experience or follow this format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Common types:**
- `feat`: New feature (minor version bump)
- `fix`: Bug fix (patch version bump) 
- `docs`: Documentation changes
- `chore`: Maintenance tasks
- `ci`: CI/CD changes
- `BREAKING CHANGE`: Major version bump

### Development Environment with Docker

For contributors looking to work with the OpenBao provider, this project includes a Docker Compose setup that spins up a complete local testing environment.

**Services:**
- **`openbao`**: An OpenBao server instance.
- **`postgres`**: A PostgreSQL database that acts as the storage backend for OpenBao.

**How to Use:**
1.  Ensure you have Docker and Docker Compose installed.
2.  Create a `.env` file in the root of the project with the following variables (you can copy `.env.example`):
    ```bash
    POSTGRES_DB=envoi
    POSTGRES_USER=envoi
    POSTGRES_PASSWORD=envoi
    ```
3.  Start the services:
    ```bash
    docker-compose up
    ```
4.  The OpenBao UI will be available at `http://localhost:8200`. You can use this for local testing of the OpenBao provider.

## Release Process

Envoi uses **automated releases** with semantic-release to ensure consistent versioning and reduce manual overhead. Releases are triggered automatically when you push to the main branch.

### 🚀 Automated Release Process

**1. Make changes with conventional commits:**
```bash
# Use guided commit creation
npm run commit

# Or manual conventional commits
git commit -m "feat: add new feature"
git commit -m "fix: resolve issue"
git commit -m "docs: update documentation"
```

**2. Push to main branch:**
```bash
git push origin main
```

**3. Automatic release happens:**
- ✅ Version is calculated from commit messages
- ✅ Changelog is automatically generated
- ✅ GitHub release is created with release notes
- ✅ Package is published to npm registry
- ✅ Git tags are created automatically

### 📝 Commit Types & Version Bumps

- **`feat`**: New features → Minor version (0.2.1 → 0.3.0)
- **`fix`**: Bug fixes → Patch version (0.2.1 → 0.2.2)
- **`BREAKING CHANGE`**: Breaking changes → Major version (0.2.1 → 1.0.0)
- **`docs`, `chore`, `ci`, etc.**: No version bump

### 🆘 Emergency Releases

For emergency situations when the automated system is unavailable, see the [Release Process Guide](./docs/RELEASE-PROCESS.md) for manual steps.

### 📋 Release Checklist

**Before Pushing:**
- [ ] All tests pass locally (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Follow conventional commit format
- [ ] Run validation (`npm run validate-cicd`)

**After Push (Automated):**
- [x] ✅ GitHub release automatically created
- [x] ✅ npm package automatically published
- [x] ✅ Changelog automatically updated
- [x] ✅ Semantic version automatically calculated

For detailed information about the release process, see [docs/RELEASE-PROCESS.md](./docs/RELEASE-PROCESS.md).

-----

## 🌿 GitFlow Workflow

This project follows a **GitFlow** branching strategy for organized development and release management:

### Branch Structure

```
main (Production)
├── 🚀 Automated releases to npm
├── 📦 Production builds
└── 🏷️ Production tags

develop (Integration)  
├── 🔧 Feature integration
├── 🧪 CI/CD testing
└── 📋 Release preparation

feature/* (Development)
├── 💻 Feature development
├── 🧪 Local testing
└── 🔀 Pull requests to develop
```

### Workflow Process

**1. Feature Development:**
```bash
# Create feature branch
git checkout -b feature/new-feature develop

# Develop and test locally
npm run validate-cicd
npm test && npm run lint && npm run build

# Commit with conventional commits
npm run commit
git push origin feature/new-feature
```

**2. Integration (Feature → develop):**
```bash
# Create pull request: feature/* → develop
# CI/CD runs automatically on develop
# Team reviews and merges into develop
```

**3. Release (develop → main):**
```bash
# When ready for production
git checkout main
git merge develop

# Push to main triggers automated release
git push origin main
# ✅ Semantic-release handles version bump, changelog, npm publish
```

### Branch Protection Rules

- **main branch**: Only merges from develop, automated releases only
- **develop branch**: Accepts merges from feature branches, full CI/CD
- **feature branches**: Created from develop, merge back to develop

### CI/CD Triggers

- **CI/CD Pipeline**: Runs on `main`, `develop`, and `feature/*` branches
- **Automated Releases**: Only on `main` branch (production)
- **Pull Requests**: Target both `main` and `develop` branches

This GitFlow workflow ensures:
- ✅ Clear separation between development and production
- ✅ Controlled releases with automated versioning
- ✅ Integration testing in develop branch
- ✅ Production safety with only main branch publishing

## CI/CD Pipeline

Envoi features a comprehensive CI/CD pipeline with automated testing, security scanning, and releases.

### 🔄 CI/CD Workflows

**Main CI/CD Pipeline** (`.github/workflows/ci.yml`):
- Runs on every push to `main`, `develop`, and `feature/*` branches
- Executes test suite with coverage reporting
- Performs security scanning with CodeQL analysis
- Builds and validates project artifacts
- Provides detailed notifications
- **GitFlow Integration**: Full testing on develop branch for integration

**Automated Releases** (`.github/workflows/release.yml`):
- **Triggered only on pushes to `main` branch** (production)
- Uses semantic-release for version management
- Creates GitHub releases with auto-generated notes
- Publishes packages to npm registry
- Updates changelog automatically
- **Production Safety**: Only main branch can publish to npm

**Health Monitoring** (`.github/workflows/health-monitor.yml`):
- Runs daily health checks
- Monitors dependency updates
- Validates project structure and configurations
- Provides repository health metrics
- **Integration Environment**: Helps maintain develop branch health

### 📊 Monitoring & Validation

**Project Validation:**
```bash
npm run validate-cicd  # Comprehensive project health check
```

**Daily Health Checks:**
- Dependency vulnerability scanning
- Configuration file validation
- Build and test verification
- Repository health metrics

### 📖 Documentation

For comprehensive CI/CD information:
- **[CI/CD Documentation](./docs/CI-CD.md)** - Complete pipeline guide
- **[Release Process Guide](./docs/RELEASE-PROCESS.md)** - Release procedures and troubleshooting
- **[GitHub Actions](https://github.com/The-Dave-Stack/envoi/actions)** - View workflow runs and status

-----

## Project Roadmap

Envoi has a comprehensive roadmap for future enhancements, managed through our backlog system. You can view all planned improvements in the [`backlog/tasks/`](./backlog/tasks/) directory.

### Upcoming Features

**High Priority:**
- **Configuration Templates System**: Pre-built templates for popular frameworks (Next.js, Express, Docker)
- **Variable Interpolation Support**: Dynamic configuration values using `${VAR}` syntax
- **Interactive Configuration Setup**: Guided wizard for creating configurations
- **Configuration Validation & Dry-Run**: Test configurations without execution
- **Comprehensive Integration Testing**: End-to-end testing scenarios
- **Security & Vulnerability Testing**: Enhanced security hardening

**Medium Priority:**
- **Enhanced Error Handling**: More specific error types with recovery suggestions
- **Advanced Logging**: Structured logging with configurable levels
- **Configuration Export/Import**: Share configurations across teams
- **Enhanced Documentation**: Video tutorials and migration guides

**Low Priority:**
- **Environment Variable Type Validation**: Format validation for URLs, numbers, etc.
- **Shell Completion**: Tab completion for Bash, Zsh, Fish
- **Ecosystem Integration Examples**: Real-world deployment examples

### Contributing to the Roadmap

We use [backlog.md](https://github.com/the-dave-stack/backlog.md) for project management. You can:

- View tasks: Browse the `backlog/tasks/` directory
- Suggest features: Create an issue referencing specific tasks
- Contribute: Pick up any task and submit a PR

All tasks include detailed acceptance criteria and implementation notes to ensure successful development.

-----

## Version History

For a detailed list of changes, please see the [`CHANGELOG.md`](./CHANGELOG.md) file.

-----

## Contributing

We welcome contributions! Please follow our GitFlow workflow:

1.  **Fork the repository.**
2.  **Create a feature branch** from develop:
    ```bash
    git checkout develop
    git pull origin develop
    git checkout -b feature/amazing-feature develop
    ```
3.  **Make your changes** following our standards:
    - Use conventional commits (`npm run commit` for guidance)
    - Add tests for new functionality
    - Run `npm run validate-cicd` before committing
4.  **Test your changes**:
    ```bash
    npm test && npm run lint && npm run build
    ```
5.  **Submit a pull request** targeting the `develop` branch.

**GitFlow Guidelines:**
- **Feature branches** → `develop` (for integration)
- **develop** → `main` (for production releases)
- Use conventional commit messages for automated releases
- Ensure CI/CD passes on your feature branch

For detailed guidelines, see our [Development Workflow](#development) and [GitFlow Workflow](#-gitflow-workflow) sections.

## License

This project is licensed under the MIT License - see the [LICENSE](https://www.google.com/search?q=LICENSE) file for details.
