import { BaseCommand } from './BaseCommand';
import { Logger } from '../../utils/logger';
import { ProgramOption } from '../../types';
import { resolveVariables } from '../../core/resolver';

export class EnvCommand extends BaseCommand {
  command = 'env';
  description = `Show loaded environment variables and their sources

Displays all resolved environment variables with their values and where they were loaded from.
Source information shows: "environment" (existing env vars), "local:KEY" (.env files), "vault:PATH" (HashiCorp Vault), "openbao:PATH" (OpenBao), or "default".
Also shows the default command configuration if defined in envoi.yml.

Examples:
  envoi env
  envoi env --config ./config/envoi.yml`;
  
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

  async action(options: {
    config: string;
    verbose: boolean;
    userConfigDir?: string;
    projectConfigDir?: string;
    userConfigOnly?: boolean;
    projectConfigOnly?: boolean;
  }, command: { args: string[] }): Promise<void> {
    Logger.debug('Starting env command');
    
    try {
      const rawArgs = command.args;
      let configName: string | undefined;
      
      // Check if first arg is a config name (no dots, no slashes)
      if (rawArgs.length > 0) {
        const firstArg = rawArgs[0];
        if (!firstArg.includes('.') && !firstArg.includes('/') && !firstArg.includes(' ')) {
          configName = firstArg;
        }
      }
      
      // Setup environment and get filtered config
      const setupOptions: { 
        userConfigDir?: string; 
        projectConfigDir?: string; 
        userConfigOnly?: boolean; 
        projectConfigOnly?: boolean; 
      } = {};
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
      if (filteredConfig.command?.default) {
        Logger.blank();
        Logger.header('Default Command:');
        Logger.blank();
        
        const commandInfo = filteredConfig.command.description 
          ? `${filteredConfig.command.default} - ${filteredConfig.command.description}`
          : filteredConfig.command.default;
        
        Logger.plain(`  ${commandInfo}`);
      }
    } catch (error) {
      this.handleError(error);
    }
  }
}