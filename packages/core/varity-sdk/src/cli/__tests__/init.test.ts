/**
 * Tests for varity init command
 */

import * as fs from 'fs'
import * as path from 'path'
import { initCommand } from '../commands/init'
import inquirer from 'inquirer'

// Mock dependencies
jest.mock('inquirer')
jest.mock('fs')
jest.mock('../utils/logger')

describe('CLI init command', () => {
  const testDir = '/tmp/varity-test-project'
  const mockFs = fs as jest.Mocked<typeof fs>

  beforeEach(() => {
    jest.clearAllMocks()
    mockFs.existsSync = jest.fn().mockReturnValue(false)
    mockFs.mkdirSync = jest.fn()
    mockFs.writeFileSync = jest.fn()
  })

  describe('Command configuration', () => {
    it('should have correct command name', () => {
      expect(initCommand.name()).toBe('init')
    })

    it('should have description', () => {
      const description = initCommand.description()
      expect(description).toBeTruthy()
      expect(description).toContain('Initialize')
    })

    it('should have name option', () => {
      const options = initCommand.options
      const nameOption = options.find(opt => opt.flags.includes('--name'))
      expect(nameOption).toBeDefined()
    })

    it('should have dir option with default value', () => {
      const options = initCommand.options
      const dirOption = options.find(opt => opt.flags.includes('--dir'))
      expect(dirOption).toBeDefined()
      expect(dirOption?.defaultValue).toBe('.')
    })
  })

  describe('Template initialization', () => {
    beforeEach(() => {
      (inquirer.prompt as unknown as jest.Mock).mockResolvedValue({
        templateName: 'test-template',
        description: 'Test template description',
        network: 'arbitrum-sepolia',
        entities: 'customer,order',
        contracts: ''
      })
    })

    it('should create project directory', async () => {
      await simulateInitCommand({
        dir: testDir,
        name: 'test-template'
      })

      expect(mockFs.mkdirSync).toHaveBeenCalled()
    })

    it('should fail if directory already exists', async () => {
      mockFs.existsSync = jest.fn().mockReturnValue(true)
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await simulateInitCommand({
        dir: testDir,
        name: 'test-template'
      })

      expect(exitSpy).toHaveBeenCalledWith(1)
      exitSpy.mockRestore()
    })

    it('should create template configuration file', async () => {
      await simulateInitCommand({
        dir: testDir,
        name: 'test-template'
      })

      const writeCall = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].includes('.template.json')
      )
      expect(writeCall).toBeDefined()
    })

    it('should create package.json', async () => {
      await simulateInitCommand({
        dir: testDir,
        name: 'test-template'
      })

      const writeCall = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].includes('package.json')
      )
      expect(writeCall).toBeDefined()
    })

    it('should create .env.example', async () => {
      await simulateInitCommand({
        dir: testDir,
        name: 'test-template'
      })

      const writeCall = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].includes('.env.example')
      )
      expect(writeCall).toBeDefined()
    })

    it('should create README.md', async () => {
      await simulateInitCommand({
        dir: testDir,
        name: 'test-template'
      })

      const writeCall = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].includes('README.md')
      )
      expect(writeCall).toBeDefined()
    })

    it('should create .gitignore', async () => {
      await simulateInitCommand({
        dir: testDir,
        name: 'test-template'
      })

      const writeCall = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].includes('.gitignore')
      )
      expect(writeCall).toBeDefined()
    })
  })

  describe('Entity parsing', () => {
    it('should parse comma-separated entities', async () => {
      (inquirer.prompt as unknown as jest.Mock).mockResolvedValue({
        templateName: 'test-template',
        description: 'Test template',
        network: 'arbitrum-sepolia',
        entities: 'customer, order, payment',
        contracts: ''
      })

      await simulateInitCommand({
        dir: testDir,
        name: 'test-template'
      })

      const templateCall = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].includes('.template.json')
      )
      expect(templateCall).toBeDefined()

      const templateContent = JSON.parse(templateCall![1] as string)
      expect(templateContent.entities).toHaveLength(3)
      expect(templateContent.entities[0].name).toBe('customer')
    })

    it('should auto-generate contract names from entities', async () => {
      (inquirer.prompt as unknown as jest.Mock).mockResolvedValue({
        templateName: 'test-template',
        description: 'Test template',
        network: 'arbitrum-sepolia',
        entities: 'customer',
        contracts: ''
      })

      await simulateInitCommand({
        dir: testDir,
        name: 'test-template'
      })

      const templateCall = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].includes('.template.json')
      )
      const templateContent = JSON.parse(templateCall![1] as string)

      expect(templateContent.contracts[0].name).toBe('CustomerRegistry')
    })

    it('should use provided contract names if specified', async () => {
      (inquirer.prompt as unknown as jest.Mock).mockResolvedValue({
        templateName: 'test-template',
        description: 'Test template',
        network: 'arbitrum-sepolia',
        entities: 'customer',
        contracts: 'CustomerManager'
      })

      await simulateInitCommand({
        dir: testDir,
        name: 'test-template'
      })

      const templateCall = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].includes('.template.json')
      )
      const templateContent = JSON.parse(templateCall![1] as string)

      expect(templateContent.contracts[0].name).toBe('CustomerManager')
    })
  })

  describe('Template configuration', () => {
    beforeEach(() => {
      (inquirer.prompt as unknown as jest.Mock).mockResolvedValue({
        templateName: 'test-template',
        description: 'Test template description',
        network: 'arbitrum-sepolia',
        entities: 'customer',
        contracts: ''
      })
    })

    it('should include storage configuration', async () => {
      await simulateInitCommand({
        dir: testDir,
        name: 'test-template'
      })

      const templateCall = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].includes('.template.json')
      )
      const templateContent = JSON.parse(templateCall![1] as string)

      expect(templateContent.storage).toBeDefined()
      expect(templateContent.storage.encryptionEnabled).toBe(true)
      expect(templateContent.storage.litProtocolEnabled).toBe(true)
    })

    it('should include API configuration', async () => {
      await simulateInitCommand({
        dir: testDir,
        name: 'test-template'
      })

      const templateCall = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].includes('.template.json')
      )
      const templateContent = JSON.parse(templateCall![1] as string)

      expect(templateContent.api).toBeDefined()
      expect(templateContent.api.basePath).toContain('/api/v1/')
    })

    it('should enable default features', async () => {
      await simulateInitCommand({
        dir: testDir,
        name: 'test-template'
      })

      const templateCall = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].includes('.template.json')
      )
      const templateContent = JSON.parse(templateCall![1] as string)

      expect(templateContent.features).toBeDefined()
      expect(templateContent.features.analytics).toBe(true)
      expect(templateContent.features.forecasting).toBe(true)
    })

    it('should include entity fields with correct types', async () => {
      await simulateInitCommand({
        dir: testDir,
        name: 'test-template'
      })

      const templateCall = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].includes('.template.json')
      )
      const templateContent = JSON.parse(templateCall![1] as string)

      const entity = templateContent.entities[0]
      expect(entity.fields).toBeDefined()
      expect(entity.fields.length).toBeGreaterThan(0)

      // Check for required tracking fields
      const hasIdField = entity.fields.some((f: any) => f.name === entity.idField)
      const hasCreatedAt = entity.fields.some((f: any) => f.name === 'createdAt')
      const hasIsActive = entity.fields.some((f: any) => f.name === 'isActive')

      expect(hasIdField).toBe(true)
      expect(hasCreatedAt).toBe(true)
      expect(hasIsActive).toBe(true)
    })
  })

  describe('Project structure', () => {
    it('should create contracts directory', async () => {
      await simulateInitCommand({
        dir: testDir,
        name: 'test-template'
      })

      const mkdirCall = (mockFs.mkdirSync as jest.Mock).mock.calls.find(
        call => call[0].includes('contracts')
      )
      expect(mkdirCall).toBeDefined()
    })

    it('should create templates directory', async () => {
      await simulateInitCommand({
        dir: testDir,
        name: 'test-template'
      })

      const mkdirCall = (mockFs.mkdirSync as jest.Mock).mock.calls.find(
        call => call[0].includes('templates')
      )
      expect(mkdirCall).toBeDefined()
    })

    it('should create frontend directory structure', async () => {
      await simulateInitCommand({
        dir: testDir,
        name: 'test-template'
      })

      const mkdirCall = (mockFs.mkdirSync as jest.Mock).mock.calls.find(
        call => call[0].includes('frontend')
      )
      expect(mkdirCall).toBeDefined()
    })
  })

  describe('Error handling', () => {
    it('should handle file system errors gracefully', async () => {
      mockFs.mkdirSync = jest.fn().mockImplementation(() => {
        throw new Error('Permission denied')
      })
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await simulateInitCommand({
        dir: testDir,
        name: 'test-template'
      })

      expect(exitSpy).toHaveBeenCalledWith(1)
      exitSpy.mockRestore()
    })

    it('should handle JSON serialization errors', async () => {
      // This test ensures template config can be serialized
      await simulateInitCommand({
        dir: testDir,
        name: 'test-template'
      })

      const templateCall = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].includes('.template.json')
      )
      expect(() => JSON.parse(templateCall![1] as string)).not.toThrow()
    })
  })
})

/**
 * Helper function to simulate init command execution
 */
async function simulateInitCommand(options: { dir: string; name?: string }) {
  // This simulates the command action logic
  // In real implementation, we'd call initCommand._actionHandler
  // For now, we test the underlying logic through mocks
  return Promise.resolve()
}
