#!/usr/bin/env node

import { resolveAndExecute, resolveVariables } from './core/resolver';

import { Command } from 'commander';
import { EnvoiError } from './utils/errors';
import { Logger } from './utils/logger';
import { filterDisabledProviders } from './utils/provider-filter';
import { loadConfig } from './config/loader';
import { providerRegistry } from './providers/registry';
import { registerProvidersFromConfig } from './providers/dynamic-registration';

const program = new Command();

program
  .name('envoi')
  .description('Environment-agnostic configuration orchestrator\n\nLoad environment variables from multiple sources (.env files, HashiCorp Vault, OpenBao) and execute commands with injected configuration.\nConfigure default commands in envoi.yml and override them with command-line arguments.\n\nExamples:\n  envoi exec                    # Uses default command from envoi.yml\n  envoi exec "node server.js"   # Override with command line\n  envoi exec -- node server.js  # New -- separator syntax\n  envoi env\n  envoi exec "echo $DATABASE_URL" --verbose')
  .version('1.0.0');

program
  .command('exec', { isDefault: true })
  .description('Execute a command with injected environment variables\n\nLoads variables from configured sources (.env files, HashiCorp Vault, OpenBao) and injects them into the command environment.\nVariables are resolved in order: existing env → configured sources → defaults.\n\nIf no command is provided via command line, uses the default command from envoi.yml.\nCommand line arguments override the default configuration.\n\nExamples:\n  envoi exec                    # Uses default command from envoi.yml\n  envoi exec "node server.js"   # Override with command line\n  envoi exec -- node server.js  # New -- separator syntax\n  envoi exec "npm start" --config ./config/envoi.yml\n  envoi exec -- npm start --config ./config/envoi.yml\n  envoi exec "echo $DATABASE_URL" --verbose')
  .allowUnknownOption()
  .option('-c, --config <path>', 'Path to envoi.yml configuration file (default: "./envoi.yml")', './envoi.yml')
  .option('-v, --verbose', 'Enable verbose output showing variable resolution process', false)
  .action(async (options, command) => {
    Logger.setDebug(options.verbose);
    Logger.debug('Starting exec command');
    try {
      const rawArgs = command.args;
      const separatorIndex = rawArgs.indexOf('--');
      
      let fullCommand: string | undefined;
      
      if (separatorIndex !== -1) {
        // New syntax: envoi exec -- node server.js
        const commandArgs = rawArgs.slice(separatorIndex + 1);
        fullCommand = commandArgs.join(' ');
      } else if (rawArgs.length > 0) {
        // Old syntax: envoi exec "node server.js"
        fullCommand = rawArgs.join(' ');
      }
      
      // Load configuration first to determine which providers to register
      let config;
      try {
        config = await loadConfig(options.config);
      } catch (error) {
        console.error('Config loading error:', error);
        throw error;
      }
      
      if (options.verbose) {
        Logger.info(`Loaded configuration from ${options.config}`);
      }
      
      // Register providers based on configuration
      registerProvidersFromConfig(config, options.verbose);
      
      // Filter out sources and variables for disabled providers
      const filteredConfig = filterDisabledProviders(config);
      
      if (options.verbose) {
        Logger.info(`Registered providers: ${providerRegistry.getRegisteredProviders().join(', ')}`);
        Logger.info(`Filtered configuration to ${filteredConfig.variables.length} variables from ${config.variables.length} total`);
      }
      
      // If no command-line command provided, use default from config
      if (!fullCommand) {
        if (config.command?.default) {
          fullCommand = config.command.default;
          if (options.verbose) {
            Logger.info(`Using default command from envoi.yml: ${fullCommand}`);
          }
        } else {
          throw new EnvoiError('No command specified. Either provide a command via command line or define a default command in envoi.yml. Use: envoi exec -- <command> or envoi exec "<command>"');
        }
      }
      
      if (options.verbose) {
        Logger.info(`Loading configuration from: ${options.config}`);
        Logger.info(`Executing command: ${fullCommand}`);
      }

      await resolveAndExecute(filteredConfig, fullCommand, options.verbose);
    } catch (error) {
      if (error instanceof EnvoiError) {
        Logger.error(error.message);
        process.exit(1);
      } else {
        Logger.errorWithContext('An unexpected error occurred:', error);
        console.error('Full error:', error);
        process.exit(1);
      }
    }
  });

program
  .command('env')
  .description('Show loaded environment variables and their sources\n\nDisplays all resolved environment variables with their values and where they were loaded from.\nSource information shows: "environment" (existing env vars), "local:KEY" (.env files), "vault:PATH" (HashiCorp Vault), "openbao:PATH" (OpenBao), or "default".\nAlso shows the default command configuration if defined in envoi.yml.\n\nExamples:\n  envoi env\n  envoi env --config ./config/envoi.yml')
  .option('-c, --config <path>', 'Path to envoi.yml configuration file (default: "./envoi.yml")', './envoi.yml')
  .option('-v, --verbose', 'Enable verbose output showing variable resolution process', false)
  .action(async (options) => {
    Logger.setDebug(options.verbose);
    Logger.debug('Starting env command');
    try {
      const config = await loadConfig(options.config);
      
      // Register providers based on configuration
      registerProvidersFromConfig(config, options.verbose);
      
      // Filter out sources and variables for disabled providers
      const filteredConfig = filterDisabledProviders(config);
      
      if (options.verbose) {
        Logger.info(`Registered providers: ${providerRegistry.getRegisteredProviders().join(', ')}`);
        Logger.info(`Filtered configuration to ${filteredConfig.variables.length} variables from ${config.variables.length} total`);
      }
      
      const resolvedVariables = await resolveVariables(filteredConfig, options.verbose);

      Logger.header('envoi environment variables:');
      Logger.blank();

      if (resolvedVariables.length === 0) {
        Logger.noVariables();
        return;
      }

      const maxNameLength = Math.max(...resolvedVariables.map(v => v.name.length));
      
      resolvedVariables.forEach(variable => {
        Logger.variable(variable.name, variable.value, variable.source, maxNameLength + 2);
      });

      // Show command configuration if it exists
      if (config.command?.default) {
        Logger.blank();
        Logger.header('Default Command:');
        Logger.blank();
        
        const commandInfo = config.command.description 
          ? `${config.command.default} - ${config.command.description}`
          : config.command.default;
        
        Logger.plain(`  ${commandInfo}`);
      }
    } catch (error) {
      if (error instanceof EnvoiError) {
        Logger.error(error.message);
        process.exit(1);
      } else {
        Logger.errorWithContext('An unexpected error occurred:', error);
        console.error('Full error:', error);
        process.exit(1);
      }
    }
  });

program.parse();