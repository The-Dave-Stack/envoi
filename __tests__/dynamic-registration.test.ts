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

  test('should register file provider by default when no providers config', () => {
    const config: EnvoiConfig = {
      variables: [],
    };

    registerProvidersFromConfig(config, false);

    expect(providerRegistry.has('file')).toBe(true);
    expect(providerRegistry.getRegisteredProviders()).toContain('file');
  });

  test('should register enabled providers from config', () => {
    const config: EnvoiConfig = {
      variables: [],
      providers: {
        file: {
          type: 'file',
          enabled: true,
          config: { file: '.env' }
        }
      }
    };

    registerProvidersFromConfig(config, false);

    expect(providerRegistry.has('file')).toBe(true);
    expect(providerRegistry.getRegisteredProviders()).toEqual(['file']);
  });

  test('should handle unknown provider type gracefully', () => {
    const config: EnvoiConfig = {
      variables: [],
      providers: {
        file: {
          type: 'file',
          enabled: true,
          config: { file: '.env' }
        },
        unknown: {
          type: 'unknown' as any,
          enabled: true,
          config: {}
        }
      }
    };

    registerProvidersFromConfig(config, false);

    expect(providerRegistry.has('file')).toBe(true);
    expect(providerRegistry.has('unknown')).toBe(false);
    expect(providerRegistry.getRegisteredProviders()).toEqual(['file']);
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