import { z } from 'zod';

const VariableDefinitionSchema = z.object({
  name: z.string(),
  required: z.boolean().optional().default(false),
  default: z.string().optional(),
  description: z.string().optional(),
});

const VariableSourceSchema = z.object({
  type: z.enum(['local', 'vault']),
  file: z.string().optional(),
  key: z.string().optional(),
  path: z.string().optional(),
});

const CommandConfigSchema = z.object({
  default: z.string().optional(),
  description: z.string().optional(),
});

const EnvoiConfigSchema = z.object({
  variables: z.array(VariableDefinitionSchema),
  sources: z.record(VariableSourceSchema).optional(),
  command: CommandConfigSchema.optional(),
});

export type VariableDefinition = z.infer<typeof VariableDefinitionSchema>;
export type VariableSource = z.infer<typeof VariableSourceSchema>;
export type CommandConfig = z.infer<typeof CommandConfigSchema>;
export type EnvoiConfig = z.infer<typeof EnvoiConfigSchema>;

export function validateConfig(data: unknown): EnvoiConfig {
  return EnvoiConfigSchema.parse(data);
}