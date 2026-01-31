/**
 * Unit tests for ForecastingClient
 */

import {
  ForecastingClient,
  PredictOptions,
  ForecastPoint,
  AnomalyDetectionOptions,
  Anomaly,
  TrendAnalysis
} from './ForecastingClient'
import { createMockHTTPClient, MockHTTPClient } from '../../tests/mocks/httpClient.mock'

describe('ForecastingClient', () => {
  let mockHttp: MockHTTPClient
  let forecastingClient: ForecastingClient

  beforeEach(() => {
    mockHttp = createMockHTTPClient()
    forecastingClient = new ForecastingClient(mockHttp)
  })

  afterEach(() => {
    mockHttp.clearMocks()
  })

  describe('predict', () => {
    it('should predict future values', async () => {
      const mockForecast: ForecastPoint[] = [
        { date: '2025-11-01', value: 100, upperBound: 110, lowerBound: 90, confidence: 0.95 },
        { date: '2025-11-02', value: 105, upperBound: 115, lowerBound: 95, confidence: 0.93 }
      ]

      mockHttp.mockPost('/forecasting/predict', mockForecast)

      const options: PredictOptions = {
        metric: 'revenue',
        periods: 30,
        confidence: 0.95,
        model: 'prophet'
      }

      const result = await forecastingClient.predict(options)

      expect(result).toEqual(mockForecast)
      expect(result).toHaveLength(2)
      expect(result[0].confidence).toBe(0.95)
    })
  })

  describe('detectAnomalies', () => {
    it('should detect anomalies', async () => {
      const mockAnomalies: Anomaly[] = [
        { timestamp: '2025-01-15T10:00:00Z', value: 500, expectedValue: 100, severity: 'high' }
      ]

      mockHttp.mockPost('/forecasting/detect-anomalies', mockAnomalies)

      const options: AnomalyDetectionOptions = {
        metric: 'transactions',
        data: [{ timestamp: '2025-01-15T10:00:00Z', value: 500 }],
        sensitivity: 'medium'
      }

      const result = await forecastingClient.detectAnomalies(options)

      expect(result).toEqual(mockAnomalies)
      expect(result[0].severity).toBe('high')
    })
  })

  describe('analyzeTrend', () => {
    it('should analyze trend', async () => {
      const mockTrend: TrendAnalysis = {
        trend: 'increasing',
        slope: 0.05,
        confidence: 0.92,
        seasonality: { period: 'weekly', strength: 0.75 }
      }

      mockHttp.mockPost('/forecasting/analyze-trend', mockTrend)

      const result = await forecastingClient.analyzeTrend('sales')

      expect(result).toEqual(mockTrend)
      expect(result.trend).toBe('increasing')
      expect(result.seasonality?.period).toBe('weekly')
    })
  })

  describe('simulate', () => {
    it('should run scenario simulation', async () => {
      const mockSimulation = { outcome: 'positive', confidence: 0.88 }

      mockHttp.mockPost('/forecasting/simulate', mockSimulation)

      const scenario = { change: '+10%', variable: 'marketing_spend' }

      const result = await forecastingClient.simulate(scenario)

      expect(result).toEqual(mockSimulation)
    })
  })

  describe('trainModel', () => {
    it('should train custom model', async () => {
      const mockResult = { modelId: 'model-abc123' }

      mockHttp.mockPost('/forecasting/train', mockResult)

      const data = { features: [], labels: [] }

      const result = await forecastingClient.trainModel(data)

      expect(result).toEqual(mockResult)
      expect(result.modelId).toBe('model-abc123')
    })
  })

  describe('evaluateModel', () => {
    it('should evaluate model performance', async () => {
      const mockEvaluation = { accuracy: 0.92, rmse: 5.2 }

      mockHttp.mockGet('/forecasting/evaluate/model-abc123', mockEvaluation)

      const result = await forecastingClient.evaluateModel('model-abc123')

      expect(result).toEqual(mockEvaluation)
    })
  })
})
