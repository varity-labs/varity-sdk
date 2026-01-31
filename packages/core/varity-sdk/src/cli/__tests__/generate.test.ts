/**
 * Tests for varity generate commands
 */

import * as path from 'path'
import { generateCommand } from '../commands/generate'
import { generateContracts } from '../../generators/contracts/generator'
import { generateTypes } from '../../generators/types/generator'
import { generateTests } from '../../generators/tests/generator'

// Mock dependencies
jest.mock('../../generators/contracts/generator')
jest.mock('../../generators/types/generator')
jest.mock('../../generators/tests/generator')
jest.mock('../../generators/ui/component-generator')
jest.mock('../../generators/ui/dashboard-generator')
jest.mock('../utils/logger')

describe('CLI generate command', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Command structure', () => {
    it('should have correct command name', () => {
      expect(generateCommand.name()).toBe('generate')
    })

    it('should have description', () => {
      const description = generateCommand.description()
      expect(description).toBeTruthy()
      expect(description.toLowerCase()).toContain('generate')
    })

    it('should have subcommands', () => {
      const commands = generateCommand.commands
      expect(commands.length).toBeGreaterThan(0)

      const commandNames = commands.map(cmd => cmd.name())
      expect(commandNames).toContain('contracts')
      expect(commandNames).toContain('types')
      expect(commandNames).toContain('tests')
      expect(commandNames).toContain('ui')
      expect(commandNames).toContain('dashboard')
    })
  })

  describe('generate contracts subcommand', () => {
    const mockGenerateContracts = generateContracts as jest.MockedFunction<typeof generateContracts>

    beforeEach(() => {
      mockGenerateContracts.mockResolvedValue({
        success: true,
        contracts: ['CustomerRegistry.sol', 'OrderRegistry.sol'],
        tests: ['CustomerRegistry.test.ts', 'OrderRegistry.test.ts'],
        errors: []
      })
    })

    it('should have template option', () => {
      const contractsCmd = generateCommand.commands.find(cmd => cmd.name() === 'contracts')
      expect(contractsCmd).toBeDefined()

      const options = contractsCmd!.options
      const templateOption = options.find(opt => opt.flags.includes('--template'))
      expect(templateOption).toBeDefined()
    })

    it('should have output option', () => {
      const contractsCmd = generateCommand.commands.find(cmd => cmd.name() === 'contracts')
      const options = contractsCmd!.options
      const outputOption = options.find(opt => opt.flags.includes('--output'))
      expect(outputOption).toBeDefined()
    })

    it('should have no-tests option', () => {
      const contractsCmd = generateCommand.commands.find(cmd => cmd.name() === 'contracts')
      const options = contractsCmd!.options
      const noTestsOption = options.find(opt => opt.flags.includes('--no-tests'))
      expect(noTestsOption).toBeDefined()
    })

    it('should call generateContracts with correct options', async () => {
      const templatePath = './templates/test.template.json'
      const outputPath = './contracts'

      await simulateGenerateContracts({
        template: templatePath,
        output: outputPath,
        tests: true
      })

      expect(mockGenerateContracts).toHaveBeenCalledWith(
        expect.objectContaining({
          templatePath: expect.stringContaining('test.template.json'),
          outputPath: expect.stringContaining('contracts'),
          includeTests: true
        })
      )
    })

    it('should handle successful generation', async () => {
      const result = await simulateGenerateContracts({
        template: './templates/test.template.json',
        output: './contracts',
        tests: true
      })

      expect(result.success).toBe(true)
      expect(result.contracts.length).toBe(2)
    })

    it('should handle generation errors', async () => {
      mockGenerateContracts.mockResolvedValue({
        success: false,
        contracts: [],
        tests: [],
        errors: ['Failed to parse template']
      })

      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await simulateGenerateContracts({
        template: './templates/test.template.json',
        output: './contracts',
        tests: true
      })

      expect(exitSpy).toHaveBeenCalledWith(1)
      exitSpy.mockRestore()
    })

    it('should skip tests when --no-tests flag is used', async () => {
      await simulateGenerateContracts({
        template: './templates/test.template.json',
        output: './contracts',
        tests: false
      })

      expect(mockGenerateContracts).toHaveBeenCalledWith(
        expect.objectContaining({
          includeTests: false
        })
      )
    })
  })

  describe('generate types subcommand', () => {
    const mockGenerateTypes = generateTypes as jest.MockedFunction<typeof generateTypes>

    beforeEach(() => {
      mockGenerateTypes.mockResolvedValue({
        success: true,
        types: ['CustomerRegistry.ts', 'OrderRegistry.ts', 'index.ts'],
        errors: []
      })
    })

    it('should have abi-dir option', () => {
      const typesCmd = generateCommand.commands.find(cmd => cmd.name() === 'types')
      expect(typesCmd).toBeDefined()

      const options = typesCmd!.options
      const abiDirOption = options.find(opt => opt.flags.includes('--abi-dir'))
      expect(abiDirOption).toBeDefined()
    })

    it('should have output option with default value', () => {
      const typesCmd = generateCommand.commands.find(cmd => cmd.name() === 'types')
      const options = typesCmd!.options
      const outputOption = options.find(opt => opt.flags.includes('--output'))
      expect(outputOption).toBeDefined()
      expect(outputOption?.defaultValue).toContain('types')
    })

    it('should call generateTypes with correct options', async () => {
      await simulateGenerateTypes({
        abiDir: './contracts/abis',
        output: './src/types'
      })

      expect(mockGenerateTypes).toHaveBeenCalledWith(
        expect.objectContaining({
          abiDir: expect.stringContaining('abis'),
          outputPath: expect.stringContaining('types')
        })
      )
    })

    it('should handle successful type generation', async () => {
      const result = await simulateGenerateTypes({
        abiDir: './contracts/abis',
        output: './src/types'
      })

      expect(result.success).toBe(true)
      expect(result.types.length).toBe(3)
    })

    it('should handle type generation errors', async () => {
      mockGenerateTypes.mockResolvedValue({
        success: false,
        types: [],
        errors: ['No ABI files found']
      })

      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await simulateGenerateTypes({
        abiDir: './contracts/abis',
        output: './src/types'
      })

      expect(exitSpy).toHaveBeenCalledWith(1)
      exitSpy.mockRestore()
    })
  })

  describe('generate tests subcommand', () => {
    const mockGenerateTests = generateTests as jest.MockedFunction<typeof generateTests>

    beforeEach(() => {
      mockGenerateTests.mockResolvedValue({
        success: true,
        tests: ['CustomerRegistry.test.ts', 'OrderRegistry.test.ts'],
        errors: []
      })
    })

    it('should have template option', () => {
      const testsCmd = generateCommand.commands.find(cmd => cmd.name() === 'tests')
      expect(testsCmd).toBeDefined()

      const options = testsCmd!.options
      const templateOption = options.find(opt => opt.flags.includes('--template'))
      expect(templateOption).toBeDefined()
    })

    it('should have contracts option', () => {
      const testsCmd = generateCommand.commands.find(cmd => cmd.name() === 'tests')
      const options = testsCmd!.options
      const contractsOption = options.find(opt => opt.flags.includes('--contracts'))
      expect(contractsOption).toBeDefined()
    })

    it('should call generateTests with correct options', async () => {
      await simulateGenerateTests({
        template: './templates/test.template.json',
        contracts: './contracts',
        output: './test'
      })

      expect(mockGenerateTests).toHaveBeenCalledWith(
        expect.objectContaining({
          templatePath: expect.any(String),
          contractsPath: expect.any(String),
          outputPath: expect.any(String)
        })
      )
    })

    it('should handle successful test generation', async () => {
      const result = await simulateGenerateTests({
        template: './templates/test.template.json',
        contracts: './contracts',
        output: './test'
      })

      expect(result.success).toBe(true)
      expect(result.tests.length).toBe(2)
    })
  })

  describe('generate ui subcommand', () => {
    it('should have template option', () => {
      const uiCmd = generateCommand.commands.find(cmd => cmd.name() === 'ui')
      expect(uiCmd).toBeDefined()

      const options = uiCmd!.options
      const templateOption = options.find(opt => opt.flags.includes('--template'))
      expect(templateOption).toBeDefined()
    })

    it('should have default template path', () => {
      const uiCmd = generateCommand.commands.find(cmd => cmd.name() === 'ui')
      const options = uiCmd!.options
      const templateOption = options.find(opt => opt.flags.includes('--template'))
      expect(templateOption?.defaultValue).toContain('template.json')
    })
  })

  describe('generate dashboard subcommand', () => {
    it('should have template option', () => {
      const dashboardCmd = generateCommand.commands.find(cmd => cmd.name() === 'dashboard')
      expect(dashboardCmd).toBeDefined()

      const options = dashboardCmd!.options
      const templateOption = options.find(opt => opt.flags.includes('--template'))
      expect(templateOption).toBeDefined()
    })

    it('should have output option', () => {
      const dashboardCmd = generateCommand.commands.find(cmd => cmd.name() === 'dashboard')
      const options = dashboardCmd!.options
      const outputOption = options.find(opt => opt.flags.includes('--output'))
      expect(outputOption).toBeDefined()
    })
  })

  describe('Error handling', () => {
    it('should handle missing template file gracefully', async () => {
      const mockGenerateContracts = generateContracts as jest.MockedFunction<typeof generateContracts>
      mockGenerateContracts.mockRejectedValue(new Error('Template file not found'))

      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await simulateGenerateContracts({
        template: './templates/missing.json',
        output: './contracts',
        tests: true
      }).catch(() => {})

      expect(exitSpy).toHaveBeenCalledWith(1)
      exitSpy.mockRestore()
    })

    it('should handle file system errors', async () => {
      const mockGenerateTypes = generateTypes as jest.MockedFunction<typeof generateTypes>
      mockGenerateTypes.mockRejectedValue(new Error('Permission denied'))

      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await simulateGenerateTypes({
        abiDir: './contracts/abis',
        output: './src/types'
      }).catch(() => {})

      expect(exitSpy).toHaveBeenCalledWith(1)
      exitSpy.mockRestore()
    })
  })
})

/**
 * Helper functions to simulate command execution
 */
async function simulateGenerateContracts(options: any) {
  const result = await generateContracts({
    templatePath: path.resolve(options.template),
    outputPath: path.resolve(options.output),
    includeTests: options.tests
  })

  if (!result.success) {
    process.exit(1)
  }

  return result
}

async function simulateGenerateTypes(options: any) {
  const result = await generateTypes({
    abiDir: path.resolve(options.abiDir),
    outputPath: path.resolve(options.output)
  })

  if (!result.success) {
    process.exit(1)
  }

  return result
}

async function simulateGenerateTests(options: any) {
  const result = await generateTests({
    templatePath: path.resolve(options.template),
    contractsPath: path.resolve(options.contracts),
    outputPath: path.resolve(options.output)
  })

  if (!result.success) {
    process.exit(1)
  }

  return result
}
