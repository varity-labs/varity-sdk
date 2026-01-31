/**
 * ExportModule Tests
 */

import { ExportModule } from '../ExportModule'
import type { VaritySDK } from '../../../core/VaritySDK'

global.fetch = jest.fn()

describe('ExportModule', () => {
  let exportModule: ExportModule
  const mockSDK = {
    getAPIEndpoint: () => 'https://api.varity.test',
    getAPIKey: () => 'test-api-key'
  } as VaritySDK

  beforeEach(() => {
    jest.clearAllMocks()
    exportModule = new ExportModule(mockSDK)
  })

  it('should initialize correctly', () => {
    expect(exportModule).toBeDefined()
  })

  it('should have SDK reference', () => {
    expect((exportModule as any).sdk).toBe(mockSDK)
  })
})
