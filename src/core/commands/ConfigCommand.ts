import { BaseCommand } from './BaseCommand';
import { Logger } from '../../utils/logger';

export abstract class ConfigCommand extends BaseCommand {
  protected async ensureDirectories(): Promise<void> {
    const { ConfigDiscovery } = await import('../../config/discovery');
    await ConfigDiscovery.ensureDirectories();
  }

  protected async listConfigurations(): Promise<{ user: string[]; project: string[] }> {
    const { ConfigDiscovery } = await import('../../config/discovery');
    return await ConfigDiscovery.listConfigurations();
  }

  protected async showConfigHelp(): Promise<void> {
    Logger.header('envoi configuration management');
    Logger.blank();
    Logger.plain('Available commands:');
    Logger.blank();
    Logger.plain('  envoi config init          Initialize configuration directories');
    Logger.plain('  envoi config ls             List available configurations');
    Logger.plain('  envoi config show <name>     Show specific configuration');
    Logger.plain('  envoi config create <name>   Create new configuration');
    Logger.plain('  envoi config edit <name>     Edit configuration');
    Logger.plain('  envoi config rm <name>       Remove configuration');
    Logger.blank();
    Logger.plain('Configuration directories:');
    Logger.blank();
    Logger.plain('  User: ~/.envoi/');
    Logger.plain('  Project: .envoi/');
    Logger.blank();
    Logger.plain('Configuration priority (highest to lowest):');
    Logger.blank();
    Logger.plain('  1. Project configuration (.envoi/{name}.yml)');
    Logger.plain('  2. User configuration (~/.envoi/{name}.yml)');
    Logger.plain('  3. Legacy configuration (envoi.yml)');
  }
}