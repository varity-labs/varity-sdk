/**
 * ContractsModule Tests
 */

import { ContractsModule } from '../ContractsModule'
import type { VaritySDK } from '../../../core/VaritySDK'

global.fetch = jest.fn()

describe('ContractsModule', () => {
  let contractsModule: ContractsModule
  const mockSDK = {
    getAPIEndpoint: () => 'https://api.varity.test',
    getAPIKey: () => 'test-api-key',
    getSigner: () => ({
      getAddress: async () => '0x1234567890123456789012345678901234567890'
    }),
    getProvider: () => ({}),
    getContractAddress: () => '0xcontract1234'
  } as any

  beforeEach(() => {
    jest.clearAllMocks()
    contractsModule = new ContractsModule(mockSDK)
  })

  it('should initialize correctly', () => {
    expect(contractsModule).toBeDefined()
  })

  it('should have SDK reference', () => {
    expect((contractsModule as any).sdk).toBe(mockSDK)
  })
})
