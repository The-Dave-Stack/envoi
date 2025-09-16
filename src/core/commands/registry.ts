import { Command } from 'commander';
import { BaseCommand } from './BaseCommand';
import { CommandDiscovery } from './discover';

export interface CommandRegistration {
  command: BaseCommand;
  programCommand: Command;
}

export class CommandRegistry {
  private static registrations: CommandRegistration[] = [];

  static async registerCommands(program: Command, commandsDir?: string): Promise<CommandRegistration[]> {
    const commands = await CommandDiscovery.createCommandInstances(commandsDir);
    
    this.registrations = [];

    for (const command of commands) {
      const registration = this.registerCommand(program, command);
      this.registrations.push(registration);
    }

    return this.registrations;
  }

  private static registerCommand(program: Command, command: BaseCommand): CommandRegistration {
    // Check if this should be the default command
    const isDefault = command.command === 'exec'; // exec is our default command

    // Create the command
    const programCommand = program
      .command(command.command, { isDefault })
      .description(command.description);

    // Add allowUnknownOption for exec command
    if (command.command === 'exec') {
      programCommand.allowUnknownOption();
    }

    // Add options to the command
    command.options.forEach(option => {
      programCommand.option(
        option.flags,
        option.description || '',
        option.defaultValue
      );
    });

    // Set the action handler
    programCommand.action(command.action.bind(command));

    return {
      command,
      programCommand
    };
  }

  static getRegistrations(): CommandRegistration[] {
    return this.registrations;
  }

  static getCommandByName(name: string): BaseCommand | undefined {
    return this.registrations.find(reg => reg.command.command === name)?.command;
  }

  static clear(): void {
    this.registrations = [];
  }
}