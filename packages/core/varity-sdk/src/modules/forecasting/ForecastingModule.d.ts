/**
 * Forecasting Module
 *
 * Universal time-series forecasting, anomaly detection, and predictive analytics
 * Works across ALL templates (ISO, Healthcare, Finance, Retail)
 *
 * @example
 * ```typescript
 * // Time-series forecast
 * const forecast = await sdk.forecasting.predict({
 *   metric: 'revenue',
 *   periods: 12,
 *   interval: 'month'
 * })
 *
 * // Anomaly detection
 * const anomalies = await sdk.forecasting.detectAnomalies({
 *   metric: 'transactions',
 *   sensitivity: 'high'
 * })
 *
 * // What-if scenario
 * const scenario = await sdk.forecasting.simulateScenario({
 *   changes: { marketing_spend: 1.5 },
 *   target_metric: 'revenue'
 * })
 * ```
 */
import type { VaritySDK } from '../../core/VaritySDK';
/**
 * Time interval for forecasting
 */
export type TimeInterval = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
/**
 * Forecasting algorithm/model type
 */
export type ForecastModel = 'auto' | 'arima' | 'prophet' | 'exponential_smoothing' | 'neural_network' | 'ensemble';
/**
 * Anomaly detection sensitivity
 */
export type AnomalySensitivity = 'low' | 'medium' | 'high' | 'critical';
/**
 * Anomaly type classification
 */
export type AnomalyType = 'spike' | 'drop' | 'trend_change' | 'seasonal_anomaly' | 'outlier' | 'unknown';
/**
 * Model evaluation metric
 */
export type EvaluationMetric = 'mae' | 'rmse' | 'mape' | 'r_squared' | 'accuracy';
/**
 * Options for time-series prediction
 */
export interface PredictOptions {
    /** Metric to forecast (e.g., 'revenue', 'transactions', 'users') */
    metric: string;
    /** Number of periods to forecast */
    periods: number;
    /** Time interval for forecast */
    interval: TimeInterval;
    /** Forecasting model to use */
    model?: ForecastModel;
    /** Historical data range (e.g., 'last_365_days') */
    history_range?: string;
    /** Include confidence intervals */
    include_confidence?: boolean;
    /** Confidence level (0-1) */
    confidence_level?: number;
    /** Include seasonality decomposition */
    include_seasonality?: boolean;
    /** Additional filters */
    filters?: Record<string, any>;
}
/**
 * Options for anomaly detection
 */
export interface AnomalyDetectionOptions {
    /** Metric to analyze */
    metric: string;
    /** Time range to analyze */
    time_range?: string;
    /** Detection sensitivity */
    sensitivity?: AnomalySensitivity;
    /** Minimum anomaly score threshold (0-1) */
    threshold?: number;
    /** Include explanations for anomalies */
    include_explanations?: boolean;
    /** Filter by anomaly types */
    types?: AnomalyType[];
    /** Additional filters */
    filters?: Record<string, any>;
}
/**
 * Options for trend analysis
 */
export interface TrendAnalysisOptions {
    /** Metric to analyze */
    metric: string;
    /** Time range */
    time_range?: string;
    /** Interval for data points */
    interval?: TimeInterval;
    /** Detect seasonality patterns */
    detect_seasonality?: boolean;
    /** Detect cycles */
    detect_cycles?: boolean;
    /** Additional filters */
    filters?: Record<string, any>;
}
/**
 * Options for scenario simulation
 */
export interface ScenarioSimulationOptions {
    /** Changes to simulate (variable -> multiplier/value) */
    changes: Record<string, number>;
    /** Target metric to predict */
    target_metric: string;
    /** Forecast periods */
    periods?: number;
    /** Time interval */
    interval?: TimeInterval;
    /** Scenario name/description */
    scenario_name?: string;
    /** Include comparison with baseline */
    include_baseline?: boolean;
}
/**
 * Options for model training
 */
export interface TrainModelOptions {
    /** Metric/target variable */
    target: string;
    /** Feature variables */
    features?: string[];
    /** Model type */
    model?: ForecastModel;
    /** Training data range */
    training_range?: string;
    /** Validation split ratio */
    validation_split?: number;
    /** Hyperparameters */
    hyperparameters?: Record<string, any>;
    /** Model name/version */
    model_name?: string;
}
/**
 * Options for model evaluation
 */
export interface EvaluateModelOptions {
    /** Model ID to evaluate */
    model_id: string;
    /** Test data range */
    test_range?: string;
    /** Evaluation metrics to compute */
    metrics?: EvaluationMetric[];
    /** Include predictions vs actuals comparison */
    include_comparison?: boolean;
}
/**
 * Forecast data point
 */
export interface ForecastPoint {
    /** Timestamp */
    timestamp: string;
    /** Forecasted value */
    value: number;
    /** Lower confidence bound */
    lower_bound?: number;
    /** Upper confidence bound */
    upper_bound?: number;
    /** Seasonal component */
    seasonal?: number;
    /** Trend component */
    trend?: number;
}
/**
 * Forecast result
 */
export interface ForecastResult {
    /** Metric forecasted */
    metric: string;
    /** Model used */
    model: ForecastModel;
    /** Forecast data points */
    forecast: ForecastPoint[];
    /** Confidence level */
    confidence_level?: number;
    /** Model accuracy metrics */
    accuracy?: {
        mae?: number;
        rmse?: number;
        mape?: number;
    };
    /** Seasonality pattern detected */
    seasonality?: {
        detected: boolean;
        period?: number;
        strength?: number;
    };
    /** Trend information */
    trend?: {
        direction: 'increasing' | 'decreasing' | 'stable';
        strength: number;
    };
    /** Generated timestamp */
    generated_at: string;
}
/**
 * Detected anomaly
 */
export interface Anomaly {
    /** Anomaly ID */
    id: string;
    /** Timestamp of anomaly */
    timestamp: string;
    /** Metric affected */
    metric: string;
    /** Actual value */
    actual_value: number;
    /** Expected value */
    expected_value: number;
    /** Deviation from expected */
    deviation: number;
    /** Anomaly score (0-1) */
    score: number;
    /** Anomaly type */
    type: AnomalyType;
    /** Human-readable explanation */
    explanation?: string;
    /** Contributing factors */
    factors?: Array<{
        factor: string;
        impact: number;
    }>;
    /** Severity level */
    severity: 'low' | 'medium' | 'high' | 'critical';
}
/**
 * Anomaly detection result
 */
export interface AnomalyDetectionResult {
    /** Metric analyzed */
    metric: string;
    /** Time range analyzed */
    time_range: string;
    /** Detected anomalies */
    anomalies: Anomaly[];
    /** Total data points analyzed */
    total_points: number;
    /** Anomaly rate */
    anomaly_rate: number;
    /** Summary statistics */
    statistics: {
        mean: number;
        std_dev: number;
        min: number;
        max: number;
    };
    /** Generated timestamp */
    generated_at: string;
}
/**
 * Trend component
 */
export interface TrendComponent {
    /** Component name */
    name: 'trend' | 'seasonal' | 'residual';
    /** Data points */
    values: Array<{
        timestamp: string;
        value: number;
    }>;
    /** Component strength */
    strength: number;
}
/**
 * Trend analysis result
 */
export interface TrendAnalysisResult {
    /** Metric analyzed */
    metric: string;
    /** Overall trend direction */
    trend_direction: 'increasing' | 'decreasing' | 'stable';
    /** Trend strength (0-1) */
    trend_strength: number;
    /** Growth rate */
    growth_rate?: number;
    /** Seasonality detected */
    seasonality?: {
        detected: boolean;
        period?: number;
        strength?: number;
    };
    /** Cycle detected */
    cycles?: {
        detected: boolean;
        period?: number;
        amplitude?: number;
    };
    /** Decomposed components */
    components?: TrendComponent[];
    /** Change points detected */
    change_points?: Array<{
        timestamp: string;
        type: 'acceleration' | 'deceleration' | 'reversal';
        confidence: number;
    }>;
    /** Generated timestamp */
    generated_at: string;
}
/**
 * Scenario simulation result
 */
export interface ScenarioResult {
    /** Scenario name */
    scenario_name?: string;
    /** Changes applied */
    changes: Record<string, number>;
    /** Target metric */
    target_metric: string;
    /** Forecasted values */
    forecast: ForecastPoint[];
    /** Baseline forecast (for comparison) */
    baseline?: ForecastPoint[];
    /** Impact summary */
    impact: {
        /** Absolute change from baseline */
        absolute_change: number;
        /** Percentage change from baseline */
        percentage_change: number;
        /** Expected value at end of forecast */
        final_value: number;
        /** Baseline final value */
        baseline_final_value?: number;
    };
    /** Generated timestamp */
    generated_at: string;
}
/**
 * Trained model information
 */
export interface TrainedModel {
    /** Model ID */
    model_id: string;
    /** Model name */
    model_name?: string;
    /** Model type */
    model_type: ForecastModel;
    /** Target variable */
    target: string;
    /** Feature variables */
    features?: string[];
    /** Training metrics */
    metrics: {
        mae?: number;
        rmse?: number;
        mape?: number;
        r_squared?: number;
        accuracy?: number;
    };
    /** Training data size */
    training_size: number;
    /** Validation data size */
    validation_size?: number;
    /** Hyperparameters used */
    hyperparameters?: Record<string, any>;
    /** Model status */
    status: 'trained' | 'training' | 'failed';
    /** Trained timestamp */
    trained_at: string;
    /** Model version */
    version: number;
}
/**
 * Model evaluation result
 */
export interface EvaluationResult {
    /** Model ID */
    model_id: string;
    /** Test data size */
    test_size: number;
    /** Evaluation metrics */
    metrics: {
        mae?: number;
        rmse?: number;
        mape?: number;
        r_squared?: number;
        accuracy?: number;
    };
    /** Predictions vs actuals comparison */
    comparison?: Array<{
        timestamp: string;
        actual: number;
        predicted: number;
        error: number;
    }>;
    /** Feature importance */
    feature_importance?: Array<{
        feature: string;
        importance: number;
    }>;
    /** Generated timestamp */
    evaluated_at: string;
}
/**
 * Forecasting Module
 *
 * Provides time-series forecasting, anomaly detection, and predictive analytics
 * Works universally across all templates with template-specific configurations
 */
export declare class ForecastingModule {
    private sdk;
    constructor(sdk: VaritySDK);
    /**
     * Predict future values for a metric
     *
     * @param options - Prediction options
     * @returns Forecast result with predicted values and confidence intervals
     *
     * @example
     * ```typescript
     * // Forecast next 12 months of revenue
     * const forecast = await sdk.forecasting.predict({
     *   metric: 'revenue',
     *   periods: 12,
     *   interval: 'month',
     *   include_confidence: true
     * })
     * ```
     */
    predict(options: PredictOptions): Promise<ForecastResult>;
    /**
     * Detect anomalies in time-series data
     *
     * @param options - Anomaly detection options
     * @returns Detected anomalies with explanations
     *
     * @example
     * ```typescript
     * const anomalies = await sdk.forecasting.detectAnomalies({
     *   metric: 'transactions',
     *   time_range: 'last_90_days',
     *   sensitivity: 'high',
     *   include_explanations: true
     * })
     * ```
     */
    detectAnomalies(options: AnomalyDetectionOptions): Promise<AnomalyDetectionResult>;
    /**
     * Analyze trends in time-series data
     *
     * @param options - Trend analysis options
     * @returns Trend analysis with seasonality and cycle detection
     *
     * @example
     * ```typescript
     * const trends = await sdk.forecasting.analyzeTrends({
     *   metric: 'users',
     *   time_range: 'last_12_months',
     *   detect_seasonality: true
     * })
     * ```
     */
    analyzeTrends(options: TrendAnalysisOptions): Promise<TrendAnalysisResult>;
    /**
     * Simulate what-if scenarios
     *
     * @param options - Scenario simulation options
     * @returns Forecasted impact of changes
     *
     * @example
     * ```typescript
     * // What if we increase marketing spend by 50%?
     * const scenario = await sdk.forecasting.simulateScenario({
     *   changes: { marketing_spend: 1.5 },
     *   target_metric: 'revenue',
     *   periods: 6,
     *   scenario_name: 'Increased Marketing'
     * })
     * ```
     */
    simulateScenario(options: ScenarioSimulationOptions): Promise<ScenarioResult>;
    /**
     * Train a custom forecasting model
     *
     * @param options - Model training options
     * @returns Trained model information
     *
     * @example
     * ```typescript
     * const model = await sdk.forecasting.trainModel({
     *   target: 'revenue',
     *   features: ['marketing_spend', 'season', 'users'],
     *   model: 'neural_network',
     *   model_name: 'revenue_predictor_v1'
     * })
     * ```
     */
    trainModel(options: TrainModelOptions): Promise<TrainedModel>;
    /**
     * Evaluate a trained model's performance
     *
     * @param options - Evaluation options
     * @returns Model evaluation results with metrics
     *
     * @example
     * ```typescript
     * const evaluation = await sdk.forecasting.evaluateModel({
     *   model_id: 'model-123',
     *   test_range: 'last_30_days',
     *   metrics: ['mae', 'rmse', 'mape'],
     *   include_comparison: true
     * })
     * ```
     */
    evaluateModel(options: EvaluateModelOptions): Promise<EvaluationResult>;
    /**
     * Get trained model by ID
     *
     * @param modelId - Model ID
     * @returns Trained model information
     */
    getModel(modelId: string): Promise<TrainedModel>;
    /**
     * List all trained models
     *
     * @param filters - Optional filters
     * @returns List of trained models
     */
    listModels(filters?: {
        model_type?: ForecastModel;
        target?: string;
        status?: 'trained' | 'training' | 'failed';
    }): Promise<{
        models: TrainedModel[];
        total: number;
    }>;
    /**
     * Delete a trained model
     *
     * @param modelId - Model ID to delete
     * @returns Success status
     */
    deleteModel(modelId: string): Promise<{
        success: boolean;
    }>;
    /**
     * Get historical forecast accuracy
     *
     * @param options - Options for accuracy check
     * @returns Historical accuracy metrics
     *
     * @example
     * ```typescript
     * const accuracy = await sdk.forecasting.getAccuracy({
     *   metric: 'revenue',
     *   time_range: 'last_6_months'
     * })
     * ```
     */
    getAccuracy(options: {
        metric: string;
        time_range?: string;
        model?: ForecastModel;
    }): Promise<{
        metric: string;
        accuracy_metrics: {
            mae: number;
            rmse: number;
            mape: number;
        };
        forecast_vs_actual: Array<{
            period: string;
            forecast: number;
            actual: number;
            error: number;
        }>;
    }>;
}
//# sourceMappingURL=ForecastingModule.d.ts.map