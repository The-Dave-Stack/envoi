import { Provider, VariableSource } from '../types';

import { ProviderError } from '../utils/errors';
import fetch from 'node-fetch';

interface OpenBaoSecretData {
  data: Record<string, any>;
}

interface OpenBaoResponse {
  data: OpenBaoSecretData;
}

export class OpenBaoProvider implements Provider {
  name = 'openbao';
  private baseUrl: string;
  private token: string;

  constructor(config?: any) {
    this.baseUrl = config?.address || process.env.OPENBAO_ADDR || 'http://127.0.0.1:8200';
    this.token = config?.token || process.env.OPENBAO_TOKEN || '';
    
    if (!this.token) {
      throw new ProviderError(
        'OPENBAO_TOKEN environment variable is required for OpenBao provider'
      );
    }
  }

  async resolve(source: VariableSource): Promise<string> {
    if (source.type !== 'openbao') {
      throw new ProviderError(`OpenBaoProvider cannot handle source type: ${source.type}`);
    }

    if (!source.path) {
      throw new ProviderError('OpenBao provider requires a "path" specification');
    }

    if (!source.key) {
      throw new ProviderError('OpenBao provider requires a "key" specification');
    }

    try {
      const url = `${this.baseUrl}/v1/${source.path}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Vault-Token': this.token,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new ProviderError(
          `OpenBao API request failed: ${response.status} ${response.statusText}`
        );
      }

      const result: OpenBaoResponse = await response.json() as OpenBaoResponse;
      
      if (!result || !result.data || !result.data.data) {
        throw new ProviderError(`No data found at OpenBao path: ${source.path}`);
      }

      const value = result.data.data[source.key];
      
      if (value === undefined || value === null) {
        throw new ProviderError(
          `Key "${source.key}" not found in OpenBao secret at path: ${source.path}`
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
          `Failed to read from OpenBao at ${source.path}: ${error.message}`
        );
      }
      
      throw new ProviderError(
        `Failed to read from OpenBao at ${source.path}: ${error}`
      );
    }
  }
}