import { Provider } from '../types';

export class ProviderRegistry {
  private providers = new Map<string, Provider>();

  register(provider: Provider): void {
    this.providers.set(provider.name, provider);
  }

  get(name: string): Provider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Provider not found: ${name}`);
    }
    return provider;
  }

  has(name: string): boolean {
    return this.providers.has(name);
  }

  clear(): void {
    this.providers.clear();
  }

  isEmpty(): boolean {
    return this.providers.size === 0;
  }

  getRegisteredProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

export const providerRegistry = new ProviderRegistry();