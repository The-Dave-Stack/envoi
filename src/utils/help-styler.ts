const chalk = require('chalk');

/**
 * Help styling utility for consistent color formatting across CLI help output
 */
export class HelpStyler {
  /**
   * Style section headers (e.g., "Quick Start:", "Features:")
   */
  static styleHeader(text: string): string {
    return chalk.bold.blue(text);
  }

  /**
   * Style command names in examples
   */
  static styleCommand(text: string): string {
    return chalk.cyan(text);
  }

  /**
   * Style file paths and configuration items
   */
  static stylePath(text: string): string {
    return chalk.gray(text);
  }

  /**
   * Style examples and secondary information
   */
  static styleExample(text: string): string {
    return chalk.dim(text);
  }

  /**
   * Style option flags
   */
  static styleOption(text: string): string {
    return chalk.yellow(text);
  }

  /**
   * Style important keywords or highlights
   */
  static styleHighlight(text: string): string {
    return chalk.green(text);
  }

  /**
   * Style feature bullet points
   */
  static styleFeature(text: string): string {
    return chalk.white(`• ${text}`);
  }

  /**
   * Style subcommand descriptions
   */
  static styleSubcommand(text: string): string {
    return chalk.white(text);
  }

  /**
   * Style error text (minimal use in help)
   */
  static styleError(text: string): string {
    return chalk.red(text);
  }

  /**
   * Apply color formatting to main help description
   */
  static formatMainDescription(description: string): string {
    return description
      // Style section headers
      .replace(/^(Quick Start:)$/gm, this.styleHeader('$1'))
      .replace(/^(Features:)$/gm, this.styleHeader('$1'))
      .replace(/^(Configuration Management:)$/gm, this.styleHeader('$1'))
      
      // Style envoi commands in examples
      .replace(/envoi (\w+)/g, `envoi ${this.styleCommand('$1')}`)
      .replace(/envoi config (\w+)/g, `envoi config ${this.styleCommand('$1')}`)
      .replace(/envoi --(\w+)/g, `envoi --${this.styleOption('$1')}`)
      
      // Style file paths
      .replace(/(\.envoi\/|~\/\.envoi\/|\.yml|\.env)/g, this.stylePath('$1'))
      
      // Style quotes around commands
      .replace(/"([^"]+)"/g, `"${this.styleExample('$1')}"`)
      
      // Style feature bullets
      .replace(/^• (.+)$/gm, this.styleFeature('$1'));
  }

  /**
   * Apply color formatting to command descriptions
   */
  static formatCommandDescription(description: string): string {
    return description
      // Style envoi commands in examples
      .replace(/envoi (\w+)/g, `envoi ${this.styleCommand('$1')}`)
      .replace(/envoi --(\w+)/g, `envoi --${this.styleOption('$1')}`)
      .replace(/envoi env/g, `envoi ${this.styleCommand('env')}`)
      
      // Style options
      .replace(/(-\w|--[\w-]+)/g, this.styleOption('$1'))
      
      // Style file paths
      .replace(/(\.env|\.yml|\.envoi\/|~\/\.envoi\/)/g, this.stylePath('$1'))
      
      // Style quotes
      .replace(/"([^"]+)"/g, `"${this.styleExample('$1')}"`)
      
      // Style source types
      .replace(/(environment|local:KEY|openbao:PATH|default)/g, this.styleHighlight('$1'));
  }

  /**
   * Create a visual separator for between commands
   */
  static createSeparator(): string {
    return chalk.dim('─');
  }

  /**
   * Create a command separator line with proper spacing
   */
  static createCommandSeparator(): string {
    return chalk.dim('├─ ──────────────────────────────────────────────────────');
  }

  /**
   * Create a subtle separator (just a blank line with minimal styling)
   */
  static createSubtleSeparator(): string {
    return chalk.dim('');
  }

  /**
   * Strip all ANSI color codes for environments that don't support colors
   */
  static stripColors(text: string): string {
    // Remove ANSI escape codes
    // eslint-disable-next-line no-control-regex
    return text.replace(/\x1b\[[0-9;]*m/g, '');
  }

  /**
   * Strip separators from text (for clean fallback)
   */
  static stripSeparators(text: string): string {
    return text
      .replace(/├─ ──────────────────────────────────────────────────────/g, '')
      .replace(/─/g, '');
  }
}