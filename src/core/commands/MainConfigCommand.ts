import { ConfigCommand } from './ConfigCommand';
import { Logger } from '../../utils/logger';
import { HelpStyler } from '../../utils/help-styler';
import { ProgramOption } from '../../types';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export class MainConfigCommand extends ConfigCommand {
  command = 'config';
  description = HelpStyler.formatCommandDescription(`Manage envoi configurations

Create and manage named configurations for different environments and projects.
Supports user (~/.envoi/) and project (.envoi/) configuration directories.

Subcommands:
  init              Initialize configuration directories
  ls                List available configurations
  show <name>       Show configuration details
  create <name>     Create new configuration
  edit <name>       Edit configuration file
  rm <name>         Remove configuration

Examples:
  envoi config init           # Setup directories
  envoi config create dev     # Create dev configuration
  envoi config ls            # List all configurations
  envoi dev                  # Execute 'dev' configuration

Use "envoi config <subcommand> --help" for subcommand details.`);
  
  options: ProgramOption[] = [
    {
      flags: '-v, --verbose',
      description: 'Enable verbose output',
      defaultValue: false
    }
  ];

  async action(subcommand: string, args: string[], options: { verbose: boolean }): Promise<void> {
    Logger.setDebug(options.verbose);
    
    if (!subcommand) {
      await this.showConfigHelp();
      return;
    }

    const cmd = subcommand;
    const subcommandArgs = args || [];

    switch (cmd) {
      case 'init':
        await this.handleInit();
        break;
      case 'ls':
        await this.handleList();
        break;
      case 'show':
        await this.handleShow(subcommandArgs);
        break;
      case 'create':
        await this.handleCreate(subcommandArgs);
        break;
      case 'edit':
        await this.handleEdit(subcommandArgs);
        break;
      case 'rm':
        await this.handleRemove(subcommandArgs);
        break;
      default:
        Logger.error(`Unknown subcommand: ${cmd}`);
        await this.showConfigHelp();
    }
  }

  private async handleInit(): Promise<void> {
    try {
      await this.ensureDirectories();
      Logger.success('Configuration directories initialized successfully');
      Logger.blank();
      Logger.plain('User directory: ~/.envoi/');
      Logger.plain('Project directory: .envoi/');
    } catch (error) {
      this.handleError(error);
    }
  }

  private async handleList(): Promise<void> {
    try {
      const configs = await this.listConfigurations();
      
      Logger.header('Available configurations');
      Logger.blank();
      
      if (configs.user.length > 0) {
        Logger.header('User configurations (~/.envoi/):');
        configs.user.forEach(config => Logger.plain(`  - ${config}`));
        Logger.blank();
      }
      
      if (configs.project.length > 0) {
        Logger.header('Project configurations (.envoi/):');
        configs.project.forEach(config => Logger.plain(`  - ${config}`));
        Logger.blank();
      }
      
      if (configs.user.length === 0 && configs.project.length === 0) {
        Logger.plain('No configurations found.');
        Logger.plain('Use "envoi config init" to create configuration directories.');
        Logger.plain('Use "envoi config create <name>" to create a new configuration.');
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  private async handleShow(args: string[]): Promise<void> {
    if (args.length === 0) {
      Logger.error('Configuration name is required');
      Logger.plain('Usage: envoi config show <name>');
      return;
    }

    const configName = args[0];
    const { ConfigDiscovery } = await import('../../config/discovery');
    
    try {
      const result = await ConfigDiscovery.discoverConfig({ configName });
      
      Logger.header(`Configuration: ${configName}`);
      Logger.blank();
      
      result.sources.forEach(source => {
        Logger.plain(`Source: ${source.type} (${source.path})`);
      });
      
      Logger.blank();
      Logger.header('Configuration content:');
      Logger.blank();
      
      // Show variables
      if (result.config.variables && result.config.variables.length > 0) {
        Logger.plain('variables:');
        result.config.variables.forEach(variable => {
          const required = variable.required ? ' (required)' : '';
          const defaultValue = variable.default ? ` = ${variable.default}` : '';
          Logger.plain(`  - ${variable.name}${required}${defaultValue}`);
          if (variable.description) {
            Logger.plain(`    description: ${variable.description}`);
          }
        });
      }
      
      // Show providers
      if (result.config.providers) {
        Logger.plain('providers:');
        Object.entries(result.config.providers).forEach(([name, provider]) => {
          Logger.plain(`  - ${name}:`);
          Logger.plain(`    type: ${provider.type}`);
          Logger.plain(`    enabled: ${provider.enabled}`);
          if (provider.config) {
            Logger.plain(`    config: ${JSON.stringify(provider.config)}`);
          }
        });
      }
      
      // Show command
      if (result.config.command) {
        Logger.plain('command:');
        Logger.plain(`  default: ${result.config.command.default}`);
        if (result.config.command.description) {
          Logger.plain(`  description: ${result.config.command.description}`);
        }
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  private async handleCreate(args: string[]): Promise<void> {
    if (args.length === 0) {
      Logger.error('Configuration name is required');
      Logger.plain('Usage: envoi config create <name>');
      return;
    }

    const configName = args[0];
    const userConfigPath = path.join(os.homedir(), '.envoi', `${configName}.yml`);
    const projectConfigPath = path.join('.envoi', `${configName}.yml`);
    
    try {
      // Check if configuration already exists
      const userExists = await this.fileExists(userConfigPath);
      const projectExists = await this.fileExists(projectConfigPath);
      
      if (userExists || projectExists) {
        Logger.error(`Configuration '${configName}' already exists`);
        if (userExists) Logger.plain(`  User: ${userConfigPath}`);
        if (projectExists) Logger.plain(`  Project: ${projectConfigPath}`);
        return;
      }
      
      // Create default configuration
      const defaultConfig = {
        variables: [],
        providers: {
          local: {
            type: 'local',
            enabled: true,
            config: {
              file: '.env'
            }
          }
        },
        command: {
          default: 'echo "Hello from envoi"',
          description: 'Default command'
        }
      };
      
      // Ask user where to create the configuration
      Logger.plain(`Where would you like to create the '${configName}' configuration?`);
      Logger.plain('1. User directory (~/.envoi/) - available for all projects');
      Logger.plain('2. Project directory (.envoi/) - project-specific');
      
      // For now, create in project directory by default
      await fs.mkdir('.envoi', { recursive: true });
      await fs.writeFile(projectConfigPath, this.yamlStringify(defaultConfig));
      
      Logger.success(`Configuration '${configName}' created successfully`);
      Logger.plain(`Location: ${projectConfigPath}`);
      Logger.blank();
      Logger.plain('You can now use it with:');
      Logger.plain(`  envoi ${configName}`);
    } catch (error) {
      this.handleError(error);
    }
  }

  private async handleEdit(args: string[]): Promise<void> {
    if (args.length === 0) {
      Logger.error('Configuration name is required');
      Logger.plain('Usage: envoi config edit <name>');
      return;
    }

    const configName = args[0];
    const { ConfigDiscovery } = await import('../../config/discovery');
    
    try {
      const result = await ConfigDiscovery.discoverConfig({ configName });
      
      // For now, just show the file path
      const source = result.sources[0]; // Use the first (highest priority) source
      Logger.plain(`Configuration file: ${source.path}`);
      Logger.plain('Please edit the file manually with your preferred editor.');
    } catch (error) {
      this.handleError(error);
    }
  }

  private async handleRemove(args: string[]): Promise<void> {
    if (args.length === 0) {
      Logger.error('Configuration name is required');
      Logger.plain('Usage: envoi config rm <name>');
      return;
    }

    const configName = args[0];
    const userConfigPath = path.join(os.homedir(), '.envoi', `${configName}.yml`);
    const projectConfigPath = path.join('.envoi', `${configName}.yml`);
    
    try {
      let removed = false;
      
      if (await this.fileExists(userConfigPath)) {
        await fs.unlink(userConfigPath);
        Logger.plain(`Removed user configuration: ${userConfigPath}`);
        removed = true;
      }
      
      if (await this.fileExists(projectConfigPath)) {
        await fs.unlink(projectConfigPath);
        Logger.plain(`Removed project configuration: ${projectConfigPath}`);
        removed = true;
      }
      
      if (!removed) {
        Logger.error(`Configuration '${configName}' not found`);
        return;
      }
      
      Logger.success(`Configuration '${configName}' removed successfully`);
    } catch (error) {
      this.handleError(error);
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private yamlStringify(obj: Record<string, unknown>): string {
    // Simple YAML stringification for basic objects
    const yaml = require('yaml');
    return yaml.stringify(obj);
  }
}