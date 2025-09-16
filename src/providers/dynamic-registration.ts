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
    Logger.debug('[DymanicResgistration] No providers configuration found, using defaults');
    // Register local provider as default if no providers config
    try {
      providerRegistry.register(ProviderFactory.create('local'));
      Logger.debug('[DymanicResgistration] Registered default local provider');
    } catch (error) {
      Logger.warn(`[DymanicResgistration] Failed to register default local provider: ${error}`);
    }
    return;
  }

  Logger.debug(`[DymanicResgistration] Found ${Object.keys(config.providers).length} provider configurations`);

  // Register providers based on configuration
  for (const [name, providerConfig] of Object.entries(config.providers)) {
    const config = providerConfig as import('../config/schema').ProviderConfig;
    if (!config.enabled) {
      Logger.debug(`[DymanicResgistration] Provider '${name}' is disabled, skipping registration`);
      continue;
    }

    Logger.debug(`[DymanicResgistration] Registering provider '${name}' of type '${config.type}'`);

    try {
      const provider = ProviderFactory.create(config.type, config.config);
      providerRegistry.register(provider);
      Logger.debug(`[DymanicResgistration] Successfully registered provider '${name}'`);
    } catch (error) {
      if (error instanceof ProviderError) {
        Logger.warn(`[DymanicResgistration] Failed to register provider '${name}': ${error.message}`);
      } else {
        Logger.warn(`[DymanicResgistration] Failed to register provider '${name}': ${error}`);
      }
    }
  }

  if (providerRegistry.isEmpty()) {
    Logger.warn('[DymanicResgistration] No providers were successfully registered');
  } else {
    const registeredProviders = providerRegistry.getRegisteredProviders();
    Logger.debug(`[DymanicResgistration] Registered providers: ${registeredProviders.join(', ')}`);
  }
}