import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';

import { EnvoiConfig } from '../types';
import { EnvoiError } from '../utils/errors';
import { Logger } from '../utils/logger';
import { validateConfig } from './schema';

export async function loadConfig(configPath: string): Promise<EnvoiConfig> {
  try {
    const absolutePath = path.resolve(configPath);
    const content = await fs.readFile(absolutePath, 'utf-8');
    const data = yaml.parse(content);
    
    return validateConfig(data);
  } catch (error) {
    Logger.errorWithContext('[Loader] Failed to load configuration:', error);
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        throw new EnvoiError(`Configuration file not found: ${configPath}`);
      }
      if (error.name === 'YAMLParseError') {
        throw new EnvoiError(`Invalid YAML in configuration file: ${error.message}`);
      }
    }
    
    throw new EnvoiError(`Failed to load configuration: ${error}`);
  }
}