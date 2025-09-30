---
id: task-5
title: Variable Interpolation Support
status: To Do
assignee: []
created_date: '2025-09-29 18:34'
labels:
  - enhancement
  - interpolation
  - configuration
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Support  syntax for dynamic configuration values to enable building complex configurations from simpler parts. This allows referencing other variables and environment variables within configuration values.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Support referencing other variables: database: postgresql://:@,Support environment variable interpolation in configuration files,Prevent circular references with dependency resolution,Works in defaults, file paths, and OpenBao paths,Maintain backward compatibility with existing configs
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Files: new src/utils/interpolation.ts, update src/core/resolver.ts. Example: variables: [name: DB_HOST, default: localhost, name: DATABASE_URL, default: postgresql://user:pass@:5432/mydb]. Need dependency graph to prevent circular refs.
<!-- SECTION:NOTES:END -->
