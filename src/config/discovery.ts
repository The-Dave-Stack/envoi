import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

import { EnvoiConfig } from '../config/schema';
import { loadConfig } from '../config/loader';
import { EnvoiError } from '../utils/errors';
import { Logger } from '../utils/logger';

export interface ConfigSource {
  type: 'user' | 'project' | 'legacy';
  path: string;
  configName?: string;
}

export interface ConfigDiscoveryOptions {
  userConfigDir?: string;
  projectConfigDir?: string;
  configName?: string;
  legacyConfigPath?: string;
}

export class ConfigDiscovery {
  private static readonly DEFAULT_USER_DIR = path.join(os.homedir(), '.envoi');
  private static readonly DEFAULT_PROJECT_DIR = '.envoi';
  private static readonly DEFAULT_LEGACY_CONFIG = 'envoi.yml';

  static async discoverConfig(
    options: ConfigDiscoveryOptions = {}
  ): Promise<{ config: EnvoiConfig; sources: ConfigSource[] }> {
    const {
      userConfigDir = this.DEFAULT_USER_DIR,
      projectConfigDir = this.DEFAULT_PROJECT_DIR,
      configName,
      legacyConfigPath = this.DEFAULT_LEGACY_CONFIG
    } = options;

    const sources: ConfigSource[] = [];
    const configs: EnvoiConfig[] = [];

    // Try project configuration first
    if (configName) {
      const projectConfigPath = path.join(projectConfigDir, `${configName}.yml`);
      try {
        const projectConfig = await this.loadConfigIfExists(projectConfigPath);
        if (projectConfig) {
          configs.push(projectConfig);
          sources.push({ type: 'project', path: projectConfigPath, configName });
        }
      } catch {
        Logger.debug(`[ConfigDiscovery] Project config not found: ${projectConfigPath}`);
      }
    }

    // Try user configuration
    if (configName) {
      const userConfigPath = path.join(userConfigDir, `${configName}.yml`);
      try {
        const userConfig = await this.loadConfigIfExists(userConfigPath);
        if (userConfig) {
          configs.push(userConfig);
          sources.push({ type: 'user', path: userConfigPath, configName });
        }
      } catch {
        Logger.debug(`[ConfigDiscovery] User config not found: ${userConfigPath}`);
      }
    }

    // Fallback to legacy configuration if no named config found
    if (configs.length === 0) {
      try {
        const legacyConfig = await this.loadConfigIfExists(legacyConfigPath);
        if (legacyConfig) {
          configs.push(legacyConfig);
          sources.push({ type: 'legacy', path: legacyConfigPath });
        }
      } catch {
        Logger.debug(`[ConfigDiscovery] Legacy config not found: ${legacyConfigPath}`);
      }
    }

    if (configs.length === 0) {
      throw new EnvoiError(
        configName 
          ? `No configuration found for '${configName}'. Checked: .envoi/${configName}.yml, ~/.envoi/${configName}.yml, envoi.yml`
          : `No configuration found. Checked: envoi.yml`
      );
    }

    // Merge configurations (project overrides user, both override legacy)
    const mergedConfig = this.mergeConfigs(configs.reverse());

    Logger.info(`[ConfigDiscovery] Loaded configuration from ${sources.length} source(s):`);
    sources.forEach(source => {
      Logger.info(`[ConfigDiscovery]  - ${source.type}: ${source.path}`);
    });

    return { config: mergedConfig, sources };
  }

  static async listConfigurations(
    userConfigDir: string = this.DEFAULT_USER_DIR,
    projectConfigDir: string = this.DEFAULT_PROJECT_DIR
  ): Promise<{ user: string[]; project: string[] }> {
    const userConfigs = await this.listYamlFiles(userConfigDir);
    const projectConfigs = await this.listYamlFiles(projectConfigDir);

    return {
      user: userConfigs,
      project: projectConfigs
    };
  }

  static async ensureDirectories(
    userConfigDir: string = this.DEFAULT_USER_DIR,
    projectConfigDir: string = this.DEFAULT_PROJECT_DIR
  ): Promise<void> {
    await this.ensureDirectory(userConfigDir);
    await this.ensureDirectory(projectConfigDir);
  }

  private static async loadConfigIfExists(configPath: string): Promise<EnvoiConfig | null> {
    try {
      return await loadConfig(configPath);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return null;
      }
      throw error;
    }
  }

  private static async listYamlFiles(dirPath: string): Promise<string[]> {
    try {
      const files = await fs.readdir(dirPath);
      return files
        .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))
        .map(file => file.replace(/\.(yml|yaml)$/, ''));
    } catch (error) {
      if (error instanceof Error && 'code' in error && (error as any).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  private static async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch (error) {
      if (error instanceof Error && 'code' in error && (error as any).code === 'ENOENT') {
        await fs.mkdir(dirPath, { recursive: true });
        Logger.info(`[ConfigDiscovery] Created directory: ${dirPath}`);
      } else {
        throw error;
      }
    }
  }

  private static mergeConfigs(configs: EnvoiConfig[]): EnvoiConfig {
    if (configs.length === 1) {
      return configs[0];
    }

    return configs.reduce((merged, current) => {
      return {
        variables: [...(merged.variables || []), ...(current.variables || [])],
        providers: { ...(merged.providers || {}), ...(current.providers || {}) },
        command: current.command || merged.command
      };
    });
  }
}