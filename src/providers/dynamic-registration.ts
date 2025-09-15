import { EnvoiConfig } from '../types';
import { Logger } from '../utils/logger';
import { ProviderError } from '../utils/errors';
import { ProviderFactory } from './factory';
import { providerRegistry } from './registry';

export function registerProvidersFromConfig(config: EnvoiConfig, verbose: boolean): void {
  Logger.setDebug(verbose);
  // Clear existing providers
  providerRegistry.clear();
  
  if (!config.providers) {
    Logger.debug('No providers configuration found, using defaults');
    // Register local provider as default if no providers config
    try {
      providerRegistry.register(ProviderFactory.create('local'));
      Logger.debug('Registered default local provider');
    } catch (error) {
      Logger.warn(`Failed to register default local provider: ${error}`);
    }
    return;
  }

  Logger.debug(`Found ${Object.keys(config.providers).length} provider configurations`);

  // Register providers based on configuration
  for (const [name, providerConfig] of Object.entries(config.providers)) {
    if (!providerConfig.enabled) {
      Logger.debug(`Provider '${name}' is disabled, skipping registration`);
      continue;
    }

    Logger.debug(`Registering provider '${name}' of type '${providerConfig.type}'`);

    try {
      const provider = ProviderFactory.create(providerConfig.type, providerConfig.config);
      providerRegistry.register(provider);
      Logger.debug(`Successfully registered provider '${name}'`);
    } catch (error) {
      if (error instanceof ProviderError) {
        Logger.warn(`Failed to register provider '${name}': ${error.message}`);
      } else {
        Logger.warn(`Failed to register provider '${name}': ${error}`);
      }
    }
  }

  if (providerRegistry.isEmpty()) {
    Logger.warn('No providers were successfully registered');
  } else {
    const registeredProviders = providerRegistry.getRegisteredProviders();
    Logger.debug(`Registered providers: ${registeredProviders.join(', ')}`);
  }
}