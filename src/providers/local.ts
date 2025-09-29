import * as dotenv from 'dotenv';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Provider, VariableSource } from '../types';
import { ProviderError } from '../utils/errors';

export class FileProvider implements Provider {
  name = 'file';
  private configFile: string = '.env';

  constructor(config?: { file?: string }) {
    if (config?.file) {
      this.configFile = config.file;
    }
  }

  async resolve(source: VariableSource): Promise<string> {
    if (source.type !== 'file') {
      throw new ProviderError(`FileProvider cannot handle source type: ${source.type}`);
    }

    if (!source.key) {
      throw new ProviderError('File provider requires a "key" specification');
    }

    // Use source.file if provided, otherwise use configured file
    const filePath = source.file || this.configFile;

    try {
      const envPath = path.resolve(filePath);
      const envExists = await fs.access(envPath).then(() => true).catch(() => false);

      if (!envExists) {
        throw new ProviderError(`Environment file not found: ${filePath}`);
      }

      const envConfig = dotenv.parse(await fs.readFile(envPath, 'utf-8'));
      const value = envConfig[source.key];

      if (value === undefined) {
        throw new ProviderError(`Key "${source.key}" not found in ${filePath}`);
      }

      return value;
    } catch (error) {
      if (error instanceof ProviderError) {
        throw error;
      }
      throw new ProviderError(`Failed to read from ${filePath}: ${error}`);
    }
  }
}