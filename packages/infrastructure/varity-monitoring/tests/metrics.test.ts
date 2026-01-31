import { StorageMetrics } from '../src/metrics/storage-metrics';
import { PerformanceMetrics } from '../src/metrics/performance-metrics';
import { CostMetrics } from '../src/metrics/cost-metrics';

describe('StorageMetrics', () => {
  let metrics: StorageMetrics;

  beforeEach(() => {
    metrics = new StorageMetrics();
  });

  afterEach(() => {
    metrics.reset();
  });

  it('should record storage usage', async () => {
    metrics.recordStorageUsage('customer-data', 'hot', 'filecoin', 'customer-123', 1024);
    const output = await metrics.getMetrics();

    expect(output).toContain('varity_storage_bytes');
    expect(output).toContain('layer="customer-data"');
    expect(output).toContain('tier="hot"');
    expect(output).toContain('backend="filecoin"');
    expect(output).toContain('1024');
  });

  it('should record upload operations', async () => {
    metrics.recordUpload('customer-data', 'filecoin', 'success', 'application/pdf');
    const output = await metrics.getMetrics();

    expect(output).toContain('varity_uploads_total');
    expect(output).toContain('status="success"');
    expect(output).toContain('content_type="application/pdf"');
  });

  it('should record download operations', async () => {
    metrics.recordDownload('industry-rag', 'filecoin', 'success', true);
    const output = await metrics.getMetrics();

    expect(output).toContain('varity_downloads_total');
    expect(output).toContain('status="success"');
    expect(output).toContain('cache_hit="true"');
  });

  it('should record latency', async () => {
    metrics.recordLatency('upload', 'filecoin', 'customer-data', 2.5);
    const output = await metrics.getMetrics();

    expect(output).toContain('varity_operation_duration_seconds');
    expect(output).toContain('operation="upload"');
    expect(output).toContain('backend="filecoin"');
  });

  it('should record layer document count', async () => {
    metrics.recordLayerDocumentCount('industry-rag', 'finance', true, 10000);
    const output = await metrics.getMetrics();

    expect(output).toContain('varity_layer_document_count');
    expect(output).toContain('layer="industry-rag"');
    expect(output).toContain('category="finance"');
    expect(output).toContain('encrypted="true"');
    expect(output).toContain('10000');
  });

  it('should record multiple uploads and aggregate', async () => {
    metrics.recordUpload('customer-data', 'filecoin', 'success');
    metrics.recordUpload('customer-data', 'filecoin', 'success');
    metrics.recordUpload('customer-data', 'filecoin', 'failure');

    const output = await metrics.getMetrics();
    expect(output).toContain('varity_uploads_total');
    // Counter should show 2 successes and 1 failure
  });

  it('should reset all metrics', async () => {
    metrics.recordStorageUsage('customer-data', 'hot', 'filecoin', 'test', 1024);
    metrics.reset();

    const output = await metrics.getMetrics();
    expect(output).not.toContain('1024');
  });
});

describe('PerformanceMetrics', () => {
  let metrics: PerformanceMetrics;

  beforeEach(() => {
    metrics = new PerformanceMetrics();
  });

  afterEach(() => {
    metrics.reset();
  });

  it('should record HTTP request', async () => {
    metrics.recordHttpRequest('GET', '/api/v1/storage', 200, 0.145);
    const output = await metrics.getMetrics();

    expect(output).toContain('varity_http_request_duration_seconds');
    expect(output).toContain('method="GET"');
    expect(output).toContain('status_code="200"');
  });

  it('should record database query', async () => {
    metrics.recordDbQuery('SELECT', 'documents', 0.023, 'success');
    const output = await metrics.getMetrics();

    expect(output).toContain('varity_db_query_duration_seconds');
    expect(output).toContain('query_type="SELECT"');
    expect(output).toContain('table="documents"');
  });

  it('should record blockchain transaction', async () => {
    metrics.recordBlockchainTx('arbitrum-one', 'storage-reference', 15.3);
    const output = await metrics.getMetrics();

    expect(output).toContain('varity_blockchain_tx_duration_seconds');
    expect(output).toContain('chain="arbitrum-one"');
    expect(output).toContain('tx_type="storage-reference"');
  });

  it('should record LLM inference', async () => {
    metrics.recordLlmInference('gemini-2.5-flash', 'akash-network', 'rag-query', 3.2);
    const output = await metrics.getMetrics();

    expect(output).toContain('varity_llm_inference_duration_seconds');
    expect(output).toContain('model="gemini-2.5-flash"');
    expect(output).toContain('provider="akash-network"');
  });

  it('should record LLM token usage', async () => {
    metrics.recordLlmTokens('gemini-2.5-flash', 'input', 500);
    metrics.recordLlmTokens('gemini-2.5-flash', 'output', 300);

    const output = await metrics.getMetrics();
    expect(output).toContain('varity_llm_tokens_total');
    expect(output).toContain('token_type="input"');
    expect(output).toContain('token_type="output"');
  });

  it('should record system metrics', async () => {
    metrics.recordCpuUsage('0', 45.2);
    metrics.recordMemoryUsage('used', 4_000_000_000);

    const output = await metrics.getMetrics();
    expect(output).toContain('varity_cpu_usage_percent');
    expect(output).toContain('varity_memory_usage_bytes');
  });
});

describe('CostMetrics', () => {
  let metrics: CostMetrics;

  beforeEach(() => {
    metrics = new CostMetrics();
  });

  afterEach(() => {
    metrics.reset();
  });

  it('should record storage monthly cost', async () => {
    metrics.recordStorageMonthlyCost('customer-data', 'filecoin', 'hot', 25.00);
    const output = await metrics.getMetrics();

    expect(output).toContain('varity_storage_monthly_cost_usd');
    expect(output).toContain('layer="customer-data"');
    expect(output).toContain('backend="filecoin"');
    expect(output).toContain('25');
  });

  it('should record compute costs', async () => {
    metrics.recordComputeMonthlyCost('akash-network', 'llm-inference', 'global', 50.00);
    const output = await metrics.getMetrics();

    expect(output).toContain('varity_compute_monthly_cost_usd');
    expect(output).toContain('provider="akash-network"');
    expect(output).toContain('50');
  });

  it('should record customer monthly cost', async () => {
    metrics.recordCustomerMonthlyCost('starter', 'finance', 2.27);
    const output = await metrics.getMetrics();

    expect(output).toContain('varity_customer_monthly_cost_usd');
    expect(output).toContain('tier="starter"');
    expect(output).toContain('industry="finance"');
  });

  it('should record profit margin', async () => {
    metrics.recordProfitMargin('starter', 'finance', 97.7);
    const output = await metrics.getMetrics();

    expect(output).toContain('varity_profit_margin_percent');
    expect(output).toContain('97.7');
  });

  it('should record DePin vs Cloud savings', async () => {
    metrics.recordDepinCloudSavings('storage', 90.0);
    metrics.recordDepinCloudSavings('compute', 85.0);

    const output = await metrics.getMetrics();
    expect(output).toContain('varity_depin_cloud_savings_percent');
    expect(output).toContain('service_type="storage"');
    expect(output).toContain('90');
  });

  it('should record cost efficiency', async () => {
    metrics.recordCostEfficiency('starter', 43.6);
    const output = await metrics.getMetrics();

    expect(output).toContain('varity_cost_efficiency_ratio');
    expect(output).toContain('tier="starter"');
  });

  it('should record comprehensive cost breakdown', async () => {
    metrics.recordCostBreakdown({
      storage: [
        { layer: 'varity-internal', backend: 'filecoin', cost: 10.0 },
        { layer: 'industry-rag', backend: 'filecoin', cost: 50.0 }
      ],
      compute: [
        { provider: 'akash-network', instanceType: 'llm-inference', cost: 50.0 }
      ],
      blockchain: [
        { chain: 'arbitrum-one', txType: 'storage-reference', cost: 5.0 }
      ],
      llm: [
        { model: 'gemini-2.5-flash', provider: 'akash-network', cost: 20.0 }
      ]
    });

    const output = await metrics.getMetrics();
    expect(output).toContain('varity_storage_total_cost_usd');
    expect(output).toContain('varity_compute_total_cost_usd');
    expect(output).toContain('varity_blockchain_total_cost_usd');
    expect(output).toContain('varity_llm_total_cost_usd');
  });
});
