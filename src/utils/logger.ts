const chalk = require('chalk');

/**
 * Centralized logging utility with colorized output
 */
export class Logger {
  private static debugEnabled: boolean = false;

  /**
   * Enable or disable debug logging
   */
  static setDebug(enabled: boolean): void {
    this.debugEnabled = enabled;
  }

  /**
   * Log informational message
   */
  static info(message: string, ...optionalParams: unknown[]): void {
    console.log(chalk.blue('ℹ') + ' ' + chalk.blue(message), ...optionalParams);
  }

  /**
   * Log warning message
   */
  static warn(message: string, ...optionalParams: unknown[]): void {
    console.log(chalk.yellow('⚠') + ' ' + chalk.yellow(message), ...optionalParams);
  }

  /**
   * Log error message
   */
  static error(message: string, ...optionalParams: unknown[]): void {
    console.error(chalk.red('❌') + ' ' + chalk.red(message), ...optionalParams);
  }

  /**
   * Log error message with additional context
   */
  static errorWithContext(message: string, context?: unknown): void {
    console.error(chalk.red('❌') + ' ' + chalk.red(message));
    if (context) {
      console.error(chalk.red('   ') + chalk.dim(JSON.stringify(context, null, 2)));
    }
  }

  /**
   * Log success message
   */
  static success(message: string, ...optionalParams: unknown[]): void {
    console.log(chalk.green('✓') + ' ' + chalk.green(message), ...optionalParams);
  }

  /**
   * Log debug message (only shown when debug is enabled)
   */
  static debug(message: string, ...optionalParams: unknown[]): void {
    if (this.debugEnabled) {
      console.log(chalk.dim('🐛') + ' ' + chalk.dim(message), ...optionalParams);
    }
  }

  /**
   * Log debug message with details (only shown when debug is enabled)
   */
  static debugDetail(message: string, details?: string): void {
    if (this.debugEnabled) {
      console.log(chalk.dim('  ') + chalk.dim(message));
      if (details) {
        console.log(chalk.dim('    ') + chalk.dim(details));
      }
    }
  }

  /**
   * Log environment variable with colorized formatting
   */
  static variable(name: string, value: string, source: string, padding?: number): void {
    const coloredName = chalk.cyan(name);
    const coloredValue = chalk.white(value);
    const coloredSource = chalk.gray(`(${source})`);
    
    if (padding !== undefined) {
      const actualPadding = ' '.repeat(Math.max(0, padding - name.length));
      console.log(`  ${coloredName}:${actualPadding}${coloredValue} ${coloredSource}`);
    } else {
      console.log(`  ${coloredName}: ${coloredValue} ${coloredSource}`);
    }
  }

  /**
   * Log header/section title
   */
  static header(title: string): void {
    console.log(chalk.bold.blue(title));
  }

  /**
   * Log blank line
   */
  static blank(): void {
    console.log('');
  }

  /**
   * Log simple message without icon
   */
  static plain(message: string): void {
    console.log(message);
  }

  /**
   * Log no variables found message
   */
  static noVariables(): void {
    console.log(chalk.dim('  No environment variables configured'));
  }
}