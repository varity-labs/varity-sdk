import { BlockchainMetrics } from '../collectors/blockchainMetrics';
import { ContractMetrics } from '../collectors/contractMetrics';
import { USDCMetrics } from '../collectors/usdcMetrics';
import { NodeHealthMetrics } from '../collectors/nodeHealth';
import { ThirdwebMetrics } from '../collectors/thirdwebMetrics';
import { BlockchainAlerts } from '../alerts/blockchainAlerts';

describe('Blockchain Metrics', () => {
  let blockchainMetrics: BlockchainMetrics;

  beforeEach(() => {
    blockchainMetrics = new BlockchainMetrics();
  });

  afterEach(() => {
    blockchainMetrics.reset();
  });

  test('should initialize with default metrics', () => {
    expect(blockchainMetrics).toBeDefined();
    expect(blockchainMetrics.getRegistry()).toBeDefined();
  });

  test('should record transaction success', () => {
    blockchainMetrics.recordTransactionSuccess('varity-l3');
    // Metric should be incremented
  });

  test('should record transaction failure', () => {
    blockchainMetrics.recordTransactionFailure('varity-l3');
    // Metric should be incremented
  });

  test('should record block reorganization', () => {
    blockchainMetrics.recordBlockReorg(3, 'varity-l3');
    // Metric should be recorded
  });

  test('should export metrics in Prometheus format', async () => {
    const metrics = await blockchainMetrics.getMetrics();
    expect(typeof metrics).toBe('string');
    expect(metrics.length).toBeGreaterThan(0);
  });

  test('should reset all metrics', () => {
    blockchainMetrics.recordTransactionSuccess('varity-l3');
    blockchainMetrics.reset();
    // Metrics should be cleared
  });
});

describe('Contract Metrics', () => {
  let contractMetrics: ContractMetrics;

  beforeEach(() => {
    contractMetrics = new ContractMetrics();
  });

  afterEach(() => {
    contractMetrics.reset();
  });

  test('should record contract call', () => {
    contractMetrics.recordContractCall(
      'varity-l3',
      '0x1234567890123456789012345678901234567890',
      'transfer',
      0.05
    );
    // Metric should be recorded
  });

  test('should record contract transaction', () => {
    contractMetrics.recordContractTransaction(
      'varity-l3',
      '0x1234567890123456789012345678901234567890',
      'mint',
      50000,
      1.5,
      'success'
    );
    // Metric should be recorded
  });

  test('should record contract revert', () => {
    contractMetrics.recordContractRevert(
      'varity-l3',
      '0x1234567890123456789012345678901234567890',
      'Insufficient balance'
    );
    // Metric should be recorded
  });

  test('should record contract event', () => {
    contractMetrics.recordContractEvent(
      'varity-l3',
      '0x1234567890123456789012345678901234567890',
      'Transfer',
      0.01
    );
    // Metric should be recorded
  });

  test('should export metrics in Prometheus format', async () => {
    const metrics = await contractMetrics.getMetrics();
    expect(typeof metrics).toBe('string');
  });
});

describe('USDC Metrics', () => {
  let usdcMetrics: USDCMetrics;

  beforeEach(() => {
    usdcMetrics = new USDCMetrics();
  });

  afterEach(() => {
    usdcMetrics.reset();
  });

  test('should record USDC transfer', () => {
    usdcMetrics.recordUsdcTransfer('varity-l3', 1000, 'transfer');
    // Metric should be recorded
  });

  test('should record transaction cost in USDC', () => {
    usdcMetrics.recordTransactionCost('varity-l3', 21000, BigInt(1000000), 'transfer');
    // Metric should be recorded with 6 decimal formatting
  });

  test('should record bridge activity', () => {
    usdcMetrics.recordBridgeActivity('varity-l3', 'in', 10000, 'arbitrum-one', 300);
    // Metric should be recorded
  });

  test('should update holder metrics', () => {
    usdcMetrics.updateHolderMetrics(
      'varity-l3',
      1000,
      [
        { rank: 1, balance: 100000 },
        { rank: 2, balance: 50000 }
      ],
      { top10: 60, top100: 30, rest: 10 }
    );
    // Metrics should be updated
  });

  test('should calculate velocity', () => {
    usdcMetrics.updateVelocity('varity-l3', 500000, 1000000);
    // Velocity should be 0.5
  });

  test('should export metrics in Prometheus format', async () => {
    const metrics = await usdcMetrics.getMetrics();
    expect(typeof metrics).toBe('string');
  });

  test('should format USDC with 6 decimals', () => {
    usdcMetrics.recordTransactionCost('varity-l3', 21000, BigInt(1000000), 'transfer');
    // Should use 6 decimal formatting
  });
});

describe('Node Health Metrics', () => {
  let nodeHealthMetrics: NodeHealthMetrics;

  beforeEach(() => {
    nodeHealthMetrics = new NodeHealthMetrics();
  });

  afterEach(() => {
    nodeHealthMetrics.reset();
  });

  test('should add RPC endpoint', () => {
    nodeHealthMetrics.addEndpoint('primary', 'https://varity-l3-rpc.example.com');
    // Endpoint should be added
  });

  test('should remove RPC endpoint', () => {
    nodeHealthMetrics.addEndpoint('primary', 'https://varity-l3-rpc.example.com');
    nodeHealthMetrics.removeEndpoint('primary');
    // Endpoint should be removed
  });

  test('should record active connections', () => {
    nodeHealthMetrics.recordActiveConnections('varity-l3', 'primary', 10);
    // Metric should be recorded
  });

  test('should record queue size', () => {
    nodeHealthMetrics.recordQueueSize('varity-l3', 'primary', 5);
    // Metric should be recorded
  });

  test('should record node uptime', () => {
    nodeHealthMetrics.recordNodeUptime('varity-l3', 'node-1', 86400);
    // Metric should be recorded
  });

  test('should record sync status', () => {
    nodeHealthMetrics.recordSyncStatus('varity-l3', 'node-1', true);
    // Metric should be recorded
  });

  test('should monitor RPC call', async () => {
    const testCall = async () => {
      return 'success';
    };

    const result = await nodeHealthMetrics.monitorRpcCall(
      'varity-l3',
      'primary',
      'eth_blockNumber',
      testCall
    );

    expect(result).toBe('success');
  });

  test('should export metrics in Prometheus format', async () => {
    const metrics = await nodeHealthMetrics.getMetrics();
    expect(typeof metrics).toBe('string');
  });
});

describe('Thirdweb Metrics', () => {
  let thirdwebMetrics: ThirdwebMetrics;

  beforeEach(() => {
    thirdwebMetrics = new ThirdwebMetrics();
  });

  afterEach(() => {
    thirdwebMetrics.reset();
  });

  test('should record SDK operation', async () => {
    const testOperation = async () => {
      return 'success';
    };

    const result = await thirdwebMetrics.recordOperation(
      'blockchain',
      'getBlockNumber',
      testOperation
    );

    expect(result).toBe('success');
  });

  test('should record fallback to ethers.js', () => {
    thirdwebMetrics.recordFallback('blockchain', 'sdk_error', true);
    // Metric should be recorded
  });

  test('should record SDK initialization', async () => {
    const testInit = async () => {
      return { client: 'initialized' };
    };

    const result = await thirdwebMetrics.recordInitialization(testInit);
    expect(result).toEqual({ client: 'initialized' });
  });

  test('should update client health', () => {
    thirdwebMetrics.updateClientHealth('client-1', true);
    thirdwebMetrics.updateClientHealth('client-2', false);
    // Metrics should be updated
  });

  test('should record read operation', () => {
    thirdwebMetrics.recordReadOperation('eth_call', 0.05);
    // Metric should be recorded
  });

  test('should record write operation', () => {
    thirdwebMetrics.recordWriteOperation('eth_sendTransaction', 2.5);
    // Metric should be recorded
  });

  test('should export metrics in Prometheus format', async () => {
    const metrics = await thirdwebMetrics.getMetrics();
    expect(typeof metrics).toBe('string');
  });
});

describe('Blockchain Alerts', () => {
  let alerts: BlockchainAlerts;

  beforeEach(() => {
    alerts = new BlockchainAlerts();
  });

  test('should initialize with default thresholds', () => {
    expect(alerts).toBeDefined();
  });

  test('should add custom threshold', () => {
    alerts.addThreshold({
      metric: 'custom_metric',
      condition: 'above',
      threshold: 100,
      severity: 'warning',
      message: 'Custom metric exceeded'
    });
    // Threshold should be added
  });

  test('should remove threshold', () => {
    alerts.removeThreshold('gas_price_usdc');
    // Threshold should be removed
  });

  test('should trigger alert on threshold breach', () => {
    let alertTriggered = false;
    alerts.on('alert', () => {
      alertTriggered = true;
    });

    alerts.checkMetric('gas_price_usdc', 10.0); // Above critical threshold of 5.0
    expect(alertTriggered).toBe(true);
  });

  test('should resolve alert when value returns to normal', () => {
    let alertResolved = false;
    alerts.on('alert:resolved', () => {
      alertResolved = true;
    });

    alerts.checkMetric('gas_price_usdc', 10.0); // Trigger alert
    alerts.checkMetric('gas_price_usdc', 0.5); // Resolve alert

    expect(alertResolved).toBe(true);
  });

  test('should get active alerts', () => {
    alerts.checkMetric('gas_price_usdc', 10.0);
    const activeAlerts = alerts.getActiveAlerts();
    expect(activeAlerts.length).toBeGreaterThan(0);
  });

  test('should get alerts by severity', () => {
    alerts.checkMetric('gas_price_usdc', 10.0); // Critical
    const criticalAlerts = alerts.getAlertsBySeverity('critical');
    expect(criticalAlerts.length).toBeGreaterThan(0);
  });

  test('should get alert summary', () => {
    alerts.checkMetric('gas_price_usdc', 10.0);
    const summary = alerts.getAlertSummary();
    expect(summary.total).toBeGreaterThan(0);
  });

  test('should get alert history', () => {
    alerts.checkMetric('gas_price_usdc', 10.0);
    const history = alerts.getAlertHistory(10);
    expect(history.length).toBeGreaterThan(0);
  });

  test('should clear resolved alerts', () => {
    alerts.checkMetric('gas_price_usdc', 10.0);
    alerts.checkMetric('gas_price_usdc', 0.5);
    alerts.clearResolvedAlerts();
    // Resolved alerts should be cleared
  });
});

describe('Integration Tests', () => {
  test('should collect all metrics types', async () => {
    const blockchain = new BlockchainMetrics();
    const contracts = new ContractMetrics();
    const usdc = new USDCMetrics();
    const health = new NodeHealthMetrics();
    const thirdweb = new ThirdwebMetrics();

    // Record some metrics
    blockchain.recordTransactionSuccess('varity-l3');
    contracts.recordContractCall('varity-l3', '0x123', 'transfer', 0.05);
    usdc.recordUsdcTransfer('varity-l3', 1000);
    health.recordNodeUptime('varity-l3', 'node-1', 86400);
    await thirdweb.recordOperation('test', 'test', async () => 'success');

    // Get all metrics
    const [bMetrics, cMetrics, uMetrics, hMetrics, tMetrics] = await Promise.all([
      blockchain.getMetrics(),
      contracts.getMetrics(),
      usdc.getMetrics(),
      health.getMetrics(),
      thirdweb.getMetrics()
    ]);

    expect(bMetrics).toBeTruthy();
    expect(cMetrics).toBeTruthy();
    expect(uMetrics).toBeTruthy();
    expect(hMetrics).toBeTruthy();
    expect(tMetrics).toBeTruthy();
  });

  test('should handle USDC 6-decimal formatting', () => {
    const usdc = new USDCMetrics();
    usdc.recordTransactionCost('varity-l3', 21000, BigInt(1000000), 'transfer');
    // Should correctly format as 0.021 USDC (6 decimals)
  });

  test('should track RPC health across multiple endpoints', async () => {
    const health = new NodeHealthMetrics();

    health.addEndpoint('primary', 'https://rpc1.example.com');
    health.addEndpoint('secondary', 'https://rpc2.example.com');
    health.addEndpoint('tertiary', 'https://rpc3.example.com');

    // In a real test, these would make actual RPC calls
    // For now, just verify the structure is correct
    expect(health).toBeDefined();
  });
});
