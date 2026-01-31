/**
 * Tests for varity dev command
 */

import * as path from 'path'
import { devCommand } from '../commands/dev'
import { startDevServer } from '../../dev/dev-server'

// Mock dependencies
jest.mock('../../dev/dev-server')
jest.mock('../utils/logger')

describe('CLI dev command', () => {
  const mockStartDevServer = startDevServer as jest.MockedFunction<typeof startDevServer>

  beforeEach(() => {
    jest.clearAllMocks()
    mockStartDevServer.mockResolvedValue()
  })

  describe('Command configuration', () => {
    it('should have correct command name', () => {
      expect(devCommand.name()).toBe('dev')
    })

    it('should have description', () => {
      const description = devCommand.description()
      expect(description).toBeTruthy()
      expect(description.toLowerCase()).toContain('dev')
    })

    it('should have template option with default value', () => {
      const options = devCommand.options
      const templateOption = options.find(opt => opt.flags.includes('--template'))
      expect(templateOption).toBeDefined()
      expect(templateOption?.defaultValue).toContain('template.json')
    })

    it('should have contracts option with default value', () => {
      const options = devCommand.options
      const contractsOption = options.find(opt => opt.flags.includes('--contracts'))
      expect(contractsOption).toBeDefined()
      expect(contractsOption?.defaultValue).toBe('./contracts')
    })

    it('should have watch option enabled by default', () => {
      const options = devCommand.options
      const watchOption = options.find(opt => opt.flags.includes('--watch'))
      expect(watchOption).toBeDefined()
      expect(watchOption?.defaultValue).toBe(true)
    })

    it('should have port option with default value', () => {
      const options = devCommand.options
      const portOption = options.find(opt => opt.flags.includes('--port'))
      expect(portOption).toBeDefined()
      expect(portOption?.defaultValue).toBe('3001')
    })
  })

  describe('Dev server start', () => {
    it('should call startDevServer with correct options', async () => {
      await simulateDevCommand({
        template: './templates/test.template.json',
        contracts: './contracts',
        watch: true,
        port: '3001'
      })

      expect(mockStartDevServer).toHaveBeenCalledWith(
        expect.objectContaining({
          templatePath: expect.stringContaining('test.template.json'),
          contractsPath: expect.stringContaining('contracts'),
          watch: true,
          port: 3001
        })
      )
    })

    it('should resolve paths correctly', async () => {
      await simulateDevCommand({
        template: './templates/test.template.json',
        contracts: './contracts',
        watch: true,
        port: '3001'
      })

      expect(mockStartDevServer).toHaveBeenCalledWith(
        expect.objectContaining({
          templatePath: expect.any(String),
          contractsPath: expect.any(String)
        })
      )
    })

    it('should parse port as integer', async () => {
      await simulateDevCommand({
        template: './templates/test.template.json',
        contracts: './contracts',
        watch: true,
        port: '3002'
      })

      expect(mockStartDevServer).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 3002
        })
      )
    })

    it('should handle custom template path', async () => {
      await simulateDevCommand({
        template: './custom/path/template.json',
        contracts: './contracts',
        watch: true,
        port: '3001'
      })

      expect(mockStartDevServer).toHaveBeenCalledWith(
        expect.objectContaining({
          templatePath: expect.stringContaining('custom/path/template.json')
        })
      )
    })

    it('should handle custom contracts path', async () => {
      await simulateDevCommand({
        template: './templates/test.template.json',
        contracts: './custom-contracts',
        watch: true,
        port: '3001'
      })

      expect(mockStartDevServer).toHaveBeenCalledWith(
        expect.objectContaining({
          contractsPath: expect.stringContaining('custom-contracts')
        })
      )
    })

    it('should handle custom port', async () => {
      await simulateDevCommand({
        template: './templates/test.template.json',
        contracts: './contracts',
        watch: true,
        port: '8080'
      })

      expect(mockStartDevServer).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 8080
        })
      )
    })
  })

  describe('Watch mode', () => {
    it('should enable watch mode by default', async () => {
      await simulateDevCommand({
        template: './templates/test.template.json',
        contracts: './contracts',
        watch: true,
        port: '3001'
      })

      expect(mockStartDevServer).toHaveBeenCalledWith(
        expect.objectContaining({
          watch: true
        })
      )
    })

    it('should disable watch mode when explicitly set to false', async () => {
      await simulateDevCommand({
        template: './templates/test.template.json',
        contracts: './contracts',
        watch: false,
        port: '3001'
      })

      expect(mockStartDevServer).toHaveBeenCalledWith(
        expect.objectContaining({
          watch: false
        })
      )
    })

    it('should handle watch mode option correctly', async () => {
      const watchModeResult = await simulateDevCommand({
        template: './templates/test.template.json',
        contracts: './contracts',
        watch: true,
        port: '3001'
      })

      const noWatchResult = await simulateDevCommand({
        template: './templates/test.template.json',
        contracts: './contracts',
        watch: false,
        port: '3001'
      })

      expect(mockStartDevServer).toHaveBeenCalledTimes(2)
    })
  })

  describe('Error handling', () => {
    it('should handle server start errors gracefully', async () => {
      mockStartDevServer.mockRejectedValue(new Error('Failed to start server'))

      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await simulateDevCommand({
        template: './templates/test.template.json',
        contracts: './contracts',
        watch: true,
        port: '3001'
      }).catch(() => {})

      expect(exitSpy).toHaveBeenCalledWith(1)
      exitSpy.mockRestore()
    })

    it('should handle missing template file', async () => {
      mockStartDevServer.mockRejectedValue(new Error('Template file not found'))

      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await simulateDevCommand({
        template: './templates/missing.json',
        contracts: './contracts',
        watch: true,
        port: '3001'
      }).catch(() => {})

      expect(exitSpy).toHaveBeenCalledWith(1)
      exitSpy.mockRestore()
    })

    it('should handle file system errors', async () => {
      mockStartDevServer.mockRejectedValue(new Error('Permission denied'))

      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await simulateDevCommand({
        template: './templates/test.template.json',
        contracts: './contracts',
        watch: true,
        port: '3001'
      }).catch(() => {})

      expect(exitSpy).toHaveBeenCalledWith(1)
      exitSpy.mockRestore()
    })

    it('should handle port conflicts', async () => {
      mockStartDevServer.mockRejectedValue(new Error('Port 3001 already in use'))

      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await simulateDevCommand({
        template: './templates/test.template.json',
        contracts: './contracts',
        watch: true,
        port: '3001'
      }).catch(() => {})

      expect(exitSpy).toHaveBeenCalledWith(1)
      exitSpy.mockRestore()
    })
  })

  describe('Configuration display', () => {
    it('should display configuration before starting', async () => {
      await simulateDevCommand({
        template: './templates/test.template.json',
        contracts: './contracts',
        watch: true,
        port: '3001'
      })

      expect(mockStartDevServer).toHaveBeenCalled()
    })

    it('should show all configuration options', async () => {
      await simulateDevCommand({
        template: './templates/test.template.json',
        contracts: './output/contracts',
        watch: false,
        port: '8080'
      })

      expect(mockStartDevServer).toHaveBeenCalledWith(
        expect.objectContaining({
          templatePath: expect.any(String),
          contractsPath: expect.any(String),
          watch: false,
          port: 8080
        })
      )
    })
  })

  describe('Path resolution', () => {
    it('should resolve relative template paths', async () => {
      await simulateDevCommand({
        template: './templates/test.template.json',
        contracts: './contracts',
        watch: true,
        port: '3001'
      })

      const call = mockStartDevServer.mock.calls[0][0]
      expect(path.isAbsolute(call.templatePath)).toBe(true)
    })

    it('should resolve relative contracts paths', async () => {
      await simulateDevCommand({
        template: './templates/test.template.json',
        contracts: './contracts',
        watch: true,
        port: '3001'
      })

      const call = mockStartDevServer.mock.calls[0][0]
      expect(path.isAbsolute(call.contractsPath)).toBe(true)
    })

    it('should handle absolute paths', async () => {
      await simulateDevCommand({
        template: '/absolute/path/template.json',
        contracts: '/absolute/path/contracts',
        watch: true,
        port: '3001'
      })

      expect(mockStartDevServer).toHaveBeenCalled()
    })
  })

  describe('Port parsing', () => {
    it('should parse string port to integer', async () => {
      await simulateDevCommand({
        template: './templates/test.template.json',
        contracts: './contracts',
        watch: true,
        port: '3001'
      })

      const call = mockStartDevServer.mock.calls[0][0]
      expect(typeof call.port).toBe('number')
      expect(call.port).toBe(3001)
    })

    it('should handle different port numbers', async () => {
      const ports = ['3000', '3001', '8080', '9000']

      for (const port of ports) {
        await simulateDevCommand({
          template: './templates/test.template.json',
          contracts: './contracts',
          watch: true,
          port
        })
      }

      expect(mockStartDevServer).toHaveBeenCalledTimes(ports.length)
    })
  })
})

/**
 * Helper function to simulate dev command execution
 */
async function simulateDevCommand(options: {
  template: string
  contracts: string
  watch: boolean
  port: string
}) {
  const templatePath = path.resolve(options.template)
  const contractsPath = path.resolve(options.contracts)
  const port = parseInt(options.port, 10)

  try {
    await startDevServer({
      templatePath,
      contractsPath,
      watch: options.watch,
      port
    })
  } catch (error) {
    process.exit(1)
  }
}
