import { EnvoiConfig } from '../types';
import { providerRegistry } from '../providers/registry';

/**
 * Filter configuration to remove sources and variables that reference disabled providers
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
    if (config.sources && config.sources[variable.name]) {
      const source = config.sources[variable.name] as import('../config/schema').VariableSource;
      return enabledProviderTypes.has(source.type);
    }
    // Keep variables without sources (they'll use defaults or environment)
    return true;
  });

  // Filter sources: only keep those that use enabled providers
  if (config.sources) {
    const filteredSources: Record<string, any> = {};
    for (const [variableName, source] of Object.entries(config.sources)) {
      const typedSource = source as import('../config/schema').VariableSource;
      if (enabledProviderTypes.has(typedSource.type)) {
        filteredSources[variableName] = source;
      }
    }
    filteredConfig.sources = filteredSources;
  }

  return filteredConfig;
}