/**
 * WebhooksModule Tests
 */

import { WebhooksModule } from '../WebhooksModule'
import type { VaritySDK } from '../../../core/VaritySDK'

global.fetch = jest.fn()

describe('WebhooksModule', () => {
  let webhooksModule: WebhooksModule
  const mockSDK = {
    getAPIEndpoint: () => 'https://api.varity.test',
    getAPIKey: () => 'test-api-key'
  } as VaritySDK

  beforeEach(() => {
    jest.clearAllMocks()
    webhooksModule = new WebhooksModule(mockSDK)
  })

  it('should initialize correctly', () => {
    expect(webhooksModule).toBeDefined()
  })

  it('should have SDK reference', () => {
    expect((webhooksModule as any).sdk).toBe(mockSDK)
  })
})
