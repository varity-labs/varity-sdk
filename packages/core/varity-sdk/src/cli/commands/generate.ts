/**
 * varity generate - Code generation commands
 *
 * Generate contracts, types, tests, and deployment scripts
 */

import { Command } from 'commander'
import * as path from 'path'
import { Logger } from '../utils/logger'
import { promptGenerateContracts } from '../utils/prompts'
import { generateContracts } from '../../generators/contracts/generator'
import { generateTypes } from '../../generators/types/generator'
import { generateTests } from '../../generators/tests/generator'
import { generateUIComponents } from '../../generators/ui/component-generator'
import { generateDashboards } from '../../generators/ui/dashboard-generator'

/**
 * varity generate contracts
 */
const generateContractsCommand = new Command('contracts')
  .description('Generate Solidity smart contracts from template configuration')
  .option('-t, --template <path>', 'Path to template JSON file')
  .option('-o, --output <path>', 'Output directory for contracts')
  .option('--no-tests', 'Skip generating test files')
  .action(async (options) => {
    try {
      Logger.header('🔨 Generate Smart Contracts')

      // Get options from prompts if not provided
      let templatePath = options.template
      let outputPath = options.output
      let includeTests = options.tests !== false

      if (!templatePath || !outputPath) {
        const answers = await promptGenerateContracts()
        templatePath = templatePath || answers.templatePath
        outputPath = outputPath || answers.outputPath
        if (options.tests === undefined) {
          includeTests = answers.includeTests
        }
      }

      // Resolve paths
      templatePath = path.resolve(templatePath)
      outputPath = path.resolve(outputPath)

      Logger.step(1, 3, `Loading template configuration from ${templatePath}...`)

      // Generate contracts
      Logger.step(2, 3, 'Generating smart contracts...')
      const result = await generateContracts({
        templatePath,
        outputPath,
        includeTests
      })

      Logger.step(3, 3, 'Finalizing...')

      // Display results
      Logger.newline()
      if (result.success) {
        Logger.success('Smart contracts generated successfully!')
        Logger.newline()

        if (result.contracts.length > 0) {
          Logger.info('Generated contracts:')
          result.contracts.forEach(contract => {
            Logger.code(`  ✓ ${contract}`)
          })
          Logger.newline()
        }

        if (result.tests.length > 0) {
          Logger.info('Generated tests:')
          result.tests.forEach(test => {
            Logger.code(`  ✓ ${test}`)
          })
          Logger.newline()
        }

        Logger.info('Next steps:')
        Logger.code('  1. Review generated contracts')
        Logger.code('  2. Compile with: npx hardhat compile')
        Logger.code('  3. Run tests with: npx hardhat test')
        Logger.code('  4. Deploy with: varity generate scripts')
        Logger.newline()
      } else {
        Logger.error('Failed to generate contracts')
        Logger.newline()
        result.errors.forEach(error => {
          Logger.error(error)
        })
        process.exit(1)
      }

    } catch (error) {
      Logger.error(`Failed to generate contracts: ${error instanceof Error ? error.message : 'Unknown error'}`)
      process.exit(1)
    }
  })

/**
 * varity generate types
 */
const generateTypesCommand = new Command('types')
  .description('Generate TypeScript types from contract ABIs')
  .option('-a, --abi-dir <path>', 'Directory containing contract ABIs', './contracts/abis')
  .option('-o, --output <path>', 'Output directory for TypeScript types', './src/types')
  .action(async (options) => {
    try {
      Logger.header('📝 Generate TypeScript Types')

      const abiDir = path.resolve(options.abiDir)
      const outputPath = path.resolve(options.output)

      Logger.step(1, 2, `Loading ABIs from ${abiDir}...`)

      // Generate types
      Logger.step(2, 2, 'Generating TypeScript types...')
      const result = await generateTypes({
        abiDir,
        outputPath
      })

      // Display results
      Logger.newline()
      if (result.success) {
        Logger.success('TypeScript types generated successfully!')
        Logger.newline()

        if (result.types.length > 0) {
          Logger.info('Generated type files:')
          result.types.forEach(typeFile => {
            Logger.code(`  ✓ ${typeFile}`)
          })
          Logger.newline()
        }

        Logger.info('Next steps:')
        Logger.code('  1. Import types in your TypeScript code')
        Logger.code('  2. Use with ethers.js: const contract: MyContract = ...')
        Logger.newline()
      } else {
        Logger.error('Failed to generate types')
        Logger.newline()
        result.errors.forEach(error => {
          Logger.error(error)
        })
        process.exit(1)
      }

    } catch (error) {
      Logger.error(`Failed to generate types: ${error instanceof Error ? error.message : 'Unknown error'}`)
      process.exit(1)
    }
  })

/**
 * varity generate tests
 */
const generateTestsCommand = new Command('tests')
  .description('Generate comprehensive test suites for contracts')
  .option('-t, --template <path>', 'Path to template JSON file')
  .option('-c, --contracts <path>', 'Directory containing contracts', './contracts')
  .option('-o, --output <path>', 'Output directory for tests', './test')
  .action(async (options) => {
    try {
      Logger.header('🧪 Generate Test Suites')

      const templatePath = path.resolve(options.template || './templates/template.json')
      const contractsPath = path.resolve(options.contracts)
      const outputPath = path.resolve(options.output)

      Logger.step(1, 3, `Loading template from ${templatePath}...`)

      // Generate tests
      Logger.step(2, 3, 'Generating test suites...')
      const result = await generateTests({
        templatePath,
        contractsPath,
        outputPath
      })

      Logger.step(3, 3, 'Finalizing...')

      // Display results
      Logger.newline()
      if (result.success) {
        Logger.success('Test suites generated successfully!')
        Logger.newline()

        if (result.tests.length > 0) {
          Logger.info('Generated test files:')
          result.tests.forEach(test => {
            Logger.code(`  ✓ ${test}`)
          })
          Logger.newline()
        }

        Logger.info('Next steps:')
        Logger.code('  1. Review generated tests')
        Logger.code('  2. Add custom test cases as needed')
        Logger.code('  3. Run with: npx hardhat test')
        Logger.newline()
      } else {
        Logger.error('Failed to generate tests')
        Logger.newline()
        result.errors.forEach(error => {
          Logger.error(error)
        })
        process.exit(1)
      }

    } catch (error) {
      Logger.error(`Failed to generate tests: ${error instanceof Error ? error.message : 'Unknown error'}`)
      process.exit(1)
    }
  })

/**
 * varity generate ui
 */
const generateUICommand = new Command('ui')
  .description('Generate React UI components from template entities')
  .option('-t, --template <path>', 'Path to template JSON file', './templates/template.json')
  .option('-o, --output <path>', 'Output directory for UI components', '.')
  .action(async (options) => {
    try {
      Logger.header('🎨 Generate UI Components')

      const templatePath = path.resolve(options.template)
      const outputPath = path.resolve(options.output)

      Logger.step(1, 2, `Loading template configuration from ${templatePath}...`)

      // Generate UI components
      Logger.step(2, 2, 'Generating React components...')
      const result = await generateUIComponents({
        templatePath,
        outputPath
      })

      // Display results
      Logger.newline()
      if (result.success) {
        Logger.success('UI components generated successfully!')
        Logger.newline()

        if (result.components.length > 0) {
          Logger.info('Generated components:')
          result.components.forEach(component => {
            Logger.code(`  ✓ ${component}`)
          })
          Logger.newline()
        }

        Logger.info('Next steps:')
        Logger.code('  1. Review generated components')
        Logger.code('  2. Import components in your app')
        Logger.code('  3. Customize styling as needed')
        Logger.newline()
      } else {
        Logger.error('Failed to generate UI components')
        Logger.newline()
        result.errors.forEach(error => {
          Logger.error(error)
        })
        process.exit(1)
      }

    } catch (error) {
      Logger.error(`Failed to generate UI: ${error instanceof Error ? error.message : 'Unknown error'}`)
      process.exit(1)
    }
  })

/**
 * varity generate dashboard
 */
const generateDashboardCommand = new Command('dashboard')
  .description('Generate dashboard layouts from template configuration')
  .option('-t, --template <path>', 'Path to template JSON file', './templates/template.json')
  .option('-o, --output <path>', 'Output directory for dashboards', '.')
  .action(async (options) => {
    try {
      Logger.header('📊 Generate Dashboard Layouts')

      const templatePath = path.resolve(options.template)
      const outputPath = path.resolve(options.output)

      Logger.step(1, 2, `Loading template configuration from ${templatePath}...`)

      // Generate dashboards
      Logger.step(2, 2, 'Generating dashboard layouts...')
      const result = await generateDashboards({
        templatePath,
        outputPath
      })

      // Display results
      Logger.newline()
      if (result.success) {
        Logger.success('Dashboard layouts generated successfully!')
        Logger.newline()

        if (result.dashboards.length > 0) {
          Logger.info('Generated dashboards:')
          result.dashboards.forEach(dashboard => {
            Logger.code(`  ✓ ${dashboard}`)
          })
          Logger.newline()
        }

        Logger.info('Next steps:')
        Logger.code('  1. Review generated dashboards')
        Logger.code('  2. Import dashboards in your app routing')
        Logger.code('  3. Customize widgets as needed')
        Logger.newline()
      } else {
        Logger.error('Failed to generate dashboards')
        Logger.newline()
        result.errors.forEach(error => {
          Logger.error(error)
        })
        process.exit(1)
      }

    } catch (error) {
      Logger.error(`Failed to generate dashboards: ${error instanceof Error ? error.message : 'Unknown error'}`)
      process.exit(1)
    }
  })

export const generateCommand = new Command('generate')
  .description('Generate contracts, types, tests, UI components, dashboards, and deployment scripts')
  .addCommand(generateContractsCommand)
  .addCommand(generateTypesCommand)
  .addCommand(generateTestsCommand)
  .addCommand(generateUICommand)
  .addCommand(generateDashboardCommand)
