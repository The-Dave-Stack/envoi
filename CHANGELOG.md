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

[Unreleased]: https://github.com/The-Dave-Stack/envoi/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/The-Dave-Stack/envoi/releases/tag/v0.1.0
## [Unreleased]

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

