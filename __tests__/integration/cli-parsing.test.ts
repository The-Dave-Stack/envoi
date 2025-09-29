import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { resolveAndExecute } from '../../src/core/resolver';
import { EnvoiConfig } from '../../src/types';

// Mock the spawn function to avoid actual subprocess execution
jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));

const mockSpawn = spawn as jest.Mock;

describe('CLI Command Execution Integration', () => {
  const testDir = path.join(__dirname, '..' , 'test-files');
  let baseConfig: EnvoiConfig;

  beforeEach(() => {
    // Ensure a clean environment for each test
    delete process.env.NODE_ENV;

    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    mockSpawn.mockClear();

    // Mock successful spawn by default
    const mockChild = {
      on: jest.fn((event: string, callback: (code: number) => void) => {
        if (event === 'exit') callback(0);
      }),
    };
    mockSpawn.mockReturnValue(mockChild as any);

    baseConfig = {
      variables: [
        { name: 'NODE_ENV', required: false, default: 'development' },
      ],
      command: {
        default: 'npm start',
      },
    };
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should use the default value from config when env is not set', async () => {
    const commandToExecute = 'node server.js --port 3000';
    await resolveAndExecute(baseConfig, commandToExecute, false);
    
    expect(mockSpawn).toHaveBeenCalledWith(
      commandToExecute, 
      expect.objectContaining({
        env: expect.objectContaining({ NODE_ENV: 'development' }),
      })
    );
  });

  it('should prioritize process.env over default values', async () => {
    process.env.NODE_ENV = 'test-priority'; // Set env var before execution
    const commandToExecute = 'node server.js';
    await resolveAndExecute(baseConfig, commandToExecute, false);

    expect(mockSpawn).toHaveBeenCalledWith(
      commandToExecute,
      expect.objectContaining({
        env: expect.objectContaining({ NODE_ENV: 'test-priority' }),
      })
    );
    delete process.env.NODE_ENV; // Clean up
  });

  it('should fall back to default command when an empty string is provided', async () => {
    const commandToExecute = baseConfig.command?.default || '';
    await resolveAndExecute(baseConfig, commandToExecute, false);
    
    expect(mockSpawn).toHaveBeenCalledWith(
      commandToExecute, 
      expect.objectContaining({
        stdio: 'inherit',
        env: expect.any(Object),
        shell: true,
      })
    );
  });

  it('should correctly execute a command with quoted arguments', async () => {
    const commandToExecute = "echo 'hello world'";
    await resolveAndExecute(baseConfig, commandToExecute, false);

    expect(mockSpawn).toHaveBeenCalledWith(commandToExecute, {
      stdio: 'inherit',
      env: expect.any(Object),
      shell: true,
    });
  });

  it('should handle spawn errors gracefully', async () => {
    const mockChild = {
      on: jest.fn((event: string, callback: (error: Error) => void) => {
        if (event === 'error') callback(new Error('Command not found'));
      }),
    };
    mockSpawn.mockReturnValue(mockChild as any);

    await expect(resolveAndExecute(baseConfig, 'nonexistent-command', false)).rejects.toThrow('Failed to execute command');
  });

  it('should handle non-zero exit codes', async () => {
    const mockChild = {
      on: jest.fn((event: string, callback: (code: number) => void) => {
        if (event === 'exit') callback(1);
      }),
    };
    mockSpawn.mockReturnValue(mockChild as any);

    await expect(resolveAndExecute(baseConfig, 'exit-with-error', false)).rejects.toThrow('Command exited with code 1');
  });
});