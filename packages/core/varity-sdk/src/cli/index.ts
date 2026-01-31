#!/usr/bin/env node

/**
 * Varity SDK CLI
 *
 * Command-line tools for rapid template development
 */

import { Command } from 'commander'
import chalk from 'chalk'
import { initCommand } from './commands/init'
import { cloneCommand } from './commands/clone'
import { generateCommand } from './commands/generate'
import { devCommand } from './commands/dev'
import { validateCommand } from './commands/validate'

const program = new Command()

// CLI metadata
program
  .name('varity')
  .description('Varity SDK - Rapid development tools for blockchain business templates')
  .version('2.0.0-beta.1')

// Welcome message
console.log(chalk.cyan.bold('\n🚀 Varity SDK CLI v2.0.0\n'))

// Register commands
program.addCommand(initCommand)
program.addCommand(cloneCommand)
program.addCommand(generateCommand)
program.addCommand(devCommand)
program.addCommand(validateCommand)

// Parse CLI arguments
program.parse(process.argv)

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp()
}
