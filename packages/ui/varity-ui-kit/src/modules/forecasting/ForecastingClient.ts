/**
 * Forecasting Client - Predictive analytics and forecasting
 *
 * Handles forecasting operations via API server (ML backend)
 */

import { HTTPClient } from '../../utils/http'
import { JSONObject, JSONValue } from '@varity-labs/types'

export interface PredictOptions {
  metric: string
  periods: number
  confidence?: number
  model?: 'arima' | 'prophet' | 'lstm'
}

export interface ForecastPoint {
  date: string
  value: number
  upperBound: number
  lowerBound: number
  confidence: number
}

export interface AnomalyDetectionOptions {
  metric: string
  data: Array<{ timestamp: string; value: number }>
  sensitivity?: 'low' | 'medium' | 'high'
}

export interface Anomaly {
  timestamp: string
  value: number
  expectedValue: number
  severity: 'low' | 'medium' | 'high'
}

export interface TrendAnalysis {
  trend: 'increasing' | 'decreasing' | 'stable'
  slope: number
  confidence: number
  seasonality?: {
    period: string
    strength: number
  }
}

export class ForecastingClient {
  constructor(private http: HTTPClient) {}

  /**
   * Predict future values
   */
  async predict(options: PredictOptions): Promise<ForecastPoint[]> {
    return this.http.post<ForecastPoint[]>('/forecasting/predict', options)
  }

  /**
   * Detect anomalies
   */
  async detectAnomalies(options: AnomalyDetectionOptions): Promise<Anomaly[]> {
    return this.http.post<Anomaly[]>('/forecasting/detect-anomalies', options)
  }

  /**
   * Analyze trend
   */
  async analyzeTrend(metric: string): Promise<TrendAnalysis> {
    return this.http.post<TrendAnalysis>('/forecasting/analyze-trend', { metric })
  }

  /**
   * Run scenario simulation
   */
  async simulate(scenario: ScenarioInput): Promise<ScenarioOutput> {
    return this.http.post<ScenarioOutput>('/forecasting/simulate', scenario)
  }

  /**
   * Train custom model
   */
  async trainModel(data: TrainingData): Promise<{ modelId: string }> {
    return this.http.post<{ modelId: string }>('/forecasting/train', data)
  }

  /**
   * Evaluate model performance
   */
  async evaluateModel(modelId: string): Promise<ModelEvaluation> {
    return this.http.get<ModelEvaluation>(`/forecasting/evaluate/${modelId}`)
  }
}

/**
 * Scenario simulation input
 */
export interface ScenarioInput {
  metric: string;
  assumptions: JSONObject;
  timeframe: number;
}

/**
 * Scenario simulation output
 */
export interface ScenarioOutput {
  predictions: ForecastPoint[];
  impactAnalysis: JSONObject;
  confidence: number;
}

/**
 * Training data format
 */
export interface TrainingData {
  metric: string;
  data: Array<{ timestamp: string; value: number }>;
  modelType: 'arima' | 'prophet' | 'lstm';
}

/**
 * Model evaluation metrics
 */
export interface ModelEvaluation {
  modelId: string;
  mse: number;
  rmse: number;
  mae: number;
  r2: number;
  confidence: number;
}
