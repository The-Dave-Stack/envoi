import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';

import { EnvoiConfig } from '../types';
import { EnvoiError } from '../utils/errors';
import { Logger } from '../utils/logger';
import { validateConfig } from './schema';

const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;

export async function loadConfig(configPath: string): Promise<EnvoiConfig> {
  try {
    const absolutePath = path.resolve(configPath);
    const content = await fs.readFile(absolutePath, 'utf-8');
    
    // Parse frontmatter if present
    const { frontmatter, configContent } = parseFrontmatter(content);
    
    // Parse the main configuration content
    const configData = yaml.parse(configContent);
    
    // Merge frontmatter with configuration
    const finalConfig = {
      ...configData,
      frontmatter
    };
    
    return validateConfig(finalConfig);
  } catch (error) {
    if (error instanceof Error) {
      if ('code' in error && error.code === 'ENOENT') {
        // Don't log errors for missing files - this is expected behavior during config discovery
        throw new EnvoiError(`Configuration file not found: ${configPath}`);
      }
      if (error.name === 'YAMLParseError') {
        Logger.errorWithContext(`[Loader] Invalid YAML in configuration file: ${configPath}`, error);
        throw new EnvoiError(`Invalid YAML in configuration file: ${error.message}`);
      }
    }
    
    // Only log unexpected errors
    Logger.errorWithContext('[Loader] Failed to load configuration:', error);
    throw new EnvoiError(`Failed to load configuration: ${error}`);
  }
}

function parseFrontmatter(content: string): { frontmatter: Record<string, unknown>; configContent: string } {
  const match = content.match(FRONTMATTER_REGEX);
  
  if (!match) {
    // No frontmatter found, return empty frontmatter and original content
    return { frontmatter: {}, configContent: content };
  }
  
  const [, frontmatterContent, configContent] = match;
  
  try {
    const frontmatter = yaml.parse(frontmatterContent);
    return { frontmatter, configContent: configContent.trim() };
  } catch (error) {
    Logger.warn(`[Loader] Failed to parse frontmatter, treating as regular content: ${error}`);
    // If frontmatter parsing fails, treat entire content as config
    return { frontmatter: {}, configContent: content };
  }
}