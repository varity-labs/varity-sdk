/**
 * ZKModule Tests
 */

import { ZKModule } from '../ZKModule'
import type { VaritySDK } from '../../../core/VaritySDK'

global.fetch = jest.fn()

describe('ZKModule', () => {
  let zkModule: ZKModule
  const mockSDK = {
    getAPIEndpoint: () => 'https://api.varity.test',
    getAPIKey: () => 'test-api-key'
  } as VaritySDK

  beforeEach(() => {
    jest.clearAllMocks()
    zkModule = new ZKModule(mockSDK)
  })

  it('should initialize correctly', () => {
    expect(zkModule).toBeDefined()
  })

  it('should have SDK reference', () => {
    expect((zkModule as any).sdk).toBe(mockSDK)
  })
})
