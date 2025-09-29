import { FileProvider } from './local';
import { Provider } from '../types';
import { ProviderError } from '../utils/errors';
import { substituteEnvVarsInObject } from '../utils/env-substitution';
import { PROVIDER_TYPES } from '../config/schema';

export class ProviderFactory {
  private static providerClasses = {
    file: FileProvider,
  };

  // Try to import OpenBaoProvider if available
  private static getOpenBaoProvider(): typeof import('./openbao').OpenBaoProvider | null {
    try {
      const openbaoModule = require('./openbao');
      return openbaoModule.OpenBaoProvider;
    } catch {
      return null;
    }
  }

  static create(type: string, config?: Record<string, unknown>): Provider {
    let ProviderClass: new (config?: Record<string, unknown>) => Provider;
    
    if (type === 'openbao') {
      const OpenBaoProvider = this.getOpenBaoProvider();
      if (!OpenBaoProvider) {
        throw new ProviderError('OpenBao provider is not available');
      }
      ProviderClass = OpenBaoProvider;
    } else {
      ProviderClass = this.providerClasses[type as keyof typeof this.providerClasses];
    }
    
    if (!ProviderClass) {
      throw new ProviderError(`Unknown provider type: ${type}`);
    }

    // Substitute environment variables in config
    const processedConfig = config ? substituteEnvVarsInObject(config) as Record<string, unknown> : undefined;
    
    try {
      return new ProviderClass(processedConfig);
    } catch (error) {
      throw new ProviderError(`Failed to create ${type} provider: ${error}`);
    }
  }

  static getAvailableProviders(): string[] {
    return [...PROVIDER_TYPES];
  }
}