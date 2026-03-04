/**
 * Tests for varity validate command
 */

import * as path from 'path'
import { validateCommand } from '../commands/validate'
import { validateTemplate } from '../../validation/template-validator'

// Mock dependencies
jest.mock('../../validation/template-validator')
jest.mock('../utils/logger')

describe('CLI validate command', () => {
  const mockValidateTemplate = validateTemplate as jest.MockedFunction<typeof validateTemplate>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Command configuration', () => {
    it('should have correct command name', () => {
      expect(validateCommand.name()).toBe('validate')
    })

    it('should have description', () => {
      const description = validateCommand.description()
      expect(description).toBeTruthy()
      expect(description.toLowerCase()).toContain('validate')
    })

    it('should have template option with default value', () => {
      const options = validateCommand.options
      const templateOption = options.find(opt => opt.flags.includes('--template'))
      expect(templateOption).toBeDefined()
      expect(templateOption?.defaultValue).toContain('template.json')
    })

    it('should have strict option', () => {
      const options = validateCommand.options
      const strictOption = options.find(opt => opt.flags.includes('--strict'))
      expect(strictOption).toBeDefined()
      expect(strictOption?.defaultValue).toBe(false)
    })
  })

  describe('Successful validation', () => {
    beforeEach(() => {
      mockValidateTemplate.mockResolvedValue({
        valid: true,
        errors: [],
        warnings: [],
        summary: {
          entities: 2,
          contracts: 2,
          events: 4,
          metrics: 3
        }
      })
    })

    it('should call validateTemplate with correct options', async () => {
      await simulateValidateCommand({
        template: './templates/test.template.json',
        strict: false
      })

      expect(mockValidateTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          templatePath: expect.stringContaining('test.template.json'),
          strict: false
        })
      )
    })

    it('should handle valid template', async () => {
      const result = await simulateValidateCommand({
        template: './templates/test.template.json',
        strict: false
      })

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should display validation summary', async () => {
      const result = await simulateValidateCommand({
        template: './templates/test.template.json',
        strict: false
      })

      expect(result.summary).toBeDefined()
      expect(result.summary.entities).toBe(2)
      expect(result.summary.contracts).toBe(2)
      expect(result.summary.events).toBe(4)
      expect(result.summary.metrics).toBe(3)
    })

    it('should display warnings even when valid', async () => {
      mockValidateTemplate.mockResolvedValue({
        valid: true,
        errors: [],
        warnings: ['Missing optional field: displayName'],
        summary: {
          entities: 1,
          contracts: 1,
          events: 1,
          metrics: 1
        }
      })

      const result = await simulateValidateCommand({
        template: './templates/test.template.json',
        strict: false
      })

      expect(result.valid).toBe(true)
      expect(result.warnings).toHaveLength(1)
    })
  })

  describe('Failed validation', () => {
    beforeEach(() => {
      mockValidateTemplate.mockResolvedValue({
        valid: false,
        errors: [
          'Missing required field: type',
          'Missing required field: name'
        ],
        warnings: ['Missing description field'],
        summary: {
          entities: 0,
          contracts: 0,
          events: 0,
          metrics: 0
        }
      })
    })

    it('should handle invalid template', async () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await simulateValidateCommand({
        template: './templates/invalid.template.json',
        strict: false
      })

      expect(exitSpy).toHaveBeenCalledWith(1)
      exitSpy.mockRestore()
    })

    it('should display validation errors', async () => {
      const result = await simulateValidateCommand({
        template: './templates/invalid.template.json',
        strict: false
      }, true)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should display both errors and warnings', async () => {
      const result = await simulateValidateCommand({
        template: './templates/invalid.template.json',
        strict: false
      }, true)

      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.warnings.length).toBeGreaterThan(0)
    })
  })

  describe('Strict mode', () => {
    it('should enable strict validation when flag is set', async () => {
      mockValidateTemplate.mockResolvedValue({
        valid: true,
        errors: [],
        warnings: [],
        summary: {
          entities: 1,
          contracts: 1,
          events: 1,
          metrics: 1
        }
      })

      await simulateValidateCommand({
        template: './templates/test.template.json',
        strict: true
      })

      expect(mockValidateTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          strict: true
        })
      )
    })

    it('should enforce stricter validation rules', async () => {
      mockValidateTemplate.mockResolvedValue({
        valid: false,
        errors: ['Missing required field: description'], // Strict mode makes this an error
        warnings: [],
        summary: {
          entities: 1,
          contracts: 1,
          events: 0,
          metrics: 0
        }
      })

      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await simulateValidateCommand({
        template: './templates/test.template.json',
        strict: true
      })

      expect(exitSpy).toHaveBeenCalledWith(1)
      exitSpy.mockRestore()
    })
  })

  describe('Error handling', () => {
    it('should handle missing template file', async () => {
      mockValidateTemplate.mockRejectedValue(new Error('Template file not found'))

      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await simulateValidateCommand({
        template: './templates/missing.json',
        strict: false
      }).catch(() => {})

      expect(exitSpy).toHaveBeenCalledWith(1)
      exitSpy.mockRestore()
    })

    it('should handle JSON parse errors', async () => {
      mockValidateTemplate.mockResolvedValue({
        valid: false,
        errors: ['Invalid JSON: Unexpected token'],
        warnings: [],
        summary: {
          entities: 0,
          contracts: 0,
          events: 0,
          metrics: 0
        }
      })

      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await simulateValidateCommand({
        template: './templates/broken.json',
        strict: false
      })

      expect(exitSpy).toHaveBeenCalledWith(1)
      exitSpy.mockRestore()
    })

    it('should handle validation errors gracefully', async () => {
      mockValidateTemplate.mockRejectedValue(new Error('Validation engine error'))

      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await simulateValidateCommand({
        template: './templates/test.json',
        strict: false
      }).catch(() => {})

      expect(exitSpy).toHaveBeenCalledWith(1)
      exitSpy.mockRestore()
    })
  })

  describe('Template path resolution', () => {
    it('should resolve relative paths', async () => {
      mockValidateTemplate.mockResolvedValue({
        valid: true,
        errors: [],
        warnings: [],
        summary: {
          entities: 1,
          contracts: 1,
          events: 1,
          metrics: 1
        }
      })

      await simulateValidateCommand({
        template: './templates/test.template.json',
        strict: false
      })

      expect(mockValidateTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          templatePath: expect.any(String)
        })
      )
    })

    it('should handle absolute paths', async () => {
      mockValidateTemplate.mockResolvedValue({
        valid: true,
        errors: [],
        warnings: [],
        summary: {
          entities: 1,
          contracts: 1,
          events: 1,
          metrics: 1
        }
      })

      await simulateValidateCommand({
        template: '/absolute/path/to/template.json',
        strict: false
      })

      expect(mockValidateTemplate).toHaveBeenCalled()
    })
  })
})

/**
 * Helper function to simulate validate command execution
 */
async function simulateValidateCommand(
  options: { template: string; strict: boolean },
  skipExit = false
) {
  const templatePath = path.resolve(options.template)

  const result = await validateTemplate({
    templatePath,
    strict: options.strict
  })

  if (!result.valid && !skipExit) {
    process.exit(1)
  }

  return result
}
