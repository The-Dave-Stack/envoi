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
      // Skip the exec-default command as we handle it differently
      if (command.command === 'exec-default') {
        continue;
      }
      const registration = this.registerCommand(program, program, command);
      this.registrations.push(registration);
    }

    return this.registrations;
  }

  private static registerCommand(program: Command, _programOptions: any, command: BaseCommand): CommandRegistration {
    // Check if this should be the default command
    const isDefault = command.command === 'exec'; // exec is our default command
    const allowUnknown = command.command === 'exec' || command.command === 'config';

    // Create the command
    const programCommand = program
      .command(command.command, { isDefault })
      .description(command.description);

    // Add allowUnknownOption for exec and config commands
    if (allowUnknown) {
      programCommand.allowUnknownOption();
    }

    // Add arguments for config command
    if (command.command === 'config') {
      programCommand.argument('[subcommand]', 'Configuration subcommand (init, ls, show, create, edit, rm)');
      programCommand.argument('[args...]', 'Additional arguments for subcommands');
      programCommand.allowUnknownOption(true);
    }

    // Add arguments for exec command
    if (command.command === 'exec') {
      programCommand.argument('[args...]', 'Command to execute or configuration name');
      programCommand.allowUnknownOption(true);
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