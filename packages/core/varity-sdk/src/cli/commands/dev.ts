/**
 * varity dev - Development mode with hot-reload
 *
 * Watches for changes and automatically regenerates code
 */

import { Command } from 'commander'
import * as path from 'path'
import { Logger } from '../utils/logger'
import { startDevServer } from '../../dev/dev-server'

export const devCommand = new Command('dev')
  .description('Start development mode with hot-reload')
  .option('-t, --template <path>', 'Path to template JSON file', './templates/template.json')
  .option('-c, --contracts <path>', 'Contracts output directory', './contracts')
  .option('-w, --watch', 'Enable file watching (default: true)', true)
  .option('-p, --port <number>', 'Development server port', '3001')
  .action(async (options) => {
    try {
      Logger.header('🔥 Varity Development Mode')

      const templatePath = path.resolve(options.template)
      const contractsPath = path.resolve(options.contracts)
      const port = parseInt(options.port, 10)

      Logger.info('Configuration:')
      Logger.code(`  Template: ${templatePath}`)
      Logger.code(`  Contracts: ${contractsPath}`)
      Logger.code(`  Watch mode: ${options.watch ? 'enabled' : 'disabled'}`)
      Logger.code(`  Port: ${port}`)
      Logger.newline()

      // Start dev server
      await startDevServer({
        templatePath,
        contractsPath,
        watch: options.watch,
        port
      })

    } catch (error) {
      Logger.error(`Failed to start dev server: ${error instanceof Error ? error.message : 'Unknown error'}`)
      process.exit(1)
    }
  })
