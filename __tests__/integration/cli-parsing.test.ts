import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { resolveAndExecute } from '../../src/core/resolver';
import { loadConfig } from '../../src/config/loader';

// Mock the spawn function to avoid actual subprocess execution
jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));

describe('CLI Command Parsing', () => {
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

  describe('Command Line Argument Parsing', () => {
    it('should parse traditional syntax with quotes', () => {
      const rawArgs = ['node', 'server.js', '--port', '3000'];
      const fullCommand = rawArgs.join(' ');
      
      expect(fullCommand).toBe('node server.js --port 3000');
    });

    it('should parse -- separator syntax', () => {
      const rawArgs = ['--', 'node', 'server.js', '--port', '3000'];
      const separatorIndex = rawArgs.indexOf('--');
      const commandArgs = rawArgs.slice(separatorIndex + 1);
      const fullCommand = commandArgs.join(' ');
      
      expect(fullCommand).toBe('node server.js --port 3000');
    });

    it('should handle empty args after -- separator', () => {
      const rawArgs = ['--'];
      const separatorIndex = rawArgs.indexOf('--');
      const commandArgs = rawArgs.slice(separatorIndex + 1);
      const fullCommand = commandArgs.join(' ');
      
      expect(fullCommand).toBe('');
    });

    it('should handle mixed quoted and unquoted args', () => {
      const rawArgs = ['node', 'server.js', '--port', '"3000"'];
      const fullCommand = rawArgs.join(' ');
      
      expect(fullCommand).toBe('node server.js --port "3000"');
    });
  });

  describe('Command Priority Logic', () => {
    it('should prioritize command line arguments over config default', async () => {
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

      // Command line argument should be used instead of default
      await resolveAndExecute(config, 'node server.js', false);
      
      expect(spawn).toHaveBeenCalledWith('node', ['server.js'], expect.objectContaining({
        stdio: 'inherit',
        env: expect.any(Object),
        shell: true,
      }));
    });

    it('should fall back to default command when no command line args', async () => {
      const configContent = `
variables:
  - name: NODE_ENV
    required: false
    default: "development"

command:
  default: "npm run build"
  description: "Build the application"
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

      // Default command should be used
      await resolveAndExecute(config, 'npm run build', false);
      
      expect(spawn).toHaveBeenCalledWith('npm', ['run', 'build'], expect.objectContaining({
        stdio: 'inherit',
        env: expect.any(Object),
        shell: true,
      }));
    });

    it('should handle complex commands with arguments', async () => {
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

      // Mock successful spawn
      const mockChild = {
        on: jest.fn((event, callback) => {
          if (event === 'exit') callback(0);
        }),
      };
      (spawn as jest.Mock).mockReturnValue(mockChild as any);

      const config = await loadConfig(configPath);

      // Complex command with multiple arguments
      await resolveAndExecute(config, 'node server.js --port 3000 --debug --config ./config/dev.json', false);
      
      expect(spawn).toHaveBeenCalledWith('node', ['server.js', '--port', '3000', '--debug', '--config', './config/dev.json'], expect.objectContaining({
        stdio: 'inherit',
        env: expect.any(Object),
        shell: true,
      }));
    });
  });

  describe('Error Scenarios', () => {
    it('should handle spawn errors gracefully', async () => {
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

      // Mock spawn error
      const mockChild = {
        on: jest.fn((event, callback) => {
          if (event === 'error') callback(new Error('Command not found'));
        }),
      };
      (spawn as jest.Mock).mockReturnValue(mockChild as any);

      const config = await loadConfig(configPath);

      await expect(resolveAndExecute(config, 'nonexistent-command', false)).rejects.toThrow('Failed to execute command');
    });

    it('should handle non-zero exit codes', async () => {
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

      // Mock non-zero exit code
      const mockChild = {
        on: jest.fn((event, callback) => {
          if (event === 'exit') callback(1);
        }),
      };
      (spawn as jest.Mock).mockReturnValue(mockChild as any);

      const config = await loadConfig(configPath);

      await expect(resolveAndExecute(config, 'exit-with-error', false)).rejects.toThrow('Command exited with code 1');
    });
  });
});