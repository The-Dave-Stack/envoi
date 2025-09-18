import * as path from 'path';
import { ProgramCommand, ProgramOption } from '../../types';

import { EnvoiConfig } from '../../config/schema';
import { EnvoiError } from '../../utils/errors';
import { Logger } from '../../utils/logger';
import { filterDisabledProviders } from '../../utils/provider-filter';
import { ConfigDiscovery } from '../../config/discovery';
import { providerRegistry } from '../../providers/registry';
import { registerProvidersFromConfig } from '../../providers/dynamic-registration';

export abstract class BaseCommand implements ProgramCommand {
  abstract command: string;
  abstract description: string;
  abstract options: ProgramOption[];
  
  protected async setupEnvironment(
    configPath: string,
    verbose: boolean,
    configName?: string,
    options: {
      userConfigDir?: string;
      projectConfigDir?: string;
      legacyConfigPath?: string;
      userConfigOnly?: boolean;
      projectConfigOnly?: boolean;
    } = {}
  ): Promise<EnvoiConfig> {
    Logger.setDebug(verbose);
    
    let config;
    let sources = [];
    
    try {
      if (options.userConfigOnly) {
        // Load only user configuration
        if (configName) {
          const userConfigPath = path.join(options.userConfigDir || path.join(require('os').homedir(), '.envoi'), `${configName}.yml`);
          config = await require('../../config/loader').loadConfig(userConfigPath);
          sources = [{ type: 'user', path: userConfigPath, configName }];
        } else {
          throw new EnvoiError('Config name is required when using --user-config-only');
        }
      } else if (options.projectConfigOnly) {
        // Load only project configuration
        if (configName) {
          const projectConfigPath = path.join(options.projectConfigDir || '.envoi', `${configName}.yml`);
          config = await require('../../config/loader').loadConfig(projectConfigPath);
          sources = [{ type: 'project', path: projectConfigPath, configName }];
        } else {
          throw new EnvoiError('Config name is required when using --project-config-only');
        }
      } else {
        // Use configuration discovery
        const discoveryOptions: any = {
          configName,
          legacyConfigPath: configPath
        };
        if (options.userConfigDir) discoveryOptions.userConfigDir = options.userConfigDir;
        if (options.projectConfigDir) discoveryOptions.projectConfigDir = options.projectConfigDir;
        
        const result = await ConfigDiscovery.discoverConfig(discoveryOptions);
        config = result.config;
        sources = result.sources;
      }
    } catch (error) {
      console.error('Config loading error:', error);
      throw error;
    }
    
    if (verbose) {
      Logger.info(`[BaseCommand] Loaded configuration from ${sources.length} source(s):`);
      sources.forEach(source => {
        Logger.info(`[BaseCommand]  - ${source.type}: ${source.path}`);
      });
    }
    
    // Register providers based on configuration
    registerProvidersFromConfig(config, verbose);
    
    // Filter out sources and variables for disabled providers
    const filteredConfig = filterDisabledProviders(config);
    
    if (verbose) {
      Logger.info(`[BaseCommand] Registered providers: ${providerRegistry.getRegisteredProviders().join(', ')}`);
      Logger.info(`[BaseCommand] Filtered configuration to ${filteredConfig.variables.length} variables from ${config.variables.length} total`);
    }
    
    return filteredConfig;
  }
  
  protected handleError(error: unknown): never {
    if (error instanceof EnvoiError) {
      Logger.error('[BaseCommand] ', error.message);
      process.exit(1);
    } else {
      Logger.error('[BaseCommand] An unexpected error occurred:', error);
      process.exit(1);
    }
  }
  
  abstract action(...args: unknown[]): Promise<void>;
}