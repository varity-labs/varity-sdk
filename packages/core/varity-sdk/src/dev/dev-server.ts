/**
 * Development Server
 *
 * Hot-reload development mode with file watching
 */

import * as fs from 'fs'
import * as path from 'path'
import chokidar from 'chokidar'
import { Logger } from '../cli/utils/logger'
import { generateContracts } from '../generators/contracts/generator'
import { generateTypes } from '../generators/types/generator'

export interface DevServerOptions {
  templatePath: string
  contractsPath: string
  watch: boolean
  port: number
}

/**
 * Start development server with hot-reload
 */
export async function startDevServer(options: DevServerOptions): Promise<void> {
  Logger.success('Development server started!')
  Logger.newline()

  // Initial generation
  await regenerateAll(options)

  if (options.watch) {
    Logger.info('👀 Watching for changes...')
    Logger.code('  Press Ctrl+C to stop')
    Logger.newline()

    // Watch template file
    const watcher = chokidar.watch(options.templatePath, {
      persistent: true,
      ignoreInitial: true
    })

    watcher.on('change', async (filePath) => {
      Logger.newline()
      Logger.warn(`Template changed: ${filePath}`)
      await regenerateAll(options)
      Logger.success('✓ Regeneration complete')
      Logger.newline()
      Logger.info('👀 Watching for changes...')
    })

    watcher.on('error', (error) => {
      Logger.error(`Watcher error: ${error.message}`)
    })

    // Keep process alive
    process.on('SIGINT', () => {
      Logger.newline()
      Logger.info('Stopping development server...')
      watcher.close()
      process.exit(0)
    })
  } else {
    Logger.info('Watch mode disabled. Run with --watch to enable.')
  }
}

/**
 * Regenerate all generated files
 */
async function regenerateAll(options: DevServerOptions): Promise<void> {
  const startTime = Date.now()

  try {
    // Generate contracts
    Logger.step(1, 3, 'Generating contracts...')
    const contractResult = await generateContracts({
      templatePath: options.templatePath,
      outputPath: options.contractsPath,
      includeTests: true
    })

    if (!contractResult.success) {
      Logger.error('Contract generation failed:')
      contractResult.errors.forEach(error => Logger.error(`  ${error}`))
      return
    }

    Logger.success(`  Generated ${contractResult.contracts.length} contracts`)

    // Generate types
    Logger.step(2, 3, 'Generating types...')
    const abiDir = path.join(path.dirname(options.contractsPath), 'abis')

    if (fs.existsSync(abiDir)) {
      const typeResult = await generateTypes({
        abiDir,
        outputPath: path.join(path.dirname(options.contractsPath), 'types')
      })

      if (typeResult.success) {
        Logger.success(`  Generated ${typeResult.types.length} type files`)
      }
    } else {
      Logger.warn('  No ABIs found, skipping type generation')
    }

    // Validation
    Logger.step(3, 3, 'Validating output...')
    const validation = validateGeneration(contractResult)

    if (validation.valid) {
      Logger.success('  Validation passed')
    } else {
      Logger.warn('  Validation warnings:')
      validation.warnings.forEach(warning => Logger.warn(`    ${warning}`))
    }

    const duration = Date.now() - startTime
    Logger.newline()
    Logger.success(`✨ All done in ${duration}ms`)

  } catch (error) {
    Logger.error(`Regeneration failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Validate generated files
 */
function validateGeneration(contractResult: any): { valid: boolean; warnings: string[] } {
  const warnings: string[] = []

  if (contractResult.contracts.length === 0) {
    warnings.push('No contracts were generated')
  }

  if (contractResult.tests.length === 0) {
    warnings.push('No test files were generated')
  }

  return {
    valid: warnings.length === 0,
    warnings
  }
}
