#!/usr/bin/env node

import { Command } from 'commander';
import { CommandRegistry } from './core/infrastructure';
import { HelpStyler } from './utils/help-styler';
import { Logger } from './utils/logger';
import packageJson from '../package.json';

async function main(): Promise<void> {
  const program = new Command();

  const customDescription = HelpStyler.formatMainDescription(`${packageJson.description}

Quick Start:
  envoi exec                    # Run default command from envoi.yml
  envoi exec "npm start"        # Run specific command
  envoi env                    # Show loaded environment variables
  envoi config init            # Setup configuration directories

Features:
  • Named configurations: envoi [config_name]
  • Multiple environments: user (~/.envoi/) and project (.envoi/) configs
  • Environment variable injection from .env files, OpenBao, and more
  • Default command configuration with override support

Configuration Management:
  envoi config create <name>   # Create named configuration
  envoi config ls              # List all configurations
  envoi <config_name>          # Execute named configuration`);

  program.name(packageJson.name.substring(packageJson.name.indexOf('/') + 1)).description(customDescription).version(packageJson.version);

  // Configure help output with colors and separators
  program.configureHelp({
    styleTitle: (str) => HelpStyler.styleHeader(str),
    styleUsage: (str) => HelpStyler.styleOption(str),
    styleCommandText: (str) => HelpStyler.styleCommand(str),
    styleOptionText: (str) => HelpStyler.styleOption(str),
    styleDescriptionText: (str) => HelpStyler.formatCommandDescription(str),
    sortSubcommands: true,
    sortOptions: true,
    formatItemList: (heading, items, helper) => {
      if (items.length === 0) return [];
      
      // Special handling for Commands section to add separators
      if (heading === 'Commands:') {
        const result = [helper.styleTitle(heading)];
        items.forEach((item, index) => {
          result.push(item);
          // Add separator after each command except the last one
          if (index < items.length - 1) {
            result.push(HelpStyler.createCommandSeparator());
          }
        });
        result.push(''); // Add blank line after commands section
        return result;
      }
      
      // Default formatting for other sections (Options, Arguments, etc.)
      return [helper.styleTitle(heading), ...items, ''];
    }
  });

  // Configure output for proper color handling
  program.configureOutput({
    getOutHasColors: () => {
      // Check if stdout supports colors
      return process.stdout.isTTY && !process.env.NO_COLOR;
    },
    getErrHasColors: () => {
      // Check if stderr supports colors  
      return process.stderr.isTTY && !process.env.NO_COLOR;
    },
    stripColor: (str) => HelpStyler.stripColors(str)
  });

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
