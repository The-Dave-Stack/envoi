import * as dotenv from 'dotenv';

/**
 * Environment variable substitution utility.
 * Replaces ${VAR_NAME} patterns with values from process.env.
 */
export function substituteEnvVars(value: string): string {
  return value.replace(/\$\{([^}]+)\}/g, (_match, varName) => {
    const envValue = process.env[varName];
    if (envValue === undefined) {
      throw new Error(`Environment variable '${varName}' not found for substitution in: ${value}`);
    }
    return envValue;
  });
}

/**
 * Recursively substitute environment variables in an object.
 */
export function substituteEnvVarsInObject(obj: unknown): unknown {
  dotenv.config();
  if (typeof obj === 'string') {
    return substituteEnvVars(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => substituteEnvVarsInObject(item));
  }
  
  if (obj && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = substituteEnvVarsInObject(value);
    }
    return result;
  }
  
  return obj;
}