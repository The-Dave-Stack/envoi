---
id: task-10
title: Shell Completion & CLI Enhancements
status: To Do
assignee: []
created_date: '2025-09-29 18:35'
labels:
  - enhancement
  - cli
  - user-experience
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add shell completion scripts and improve CLI experience for daily usage workflow. This includes tab completion for commands, configuration names, and file paths across different shells.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Bash, Zsh, Fish completion for all commands and options,envoi completion generate bash command,Tab completion for configuration names and file paths,Command aliases (e.g. envoi e for envoi exec),Rich help text with examples for each command
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Files: new src/completion/ directory, update command classes. Generate completion with: envoi completion generate bash > ~/.bash_completion.d/envoi. Should complete config names from .envoi/ directories and file paths for --config flag.
<!-- SECTION:NOTES:END -->
