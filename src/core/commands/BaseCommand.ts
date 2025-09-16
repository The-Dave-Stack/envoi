import { ProgramCommand, ProgramOption } from '../../types';

import { EnvoiConfig } from '../../config/schema';
import { EnvoiError } from '../../utils/errors';
import { Logger } from '../../utils/logger';
import { filterDisabledProviders } from '../../utils/provider-filter';
import { loadConfig } from '../../config/loader';
import { providerRegistry } from '../../providers/registry';
import { registerProvidersFromConfig } from '../../providers/dynamic-registration';

export abstract class BaseCommand implements ProgramCommand {
  abstract command: string;
  abstract description: string;
  abstract options: ProgramOption[];
  
  protected async setupEnvironment(configPath: string, verbose: boolean): Promise<EnvoiConfig> {
    Logger.setDebug(verbose);
    
    // Load configuration first to determine which providers to register
    let config;
    try {
      config = await loadConfig(configPath);
    } catch (error) {
      console.error('Config loading error:', error);
      throw error;
    }
    
    if (verbose) {
      Logger.info(`[BaseCommand] Loaded configuration from ${configPath}`);
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