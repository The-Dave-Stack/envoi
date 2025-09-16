export interface ResolvedVariable {
  name: string;
  value: string;
  source: string;
}

export interface Provider {
  name: string;
  resolve(source: import('../config/schema').VariableSource): Promise<string>;
}

export interface ProgramOption {
  flags: string,
  description?: string,
  defaultValue?: string | boolean | string[],
}

export interface ProgramCommand {
  command: string;
  description: string;
  options: ProgramOption[];
  action: (...args: any[]) => void | Promise<void>;
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