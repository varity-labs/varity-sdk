/**
 * CLI Logger Utilities
 *
 * Colored console output for CLI commands
 */

import chalk from 'chalk'

export class Logger {
  static success(message: string): void {
    console.log(chalk.green('✓'), message)
  }

  static error(message: string): void {
    console.log(chalk.red('✗'), message)
  }

  static warn(message: string): void {
    console.log(chalk.yellow('⚠'), message)
  }

  static info(message: string): void {
    console.log(chalk.blue('ℹ'), message)
  }

  static step(step: number, total: number, message: string): void {
    console.log(chalk.cyan(`[${step}/${total}]`), message)
  }

  static header(message: string): void {
    console.log('\n' + chalk.bold.cyan(message) + '\n')
  }

  static subheader(message: string): void {
    console.log(chalk.bold(message))
  }

  static code(code: string): void {
    console.log(chalk.gray(code))
  }

  static newline(): void {
    console.log('')
  }
}
