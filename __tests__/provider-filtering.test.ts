import { filterDisabledProviders } from '../src/utils/provider-filter';
import { EnvoiConfig } from '../src/types';
import { providerRegistry } from '../src/providers/registry';

describe('Provider Filtering', () => {
  beforeEach(() => {
    providerRegistry.clear();
    // Register a mock provider for testing
    providerRegistry.register({
      name: 'local',
      resolve: jest.fn()
    });
  });

  test('should filter out variables that use disabled providers', () => {
    const config: EnvoiConfig = {
      variables: [
        { name: 'LOCAL_VAR', required: false, description: 'Local variable', source: { type: 'local', key: 'local_key' } },
        { name: 'VAULT_VAR', required: false, description: 'Vault variable', source: { type: 'vault', key: 'vault_key' } },
        { name: 'OPENBAO_VAR', required: false, description: 'OpenBao variable', source: { type: 'openbao', key: 'openbao_key' } },
      ],
      providers: {
        local: { type: 'local', enabled: true, config: {} },
        vault: { type: 'vault', enabled: false, config: {} },
        openbao: { type: 'openbao', enabled: false, config: {} },
      }
    };

    const filteredConfig = filterDisabledProviders(config);

    // Should only keep the local variable
    expect(filteredConfig.variables).toHaveLength(1);
    expect(filteredConfig.variables[0].name).toBe('LOCAL_VAR');
  });

  test('should keep variables without sources', () => {
    const config: EnvoiConfig = {
      variables: [
        { name: 'NO_SOURCE_VAR', required: false, description: 'Variable without source' },
        { name: 'VAULT_VAR', required: false, description: 'Vault variable', source: { type: 'vault', key: 'vault_key' } },
      ],
      providers: {
        vault: { type: 'vault', enabled: false, config: {} },
      }
    };

    const filteredConfig = filterDisabledProviders(config);

    // Should keep the variable without source
    expect(filteredConfig.variables).toHaveLength(1);
    expect(filteredConfig.variables[0].name).toBe('NO_SOURCE_VAR');
  });

  test('should preserve providers and command configuration', () => {
    const config: EnvoiConfig = {
      variables: [
        { name: 'VAULT_VAR', required: false, description: 'Vault variable', source: { type: 'vault', key: 'vault_key' } },
      ],
      providers: {
        vault: { type: 'vault', enabled: false, config: {} },
      },
      command: {
        default: 'npm start',
        description: 'Start the application'
      }
    };

    const filteredConfig = filterDisabledProviders(config);

    // Should preserve providers configuration
    expect(filteredConfig.providers).toEqual(config.providers);
    
    // Should preserve command configuration
    expect(filteredConfig.command).toEqual(config.command);
    
    // Should filter out variables
    expect(filteredConfig.variables).toHaveLength(0);
  });

  test('should handle configuration without sources', () => {
    const config: EnvoiConfig = {
      variables: [
        { name: 'VAR1', required: false, description: 'Variable 1' },
        { name: 'VAR2', required: false, description: 'Variable 2' },
      ],
      providers: {
        local: { type: 'local', enabled: true, config: {} },
      }
    };

    const filteredConfig = filterDisabledProviders(config);

    // Should keep all variables since they don't have sources
    expect(filteredConfig.variables).toHaveLength(2);
    expect(filteredConfig.variables.map(v => v.name)).toEqual(['VAR1', 'VAR2']);
  });
});