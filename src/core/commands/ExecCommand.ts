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
    },
    {
      flags: '--user-config-dir <path>',
      description: 'Path to user configuration directory (default: "~/.envoi")'
    },
    {
      flags: '--project-config-dir <path>',
      description: 'Path to project configuration directory (default: "./.envoi")'
    },
    {
      flags: '--user-config-only',
      description: 'Use only user configuration (requires config name)',
      defaultValue: false
    },
    {
      flags: '--project-config-only',
      description: 'Use only project configuration (requires config name)',
      defaultValue: false
    }
  ];

  async action(args: string[], options: {
    config: string;
    verbose: boolean;
    userConfigDir?: string;
    projectConfigDir?: string;
    userConfigOnly?: boolean;
    projectConfigOnly?: boolean;
  }): Promise<void> {
    Logger.debug('[ExecCommand] Starting exec command');
    
    try {
      const rawArgs = args || [];
      const separatorIndex = rawArgs.indexOf('--');
      
      let fullCommand: string | undefined;
      let configName: string | undefined;
      
      if (separatorIndex !== -1) {
        // New syntax: envoi exec -- node server.js
        const commandArgs = rawArgs.slice(separatorIndex + 1);
        fullCommand = commandArgs.join(' ');
      } else if (rawArgs.length > 0) {
        // Check if first arg is a config name (no dots, no slashes)
        const firstArg = rawArgs[0];
        if (!firstArg.includes('.') && !firstArg.includes('/') && !firstArg.includes(' ')) {
          configName = firstArg;
          // The rest might be the command
          if (rawArgs.length > 1) {
            fullCommand = rawArgs.slice(1).join(' ');
          }
        } else {
          // Old syntax: envoi exec "node server.js"
          fullCommand = rawArgs.join(' ');
        }
      }
      
      // Setup environment and get filtered config
      const setupOptions: any = {};
      if (options.userConfigDir) setupOptions.userConfigDir = options.userConfigDir;
      if (options.projectConfigDir) setupOptions.projectConfigDir = options.projectConfigDir;
      if (options.userConfigOnly) setupOptions.userConfigOnly = options.userConfigOnly;
      if (options.projectConfigOnly) setupOptions.projectConfigOnly = options.projectConfigOnly;
      
      const filteredConfig = await this.setupEnvironment(
        options.config,
        options.verbose,
        configName,
        setupOptions
      );
      
      // If no command-line command provided, use default from config
      if (!fullCommand) {
        if (filteredConfig.command?.default) {
          fullCommand = filteredConfig.command.default;
          if (options.verbose) {
            Logger.info(`[ExecCommand] Using default command from configuration: ${fullCommand}`);
          }
        } else {
          throw new EnvoiError('No command specified. Either provide a command via command line or define a default command in your configuration. Use: envoi exec -- <command> or envoi exec "<command>"');
        }
      }
      
      if (options.verbose) {
        const configSource = configName ? `configuration '${configName}'` : `configuration file: ${options.config}`;
        Logger.info(`[ExecCommand] Loading ${configSource}`);
        Logger.info(`[ExecCommand] Executing command: ${fullCommand}`);
      }

      await resolveAndExecute(filteredConfig, fullCommand, options.verbose);
    } catch (error) {
      this.handleError(error);
    }
  }
}