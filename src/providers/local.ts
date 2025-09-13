import * as dotenv from 'dotenv';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Provider, VariableSource } from '../types';
import { ProviderError } from '../utils/errors';

export class LocalProvider implements Provider {
  name = 'local';

  async resolve(source: VariableSource): Promise<string> {
    if (source.type !== 'local') {
      throw new ProviderError(`LocalProvider cannot handle source type: ${source.type}`);
    }

    if (!source.file) {
      throw new ProviderError('Local provider requires a "file" specification');
    }

    if (!source.key) {
      throw new ProviderError('Local provider requires a "key" specification');
    }

    try {
      const envPath = path.resolve(source.file);
      const envExists = await fs.access(envPath).then(() => true).catch(() => false);

      if (!envExists) {
        throw new ProviderError(`Environment file not found: ${source.file}`);
      }

      const envConfig = dotenv.parse(await fs.readFile(envPath, 'utf-8'));
      const value = envConfig[source.key];

      if (value === undefined) {
        throw new ProviderError(`Key "${source.key}" not found in ${source.file}`);
      }

      return value;
    } catch (error) {
      if (error instanceof ProviderError) {
        throw error;
      }
      throw new ProviderError(`Failed to read from ${source.file}: ${error}`);
    }
  }
}