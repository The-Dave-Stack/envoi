import { loadConfig } from '../src/config/loader';
import { resolveVariables } from '../src/core/resolver';
import { validateConfig } from '../src/config/schema';
import { LocalProvider } from '../src/providers/local';
import { providerRegistry } from '../src/providers/registry';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Configuration Loading', () => {
  const testConfigPath = path.join(__dirname, 'test-config.yml');
  const testEnvPath = path.join(__dirname, 'test.env');

  beforeAll(() => {
    // Register providers for tests
    providerRegistry.register(new LocalProvider());
  });

  beforeEach(async () => {
    // Create test config file
    const configContent = `
variables:
  - name: TEST_VAR
    required: true
    description: "Test variable"
    source:
      type: local
      file: ${testEnvPath}
      key: TEST_KEY
  - name: OPTIONAL_VAR
    required: false
    default: "default_value"
    description: "Optional variable"
`;
    await fs.writeFile(testConfigPath, configContent);

    // Create test .env file
    await fs.writeFile(testEnvPath, 'TEST_KEY=test_value_from_env');
  });

  afterEach(async () => {
    try {
      await fs.unlink(testConfigPath);
      await fs.unlink(testEnvPath);
    } catch (error) {
      // Ignore errors if files don't exist
    }
  });

  test('should load and validate configuration', async () => {
    const config = await loadConfig(testConfigPath);
    
    expect(config.variables).toHaveLength(2);
    expect(config.variables[0].name).toBe('TEST_VAR');
    expect(config.variables[0].required).toBe(true);
    expect(config.variables[1].name).toBe('OPTIONAL_VAR');
    expect(config.variables[1].default).toBe('default_value');
  });

  test('should resolve variables from local source', async () => {
    const config = await loadConfig(testConfigPath);
    const resolved = await resolveVariables(config, false);
    
    const testVar = resolved.find(v => v.name === 'TEST_VAR');
    expect(testVar).toBeDefined();
    expect(testVar?.value).toBe('test_value_from_env');
    expect(testVar?.source).toBe('local:TEST_KEY');

    const optionalVar = resolved.find(v => v.name === 'OPTIONAL_VAR');
    expect(optionalVar).toBeDefined();
    expect(optionalVar?.value).toBe('default_value');
    expect(optionalVar?.source).toBe('default');
  });

  test('should throw error for missing required variable', async () => {
    // Remove the .env file
    await fs.unlink(testEnvPath);
    
    const config = await loadConfig(testConfigPath);
    
    await expect(resolveVariables(config, false)).rejects.toThrow(
      'Environment file not found'
    );
  });

  test('should throw error for invalid YAML', async () => {
    await fs.writeFile(testConfigPath, 'invalid: yaml: content: [');
    
    await expect(loadConfig(testConfigPath)).rejects.toThrow('Invalid YAML');
  });

  test('should validate with Zod schema', () => {
    const validConfig = {
      variables: [
        { name: 'TEST', required: false, description: 'Test' }
      ]
    };
    
    expect(() => validateConfig(validConfig)).not.toThrow();
  });

  test('should reject invalid config with Zod', () => {
    const invalidConfig = {
      variables: 'not-an-array'
    };
    
    expect(() => validateConfig(invalidConfig)).toThrow();
  });
});