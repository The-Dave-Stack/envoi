---
id: task-4
title: Configuration Templates System
status: To Do
assignee: []
created_date: '2025-09-29 18:34'
labels:
  - enhancement
  - developer-experience
  - templates
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create pre-built configuration templates for common tech stacks to reduce setup time for new projects and provide best-practice examples. Templates should include common variables and provider configurations for popular frameworks.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Templates for: Next.js, Express.js, Docker, Kubernetes, Vercel, Railway,Commands: envoi template list, envoi template init <name>,Templates include common variables and provider configurations,Support for interactive variable substitution during init,Templates stored in organized directory structure
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Files: new src/templates/ directory, src/core/commands/TemplateCommand.ts. Next.js template should include NEXTAUTH_SECRET, DATABASE_URL, NEXTAUTH_URL variables. Templates should be YAML files with metadata and variable descriptions.
<!-- SECTION:NOTES:END -->
