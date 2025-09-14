export interface ResolvedVariable {
  name: string;
  value: string;
  source: string;
}

export interface Provider {
  name: string;
  resolve(source: import('../config/schema').VariableSource): Promise<string>;
}

// Re-export types from schema to maintain consistency
export type {
  VariableDefinition,
  VariableSource,
  CommandConfig,
  ProviderConfig,
  ProvidersConfig,
  EnvoiConfig,
} from '../config/schema';