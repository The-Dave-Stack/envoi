---
id: task-7
title: Configuration Validation & Dry-Run Command
status: To Do
assignee: []
created_date: '2025-09-29 18:34'
labels:
  - enhancement
  - validation
  - debugging
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add envoi validate and envoi exec --dry-run commands to test configurations without executing commands or affecting environment. This helps users verify their setup before actual execution.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Shows which variables would be resolved and their sources,Validates all provider connections without executing,Reports missing required variables,Shows final environment that would be created,Validates command syntax and availability
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Files: src/core/commands/ValidateCommand.ts, update ExecCommand.ts. Output example: ✓ Configuration valid: .envoi/dev.yml, ✓ All providers accessible, ✓ 4/4 required variables resolved, Variables: DATABASE_URL: postgresql://... (file:.env:DB_URL)
<!-- SECTION:NOTES:END -->
