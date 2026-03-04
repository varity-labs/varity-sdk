/**
 * varity validate - Template validation
 *
 * Validates template configuration and structure
 */

import { Command } from 'commander'
import * as path from 'path'
import { Logger } from '../utils/logger'
import { validateTemplate } from '../../validation/template-validator'

export const validateCommand = new Command('validate')
  .description('Validate template configuration and structure')
  .option('-t, --template <path>', 'Path to template JSON file', './templates/template.json')
  .option('--strict', 'Enable strict validation mode', false)
  .action(async (options) => {
    try {
      Logger.header('🔍 Validate Template Configuration')

      const templatePath = path.resolve(options.template)

      Logger.info(`Validating: ${templatePath}`)
      Logger.newline()

      // Validate template
      const result = await validateTemplate({
        templatePath,
        strict: options.strict
      })

      // Display results
      if (result.valid) {
        Logger.success('✓ Template validation passed!')
        Logger.newline()

        Logger.info('Summary:')
        Logger.code(`  Entities: ${result.summary.entities}`)
        Logger.code(`  Contracts: ${result.summary.contracts}`)
        Logger.code(`  Events: ${result.summary.events}`)
        Logger.code(`  Metrics: ${result.summary.metrics}`)
        Logger.newline()

        if (result.warnings.length > 0) {
          Logger.warn('Warnings:')
          result.warnings.forEach(warning => {
            Logger.warn(`  ${warning}`)
          })
          Logger.newline()
        }

        Logger.info('Template is ready for code generation!')
      } else {
        Logger.error('✗ Template validation failed')
        Logger.newline()

        if (result.errors.length > 0) {
          Logger.error('Errors:')
          result.errors.forEach(error => {
            Logger.error(`  ${error}`)
          })
          Logger.newline()
        }

        if (result.warnings.length > 0) {
          Logger.warn('Warnings:')
          result.warnings.forEach(warning => {
            Logger.warn(`  ${warning}`)
          })
          Logger.newline()
        }

        Logger.info('Fix the errors above and try again.')
        process.exit(1)
      }

    } catch (error) {
      Logger.error(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      process.exit(1)
    }
  })
