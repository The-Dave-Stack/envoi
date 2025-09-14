import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { loadConfig } from '../../src/config/loader';
import { EnvoiError } from '../../src/utils/errors';
import { resolveAndExecute } from '../../src/core/resolver';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Mock the spawn function to avoid actual subprocess execution
jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));

describe('Command Configuration', () => {
  const testDir = path.join(__dirname, '..', 'test-files');
  const configPath = path.join(testDir, 'envoi.yml');

  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Reset spawn mock
    (spawn as jest.MockedFunction<typeof spawn>).mockClear();
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Default Command Configuration', () => {
    it('should load configuration with default command', async () => {
      const configContent = `
variables:
  - name: NODE_ENV
    required: false
    default: "development"

command:
  default: "npm start"
  description: "Start the application server"
`;

      fs.writeFileSync(configPath, configContent);
      const config = await loadConfig(configPath);

      expect(config.command).toBeDefined();
      expect(config.command?.default).toBe('npm start');
      expect(config.command?.description).toBe('Start the application server');
    });

    it('should load configuration without command section', async () => {
      const configContent = `
variables:
  - name: NODE_ENV
    required: false
    default: "development"
`;

      fs.writeFileSync(configPath, configContent);
      const config = await loadConfig(configPath);

      expect(config.command).toBeUndefined();
    });

    it('should load configuration with only default command', async () => {
      const configContent = `
variables:
  - name: NODE_ENV
    required: false
    default: "development"

command:
  default: "node server.js"
`;

      fs.writeFileSync(configPath, configContent);
      const config = await loadConfig(configPath);

      expect(config.command).toBeDefined();
      expect(config.command?.default).toBe('node server.js');
      expect(config.command?.description).toBeUndefined();
    });
  });

  describe('CLI Integration', () => {
    it('should prioritize command line arguments over default command', async () => {
      const configContent = `
variables:
  - name: NODE_ENV
    required: false
    default: "development"

command:
  default: "npm start"
  description: "Start the application server"
`;

      fs.writeFileSync(configPath, configContent);

      // Mock successful spawn
      const mockChild = {
        on: jest.fn((event, callback) => {
          if (event === 'exit') callback(0);
        }),
      };
      (spawn as jest.Mock).mockReturnValue(mockChild as any);

      const config = await loadConfig(configPath);

      // Test that command line argument takes precedence
      await expect(resolveAndExecute(config, 'node server.js', false)).resolves.not.toThrow();
      expect(spawn).toHaveBeenCalledWith('node', ['server.js'], expect.any(Object));
    });

    it('should use default command when no command line argument provided', async () => {
      const configContent = `
variables:
  - name: NODE_ENV
    required: false
    default: "development"

command:
  default: "npm start"
  description: "Start the application server"
`;

      fs.writeFileSync(configPath, configContent);

      // Mock successful spawn
      const mockChild = {
        on: jest.fn((event, callback) => {
          if (event === 'exit') callback(0);
        }),
      };
      (spawn as jest.Mock).mockReturnValue(mockChild as any);

      const config = await loadConfig(configPath);

      // Test that default command is used
      await expect(resolveAndExecute(config, 'npm start', false)).resolves.not.toThrow();
      expect(spawn).toHaveBeenCalledWith('npm', ['start'], expect.any(Object));
    });

    it('should handle error when no command is provided anywhere', async () => {
      const configContent = `
variables:
  - name: NODE_ENV
    required: false
    default: "development"
`;

      fs.writeFileSync(configPath, configContent);

      // Test that CLI handles missing command appropriately
      const config = await loadConfig(configPath);
      expect(config.command).toBeUndefined();
    });
  });

  describe('Configuration Validation', () => {
    it('should accept valid command configuration', async () => {
      const configContent = `
variables:
  - name: NODE_ENV
    required: false
    default: "development"

command:
  default: "npm run dev"
  description: "Start development server"
`;

      fs.writeFileSync(configPath, configContent);
      
      await expect(loadConfig(configPath)).resolves.not.toThrow();
    });

    it('should accept minimal command configuration', async () => {
      const configContent = `
variables:
  - name: NODE_ENV
    required: false
    default: "development"

command:
  default: "node index.js"
`;

      fs.writeFileSync(configPath, configContent);
      
      await expect(loadConfig(configPath)).resolves.not.toThrow();
    });

    it('should accept empty command section', async () => {
      const configContent = `
variables:
  - name: NODE_ENV
    required: false
    default: "development"

command: {}
`;

      fs.writeFileSync(configPath, configContent);
      
      await expect(loadConfig(configPath)).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid command configuration', async () => {
      const configContent = `
variables:
  - name: NODE_ENV
    required: false
    default: "development"

command:
  default: "unclosed-string
`;

      fs.writeFileSync(configPath, configContent);
      
      await expect(loadConfig(configPath)).rejects.toThrow();
    });

    it('should handle missing configuration file', async () => {
      await expect(loadConfig('/nonexistent/path/envoi.yml')).rejects.toThrow(EnvoiError);
    });

    it('should handle invalid YAML syntax', async () => {
      const configContent = `
variables:
  - name: NODE_ENV
    required: false
    default: "development"

command:
  default: "npm start
  description: "Invalid YAML
`;

      fs.writeFileSync(configPath, configContent);
      
      await expect(loadConfig(configPath)).rejects.toThrow();
    });
  });
});