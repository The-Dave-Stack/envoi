#!/usr/bin/env node

import { Command } from 'commander';
import { CommandRegistry } from './core/infrastructure';
import { Logger } from './utils/logger';
import packageJson from '../package.json';

async function main(): Promise<void> {
  const program = new Command();

  const customDescription = `${packageJson.description}

Load environment variables from multiple sources (.env files, HashiCorp Vault, OpenBao) and execute commands with injected configuration.
Configure default commands in envoi.yml and override them with command-line arguments.
Manage named configurations for different environments and projects.

Features:
  - Named configuration execution: envoi [config_name]
  - Dual configuration system: user (~/.envoi/) and project (.envoi/) directories
  - Configuration management: init, create, show, list, edit, remove
  - Priority-based configuration merging: project > user > legacy

Examples:
  envoi exec                    # Uses default command from envoi.yml
  envoi exec "node server.js" # Override with command line
  envoi exec -- node server.js  # New -- separator syntax
  envoi env                    # Show environment variables
  
  # Configuration management
  envoi config init            # Initialize configuration directories
  envoi config create my-config # Create named configuration
  envoi config ls              # List available configurations
  envoi my-config              # Execute named configuration
  envoi my-config "npm start"  # Override command in configuration
  
  # Environment variable injection
  envoi exec "echo $DATABASE_URL" --verbose`;

  program.name(packageJson.name).description(customDescription).version(packageJson.version);

  try {
    await CommandRegistry.registerCommands(program);
  } catch (error) {
    console.error('[Boot] Failed to load commands:', error);
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const firstArg = args[0];

  // If the first argument is not a registered command and not an option, treat it as a config name for the 'exec' command.
  if (firstArg && !firstArg.startsWith('-')) {
    const isRegisteredCommand = program.commands.some(cmd => cmd.name() === firstArg || cmd.aliases().includes(firstArg));
    if (!isRegisteredCommand) {
      // Prepend 'exec' to the arguments and re-parse.
      program.parse(['node', 'envoi', 'exec', ...args]);
      return;
    }
  }

  program.parse(process.argv);
}

main().catch((error) => {
  Logger.error('[Boot] Failed to initialize CLI:', error);
  process.exit(1);
});
