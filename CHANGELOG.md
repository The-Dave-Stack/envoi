# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-09-18

### Added
- Environment-agnostic configuration orchestration
- Named configuration execution system
- Dual configuration system (user and project directories)
- Support for multiple providers (.env files, HashiCorp Vault, OpenBao)
- Priority-based configuration merging
- Default command configuration with command-line override
- Comprehensive CLI commands (exec, env, config)
- Colored logging system
- TypeScript implementation with full type safety
- Comprehensive test suite
- ESLint configuration
- GitHub Actions CI/CD workflow
- Automated release workflow with conventional commits
- Version bumping scripts for major/minor/patch releases
- CHANGELOG.md automation

[Unreleased]: https://github.com/The-Dave-Stack/envoi/compare/v0.2.2...HEAD
[0.2.2]: https://github.com/The-Dave-Stack/envoi/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/The-Dave-Stack/envoi/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/The-Dave-Stack/envoi/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/The-Dave-Stack/envoi/releases/tag/v0.1.0

## [0.2.0] - 2025-09-25

### Changed
- **Breaking Change**: Renamed `local` provider to `file` provider for better naming consistency
- **Breaking Change**: Removed HashiCorp Vault provider support
- **Breaking Change**: Centralized provider types in schema for better maintainability
- Updated all example configurations to use `file` provider instead of `local`
- Updated all test files to use `file` provider instead of `local`
- Enhanced provider factory to use centralized PROVIDER_TYPES constant

### Removed
- HashiCorp Vault provider support and related code
- All vault-related test cases and examples

## [0.2.1] - 2025-10-01

### Added
- Enhanced command descriptions for better CLI user experience
- HelpStyler utility for improved CLI output formatting

## [0.2.2] - 2025-10-01

### Added
- **CI/CD Pipeline Maintenance & Release Automation** (task-15)
  - Implemented comprehensive CI/CD automation with semantic-release
  - Added conventional commits support with commitizen and commitlint
  - Enhanced GitHub Actions workflows with security scanning and health monitoring
  - Added daily health monitoring and dependency checks
  - Implemented project validation tools

### Changed
- **GitFlow Workflow Implementation**
  - Established proper GitFlow with main (production) and develop (integration) branches
  - Enhanced GitHub Actions workflows to support GitFlow branching strategy
  - Updated CI/CD triggers for main, develop, and feature/* branches
  - Added automated release workflow triggered only on main branch

### Added
- **Documentation & Configuration**
  - Created `docs/CI-CD.md` with complete pipeline documentation
  - Created `docs/RELEASE-PROCESS.md` with automated and manual release guides
  - Added `scripts/validate-cicd.js` for comprehensive project validation
  - Enhanced README.md with GitFlow workflow and CI/CD documentation
  - Updated CLAUDE.md with new development scripts and GitFlow commands
  - Added `.releaserc.json` for semantic-release configuration
  - Added `.commitlintrc.json` for conventional commit linting

### Added
- **New npm Scripts**
  - `validate-cicd` - Comprehensive project validation
  - `commit` - Guided conventional commit creation
  - `semantic-release` - Automated release process
  - `prepare` - Git hooks setup with husky

### Fixed
- **CI/CD Workflow Issues**
  - Fixed CodeQL analysis failures for repositories without Advanced Security
  - Added graceful error handling with `continue-on-error: true`
  - Enhanced security scanning with npm audit integration
  - Improved test coverage reporting with Codecov

### Changed
- **Package Management**
  - Added CI/CD automation dependencies (semantic-release, commitizen, husky, etc.)
  - Cleaned up redundant npm scripts and automation files
  - Enhanced package.json with new build and validation scripts

### Added
- **Health Monitoring**
  - Daily health checks with `.github/workflows/health-monitor.yml`
  - Dependency update monitoring
  - Project structure validation
  - Configuration file validation (YAML/JSON syntax)
  - Repository health metrics and reporting

### Security
- Enhanced security scanning with CodeQL analysis
- Added npm audit integration for vulnerability detection
- Improved secret management and access controls

## [Unreleased]

