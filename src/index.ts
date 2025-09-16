#!/usr/bin/env node

import { Command } from 'commander';
import { CommandRegistry } from './core/commands';
import { Logger } from './utils/logger';
import packageJson from '../package.json';

const program = new Command();

const customDescription = `${packageJson.description}

Load environment variables from multiple sources (.env files, HashiCorp Vault, OpenBao) and execute commands with injected configuration.
Configure default commands in envoi.yml and override them with command-line arguments.

Examples:
  envoi exec                    # Uses default command from envoi.yml
  envoi exec "node server.js" # Override with command line
  envoi exec -- node server.js  # New -- separator syntax
  envoi env
  envoi exec "echo $DATABASE_URL" --verbose`;

program.name(packageJson.name).description(customDescription).version(packageJson.version);

// Dynamically load and register all commands
async function loadCommands(): Promise<void> {
  try {
    const registrations = await CommandRegistry.registerCommands(program);

    if (process.env.DEBUG || process.env.VERBOSE) {
      Logger.info(`[Boot] Loaded ${registrations.length} commands:`);
      registrations.forEach((reg) => {
        Logger.info(`[Boot]  - ${reg.command.command}: ${reg.command.description}`);
      });
    }
  } catch (error) {
    console.error('[Boot] Failed to load commands:', error);
    process.exit(1);
  }
}

// Load commands and start the CLI
loadCommands()
  .then(() => program.parse())
  .catch((error) => {
    Logger.error('[Boot] Failed to initialize CLI:', error);
    process.exit(1);
  });
