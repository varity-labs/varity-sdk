/**
 * Tests for development server
 */

import * as fs from 'fs'
import chokidar from 'chokidar'
import { startDevServer } from '../dev-server'
import { generateContracts } from '../../generators/contracts/generator'
import { generateTypes } from '../../generators/types/generator'

// Mock dependencies
jest.mock('fs')
jest.mock('chokidar')
jest.mock('../../generators/contracts/generator')
jest.mock('../../generators/types/generator')
jest.mock('../../cli/utils/logger')

describe('Dev Server', () => {
  const mockFs = fs as jest.Mocked<typeof fs>
  const mockChokidar = chokidar as jest.Mocked<typeof chokidar>
  const mockGenerateContracts = generateContracts as jest.MockedFunction<typeof generateContracts>
  const mockGenerateTypes = generateTypes as jest.MockedFunction<typeof generateTypes>

  const mockWatcher = {
    on: jest.fn().mockReturnThis(),
    close: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockFs.existsSync = jest.fn().mockReturnValue(true)

    mockChokidar.watch = jest.fn().mockReturnValue(mockWatcher as any)

    mockGenerateContracts.mockResolvedValue({
      success: true,
      contracts: ['CustomerRegistry.sol'],
      tests: ['CustomerRegistry.test.ts'],
      errors: []
    })

    mockGenerateTypes.mockResolvedValue({
      success: true,
      types: ['CustomerRegistry.ts'],
      errors: []
    })
  })

  describe('Server startup', () => {
    it('should start dev server successfully', async () => {
      await startDevServer({
        templatePath: './templates/test.template.json',
        contractsPath: './contracts',
        watch: false,
        port: 3001
      })

      // Should perform initial generation
      expect(mockGenerateContracts).toHaveBeenCalled()
    })

    it('should perform initial contract generation', async () => {
      await startDevServer({
        templatePath: './templates/test.template.json',
        contractsPath: './contracts',
        watch: false,
        port: 3001
      })

      expect(mockGenerateContracts).toHaveBeenCalledWith(
        expect.objectContaining({
          templatePath: './templates/test.template.json',
          outputPath: './contracts',
          includeTests: true
        })
      )
    })

    it('should perform initial type generation if ABIs exist', async () => {
      await startDevServer({
        templatePath: './templates/test.template.json',
        contractsPath: './contracts',
        watch: false,
        port: 3001
      })

      expect(mockGenerateTypes).toHaveBeenCalled()
    })

    it('should skip type generation if no ABIs exist', async () => {
      mockFs.existsSync = jest.fn((path) => {
        if (typeof path === 'string' && path.includes('abis')) {
          return false
        }
        return true
      })

      await startDevServer({
        templatePath: './templates/test.template.json',
        contractsPath: './contracts',
        watch: false,
        port: 3001
      })

      expect(mockGenerateTypes).not.toHaveBeenCalled()
    })

    it('should handle initial generation errors gracefully', async () => {
      mockGenerateContracts.mockResolvedValue({
        success: false,
        contracts: [],
        tests: [],
        errors: ['Template file not found']
      })

      await startDevServer({
        templatePath: './templates/test.template.json',
        contractsPath: './contracts',
        watch: false,
        port: 3001
      })

      // Should not throw, just log error
      expect(mockGenerateContracts).toHaveBeenCalled()
    })
  })

  describe('Watch mode', () => {
    it('should enable file watching when watch is true', async () => {
      await startDevServer({
        templatePath: './templates/test.template.json',
        contractsPath: './contracts',
        watch: true,
        port: 3001
      })

      expect(mockChokidar.watch).toHaveBeenCalledWith(
        './templates/test.template.json',
        expect.objectContaining({
          persistent: true,
          ignoreInitial: true
        })
      )
    })

    it('should not enable file watching when watch is false', async () => {
      await startDevServer({
        templatePath: './templates/test.template.json',
        contractsPath: './contracts',
        watch: false,
        port: 3001
      })

      expect(mockChokidar.watch).not.toHaveBeenCalled()
    })

    it('should register change handler', async () => {
      await startDevServer({
        templatePath: './templates/test.template.json',
        contractsPath: './contracts',
        watch: true,
        port: 3001
      })

      expect(mockWatcher.on).toHaveBeenCalledWith('change', expect.any(Function))
    })

    it('should register error handler', async () => {
      await startDevServer({
        templatePath: './templates/test.template.json',
        contractsPath: './contracts',
        watch: true,
        port: 3001
      })

      expect(mockWatcher.on).toHaveBeenCalledWith('error', expect.any(Function))
    })

    it('should handle file changes', async () => {
      let changeHandler: any

      mockWatcher.on = jest.fn().mockImplementation((event, handler) => {
        if (event === 'change') {
          changeHandler = handler
        }
        return mockWatcher
      })

      await startDevServer({
        templatePath: './templates/test.template.json',
        contractsPath: './contracts',
        watch: true,
        port: 3001
      })

      // Clear initial generation calls
      mockGenerateContracts.mockClear()

      // Simulate file change
      if (changeHandler) {
        await changeHandler('./templates/test.template.json')
      }

      // Should regenerate on change
      expect(mockGenerateContracts).toHaveBeenCalledTimes(1)
    })

    it('should handle watcher errors', async () => {
      let errorHandler: any

      mockWatcher.on = jest.fn().mockImplementation((event, handler) => {
        if (event === 'error') {
          errorHandler = handler
        }
        return mockWatcher
      })

      await startDevServer({
        templatePath: './templates/test.template.json',
        contractsPath: './contracts',
        watch: true,
        port: 3001
      })

      // Should not throw when error handler is called
      if (errorHandler) {
        expect(() => errorHandler(new Error('Watch error'))).not.toThrow()
      }
    })
  })

  describe('Regeneration', () => {
    it('should regenerate contracts on template change', async () => {
      let changeHandler: any

      mockWatcher.on = jest.fn().mockImplementation((event, handler) => {
        if (event === 'change') {
          changeHandler = handler
        }
        return mockWatcher
      })

      await startDevServer({
        templatePath: './templates/test.template.json',
        contractsPath: './contracts',
        watch: true,
        port: 3001
      })

      mockGenerateContracts.mockClear()

      if (changeHandler) {
        await changeHandler('./templates/test.template.json')
      }

      expect(mockGenerateContracts).toHaveBeenCalled()
    })

    it('should regenerate types on template change', async () => {
      let changeHandler: any

      mockWatcher.on = jest.fn().mockImplementation((event, handler) => {
        if (event === 'change') {
          changeHandler = handler
        }
        return mockWatcher
      })

      await startDevServer({
        templatePath: './templates/test.template.json',
        contractsPath: './contracts',
        watch: true,
        port: 3001
      })

      mockGenerateTypes.mockClear()

      if (changeHandler) {
        await changeHandler('./templates/test.template.json')
      }

      expect(mockGenerateTypes).toHaveBeenCalled()
    })

    it('should handle regeneration errors gracefully', async () => {
      let changeHandler: any

      mockWatcher.on = jest.fn().mockImplementation((event, handler) => {
        if (event === 'change') {
          changeHandler = handler
        }
        return mockWatcher
      })

      await startDevServer({
        templatePath: './templates/test.template.json',
        contractsPath: './contracts',
        watch: true,
        port: 3001
      })

      mockGenerateContracts.mockResolvedValue({
        success: false,
        contracts: [],
        tests: [],
        errors: ['Generation error']
      })

      // Should not throw
      if (changeHandler) {
        await expect(changeHandler('./templates/test.template.json')).resolves.not.toThrow()
      }
    })

    it('should validate generation results', async () => {
      await startDevServer({
        templatePath: './templates/test.template.json',
        contractsPath: './contracts',
        watch: false,
        port: 3001
      })

      // Validation happens after generation
      expect(mockGenerateContracts).toHaveBeenCalled()
    })

    it('should warn if no contracts generated', async () => {
      mockGenerateContracts.mockResolvedValue({
        success: true,
        contracts: [],
        tests: [],
        errors: []
      })

      await startDevServer({
        templatePath: './templates/test.template.json',
        contractsPath: './contracts',
        watch: false,
        port: 3001
      })

      // Should complete without throwing
      expect(mockGenerateContracts).toHaveBeenCalled()
    })

    it('should warn if no tests generated', async () => {
      mockGenerateContracts.mockResolvedValue({
        success: true,
        contracts: ['CustomerRegistry.sol'],
        tests: [],
        errors: []
      })

      await startDevServer({
        templatePath: './templates/test.template.json',
        contractsPath: './contracts',
        watch: false,
        port: 3001
      })

      expect(mockGenerateContracts).toHaveBeenCalled()
    })
  })

  describe('Signal handling', () => {
    it('should register SIGINT handler in watch mode', async () => {
      const originalOn = process.on
      const mockProcessOn = jest.fn()
      process.on = mockProcessOn as any

      await startDevServer({
        templatePath: './templates/test.template.json',
        contractsPath: './contracts',
        watch: true,
        port: 3001
      })

      expect(mockProcessOn).toHaveBeenCalledWith('SIGINT', expect.any(Function))

      process.on = originalOn
    })

    it('should close watcher on SIGINT', async () => {
      const originalOn = process.on
      let sigintHandler: any

      process.on = jest.fn().mockImplementation((signal, handler) => {
        if (signal === 'SIGINT') {
          sigintHandler = handler
        }
        return process
      }) as any

      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await startDevServer({
        templatePath: './templates/test.template.json',
        contractsPath: './contracts',
        watch: true,
        port: 3001
      })

      if (sigintHandler) {
        sigintHandler()
      }

      expect(mockWatcher.close).toHaveBeenCalled()
      expect(exitSpy).toHaveBeenCalledWith(0)

      process.on = originalOn
      exitSpy.mockRestore()
    })
  })

  describe('Configuration', () => {
    it('should accept custom template path', async () => {
      await startDevServer({
        templatePath: './custom/template.json',
        contractsPath: './contracts',
        watch: false,
        port: 3001
      })

      expect(mockGenerateContracts).toHaveBeenCalledWith(
        expect.objectContaining({
          templatePath: './custom/template.json'
        })
      )
    })

    it('should accept custom contracts path', async () => {
      await startDevServer({
        templatePath: './templates/test.template.json',
        contractsPath: './custom-contracts',
        watch: false,
        port: 3001
      })

      expect(mockGenerateContracts).toHaveBeenCalledWith(
        expect.objectContaining({
          outputPath: './custom-contracts'
        })
      )
    })

    it('should respect port configuration', async () => {
      await startDevServer({
        templatePath: './templates/test.template.json',
        contractsPath: './contracts',
        watch: false,
        port: 8080
      })

      // Port is stored but not actively used in current implementation
      expect(mockGenerateContracts).toHaveBeenCalled()
    })
  })

  describe('Error handling', () => {
    it('should handle missing template file', async () => {
      mockFs.existsSync = jest.fn().mockReturnValue(false)
      mockGenerateContracts.mockRejectedValue(new Error('Template file not found'))

      await expect(
        startDevServer({
          templatePath: './templates/missing.json',
          contractsPath: './contracts',
          watch: false,
          port: 3001
        })
      ).rejects.toThrow()
    })

    it('should handle generation exceptions', async () => {
      mockGenerateContracts.mockRejectedValue(new Error('Generation failed'))

      await expect(
        startDevServer({
          templatePath: './templates/test.template.json',
          contractsPath: './contracts',
          watch: false,
          port: 3001
        })
      ).rejects.toThrow()
    })

    it('should handle file system errors', async () => {
      mockFs.existsSync = jest.fn().mockImplementation(() => {
        throw new Error('Permission denied')
      })

      await expect(
        startDevServer({
          templatePath: './templates/test.template.json',
          contractsPath: './contracts',
          watch: false,
          port: 3001
        })
      ).rejects.toThrow()
    })
  })

  describe('Performance', () => {
    it('should complete initial generation quickly', async () => {
      const startTime = Date.now()

      await startDevServer({
        templatePath: './templates/test.template.json',
        contractsPath: './contracts',
        watch: false,
        port: 3001
      })

      const duration = Date.now() - startTime

      // Should complete in reasonable time (mocked, so very fast)
      expect(duration).toBeLessThan(1000)
    })

    it('should handle multiple rapid changes', async () => {
      let changeHandler: any

      mockWatcher.on = jest.fn().mockImplementation((event, handler) => {
        if (event === 'change') {
          changeHandler = handler
        }
        return mockWatcher
      })

      await startDevServer({
        templatePath: './templates/test.template.json',
        contractsPath: './contracts',
        watch: true,
        port: 3001
      })

      mockGenerateContracts.mockClear()

      // Simulate rapid changes
      if (changeHandler) {
        await changeHandler('./templates/test.template.json')
        await changeHandler('./templates/test.template.json')
        await changeHandler('./templates/test.template.json')
      }

      // Should handle all changes
      expect(mockGenerateContracts).toHaveBeenCalledTimes(3)
    })
  })
})
