---
id: task-9
title: Configuration Export/Import & Sharing
status: To Do
assignee: []
created_date: '2025-09-29 18:35'
labels:
  - enhancement
  - sharing
  - team-collaboration
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add commands to export configurations for team sharing. Teams need to share configuration templates while keeping secrets separate, with support for multiple formats and encryption options.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 envoi config export <name> creates portable configuration,envoi config import <file> installs shared configuration,Option to export with/without sensitive values,Support for encrypted export with team keys,Export to multiple formats (YAML, JSON, Docker Compose env format)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Files: new src/core/commands/ExportCommand.ts, ImportCommand.ts. Example: envoi config export dev --format yaml --exclude-secrets > dev-config.yml, envoi config import dev-config.yml --name team-dev. Consider encryption using team public keys.
<!-- SECTION:NOTES:END -->
