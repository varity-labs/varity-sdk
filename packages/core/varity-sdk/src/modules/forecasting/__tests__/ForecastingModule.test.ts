/**
 * ForecastingModule Tests
 */

import { ForecastingModule } from '../ForecastingModule'
import type { VaritySDK } from '../../../core/VaritySDK'

global.fetch = jest.fn()

describe('ForecastingModule', () => {
  let forecastingModule: ForecastingModule
  const mockSDK = {
    getAPIEndpoint: () => 'https://api.varity.test',
    getAPIKey: () => 'test-api-key'
  } as VaritySDK

  beforeEach(() => {
    jest.clearAllMocks()
    forecastingModule = new ForecastingModule(mockSDK)
  })

  it('should initialize correctly', () => {
    expect(forecastingModule).toBeDefined()
  })

  it('should have SDK reference', () => {
    expect((forecastingModule as any).sdk).toBe(mockSDK)
  })
})
