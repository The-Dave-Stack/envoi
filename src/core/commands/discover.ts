import { BaseCommand } from './BaseCommand';
import { Logger } from '../../utils/logger';
import { promises as fs } from 'fs';
import path from 'path';

export interface DiscoveredCommand {
  name: string;
  className: string;
  CommandClass: new () => BaseCommand;
  filePath: string;
}

export class CommandDiscovery {
  private static readonly COMMAND_PATTERN = /^(.+?)Command\.ts$/;
  private static readonly EXCLUDED_FILES = ['BaseCommand.ts', 'index.ts', 'discover.ts', 'registry.ts'];

  static async discoverCommands(commandsDir?: string): Promise<DiscoveredCommand[]> {
    Logger.setDebug(process.env.DEBUG === 'true' || process.env.DEBUG === '1');
    // Default to dist directory when running compiled code
    if (!commandsDir) {
      commandsDir = path.join(process.cwd(), process.env.NODE_ENV === 'development' ? 'src/core/commands' : 'dist/core/commands');
    }
    try {
      Logger.debug(`[CommandDiscovery] Looking for commands in: ${commandsDir}`);
      
      const files = await fs.readdir(commandsDir);
      
      Logger.debug(`[CommandDiscovery] Found files: ${files.toString()}`);
      
      // Determine file extension based on environment
      const isDevelopment = commandsDir.includes('src');
      const fileExtension = isDevelopment ? '.ts' : '.js';
      
      const commandFiles = files.filter(file => 
        file.endsWith(fileExtension) && 
        !this.EXCLUDED_FILES.map(f => f.replace('.ts', fileExtension)).includes(file) &&
        this.COMMAND_PATTERN.test(file.replace('.js', '.ts'))
      );
      
      Logger.debug(`[CommandDiscovery] Looking for ${fileExtension} files`);
      Logger.debug(`[CommandDiscovery] Command files after filter:`, commandFiles);

      const discoveredCommands: DiscoveredCommand[] = [];

      for (const file of commandFiles) {
        const match = file.replace('.js', '.ts').match(this.COMMAND_PATTERN);
        if (!match) continue;

        const commandName = match[1].toLowerCase();
        const className = match[1] + 'Command';
        const filePath = path.join(commandsDir, file);

        try {
          // Dynamic import to get the command class
          const module = await import(filePath);
          const CommandClass = module[className];

          if (!CommandClass || typeof CommandClass !== 'function') {
            console.warn(`Warning: Could not find exported class '${className}' in ${file}`);
            continue;
          }

          // Verify it extends BaseCommand
          const tempInstance = new CommandClass();
          if (!(tempInstance instanceof BaseCommand)) {
            console.warn(`Warning: Class '${className}' in ${file} does not extend BaseCommand`);
            continue;
          }

          discoveredCommands.push({
            name: commandName,
            className,
            CommandClass,
            filePath
          });
        } catch (error) {
          console.warn(`Warning: Failed to load command from ${file}:`, error);
        }
      }

      return discoveredCommands;
    } catch (error) {
      console.error('Error discovering commands:', error);
      return [];
    }
  }

  static async createCommandInstances(commandsDir: string = __dirname): Promise<BaseCommand[]> {
    const discoveredCommands = await this.discoverCommands(commandsDir);
    return discoveredCommands.map(({ CommandClass }) => new CommandClass());
  }

  static async getCommandClasses(commandsDir: string = __dirname): Promise<Array<new () => BaseCommand>> {
    const discoveredCommands = await this.discoverCommands(commandsDir);
    return discoveredCommands.map(({ CommandClass }) => CommandClass);
  }
}