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
// ============================================================================
// FORECASTING MODULE CLASS
// ============================================================================
/**
 * Forecasting Module
 *
 * Provides time-series forecasting, anomaly detection, and predictive analytics
 * Works universally across all templates with template-specific configurations
 */
export class ForecastingModule {
    sdk;
    constructor(sdk) {
        this.sdk = sdk;
    }
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
    async predict(options) {
        const response = await fetch(`${this.sdk.getAPIEndpoint()}/api/v1/forecasting/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.sdk.getAPIKey() && { 'X-API-Key': this.sdk.getAPIKey() })
            },
            body: JSON.stringify(options)
        });
        if (!response.ok) {
            throw new Error(`Prediction failed: ${response.statusText}`);
        }
        return await response.json();
    }
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
    async detectAnomalies(options) {
        const response = await fetch(`${this.sdk.getAPIEndpoint()}/api/v1/forecasting/anomalies`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.sdk.getAPIKey() && { 'X-API-Key': this.sdk.getAPIKey() })
            },
            body: JSON.stringify(options)
        });
        if (!response.ok) {
            throw new Error(`Anomaly detection failed: ${response.statusText}`);
        }
        return await response.json();
    }
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
    async analyzeTrends(options) {
        const response = await fetch(`${this.sdk.getAPIEndpoint()}/api/v1/forecasting/trends`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.sdk.getAPIKey() && { 'X-API-Key': this.sdk.getAPIKey() })
            },
            body: JSON.stringify(options)
        });
        if (!response.ok) {
            throw new Error(`Trend analysis failed: ${response.statusText}`);
        }
        return await response.json();
    }
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
    async simulateScenario(options) {
        const response = await fetch(`${this.sdk.getAPIEndpoint()}/api/v1/forecasting/scenarios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.sdk.getAPIKey() && { 'X-API-Key': this.sdk.getAPIKey() })
            },
            body: JSON.stringify(options)
        });
        if (!response.ok) {
            throw new Error(`Scenario simulation failed: ${response.statusText}`);
        }
        return await response.json();
    }
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
    async trainModel(options) {
        const response = await fetch(`${this.sdk.getAPIEndpoint()}/api/v1/forecasting/models/train`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.sdk.getAPIKey() && { 'X-API-Key': this.sdk.getAPIKey() })
            },
            body: JSON.stringify(options)
        });
        if (!response.ok) {
            throw new Error(`Model training failed: ${response.statusText}`);
        }
        return await response.json();
    }
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
    async evaluateModel(options) {
        const response = await fetch(`${this.sdk.getAPIEndpoint()}/api/v1/forecasting/models/evaluate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.sdk.getAPIKey() && { 'X-API-Key': this.sdk.getAPIKey() })
            },
            body: JSON.stringify(options)
        });
        if (!response.ok) {
            throw new Error(`Model evaluation failed: ${response.statusText}`);
        }
        return await response.json();
    }
    /**
     * Get trained model by ID
     *
     * @param modelId - Model ID
     * @returns Trained model information
     */
    async getModel(modelId) {
        const response = await fetch(`${this.sdk.getAPIEndpoint()}/api/v1/forecasting/models/${modelId}`, {
            headers: {
                ...(this.sdk.getAPIKey() && { 'X-API-Key': this.sdk.getAPIKey() })
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to get model: ${response.statusText}`);
        }
        return await response.json();
    }
    /**
     * List all trained models
     *
     * @param filters - Optional filters
     * @returns List of trained models
     */
    async listModels(filters) {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value)
                    params.append(key, value);
            });
        }
        const response = await fetch(`${this.sdk.getAPIEndpoint()}/api/v1/forecasting/models?${params.toString()}`, {
            headers: {
                ...(this.sdk.getAPIKey() && { 'X-API-Key': this.sdk.getAPIKey() })
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to list models: ${response.statusText}`);
        }
        return await response.json();
    }
    /**
     * Delete a trained model
     *
     * @param modelId - Model ID to delete
     * @returns Success status
     */
    async deleteModel(modelId) {
        const response = await fetch(`${this.sdk.getAPIEndpoint()}/api/v1/forecasting/models/${modelId}`, {
            method: 'DELETE',
            headers: {
                ...(this.sdk.getAPIKey() && { 'X-API-Key': this.sdk.getAPIKey() })
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to delete model: ${response.statusText}`);
        }
        return await response.json();
    }
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
    async getAccuracy(options) {
        const response = await fetch(`${this.sdk.getAPIEndpoint()}/api/v1/forecasting/accuracy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.sdk.getAPIKey() && { 'X-API-Key': this.sdk.getAPIKey() })
            },
            body: JSON.stringify(options)
        });
        if (!response.ok) {
            throw new Error(`Failed to get accuracy: ${response.statusText}`);
        }
        return await response.json();
    }
}
//# sourceMappingURL=ForecastingModule.js.map