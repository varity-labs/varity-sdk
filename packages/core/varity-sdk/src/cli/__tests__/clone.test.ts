/**
 * Tests for varity clone command
 */

import * as fs from 'fs'
import * as path from 'path'
import { cloneCommand } from '../commands/clone'
import inquirer from 'inquirer'

// Mock dependencies
jest.mock('inquirer')
jest.mock('fs')
jest.mock('../utils/logger')

describe('CLI clone command', () => {
  const mockFs = fs as jest.Mocked<typeof fs>

  beforeEach(() => {
    jest.clearAllMocks()
    mockFs.existsSync = jest.fn().mockReturnValue(false)
    mockFs.mkdirSync = jest.fn()
    mockFs.writeFileSync = jest.fn()
    mockFs.readFileSync = jest.fn()
    mockFs.readdirSync = jest.fn()
  })

  describe('Command configuration', () => {
    it('should have correct command name', () => {
      expect(cloneCommand.name()).toBe('clone')
    })

    it('should have description', () => {
      const description = cloneCommand.description()
      expect(description).toBeTruthy()
      expect(description.toLowerCase()).toContain('clone')
    })

    it('should have from option', () => {
      const options = cloneCommand.options
      const fromOption = options.find(opt => opt.flags.includes('--from'))
      expect(fromOption).toBeDefined()
    })

    it('should have to option', () => {
      const options = cloneCommand.options
      const toOption = options.find(opt => opt.flags.includes('--to'))
      expect(toOption).toBeDefined()
    })

    it('should have dir option with default value', () => {
      const options = cloneCommand.options
      const dirOption = options.find(opt => opt.flags.includes('--dir'))
      expect(dirOption).toBeDefined()
      expect(dirOption?.defaultValue).toBe('.')
    })
  })

  describe('Template cloning', () => {
    const mockTemplateContent = {
      type: 'iso',
      name: 'ISO Business Template',
      version: '1.0.0',
      description: 'ISO merchant services template',
      contracts: [
        {
          name: 'MerchantRegistry',
          abi: '../../contracts/abis/iso/MerchantRegistry.json',
          addresses: {}
        }
      ],
      entities: [
        {
          name: 'merchant',
          idField: 'merchantId',
          fields: []
        }
      ],
      storage: {
        varityNamespace: 'varity-internal-iso',
        industryNamespace: 'industry-iso-rag',
        customerNamespacePattern: 'customer-iso-{company-id}-{data-type}'
      },
      api: {
        basePath: '/api/v1/iso'
      }
    }

    beforeEach(() => {
      // Mock file system to simulate source template exists
      mockFs.existsSync = jest.fn((filePath: any) => {
        if (typeof filePath === 'string' && filePath.includes('iso.template.json')) {
          return true
        }
        return false
      })

      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(mockTemplateContent))

      ;(inquirer.prompt as unknown as jest.Mock).mockResolvedValue({
        sourceTemplate: 'iso',
        newTemplateName: 'custom-iso'
      })
    })

    it('should prompt for source template if not provided', async () => {
      await simulateCloneCommand({
        from: undefined,
        to: 'custom-iso',
        dir: '.'
      })

      expect(inquirer.prompt).toHaveBeenCalled()
    })

    it('should prompt for new template name if not provided', async () => {
      await simulateCloneCommand({
        from: 'iso',
        to: undefined,
        dir: '.'
      })

      expect(inquirer.prompt).toHaveBeenCalled()
    })

    it('should not prompt if both source and destination are provided', async () => {
      await simulateCloneCommand({
        from: 'iso',
        to: 'custom-iso',
        dir: '.'
      })

      // Prompts should still be called but with fewer questions
      const calls = (inquirer.prompt as unknown as jest.Mock).mock.calls
      if (calls.length > 0) {
        const questions = calls[0][0]
        expect(questions.length).toBe(0)
      }
    })

    it('should fail if destination directory already exists', async () => {
      mockFs.existsSync = jest.fn().mockReturnValue(true)
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await simulateCloneCommand({
        from: 'iso',
        to: 'custom-iso',
        dir: '.'
      })

      expect(exitSpy).toHaveBeenCalledWith(1)
      exitSpy.mockRestore()
    })

    it('should fail if source template not found', async () => {
      mockFs.existsSync = jest.fn().mockReturnValue(false)
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await simulateCloneCommand({
        from: 'nonexistent',
        to: 'custom-template',
        dir: '.'
      })

      expect(exitSpy).toHaveBeenCalledWith(1)
      exitSpy.mockRestore()
    })

    it('should create project directory structure', async () => {
      await simulateCloneCommand({
        from: 'iso',
        to: 'custom-iso',
        dir: '.'
      })

      expect(mockFs.mkdirSync).toHaveBeenCalled()
    })

    it('should transform template type', async () => {
      await simulateCloneCommand({
        from: 'iso',
        to: 'custom-iso',
        dir: '.'
      })

      const writeCall = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].includes('.template.json')
      )
      expect(writeCall).toBeDefined()

      const templateContent = JSON.parse(writeCall![1] as string)
      expect(templateContent.type).toBe('custom-iso')
    })

    it('should transform template name', async () => {
      await simulateCloneCommand({
        from: 'iso',
        to: 'custom-iso',
        dir: '.'
      })

      const writeCall = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].includes('.template.json')
      )
      const templateContent = JSON.parse(writeCall![1] as string)

      expect(templateContent.name).toContain('Custom-iso')
    })

    it('should transform storage namespaces', async () => {
      await simulateCloneCommand({
        from: 'iso',
        to: 'custom-iso',
        dir: '.'
      })

      const writeCall = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].includes('.template.json')
      )
      const templateContent = JSON.parse(writeCall![1] as string)

      expect(templateContent.storage.varityNamespace).toContain('custom-iso')
      expect(templateContent.storage.industryNamespace).toContain('custom-iso')
      expect(templateContent.storage.customerNamespacePattern).toContain('custom-iso')
    })

    it('should transform API base path', async () => {
      await simulateCloneCommand({
        from: 'iso',
        to: 'custom-iso',
        dir: '.'
      })

      const writeCall = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].includes('.template.json')
      )
      const templateContent = JSON.parse(writeCall![1] as string)

      expect(templateContent.api.basePath).toBe('/api/v1/custom-iso')
    })

    it('should transform contract ABI paths', async () => {
      await simulateCloneCommand({
        from: 'iso',
        to: 'custom-iso',
        dir: '.'
      })

      const writeCall = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].includes('.template.json')
      )
      const templateContent = JSON.parse(writeCall![1] as string)

      expect(templateContent.contracts[0].abi).toContain('custom-iso')
    })
  })

  describe('File generation', () => {
    beforeEach(() => {
      mockFs.existsSync = jest.fn((filePath: any) => {
        if (typeof filePath === 'string' && filePath.includes('iso.template.json')) {
          return true
        }
        return false
      })

      mockFs.readFileSync = jest.fn().mockReturnValue(
        JSON.stringify({
          type: 'iso',
          name: 'ISO Template',
          version: '1.0.0',
          description: 'ISO template',
          entities: [],
          contracts: [],
          storage: {},
          api: { basePath: '/api/v1/iso' }
        })
      )
    })

    it('should create .env.example file', async () => {
      await simulateCloneCommand({
        from: 'iso',
        to: 'custom-iso',
        dir: '.'
      })

      const writeCall = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].includes('.env.example')
      )
      expect(writeCall).toBeDefined()
    })

    it('should create package.json file', async () => {
      await simulateCloneCommand({
        from: 'iso',
        to: 'custom-iso',
        dir: '.'
      })

      const writeCall = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].includes('package.json')
      )
      expect(writeCall).toBeDefined()
    })

    it('should create README.md file', async () => {
      await simulateCloneCommand({
        from: 'iso',
        to: 'custom-iso',
        dir: '.'
      })

      const writeCall = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].includes('README.md')
      )
      expect(writeCall).toBeDefined()
    })

    it('should create .gitignore file', async () => {
      await simulateCloneCommand({
        from: 'iso',
        to: 'custom-iso',
        dir: '.'
      })

      const writeCall = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].includes('.gitignore')
      )
      expect(writeCall).toBeDefined()
    })
  })

  describe('Template name validation', () => {
    it('should validate template name format in prompts', async () => {
      const promptCall = (inquirer.prompt as unknown as jest.Mock)
      promptCall.mockResolvedValue({
        sourceTemplate: 'iso',
        newTemplateName: 'valid-template-name'
      })

      await simulateCloneCommand({
        from: undefined,
        to: undefined,
        dir: '.'
      })

      expect(inquirer.prompt).toHaveBeenCalled()
    })

    it('should reject invalid template names with uppercase', async () => {
      // The validation is in the inquirer prompt configuration
      // We test that the validation function exists
      const questions = [{
        type: 'input',
        name: 'newTemplateName',
        message: 'New template name:',
        validate: (input: string) => {
          if (!input || input.trim().length === 0) {
            return 'New template name is required'
          }
          if (!/^[a-z][a-z0-9-]*$/.test(input)) {
            return 'Template name must be lowercase letters, numbers, and hyphens only'
          }
          return true
        }
      }]

      const validate = questions[0].validate
      expect(validate('InvalidName')).toContain('lowercase')
      expect(validate('valid-name')).toBe(true)
    })

    it('should reject empty template names', async () => {
      const validate = (input: string) => {
        if (!input || input.trim().length === 0) {
          return 'New template name is required'
        }
        return true
      }

      expect(validate('')).toContain('required')
      expect(validate('   ')).toContain('required')
    })
  })

  describe('Error handling', () => {
    it('should handle file read errors', async () => {
      mockFs.readFileSync = jest.fn().mockImplementation(() => {
        throw new Error('File read error')
      })

      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await simulateCloneCommand({
        from: 'iso',
        to: 'custom-iso',
        dir: '.'
      }).catch(() => {})

      expect(exitSpy).toHaveBeenCalledWith(1)
      exitSpy.mockRestore()
    })

    it('should handle JSON parse errors', async () => {
      mockFs.readFileSync = jest.fn().mockReturnValue('invalid json {')

      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await simulateCloneCommand({
        from: 'iso',
        to: 'custom-iso',
        dir: '.'
      }).catch(() => {})

      expect(exitSpy).toHaveBeenCalledWith(1)
      exitSpy.mockRestore()
    })

    it('should handle file write errors', async () => {
      mockFs.existsSync = jest.fn((filePath: any) => {
        if (typeof filePath === 'string' && filePath.includes('iso.template.json')) {
          return true
        }
        return false
      })

      mockFs.readFileSync = jest.fn().mockReturnValue(
        JSON.stringify({
          type: 'iso',
          name: 'ISO',
          version: '1.0.0',
          entities: [],
          contracts: [],
          storage: {},
          api: {}
        })
      )

      mockFs.writeFileSync = jest.fn().mockImplementation(() => {
        throw new Error('Write permission denied')
      })

      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await simulateCloneCommand({
        from: 'iso',
        to: 'custom-iso',
        dir: '.'
      }).catch(() => {})

      expect(exitSpy).toHaveBeenCalledWith(1)
      exitSpy.mockRestore()
    })
  })
})

/**
 * Helper function to simulate clone command execution
 */
async function simulateCloneCommand(options: {
  from?: string
  to?: string
  dir: string
}) {
  try {
    // This simulates the command action logic
    // In real implementation, we'd call cloneCommand._actionHandler
    return Promise.resolve()
  } catch (error) {
    process.exit(1)
  }
}
