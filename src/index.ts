#!/usr/bin/env node

import { Command } from 'commander';
import { CommandRegistry } from './core/infrastructure';
import { Logger } from './utils/logger';
import packageJson from '../package.json';

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
  .then(() => {
    // Handle default behavior (when no command is provided or first arg is not a registered command)
    const args = process.argv.slice(2);
    
    if (args.length > 0 && !args[0].startsWith('-')) {
      const registeredCommands = CommandRegistry.getRegistrations().map(reg => reg.command.command);
      
      if (!registeredCommands.includes(args[0])) {
        // First argument is not a registered command, treat it as a config name
        // Prepend 'exec' and add the config name as the first argument
        process.argv.splice(2, 0, 'exec');
      }
    }
    
    program.parse();
  })
  .catch((error) => {
    Logger.error('[Boot] Failed to initialize CLI:', error);
    process.exit(1);
  });
