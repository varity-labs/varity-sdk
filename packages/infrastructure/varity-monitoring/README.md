# Varity Monitoring

Comprehensive monitoring and metrics collection for Varity infrastructure.

## Features

- **Prometheus Metrics**: Industry-standard metrics collection
- **Storage Monitoring**: Track 3-layer storage architecture usage
- **Performance Tracking**: API, database, blockchain, and LLM metrics
- **Cost Analysis**: Real-time cost tracking and DePin vs Cloud comparison
- **Admin Dashboard**: Web-based metrics visualization

## Installation

```bash
npm install
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build
npm run build
```

## Usage

### Starting the Metrics Server

```bash
npm run dev
```

The server will start on port 9090 (configurable via `METRICS_PORT` environment variable).

### Endpoints

- **GET /metrics** - All Prometheus metrics
- **GET /metrics/storage** - Storage-specific metrics
- **GET /metrics/performance** - Performance metrics
- **GET /metrics/cost** - Cost tracking metrics
- **GET /health** - Health check
- **GET /status** - Detailed status information
- **POST /reset** - Reset all metrics (testing only)

### Using in Your Application

```typescript
import { PrometheusCollector, MetricsAggregator } from '@varity/monitoring';

// Initialize collector
const collector = new PrometheusCollector();
const aggregator = new MetricsAggregator(collector);

// Start aggregation
aggregator.start(30000);

// Record metrics
const storage = collector.getStorageMetrics();
storage.recordStorageUsage('customer-data', 'hot', 'filecoin', 'customer-123', 1024);

const performance = collector.getPerformanceMetrics();
performance.recordHttpRequest('GET', '/api/test', 200, 0.145);

const cost = collector.getCostMetrics();
cost.recordStorageMonthlyCost('customer-data', 'filecoin', 'hot', 25.00);

// Get metrics
const metrics = await collector.getAllMetrics();
console.log(metrics);
```

## Metrics Categories

### Storage Metrics

- `varity_storage_bytes` - Storage usage by layer/tier/backend
- `varity_uploads_total` - Upload operation count
- `varity_downloads_total` - Download operation count
- `varity_operation_duration_seconds` - Operation latency
- `varity_layer_document_count` - Document count per layer
- `varity_layer_total_bytes` - Total layer size

### Performance Metrics

- `varity_http_request_duration_seconds` - HTTP request latency
- `varity_db_query_duration_seconds` - Database query performance
- `varity_blockchain_tx_duration_seconds` - Blockchain transaction time
- `varity_llm_inference_duration_seconds` - LLM inference time
- `varity_cpu_usage_percent` - CPU utilization
- `varity_memory_usage_bytes` - Memory usage

### Cost Metrics

- `varity_storage_monthly_cost_usd` - Monthly storage costs
- `varity_compute_monthly_cost_usd` - Monthly compute costs
- `varity_customer_monthly_cost_usd` - Cost per customer
- `varity_profit_margin_percent` - Profit margin
- `varity_depin_cloud_savings_percent` - Cost savings vs cloud

### Blockchain Metrics

#### Block Metrics
- `varity_blockchain_block_height` - Current block height on Varity L3
- `varity_blockchain_block_time_seconds` - Time between blocks
- `varity_blockchain_avg_block_time_seconds` - Average block time (last 100 blocks)
- `varity_blockchain_block_gas_used` - Gas used per block
- `varity_blockchain_block_gas_limit` - Block gas limit

#### Transaction Metrics
- `varity_blockchain_tx_count` - Transactions per block
- `varity_blockchain_tx_throughput_per_second` - Transaction throughput
- `varity_blockchain_pending_tx_count` - Pending transactions in mempool
- `varity_blockchain_tx_success_total` - Successful transactions counter
- `varity_blockchain_tx_failure_total` - Failed transactions counter

#### Gas Metrics (USDC with 6 decimals)
- `varity_blockchain_gas_price_usdc` - Current gas price in USDC
- `varity_blockchain_avg_gas_price_usdc` - Average gas price
- `varity_blockchain_max_gas_price_usdc` - Maximum gas price
- `varity_blockchain_min_gas_price_usdc` - Minimum gas price
- `varity_blockchain_gas_price_distribution_usdc` - Gas price histogram

#### Network Metrics
- `varity_blockchain_network_hashrate` - Estimated network hash rate
- `varity_blockchain_peer_count` - Connected peers
- `varity_blockchain_syncing_status` - Node sync status (0=synced, 1=syncing)
- `varity_blockchain_rpc_latency_seconds` - RPC call latency
- `varity_blockchain_rpc_errors_total` - RPC errors by type

### Smart Contract Metrics

- `varity_contracts_deployed_total` - Total deployed contracts
- `varity_contract_calls_total` - Contract call count by contract
- `varity_contract_transactions_total` - Contract transactions
- `varity_contract_gas_used` - Gas used by contract
- `varity_contract_success_total` - Successful contract interactions
- `varity_contract_failure_total` - Failed contract interactions
- `varity_contract_revert_total` - Contract reverts with reasons
- `varity_contract_events_total` - Contract events emitted
- `varity_contract_balance_usdc` - Contract balance in USDC
- `varity_contract_code_size_bytes` - Contract bytecode size

### USDC Metrics

#### Supply Metrics
- `varity_usdc_total_supply` - Total USDC supply on Varity L3
- `varity_usdc_circulating_supply` - Circulating supply
- `varity_usdc_locked_supply` - USDC locked in contracts

#### Transaction Metrics
- `varity_usdc_transfers_total` - Total USDC transfers
- `varity_usdc_transfer_volume_total` - Total transfer volume
- `varity_usdc_avg_transaction_cost` - Average transaction cost in USDC
- `varity_usdc_transaction_fees_total` - Total fees collected

#### Bridge Metrics
- `varity_usdc_bridge_in_total` - USDC bridged in
- `varity_usdc_bridge_out_total` - USDC bridged out
- `varity_usdc_bridge_volume_24h` - 24h bridge volume
- `varity_usdc_bridge_duration_seconds` - Bridge operation time

#### Holder Metrics
- `varity_usdc_holders_total` - Total USDC holders
- `varity_usdc_active_addresses` - Active addresses by timeframe
- `varity_usdc_velocity` - USDC velocity ratio

### Node Health Metrics

- `varity_node_health_status` - Node health (1=healthy, 0=unhealthy)
- `varity_node_uptime_seconds` - Node uptime
- `varity_rpc_response_time_seconds` - RPC response time
- `varity_rpc_success_total` - Successful RPC calls
- `varity_rpc_failure_total` - Failed RPC calls
- `varity_rpc_timeout_total` - RPC timeouts
- `varity_rpc_rate_limit_total` - Rate limit hits
- `varity_rpc_error_rate_percent` - RPC error rate percentage

### Thirdweb SDK Metrics

- `varity_thirdweb_operations_total` - Total SDK operations
- `varity_thirdweb_success_total` - Successful operations
- `varity_thirdweb_failure_total` - Failed operations
- `varity_thirdweb_fallback_to_ethers_total` - Fallback to ethers.js count
- `varity_thirdweb_client_health` - Client health status
- `varity_thirdweb_read_operation_duration_seconds` - Read operation latency
- `varity_thirdweb_write_operation_duration_seconds` - Write operation latency

## Prometheus Integration

Add this job to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'varity-monitoring'
    static_configs:
      - targets: ['localhost:9090']
    scrape_interval: 30s
```

## Grafana Dashboards

Import the included Grafana dashboard template from `config/grafana-dashboard.json`.

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Architecture

### 3-Layer Storage Monitoring

The monitoring system tracks Varity's 3-layer storage architecture:

1. **Layer 1 - Varity Internal**: Company documents and knowledge base
2. **Layer 2 - Industry RAG**: Shared industry knowledge (10,000+ docs per industry)
3. **Layer 3 - Customer Data**: Customer-specific encrypted data

### Metrics Flow

```
Application → PrometheusCollector → Metrics Classes
                                    ↓
                                Storage Metrics
                                Performance Metrics
                                Cost Metrics
                                    ↓
                              Prometheus Format
                                    ↓
                              /metrics Endpoint
```

## Blockchain Metrics Usage

### Basic Setup

```typescript
import {
  BlockchainMetrics,
  ContractMetrics,
  USDCMetrics,
  NodeHealthMetrics,
  ThirdwebMetrics,
  BlockchainAlerts,
  MetricsAPI
} from '@varity/monitoring';

// Initialize collectors
const blockchainMetrics = new BlockchainMetrics(
  'https://varity-l3-rpc.example.com',
  'a35636133eb5ec6f30eb9f4c15fce2f3' // Thirdweb Client ID
);

const contractMetrics = new ContractMetrics('https://varity-l3-rpc.example.com');
const usdcMetrics = new USDCMetrics('https://varity-l3-rpc.example.com');
const nodeHealthMetrics = new NodeHealthMetrics();
const thirdwebMetrics = new ThirdwebMetrics();
const alerts = new BlockchainAlerts();

// Start continuous collection
blockchainMetrics.startCollection(30000); // Every 30 seconds
contractMetrics.startMonitoring(60000); // Every 60 seconds
usdcMetrics.startCollection(60000);
nodeHealthMetrics.startMonitoring('varity-l3', 30000);
```

### Configure Node Health Monitoring

```typescript
// Add RPC endpoints
nodeHealthMetrics.addEndpoint('primary', 'https://varity-l3-rpc1.example.com');
nodeHealthMetrics.addEndpoint('secondary', 'https://varity-l3-rpc2.example.com');
nodeHealthMetrics.addEndpoint('fallback', 'https://varity-l3-rpc3.example.com');

// Check endpoint health
const status = await nodeHealthMetrics.getEndpointStatus('varity-l3');
console.log('RPC Health:', status);
```

### Configure Alerts

```typescript
// Add custom alert thresholds
alerts.addThreshold({
  metric: 'gas_price_usdc',
  condition: 'above',
  threshold: 2.0,
  severity: 'warning',
  message: 'Gas prices elevated on Varity L3'
});

// Listen for alerts
alerts.on('alert', (alert) => {
  console.error(`[${alert.severity}] ${alert.message}`);
  // Send notification, log to monitoring system, etc.
});

// Check metrics against thresholds
alerts.checkMetric('gas_price_usdc', 2.5);
```

### Record Custom Metrics

```typescript
// Record blockchain events
blockchainMetrics.recordTransactionSuccess('varity-l3');
blockchainMetrics.recordTransactionFailure('varity-l3');
blockchainMetrics.recordBlockReorg(3, 'varity-l3');

// Record contract interactions
contractMetrics.recordContractCall('varity-l3', '0x123...', 'transfer', 0.05);
contractMetrics.recordContractTransaction(
  'varity-l3',
  '0x123...',
  'mint',
  50000,
  2.5,
  'success'
);

// Record USDC activity
usdcMetrics.recordUsdcTransfer('varity-l3', 1000, 'transfer');
usdcMetrics.recordTransactionCost('varity-l3', 21000, BigInt(1000000), 'transfer');
usdcMetrics.recordBridgeActivity('varity-l3', 'in', 10000, 'arbitrum-one', 300);

// Track Thirdweb SDK operations
await thirdwebMetrics.recordOperation('blockchain', 'getBlockNumber', async () => {
  return await provider.getBlockNumber();
});
```

### REST API Endpoints

```typescript
import express from 'express';

const app = express();

// Initialize API
const metricsAPI = new MetricsAPI(
  blockchainMetrics,
  contractMetrics,
  usdcMetrics,
  nodeHealthMetrics,
  thirdwebMetrics,
  alerts
);

// Mount API routes
app.use('/api/metrics', metricsAPI.getRouter());

// Start server
app.listen(9090, () => {
  console.log('Metrics API running on http://localhost:9090');
});
```

### Available API Endpoints

- `GET /api/metrics/blockchain` - Current blockchain statistics
- `GET /api/metrics/contracts` - Contract analytics
- `GET /api/metrics/contracts/top` - Top contracts by activity
- `GET /api/metrics/gas` - Gas price statistics
- `GET /api/metrics/health` - RPC health status
- `GET /api/metrics/usdc` - USDC metrics
- `GET /api/metrics/usdc/supply` - USDC supply details
- `GET /api/metrics/alerts` - Active alerts
- `GET /api/metrics/summary` - Overall system summary
- `GET /api/metrics/prometheus` - All metrics in Prometheus format

### Query Examples

```bash
# Get current blockchain metrics
curl http://localhost:9090/api/metrics/blockchain

# Get gas price statistics
curl http://localhost:9090/api/metrics/gas

# Get node health
curl http://localhost:9090/api/metrics/health

# Get USDC metrics
curl http://localhost:9090/api/metrics/usdc

# Get active alerts
curl http://localhost:9090/api/metrics/alerts/active?severity=critical

# Get system summary
curl http://localhost:9090/api/metrics/summary

# Get Prometheus metrics
curl http://localhost:9090/api/metrics/prometheus
```

## Alerting System

The blockchain metrics package includes a comprehensive alerting system:

### Default Alert Thresholds

- Gas price above 1.0 USDC → Warning
- Gas price above 5.0 USDC → Critical
- RPC error rate above 10% → Warning
- RPC error rate above 50% → Critical
- Block time above 5 seconds → Warning
- Node out of sync → Critical

### Custom Alerts

```typescript
// Add custom threshold
alerts.addThreshold({
  metric: 'tx_throughput',
  condition: 'below',
  threshold: 1.0,
  severity: 'warning',
  message: 'Low transaction throughput detected'
});

// Get active alerts
const activeAlerts = alerts.getActiveAlerts();

// Get alerts by severity
const criticalAlerts = alerts.getAlertsBySeverity('critical');

// Get alert summary
const summary = alerts.getAlertSummary();
console.log(`Total alerts: ${summary.total}`);
console.log(`Critical: ${summary.critical}`);
console.log(`Warning: ${summary.warning}`);
```

## Varity L3 Configuration

### Chain Configuration

- **Chain ID**: 33529
- **Native Gas Token**: USDC (6 decimals)
- **RPC Endpoints**: Configure via NodeHealthMetrics
- **Thirdweb Client ID**: a35636133eb5ec6f30eb9f4c15fce2f3

### USDC Decimal Handling

All USDC values are automatically formatted with 6 decimals:

```typescript
// Gas price in wei
const gasPriceWei = BigInt(1000000); // 1000000 wei

// Automatically converted to USDC (6 decimals)
// Result: 0.001 USDC
usdcMetrics.recordTransactionCost('varity-l3', 21000, gasPriceWei, 'transfer');
```

## Grafana Dashboard

Import the included Grafana dashboard for blockchain metrics visualization:

```bash
# Dashboard includes:
# - Real-time block height and block time
# - Transaction throughput and success rates
# - Gas price trends (USDC)
# - Contract deployment and interaction stats
# - USDC supply and transaction volume
# - RPC health and response times
# - Active alerts panel
```

## Configuration

Environment variables (see `.env.example`):

- `METRICS_PORT` - Metrics server port (default: 9090)
- `DEFAULT_METRICS_INTERVAL` - Default metrics collection interval (default: 10000ms)
- `AGGREGATION_INTERVAL` - Metrics aggregation interval (default: 30000ms)
- `VARITY_L3_RPC_URL` - Varity L3 RPC endpoint
- `THIRDWEB_CLIENT_ID` - Thirdweb client ID

## License

MIT
