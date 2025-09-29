---
id: task-6
title: Interactive Configuration Setup
status: To Do
assignee: []
created_date: '2025-09-29 18:34'
labels:
  - enhancement
  - developer-experience
  - interactive
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create a guided setup wizard for creating configurations to reduce learning curve and prevent common configuration mistakes. Should detect existing files and suggest appropriate configurations.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 envoi init --interactive command with step-by-step prompts,Detects common files (.env, docker-compose.yml) and suggests configurations,Asks about deployment targets (local, staging, production),Generates appropriate provider configurations,Option to create multiple named configurations in one session
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Files: src/core/commands/InitCommand.ts, new src/utils/prompts.ts. Flow: What type of project? (Next.js, Express, Docker, Other) -> Do you have .env file? -> Which providers? -> Which environments? Should use inquirer or similar for prompts.
<!-- SECTION:NOTES:END -->
