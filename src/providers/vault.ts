import * as vaultModule from 'node-vault';
import { Provider, VariableSource } from '../types';
import { ProviderError } from '../utils/errors';

export class VaultProvider implements Provider {
  name = 'vault';
  private client?: any;

  constructor() {
    this.initializeClient();
  }

  private initializeClient(): void {
    const token = process.env.VAULT_TOKEN;
    if (!token) {
      throw new ProviderError(
        'VAULT_TOKEN environment variable is required for Vault provider'
      );
    }

    // Use the default export or fallback to the main export
    const vault = (vaultModule as any).default || vaultModule;
    this.client = vault({
      endpoint: process.env.VAULT_ADDR || 'http://127.0.0.1:8200',
      token: token,
    });
  }

  async resolve(source: VariableSource): Promise<string> {
    if (source.type !== 'vault') {
      throw new ProviderError(`VaultProvider cannot handle source type: ${source.type}`);
    }

    if (!source.path) {
      throw new ProviderError('Vault provider requires a "path" specification');
    }

    if (!source.key) {
      throw new ProviderError('Vault provider requires a "key" specification');
    }

    if (!this.client) {
      throw new ProviderError('Vault client not initialized');
    }

    try {
      const result = await this.client.read(source.path);
      
      if (!result || !result.data || !result.data.data) {
        throw new ProviderError(`No data found at Vault path: ${source.path}`);
      }

      const value = result.data.data[source.key];
      
      if (value === undefined || value === null) {
        throw new ProviderError(
          `Key "${source.key}" not found in Vault secret at path: ${source.path}`
        );
      }

      if (typeof value !== 'string') {
        throw new ProviderError(
          `Expected string value for key "${source.key}", but got ${typeof value}`
        );
      }

      return value;
    } catch (error) {
      if (error instanceof ProviderError) {
        throw error;
      }
      
      if (error && typeof error === 'object' && 'message' in error) {
        throw new ProviderError(
          `Failed to read from Vault at ${source.path}: ${error.message}`
        );
      }
      
      throw new ProviderError(
        `Failed to read from Vault at ${source.path}: ${error}`
      );
    }
  }
}