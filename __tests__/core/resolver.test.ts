import { resolveVariables } from '../../src/core/resolver';
import { providerRegistry } from '../../src/providers/registry';
import { Provider, EnvoiConfig, VariableSource } from '../../src/types';
import { ValidationError } from '../../src/utils/errors';

// Mock provider
class MockProvider implements Provider {
  name = 'mock';
  private values: Record<string, string>;

  constructor(values: Record<string, string>) {
    this.values = values;
  }

  async resolve(source: VariableSource): Promise<string> {
    if (source.key && this.values[source.key]) {
      return this.values[source.key];
    }
    throw new Error(`Key not found in mock: ${source.key}`);
  }
}

describe('Resolver Unit Tests', () => {
  beforeEach(() => {
    providerRegistry.clear();
    // Reset environment variables
    delete process.env.ENV_VAR;
    delete process.env.SOURCE_VAR;
  });

  test('should resolve variables from default values', async () => {
    const config: EnvoiConfig = {
      variables: [
        { name: 'DEFAULT_VAR', required: false, default: 'defaultValue' },
      ],
    };
    const resolved = await resolveVariables(config, false);
    expect(resolved).toEqual([{ name: 'DEFAULT_VAR', value: 'defaultValue', source: 'default' }]);
  });

  test('should throw ValidationError for required variable with no source or default', async () => {
    const config: EnvoiConfig = {
      variables: [
        { name: 'REQUIRED_VAR', required: true },
      ],
    };
    await expect(resolveVariables(config, false)).rejects.toThrow(ValidationError);
    await expect(resolveVariables(config, false)).rejects.toThrow(
      "Required variable 'REQUIRED_VAR' was not found."
    );
  });

  test('should resolve variables from a registered provider', async () => {
    providerRegistry.register(new MockProvider({ 'source-key': 'sourceValue' }));
    const config: EnvoiConfig = {
      variables: [
        {
          name: 'SOURCE_VAR',
          required: false,
          source: { type: 'mock', key: 'source-key' } as any,
        },
      ],
    };
    const resolved = await resolveVariables(config, false);
    expect(resolved).toEqual([{ name: 'SOURCE_VAR', value: 'sourceValue', source: 'mock:source-key' }]);
  });

  test('should prioritize environment variables over sources and defaults', async () => {
    process.env.ENV_VAR = 'envValue';
    providerRegistry.register(new MockProvider({ 'source-key': 'sourceValue' }));

    const config: EnvoiConfig = {
      variables: [
        {
          name: 'ENV_VAR',
          required: false,
          default: 'defaultValue',
          source: { type: 'mock', key: 'source-key' } as any,
        },
      ],
    };

    const resolved = await resolveVariables(config, false);
    expect(resolved).toEqual([{ name: 'ENV_VAR', value: 'envValue', source: 'environment' }]);
  });

  test('should prioritize source over default value', async () => {
    providerRegistry.register(new MockProvider({ 'source-key': 'sourceValue' }));

    const config: EnvoiConfig = {
      variables: [
        {
          name: 'SOURCE_VAR',
          required: false,
          default: 'defaultValue',
          source: { type: 'mock', key: 'source-key' } as any,
        },
      ],
    };

    const resolved = await resolveVariables(config, false);
    expect(resolved).toEqual([{ name: 'SOURCE_VAR', value: 'sourceValue', source: 'mock:source-key' }]);
  });

  test('should skip optional variables if no value is found', async () => {
    const config: EnvoiConfig = {
      variables: [
        { name: 'OPTIONAL_VAR', required: false },
      ],
    };
    const resolved = await resolveVariables(config, false);
    expect(resolved).toHaveLength(0);
  });
});
