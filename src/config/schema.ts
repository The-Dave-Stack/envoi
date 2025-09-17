import { z } from 'zod';

const VariableSourceSchema = z.object({
  type: z.enum(['local', 'vault', 'openbao']),
  file: z.string().optional(),
  key: z.string().optional(),
  path: z.string().optional(),
  namespace: z.string().optional(),
});

const VariableDefinitionSchema = z.object({
  name: z.string(),
  required: z.boolean().optional().default(false),
  default: z.string().optional(),
  description: z.string().optional(),
  source: VariableSourceSchema.optional(),
});

const CommandConfigSchema = z.object({
  default: z.string().optional(),
  description: z.string().optional(),
});

const ProviderConfigSchema = z.object({
  type: z.enum(['local', 'vault', 'openbao']),
  enabled: z.boolean().default(true),
  config: z.record(z.string(), z.any()).optional(),
});

const ProvidersConfigSchema = z.record(z.string(), ProviderConfigSchema);

const FrontmatterSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const EnvoiConfigSchema = z.object({
  variables: z.array(VariableDefinitionSchema),
  providers: ProvidersConfigSchema.optional(),
  command: CommandConfigSchema.optional(),
  frontmatter: FrontmatterSchema.optional(),
});

export type VariableDefinition = z.infer<typeof VariableDefinitionSchema>;
export type VariableSource = z.infer<typeof VariableSourceSchema>;
export type CommandConfig = z.infer<typeof CommandConfigSchema>;
export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;
export type ProvidersConfig = z.infer<typeof ProvidersConfigSchema>;
export type Frontmatter = z.infer<typeof FrontmatterSchema>;
export type EnvoiConfig = z.infer<typeof EnvoiConfigSchema>;

export function validateConfig(data: unknown): EnvoiConfig {
  return EnvoiConfigSchema.parse(data);
}