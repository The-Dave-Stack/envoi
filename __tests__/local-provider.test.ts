import { LocalProvider } from '../src/providers/local';
import { VariableSource } from '../src/types';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('LocalProvider', () => {
  const provider = new LocalProvider();
  const testEnvPath = path.join(__dirname, 'test-local.env');

  beforeEach(async () => {
    await fs.writeFile(testEnvPath, 'TEST_KEY=test_value\nANOTHER_KEY=another_value');
  });

  afterEach(async () => {
    try {
      await fs.unlink(testEnvPath);
    } catch (error) {
      // Ignore errors if file doesn't exist
    }
  });

  test('should resolve variable from .env file', async () => {
    const source: VariableSource = {
      type: 'local',
      file: testEnvPath,
      key: 'TEST_KEY'
    };

    const value = await provider.resolve(source);
    expect(value).toBe('test_value');
  });

  test('should throw error for non-existent file', async () => {
    const source: VariableSource = {
      type: 'local',
      file: 'non-existent.env',
      key: 'TEST_KEY'
    };

    await expect(provider.resolve(source)).rejects.toThrow(
      'Environment file not found: non-existent.env'
    );
  });

  test('should throw error for missing key', async () => {
    const source: VariableSource = {
      type: 'local',
      file: testEnvPath,
      key: 'MISSING_KEY'
    };

    await expect(provider.resolve(source)).rejects.toThrow(
      'Key "MISSING_KEY" not found'
    );
  });

  test('should throw error for non-local source type', async () => {
    const source: VariableSource = {
      type: 'vault',
      key: 'TEST_KEY'
    } as any;

    await expect(provider.resolve(source)).rejects.toThrow(
      'LocalProvider cannot handle source type: vault'
    );
  });

  test('should throw error when file is not specified', async () => {
    const source: VariableSource = {
      type: 'local',
      key: 'TEST_KEY'
    };

    await expect(provider.resolve(source)).rejects.toThrow(
      'Local provider requires a "file" specification'
    );
  });
});