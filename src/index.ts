#!/usr/bin/env node

import { Command } from 'commander';
import { resolveAndExecute, resolveVariables } from './core/resolver';
import { loadConfig } from './config/loader';
import { EnvoiError } from './utils/errors';
import { LocalProvider } from './providers/local';
import { VaultProvider } from './providers/vault';
import { providerRegistry } from './providers/registry';

// Register built-in providers
providerRegistry.register(new LocalProvider());

// Register Vault provider if dependencies are available
try {
  providerRegistry.register(new VaultProvider());
} catch (error) {
  // Vault provider requires optional dependencies, fail gracefully
}

const program = new Command();

program
  .name('envoi')
  .description('Environment-agnostic configuration orchestrator\n\nLoad environment variables from multiple sources (.env files, HashiCorp Vault) and execute commands with injected configuration.\n\nExamples:\n  envoi exec "node server.js"\n  envoi env\n  envoi exec "echo $DATABASE_URL" --verbose')
  .version('1.0.0');

program
  .command('exec', { isDefault: true })
  .description('Execute a command with injected environment variables\n\nLoads variables from configured sources (.env files, HashiCorp Vault) and injects them into the command environment.\nVariables are resolved in order: existing env → configured sources → defaults.\n\nExamples:\n  envoi exec "node server.js"\n  envoi exec "npm start" --config ./config/envoi.yml\n  envoi exec "echo $DATABASE_URL" --verbose')
  .argument('<command...>', 'Command to execute (e.g., "node server.js", "npm start")')
  .option('-c, --config <path>', 'Path to envoi.yml configuration file (default: "./envoi.yml")', './envoi.yml')
  .option('-v, --verbose', 'Enable verbose output showing variable resolution process', false)
  .action(async (command: string[], options) => {
    try {
      const fullCommand = command.join(' ');
      
      if (options.verbose) {
        console.log(`Loading configuration from: ${options.config}`);
        console.log(`Executing command: ${fullCommand}`);
      }

      const config = await loadConfig(options.config);
      await resolveAndExecute(config, fullCommand, options.verbose);
    } catch (error) {
      if (error instanceof EnvoiError) {
        console.error(`❌ ${error.message}`);
        process.exit(1);
      } else {
        console.error('❌ An unexpected error occurred:', error);
        process.exit(1);
      }
    }
  });

program
  .command('env')
  .description('Show loaded environment variables and their sources\n\nDisplays all resolved environment variables with their values and where they were loaded from.\nSource information shows: "environment" (existing env vars), "local:KEY" (.env files), "vault:PATH" (HashiCorp Vault), or "default".\n\nExamples:\n  envoi env\n  envoi env --config ./config/envoi.yml')
  .option('-c, --config <path>', 'Path to envoi.yml configuration file (default: "./envoi.yml")', './envoi.yml')
  .action(async (options) => {
    try {
      const config = await loadConfig(options.config);
      const resolvedVariables = await resolveVariables(config);

      console.log('envoi environment variables:');
      console.log('');

      if (resolvedVariables.length === 0) {
        console.log('  No environment variables configured');
        return;
      }

      const maxNameLength = Math.max(...resolvedVariables.map(v => v.name.length));
      
      resolvedVariables.forEach(variable => {
        const padding = ' '.repeat(maxNameLength - variable.name.length + 2);
        console.log(`  ${variable.name}:${padding}${variable.value} (${variable.source})`);
      });
    } catch (error) {
      if (error instanceof EnvoiError) {
        console.error(`❌ ${error.message}`);
        process.exit(1);
      } else {
        console.error('❌ An unexpected error occurred:', error);
        process.exit(1);
      }
    }
  });

program.parse();