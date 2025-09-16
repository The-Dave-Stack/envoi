import { registerProvidersFromConfig } from '../src/providers/dynamic-registration';
import { providerRegistry } from '../src/providers/registry';
import { EnvoiConfig } from '../src/types';

// Mock the OpenBao provider to avoid node-fetch import issues
jest.mock('../src/providers/openbao', () => ({
  OpenBaoProvider: jest.fn().mockImplementation(() => ({
    name: 'openbao',
    resolve: jest.fn()
  }))
}));

describe('Dynamic Provider Registration', () => {
  beforeEach(() => {
    providerRegistry.clear();
  });

  test('should register local provider by default when no providers config', () => {
    const config: EnvoiConfig = {
      variables: [],
    };

    registerProvidersFromConfig(config, false);

    expect(providerRegistry.has('local')).toBe(true);
    expect(providerRegistry.getRegisteredProviders()).toContain('local');
  });

  test('should register enabled providers from config', () => {
    const config: EnvoiConfig = {
      variables: [],
      providers: {
        local: {
          type: 'local',
          enabled: true,
          config: { file: '.env' }
        }
      }
    };

    registerProvidersFromConfig(config, false);

    expect(providerRegistry.has('local')).toBe(true);
    expect(providerRegistry.getRegisteredProviders()).toEqual(['local']);
  });

  test('should skip disabled providers', () => {
    const config: EnvoiConfig = {
      variables: [],
      providers: {
        local: {
          type: 'local',
          enabled: true,
          config: { file: '.env' }
        },
        vault: {
          type: 'vault',
          enabled: false,
          config: { address: 'http://localhost:8200' }
        }
      }
    };

    registerProvidersFromConfig(config, false);

    expect(providerRegistry.has('local')).toBe(true);
    expect(providerRegistry.has('vault')).toBe(false);
    expect(providerRegistry.getRegisteredProviders()).toEqual(['local']);
  });

  test('should handle provider creation errors gracefully', () => {
    const config: EnvoiConfig = {
      variables: [],
      providers: {
        invalid: {
          type: 'invalid' as any,
          enabled: true,
          config: {}
        }
      }
    };

    // Should not throw, but should log warning
    expect(() => {
      registerProvidersFromConfig(config, false);
    }).not.toThrow();

    expect(providerRegistry.isEmpty()).toBe(true);
  });
});