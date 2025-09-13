export interface VariableDefinition {
  name: string;
  required?: boolean | undefined;
  default?: string | undefined;
  description?: string | undefined;
}

export interface VariableSource {
  type: 'local' | 'vault';
  file?: string | undefined; // For local type
  key?: string | undefined; // If not provided, uses variable name
  path?: string | undefined; // For vault type
}

export interface EnvoiConfig {
  variables: VariableDefinition[];
  sources?: Record<string, VariableSource> | undefined;
}

export interface ResolvedVariable {
  name: string;
  value: string;
  source: string;
}

export interface Provider {
  name: string;
  resolve(source: VariableSource): Promise<string>;
}