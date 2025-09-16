import { BaseCommand } from './BaseCommand';
import { EnvoiError } from '../../utils/errors';
import { Logger } from '../../utils/logger';
import { ProgramOption } from '../../types';
import { resolveAndExecute } from '../../core/resolver';

export class ExecCommand extends BaseCommand {
  command = 'exec';
  description = `Execute a command with injected environment variables
Loads variables from configured sources (.env files, HashiCorp Vault, OpenBao) and injects them into the command environment.
Variables are resolved in order: existing env → configured sources → defaults.

If no command is provided via command line, uses the default command from envoi.yml.
Command line arguments override the default configuration.

Examples:
  envoi exec                    # Uses default command from envoi.yml
  envoi exec "node server.js"   # Override with command line
  envoi exec -- node server.js  # New -- separator syntax
  envoi exec "npm start" --config ./config/envoi.yml
  envoi exec -- npm start --config ./config/envoi.yml
  envoi exec "echo $DATABASE_URL" --verbose`;
  
  options: ProgramOption[] = [
    {
      flags: '-c, --config <path>',
      description: 'Path to envoi.yml configuration file (default: "./envoi.yml")',
      defaultValue: './envoi.yml'
    },
    {
      flags: '-v, --verbose',
      description: 'Enable verbose output showing variable resolution process',
      defaultValue: false
    }
  ];

  async action(options: { config: string; verbose: boolean }, command: { args: string[] }): Promise<void> {
    Logger.debug('[ExecCommand] Starting exec command');
    
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
      
      // Setup environment and get filtered config
      const filteredConfig = await this.setupEnvironment(options.config, options.verbose);
      
      // If no command-line command provided, use default from config
      if (!fullCommand) {
        if (filteredConfig.command?.default) {
          fullCommand = filteredConfig.command.default;
          if (options.verbose) {
            Logger.info(`[ExecCommand] Using default command from envoi.yml: ${fullCommand}`);
          }
        } else {
          throw new EnvoiError('No command specified. Either provide a command via command line or define a default command in envoi.yml. Use: envoi exec -- <command> or envoi exec "<command>"');
        }
      }
      
      if (options.verbose) {
        Logger.info(`[ExecCommand] Loading configuration from: ${options.config}`);
        Logger.info(`[ExecCommand] Executing command: ${fullCommand}`);
      }

      await resolveAndExecute(filteredConfig, fullCommand, options.verbose);
    } catch (error) {
      this.handleError(error);
    }
  }
}