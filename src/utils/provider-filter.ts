import { EnvoiConfig } from '../types';
import { providerRegistry } from '../providers/registry';

/**
 * Filter configuration to remove variables that reference disabled providers
 */
export function filterDisabledProviders(config: EnvoiConfig): EnvoiConfig {
  const filteredConfig: EnvoiConfig = {
    variables: [],
    providers: config.providers,
    command: config.command,
  };

  // Get registered providers (only enabled ones)
  const registeredProviders = providerRegistry.getRegisteredProviders();
  const enabledProviderTypes = new Set(registeredProviders);

  // Filter variables: only keep those that either don't require a source or use an enabled provider
  filteredConfig.variables = config.variables.filter(variable => {
    // If variable has a source configured, check if the provider type is enabled
    if (variable.source) {
      return enabledProviderTypes.has(variable.source.type);
    }
    // Keep variables without sources (they'll use defaults or environment)
    return true;
  });

  return filteredConfig;
}