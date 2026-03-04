/**
 * Tests for TypeScript types generator
 */

import * as fs from 'fs'
import * as path from 'path'
import { generateTypes } from '../types/generator'

// Mock dependencies
jest.mock('fs')

describe('Types Generator', () => {
  const mockFs = fs as jest.Mocked<typeof fs>

  const mockABI = [
    {
      type: 'function',
      name: 'createCustomer',
      inputs: [
        { name: 'customerId', type: 'string' },
        { name: 'customerName', type: 'string' }
      ],
      outputs: []
    },
    {
      type: 'function',
      name: 'getCustomer',
      inputs: [
        { name: 'customerId', type: 'string' }
      ],
      outputs: [
        { name: '', type: 'tuple' }
      ]
    },
    {
      type: 'event',
      name: 'CustomerCreated',
      inputs: [
        { name: 'customerId', type: 'string', indexed: true },
        { name: 'customerName', type: 'string', indexed: false }
      ]
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockFs.existsSync = jest.fn().mockReturnValue(true)
    mockFs.mkdirSync = jest.fn()
    mockFs.writeFileSync = jest.fn()
    mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(mockABI))
    mockFs.readdirSync = jest.fn().mockReturnValue([
      { name: 'CustomerRegistry.json', isFile: () => true, isDirectory: () => false }
    ] as any)
  })

  describe('Basic functionality', () => {
    it('should generate types successfully', async () => {
      const result = await generateTypes({
        abiDir: './contracts/abis',
        outputPath: './src/types'
      })

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return error if ABI directory not found', async () => {
      mockFs.existsSync = jest.fn().mockReturnValue(false)

      const result = await generateTypes({
        abiDir: './contracts/abis',
        outputPath: './src/types'
      })

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should create output directory if it does not exist', async () => {
      mockFs.existsSync = jest.fn()
        .mockReturnValueOnce(true) // ABI dir exists
        .mockReturnValueOnce(false) // Output dir doesn't exist

      await generateTypes({
        abiDir: './contracts/abis',
        outputPath: './src/types'
      })

      expect(mockFs.mkdirSync).toHaveBeenCalled()
    })

    it('should generate type file for each ABI', async () => {
      await generateTypes({
        abiDir: './contracts/abis',
        outputPath: './src/types'
      })

      const typeFiles = (mockFs.writeFileSync as jest.Mock).mock.calls.filter(
        call => call[0].endsWith('.ts') && !call[0].endsWith('index.ts')
      )

      expect(typeFiles.length).toBe(1)
    })

    it('should generate index.ts file', async () => {
      await generateTypes({
        abiDir: './contracts/abis',
        outputPath: './src/types'
      })

      const indexFile = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].endsWith('index.ts')
      )

      expect(indexFile).toBeDefined()
    })
  })

  describe('ABI file discovery', () => {
    it('should find JSON files in directory', async () => {
      mockFs.readdirSync = jest.fn().mockReturnValue([
        { name: 'CustomerRegistry.json', isFile: () => true, isDirectory: () => false },
        { name: 'OrderRegistry.json', isFile: () => true, isDirectory: () => false }
      ] as any)

      const result = await generateTypes({
        abiDir: './contracts/abis',
        outputPath: './src/types'
      })

      // Should generate 2 type files + 1 index file
      expect(result.types.length).toBe(3)
    })

    it('should ignore non-JSON files', async () => {
      mockFs.readdirSync = jest.fn().mockReturnValue([
        { name: 'CustomerRegistry.json', isFile: () => true, isDirectory: () => false },
        { name: 'readme.txt', isFile: () => true, isDirectory: () => false }
      ] as any)

      await generateTypes({
        abiDir: './contracts/abis',
        outputPath: './src/types'
      })

      const typeFiles = (mockFs.writeFileSync as jest.Mock).mock.calls.filter(
        call => call[0].endsWith('.ts') && !call[0].endsWith('index.ts')
      )

      expect(typeFiles.length).toBe(1)
    })

    it('should scan subdirectories', async () => {
      let callCount = 0
      mockFs.readdirSync = jest.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return [
            { name: 'subdir', isFile: () => false, isDirectory: () => true }
          ] as any
        } else {
          return [
            { name: 'Contract.json', isFile: () => true, isDirectory: () => false }
          ] as any
        }
      })

      const result = await generateTypes({
        abiDir: './contracts/abis',
        outputPath: './src/types'
      })

      expect(result.types.length).toBeGreaterThan(0)
    })

    it('should handle empty directory', async () => {
      mockFs.readdirSync = jest.fn().mockReturnValue([])

      const result = await generateTypes({
        abiDir: './contracts/abis',
        outputPath: './src/types'
      })

      expect(result.success).toBe(false)
      expect(result.errors).toContain('No ABI files found in directory')
    })
  })

  describe('Type generation from ABI', () => {
    it('should generate function interface', async () => {
      await generateTypes({
        abiDir: './contracts/abis',
        outputPath: './src/types'
      })

      const typeFile = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].includes('CustomerRegistry.ts')
      )

      expect(typeFile).toBeDefined()
      const content = typeFile![1] as string
      expect(content).toContain('interface')
      expect(content).toContain('Functions')
    })

    it('should generate event interface', async () => {
      await generateTypes({
        abiDir: './contracts/abis',
        outputPath: './src/types'
      })

      const typeFile = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].includes('CustomerRegistry.ts')
      )

      const content = typeFile![1] as string
      expect(content).toContain('Events')
    })

    it('should include ABI export', async () => {
      await generateTypes({
        abiDir: './contracts/abis',
        outputPath: './src/types'
      })

      const typeFile = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].includes('CustomerRegistry.ts')
      )

      const content = typeFile![1] as string
      expect(content).toContain('ABI')
    })

    it('should import ethers', async () => {
      await generateTypes({
        abiDir: './contracts/abis',
        outputPath: './src/types'
      })

      const typeFile = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].includes('CustomerRegistry.ts')
      )

      const content = typeFile![1] as string
      expect(content).toContain('import')
      expect(content).toContain('ethers')
    })
  })

  describe('Type mapping', () => {
    it('should map uint types to bigint', async () => {
      const uintABI = [
        {
          type: 'function',
          name: 'getCount',
          inputs: [],
          outputs: [{ name: '', type: 'uint256' }]
        }
      ]
      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(uintABI))

      await generateTypes({
        abiDir: './contracts/abis',
        outputPath: './src/types'
      })

      const typeFile = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].includes('.ts') && !call[0].includes('index.ts')
      )

      const content = typeFile![1] as string
      expect(content).toContain('bigint')
    })

    it('should map int types to bigint', async () => {
      const intABI = [
        {
          type: 'function',
          name: 'getValue',
          inputs: [],
          outputs: [{ name: '', type: 'int256' }]
        }
      ]
      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(intABI))

      await generateTypes({
        abiDir: './contracts/abis',
        outputPath: './src/types'
      })

      const typeFile = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].includes('.ts') && !call[0].includes('index.ts')
      )

      const content = typeFile![1] as string
      expect(content).toContain('bigint')
    })

    it('should map address type to string', async () => {
      const addressABI = [
        {
          type: 'function',
          name: 'getOwner',
          inputs: [],
          outputs: [{ name: '', type: 'address' }]
        }
      ]
      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(addressABI))

      await generateTypes({
        abiDir: './contracts/abis',
        outputPath: './src/types'
      })

      const typeFile = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].includes('.ts') && !call[0].includes('index.ts')
      )

      const content = typeFile![1] as string
      expect(content).toContain('string')
    })

    it('should map bool type to boolean', async () => {
      const boolABI = [
        {
          type: 'function',
          name: 'isActive',
          inputs: [],
          outputs: [{ name: '', type: 'bool' }]
        }
      ]
      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(boolABI))

      await generateTypes({
        abiDir: './contracts/abis',
        outputPath: './src/types'
      })

      const typeFile = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].includes('.ts') && !call[0].includes('index.ts')
      )

      const content = typeFile![1] as string
      expect(content).toContain('boolean')
    })

    it('should map string type to string', async () => {
      const stringABI = [
        {
          type: 'function',
          name: 'getName',
          inputs: [],
          outputs: [{ name: '', type: 'string' }]
        }
      ]
      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(stringABI))

      await generateTypes({
        abiDir: './contracts/abis',
        outputPath: './src/types'
      })

      const typeFile = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].includes('.ts') && !call[0].includes('index.ts')
      )

      const content = typeFile![1] as string
      expect(content).toContain('string')
    })

    it('should map bytes types to string', async () => {
      const bytesABI = [
        {
          type: 'function',
          name: 'getData',
          inputs: [],
          outputs: [{ name: '', type: 'bytes32' }]
        }
      ]
      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(bytesABI))

      await generateTypes({
        abiDir: './contracts/abis',
        outputPath: './src/types'
      })

      const typeFile = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].includes('.ts') && !call[0].includes('index.ts')
      )

      const content = typeFile![1] as string
      expect(content).toContain('string')
    })

    it('should handle array types', async () => {
      const arrayABI = [
        {
          type: 'function',
          name: 'getList',
          inputs: [],
          outputs: [{ name: '', type: 'uint256[]' }]
        }
      ]
      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(arrayABI))

      await generateTypes({
        abiDir: './contracts/abis',
        outputPath: './src/types'
      })

      const typeFile = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].includes('.ts') && !call[0].includes('index.ts')
      )

      const content = typeFile![1] as string
      expect(content).toContain('[]')
    })
  })

  describe('Index file generation', () => {
    it('should export all generated types', async () => {
      mockFs.readdirSync = jest.fn().mockReturnValue([
        { name: 'CustomerRegistry.json', isFile: () => true, isDirectory: () => false },
        { name: 'OrderRegistry.json', isFile: () => true, isDirectory: () => false }
      ] as any)

      await generateTypes({
        abiDir: './contracts/abis',
        outputPath: './src/types'
      })

      const indexFile = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].endsWith('index.ts')
      )

      const content = indexFile![1] as string
      expect(content).toContain('export')
      expect(content).toContain('CustomerRegistry')
      expect(content).toContain('OrderRegistry')
    })

    it('should not export index file from itself', async () => {
      await generateTypes({
        abiDir: './contracts/abis',
        outputPath: './src/types'
      })

      const indexFile = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].endsWith('index.ts')
      )

      const content = indexFile![1] as string
      expect(content).not.toContain('from \'./index\'')
    })

    it('should include documentation comment', async () => {
      await generateTypes({
        abiDir: './contracts/abis',
        outputPath: './src/types'
      })

      const indexFile = (mockFs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].endsWith('index.ts')
      )

      const content = indexFile![1] as string
      expect(content).toContain('/**')
      expect(content).toContain('*/')
    })
  })

  describe('Error handling', () => {
    it('should handle invalid JSON in ABI file', async () => {
      mockFs.readFileSync = jest.fn().mockReturnValue('invalid json {')

      const result = await generateTypes({
        abiDir: './contracts/abis',
        outputPath: './src/types'
      })

      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should handle file system errors', async () => {
      mockFs.writeFileSync = jest.fn().mockImplementation(() => {
        throw new Error('Permission denied')
      })

      const result = await generateTypes({
        abiDir: './contracts/abis',
        outputPath: './src/types'
      })

      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should collect errors for individual files', async () => {
      mockFs.readdirSync = jest.fn().mockReturnValue([
        { name: 'Valid.json', isFile: () => true, isDirectory: () => false },
        { name: 'Invalid.json', isFile: () => true, isDirectory: () => false }
      ] as any)

      let readCount = 0
      mockFs.readFileSync = jest.fn().mockImplementation(() => {
        readCount++
        if (readCount === 1) {
          return JSON.stringify(mockABI)
        } else {
          throw new Error('File read error')
        }
      })

      const result = await generateTypes({
        abiDir: './contracts/abis',
        outputPath: './src/types'
      })

      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should continue processing after individual file error', async () => {
      mockFs.readdirSync = jest.fn().mockReturnValue([
        { name: 'Valid.json', isFile: () => true, isDirectory: () => false },
        { name: 'Invalid.json', isFile: () => true, isDirectory: () => false }
      ] as any)

      let readCount = 0
      mockFs.readFileSync = jest.fn().mockImplementation(() => {
        readCount++
        if (readCount === 1) {
          return JSON.stringify(mockABI)
        } else {
          throw new Error('File read error')
        }
      })

      const result = await generateTypes({
        abiDir: './contracts/abis',
        outputPath: './src/types'
      })

      // Should have at least one successful type generation
      expect(result.types.length).toBeGreaterThan(0)
    })
  })

  describe('Result structure', () => {
    it('should return correct result structure', async () => {
      const result = await generateTypes({
        abiDir: './contracts/abis',
        outputPath: './src/types'
      })

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('types')
      expect(result).toHaveProperty('errors')
    })

    it('should return type file paths', async () => {
      const result = await generateTypes({
        abiDir: './contracts/abis',
        outputPath: './src/types'
      })

      expect(Array.isArray(result.types)).toBe(true)
      expect(result.types.length).toBeGreaterThan(0)
    })

    it('should mark success as false when errors occur', async () => {
      mockFs.existsSync = jest.fn().mockReturnValue(false)

      const result = await generateTypes({
        abiDir: './contracts/abis',
        outputPath: './src/types'
      })

      expect(result.success).toBe(false)
    })
  })
})
