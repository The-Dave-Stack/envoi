import { EnvoiConfig, ResolvedVariable } from '../types';
import { ProviderError, ValidationError } from '../utils/errors';

import { Logger } from '../utils/logger';
import { providerRegistry } from '../providers/registry';
import { spawn } from 'child_process';

export async function resolveVariables(config: EnvoiConfig, verbose: boolean): Promise<ResolvedVariable[]> {
  Logger.setDebug(verbose);
  const resolvedVariables: ResolvedVariable[] = [];

  for (const variable of config.variables) {
    try {
      let value: string | undefined;
      let sourceInfo = '';

      // First check if variable is already in environment
      Logger.debug(`[Resolver] Resolving variable '${variable.name}' using process.env: ${process.env[variable.name]}`);
      const envValue = process.env[variable.name];
      if (envValue !== undefined) {
        value = envValue;
        sourceInfo = 'environment';
      }

      // If not in environment, try to resolve from sources
      if (value === undefined && config.sources && config.sources[variable.name]) {
        Logger.debug(`[Resolver] Attempting to resolve variable '${variable.name}' from configured sources`);
        const variableSource = config.sources[variable.name];
        const provider = providerRegistry.get(variableSource.type);
        
        // Create a source with the key fallback for provider resolution
        const sourceWithKey = {
          ...variableSource,
          key: variableSource.key || variable.name
        };
        
        value = await provider.resolve(sourceWithKey);
        const keyUsed = sourceWithKey.key;
        sourceInfo = `${variableSource.type}:${keyUsed}`;
      }

      // If still not found, use default or throw error
      if (value === undefined) {
        if (variable.default !== undefined) {
          value = variable.default;
          sourceInfo = 'default';
        } else if (variable.required) {
          throw new ValidationError(
            `Required variable '${variable.name}' was not found. ` +
            `Please define it in your environment or configure a source in envoi.yml.`
          );
        } else {
          continue; // Skip optional variables without value
        }
      }

      resolvedVariables.push({
        name: variable.name,
        value,
        source: sourceInfo,
      });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof ProviderError) {
        throw error;
      }
      throw new Error(`Failed to resolve variable '${variable.name}': ${error}`);
    }
  }

  return resolvedVariables;
}

export async function resolveAndExecute(
  config: EnvoiConfig, 
  command: string, 
  verbose: boolean = false
): Promise<void> {
  Logger.setDebug(verbose);
  const resolvedVariables = await resolveVariables(config, verbose);

  if (verbose) {
    Logger.debug('[Resolver] Resolved variables:');
    resolvedVariables.forEach(variable => {
      Logger.debugDetail(`[Resolver] ${variable.name}: ${variable.source}`);
    });
  }

  const env = {
    ...process.env,
    ...Object.fromEntries(resolvedVariables.map(v => [v.name, v.value])),
  };

  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(' ');
    
    if (!cmd) {
      reject(new Error('No command provided'));
      return;
    }

    if (verbose) {
      Logger.debug(`[Resolver] Executing: ${command}`);
    }

    const child = spawn(cmd, args, {
      stdio: 'inherit',
      env,
      shell: true,
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command exited with code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(new Error(`Failed to execute command: ${error.message}`));
    });
  });
}