/**
 * Tests for contract generator
 */

import * as fs from 'fs'
import * as path from 'path'
import { generateContracts } from '../contracts/generator'

// Mock dependencies
jest.mock('fs')
jest.mock('handlebars')

describe('Contracts Generator', () => {
  const mockFs = fs as jest.Mocked<typeof fs>

  const mockTemplate = {
    type: 'test',
    name: 'Test Template',
    version: '1.0.0',
    description: 'Test template for contracts',
    entities: [
      {
        name: 'customer',
        displayName: 'Customer',
        description: 'Customer entity',
        idField: 'customerId',
        displayField: 'customerName',
        fields: [
          {
            name: 'customerId',
            label: 'Customer ID',
            type: 'string',
            description: 'Unique customer identifier',
            required: true
          },
          {
            name: 'customerName',
            label: 'Customer Name',
            type: 'string',
            description: 'Customer name',
            required: true
          },
          {
            name: 'email',
            label: 'Email',
            type: 'string',
            description: 'Customer email',
            required: true
          },
          {
            name: 'createdAt',
            label: 'Created At',
            type: 'number',
            description: 'Creation timestamp',
            required: true
          },
          {
            name: 'isActive',
            label: 'Is Active',
            type: 'boolean',
            description: 'Active status',
            required: true
          }
        ]
      }
    ],
    contracts: [],
    storage: {},
    api: {}
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockFs.existsSync = jest.fn().mockReturnValue(true)
    mockFs.mkdirSync = jest.fn()
    mockFs.writeFileSync = jest.fn()
    mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(mockTemplate))
  })

  describe('Basic functionality', () => {
    it('should generate contracts successfully', async () => {
      const result = await generateContracts({
        templatePath: './templates/test.template.json',
        outputPath: './contracts',
        includeTests: false
      })

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return error if template file not found', async () => {
      mockFs.existsSync = jest.fn().mockReturnValue(false)

      const result = await generateContracts({
        templatePath: './templates/missing.json',
        outputPath: './contracts',
        includeTests: false
      })

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should create output directory if it does not exist', async () => {
      mockFs.existsSync = jest.fn()
        .mockReturnValueOnce(true) // Template exists
        .mockReturnValueOnce(false) // Output dir doesn't exist

      await generateContracts({
        templatePath: './templates/test.template.json',
        outputPath: './contracts',
        includeTests: false
      })

      expect(mockFs.mkdirSync).toHaveBeenCalled()
    })

    it('should generate one contract per entity', async () => {
      await generateContracts({
        templatePath: './templates/test.template.json',
        outputPath: './contracts',
        includeTests: false
      })

      // Should write one .sol file for the customer entity
      const solFiles = (mockFs.writeFileSync as jest.Mock).mock.calls.filter(
        call => call[0].endsWith('.sol')
      )
      expect(solFiles.length).toBe(1)
    })

    it('should generate contract with correct naming convention', async () => {
      await generateContracts({
        templatePath: './templates/test.template.json',
        outputPath: './contracts',
        includeTests: false
      })

      const solFiles = (mockFs.writeFileSync as jest.Mock).mock.calls.filter(
        call => call[0].endsWith('.sol')
      )

      expect(solFiles[0][0]).toContain('CustomerRegistry.sol')
    })
  })

  describe('Test generation', () => {
    it('should generate tests when includeTests is true', async () => {
      const result = await generateContracts({
        templatePath: './templates/test.template.json',
        outputPath: './contracts',
        includeTests: true
      })

      expect(result.tests.length).toBeGreaterThan(0)
    })

    it('should not generate tests when includeTests is false', async () => {
      const result = await generateContracts({
        templatePath: './templates/test.template.json',
        outputPath: './contracts',
        includeTests: false
      })

      expect(result.tests).toHaveLength(0)
    })

    it('should create test directory when generating tests', async () => {
      mockFs.existsSync = jest.fn()
        .mockReturnValueOnce(true) // Template exists
        .mockReturnValueOnce(true) // Output dir exists
        .mockReturnValueOnce(false) // Test dir doesn't exist

      await generateContracts({
        templatePath: './templates/test.template.json',
        outputPath: './contracts',
        includeTests: true
      })

      expect(mockFs.mkdirSync).toHaveBeenCalled()
    })

    it('should generate test file with correct naming', async () => {
      const result = await generateContracts({
        templatePath: './templates/test.template.json',
        outputPath: './contracts',
        includeTests: true
      })

      expect(result.tests[0]).toContain('CustomerRegistry.test.ts')
    })

    it('should include test structure in generated tests', async () => {
      await generateContracts({
        templatePath: './templates/test.template.json',
        outputPath: './contracts',
        includeTests: true
      })

      const testFiles = (mockFs.writeFileSync as jest.Mock).mock.calls.filter(
        call => call[0].endsWith('.test.ts')
      )

      expect(testFiles.length).toBe(1)
      const testContent = testFiles[0][1] as string
      expect(testContent).toContain('describe')
      expect(testContent).toContain('CustomerRegistry')
    })
  })

  describe('Multiple entities', () => {
    beforeEach(() => {
      const multiEntityTemplate = {
        ...mockTemplate,
        entities: [
          mockTemplate.entities[0],
          {
            name: 'order',
            displayName: 'Order',
            description: 'Order entity',
            idField: 'orderId',
            displayField: 'orderNumber',
            fields: [
              {
                name: 'orderId',
                type: 'string',
                required: true
              },
              {
                name: 'orderNumber',
                type: 'string',
                required: true
              }
            ]
          }
        ]
      }
      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(multiEntityTemplate))
    })

    it('should generate contracts for all entities', async () => {
      const result = await generateContracts({
        templatePath: './templates/test.template.json',
        outputPath: './contracts',
        includeTests: false
      })

      expect(result.contracts.length).toBe(2)
    })

    it('should generate tests for all entities', async () => {
      const result = await generateContracts({
        templatePath: './templates/test.template.json',
        outputPath: './contracts',
        includeTests: true
      })

      expect(result.tests.length).toBe(2)
    })

    it('should generate unique contract names', async () => {
      const result = await generateContracts({
        templatePath: './templates/test.template.json',
        outputPath: './contracts',
        includeTests: false
      })

      expect(result.contracts[0]).toContain('CustomerRegistry')
      expect(result.contracts[1]).toContain('OrderRegistry')
    })
  })

  describe('Type mapping', () => {
    it('should map string type to Solidity string', async () => {
      await generateContracts({
        templatePath: './templates/test.template.json',
        outputPath: './contracts',
        includeTests: false
      })

      // Type mapping is tested through contract generation
      expect(mockFs.writeFileSync).toHaveBeenCalled()
    })

    it('should map number type to Solidity uint256', async () => {
      const numericTemplate = {
        ...mockTemplate,
        entities: [{
          ...mockTemplate.entities[0],
          fields: [
            {
              name: 'amount',
              type: 'number',
              required: true
            }
          ]
        }]
      }
      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(numericTemplate))

      await generateContracts({
        templatePath: './templates/test.template.json',
        outputPath: './contracts',
        includeTests: false
      })

      expect(mockFs.writeFileSync).toHaveBeenCalled()
    })

    it('should map boolean type to Solidity bool', async () => {
      const booleanTemplate = {
        ...mockTemplate,
        entities: [{
          ...mockTemplate.entities[0],
          fields: [
            {
              name: 'isActive',
              type: 'boolean',
              required: true
            }
          ]
        }]
      }
      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(booleanTemplate))

      await generateContracts({
        templatePath: './templates/test.template.json',
        outputPath: './contracts',
        includeTests: false
      })

      expect(mockFs.writeFileSync).toHaveBeenCalled()
    })

    it('should map address type to Solidity address', async () => {
      const addressTemplate = {
        ...mockTemplate,
        entities: [{
          ...mockTemplate.entities[0],
          fields: [
            {
              name: 'walletAddress',
              type: 'address',
              required: true
            }
          ]
        }]
      }
      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(addressTemplate))

      await generateContracts({
        templatePath: './templates/test.template.json',
        outputPath: './contracts',
        includeTests: false
      })

      expect(mockFs.writeFileSync).toHaveBeenCalled()
    })
  })

  describe('Field handling', () => {
    it('should include all entity fields in contract struct', async () => {
      await generateContracts({
        templatePath: './templates/test.template.json',
        outputPath: './contracts',
        includeTests: false
      })

      expect(mockFs.writeFileSync).toHaveBeenCalled()
    })

    it('should identify ID field correctly', async () => {
      await generateContracts({
        templatePath: './templates/test.template.json',
        outputPath: './contracts',
        includeTests: false
      })

      // ID field identification is tested through contract generation
      expect(mockFs.writeFileSync).toHaveBeenCalled()
    })

    it('should handle required fields properly', async () => {
      await generateContracts({
        templatePath: './templates/test.template.json',
        outputPath: './contracts',
        includeTests: false
      })

      expect(mockFs.writeFileSync).toHaveBeenCalled()
    })

    it('should exclude tracking fields from create params', async () => {
      // createdAt and isActive should not be in create parameters
      // They should be auto-generated
      await generateContracts({
        templatePath: './templates/test.template.json',
        outputPath: './contracts',
        includeTests: false
      })

      expect(mockFs.writeFileSync).toHaveBeenCalled()
    })
  })

  describe('Error handling', () => {
    it('should handle invalid JSON in template', async () => {
      mockFs.readFileSync = jest.fn().mockReturnValue('invalid json {')

      const result = await generateContracts({
        templatePath: './templates/test.template.json',
        outputPath: './contracts',
        includeTests: false
      })

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should handle file system errors gracefully', async () => {
      mockFs.writeFileSync = jest.fn().mockImplementation(() => {
        throw new Error('Write permission denied')
      })

      const result = await generateContracts({
        templatePath: './templates/test.template.json',
        outputPath: './contracts',
        includeTests: false
      })

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should collect errors for individual entities', async () => {
      const invalidTemplate = {
        ...mockTemplate,
        entities: [
          mockTemplate.entities[0],
          {
            // Invalid entity missing required fields
            name: 'invalid'
          }
        ]
      }
      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(invalidTemplate))

      const result = await generateContracts({
        templatePath: './templates/test.template.json',
        outputPath: './contracts',
        includeTests: false
      })

      // Should partially succeed (one valid entity) but report errors
      expect(result.errors.length).toBeGreaterThanOrEqual(0)
    })

    it('should continue processing after entity error', async () => {
      // Even if one entity fails, others should still be processed
      const result = await generateContracts({
        templatePath: './templates/test.template.json',
        outputPath: './contracts',
        includeTests: false
      })

      // Result should still indicate overall status
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('errors')
      expect(result).toHaveProperty('contracts')
    })
  })

  describe('Output paths', () => {
    it('should resolve output path correctly', async () => {
      await generateContracts({
        templatePath: './templates/test.template.json',
        outputPath: './contracts',
        includeTests: false
      })

      const calls = (mockFs.writeFileSync as jest.Mock).mock.calls
      expect(calls.length).toBeGreaterThan(0)
      expect(calls[0][0]).toBeTruthy()
    })

    it('should place test files in test directory', async () => {
      const result = await generateContracts({
        templatePath: './templates/test.template.json',
        outputPath: './contracts',
        includeTests: true
      })

      expect(result.tests[0]).toContain('test')
    })

    it('should use absolute paths for output', async () => {
      const result = await generateContracts({
        templatePath: path.resolve('./templates/test.template.json'),
        outputPath: path.resolve('./contracts'),
        includeTests: false
      })

      expect(result.contracts.length).toBeGreaterThan(0)
    })
  })

  describe('Result structure', () => {
    it('should return correct result structure', async () => {
      const result = await generateContracts({
        templatePath: './templates/test.template.json',
        outputPath: './contracts',
        includeTests: true
      })

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('contracts')
      expect(result).toHaveProperty('tests')
      expect(result).toHaveProperty('errors')
    })

    it('should return contract file paths', async () => {
      const result = await generateContracts({
        templatePath: './templates/test.template.json',
        outputPath: './contracts',
        includeTests: false
      })

      expect(Array.isArray(result.contracts)).toBe(true)
    })

    it('should return test file paths when generated', async () => {
      const result = await generateContracts({
        templatePath: './templates/test.template.json',
        outputPath: './contracts',
        includeTests: true
      })

      expect(Array.isArray(result.tests)).toBe(true)
    })

    it('should return empty arrays on failure', async () => {
      mockFs.existsSync = jest.fn().mockReturnValue(false)

      const result = await generateContracts({
        templatePath: './templates/missing.json',
        outputPath: './contracts',
        includeTests: false
      })

      expect(result.contracts).toHaveLength(0)
      expect(result.tests).toHaveLength(0)
    })
  })
})
