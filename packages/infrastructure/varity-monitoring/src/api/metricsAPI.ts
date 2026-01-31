import express, { Request, Response, Router } from 'express';
import { BlockchainMetrics } from '../collectors/blockchainMetrics';
import { ContractMetrics } from '../collectors/contractMetrics';
import { USDCMetrics } from '../collectors/usdcMetrics';
import { NodeHealthMetrics } from '../collectors/nodeHealth';
import { ThirdwebMetrics } from '../collectors/thirdwebMetrics';
import { BlockchainAlerts } from '../alerts/blockchainAlerts';

/**
 * MetricsAPI - REST API endpoints for blockchain metrics
 *
 * Endpoints:
 * - GET /metrics/blockchain - Current blockchain statistics
 * - GET /metrics/contracts - Contract analytics
 * - GET /metrics/gas - Gas price history and statistics
 * - GET /metrics/health - System health status
 * - GET /metrics/usdc - USDC-specific metrics
 * - GET /metrics/alerts - Active alerts
 * - GET /metrics/summary - Overall system summary
 */
export class MetricsAPI {
  private router: Router;
  private blockchainMetrics: BlockchainMetrics;
  private contractMetrics: ContractMetrics;
  private usdcMetrics: USDCMetrics;
  private nodeHealthMetrics: NodeHealthMetrics;
  private thirdwebMetrics: ThirdwebMetrics;
  private alerts: BlockchainAlerts;

  constructor(
    blockchainMetrics: BlockchainMetrics,
    contractMetrics: ContractMetrics,
    usdcMetrics: USDCMetrics,
    nodeHealthMetrics: NodeHealthMetrics,
    thirdwebMetrics: ThirdwebMetrics,
    alerts: BlockchainAlerts
  ) {
    this.router = express.Router();
    this.blockchainMetrics = blockchainMetrics;
    this.contractMetrics = contractMetrics;
    this.usdcMetrics = usdcMetrics;
    this.nodeHealthMetrics = nodeHealthMetrics;
    this.thirdwebMetrics = thirdwebMetrics;
    this.alerts = alerts;

    this.setupRoutes();
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Blockchain metrics
    this.router.get('/blockchain', this.getBlockchainMetrics.bind(this));
    this.router.get('/blockchain/prometheus', this.getBlockchainPrometheus.bind(this));

    // Contract metrics
    this.router.get('/contracts', this.getContractMetrics.bind(this));
    this.router.get('/contracts/top', this.getTopContracts.bind(this));
    this.router.get('/contracts/:address', this.getContractDetails.bind(this));

    // Gas metrics
    this.router.get('/gas', this.getGasMetrics.bind(this));
    this.router.get('/gas/history', this.getGasHistory.bind(this));

    // Health metrics
    this.router.get('/health', this.getHealthMetrics.bind(this));
    this.router.get('/health/endpoints', this.getEndpointHealth.bind(this));

    // USDC metrics
    this.router.get('/usdc', this.getUSDCMetrics.bind(this));
    this.router.get('/usdc/supply', this.getUSDCSupply.bind(this));
    this.router.get('/usdc/transactions', this.getUSDCTransactions.bind(this));

    // Thirdweb metrics
    this.router.get('/thirdweb', this.getThirdwebMetrics.bind(this));

    // Alert endpoints
    this.router.get('/alerts', this.getAlerts.bind(this));
    this.router.get('/alerts/active', this.getActiveAlerts.bind(this));
    this.router.get('/alerts/history', this.getAlertHistory.bind(this));
    this.router.get('/alerts/summary', this.getAlertSummary.bind(this));

    // Summary endpoint
    this.router.get('/summary', this.getSystemSummary.bind(this));

    // Prometheus format for all metrics
    this.router.get('/prometheus', this.getAllPrometheusMetrics.bind(this));
  }

  /**
   * GET /metrics/blockchain - Current blockchain statistics
   */
  private async getBlockchainMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.blockchainMetrics.getMetrics();
      const parsed = this.parsePrometheusMetrics(metrics);

      res.json({
        success: true,
        data: {
          blockHeight: parsed.varity_blockchain_block_height || 0,
          blockTime: parsed.varity_blockchain_block_time_seconds || 0,
          avgBlockTime: parsed.varity_blockchain_avg_block_time_seconds || 0,
          gasPrice: parsed.varity_blockchain_gas_price_usdc || 0,
          txThroughput: parsed.varity_blockchain_tx_throughput_per_second || 0,
          pendingTxCount: parsed.varity_blockchain_pending_tx_count || 0
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /metrics/blockchain/prometheus - Blockchain metrics in Prometheus format
   */
  private async getBlockchainPrometheus(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.blockchainMetrics.getMetrics();
      res.set('Content-Type', 'text/plain');
      res.send(metrics);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /metrics/contracts - Contract analytics
   */
  private async getContractMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.contractMetrics.getMetrics();
      const parsed = this.parsePrometheusMetrics(metrics);

      res.json({
        success: true,
        data: {
          deployedContracts: parsed.varity_contracts_deployed_total || 0,
          totalCalls: parsed.varity_contract_calls_total || 0,
          totalTransactions: parsed.varity_contract_transactions_total || 0,
          successRate: this.calculateSuccessRate(
            parsed.varity_contract_success_total || 0,
            parsed.varity_contract_failure_total || 0
          )
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /metrics/contracts/top - Top contracts by interaction count
   */
  private async getTopContracts(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const topContracts = await this.contractMetrics.getTopContracts(limit);

      res.json({
        success: true,
        data: topContracts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /metrics/contracts/:address - Contract details
   */
  private async getContractDetails(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      const metrics = await this.contractMetrics.getMetrics();

      res.json({
        success: true,
        data: {
          address,
          // This would typically query specific contract metrics
          metrics: 'Contract-specific metrics would go here'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /metrics/gas - Gas price metrics
   */
  private async getGasMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.blockchainMetrics.getMetrics();
      const parsed = this.parsePrometheusMetrics(metrics);

      res.json({
        success: true,
        data: {
          current: parsed.varity_blockchain_gas_price_usdc || 0,
          average: parsed.varity_blockchain_avg_gas_price_usdc || 0,
          max: parsed.varity_blockchain_max_gas_price_usdc || 0,
          min: parsed.varity_blockchain_min_gas_price_usdc || 0
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /metrics/gas/history - Gas price history
   */
  private async getGasHistory(req: Request, res: Response): Promise<void> {
    try {
      // This would typically query historical data from a time-series database
      res.json({
        success: true,
        data: {
          history: [],
          message: 'Historical data would be retrieved from time-series database'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /metrics/health - System health status
   */
  private async getHealthMetrics(req: Request, res: Response): Promise<void> {
    try {
      const chain = req.query.chain as string || 'varity-l3';
      const endpointStatus = await this.nodeHealthMetrics.getEndpointStatus(chain);

      const healthyEndpoints = endpointStatus.filter(e => e.healthy).length;
      const totalEndpoints = endpointStatus.length;

      res.json({
        success: true,
        data: {
          overall: healthyEndpoints === totalEndpoints ? 'healthy' : 'degraded',
          healthyEndpoints,
          totalEndpoints,
          endpoints: endpointStatus
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /metrics/health/endpoints - Detailed endpoint health
   */
  private async getEndpointHealth(req: Request, res: Response): Promise<void> {
    try {
      const chain = req.query.chain as string || 'varity-l3';
      const endpoints = await this.nodeHealthMetrics.getEndpointStatus(chain);

      res.json({
        success: true,
        data: endpoints
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /metrics/usdc - USDC metrics
   */
  private async getUSDCMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.usdcMetrics.getMetrics();
      const parsed = this.parsePrometheusMetrics(metrics);

      res.json({
        success: true,
        data: {
          totalSupply: parsed.varity_usdc_total_supply || 0,
          circulatingSupply: parsed.varity_usdc_circulating_supply || 0,
          lockedSupply: parsed.varity_usdc_locked_supply || 0,
          holders: parsed.varity_usdc_holders_total || 0,
          transfers: parsed.varity_usdc_transfers_total || 0,
          avgTransactionCost: parsed.varity_usdc_avg_transaction_cost || 0
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /metrics/usdc/supply - USDC supply metrics
   */
  private async getUSDCSupply(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.usdcMetrics.getMetrics();
      const parsed = this.parsePrometheusMetrics(metrics);

      res.json({
        success: true,
        data: {
          total: parsed.varity_usdc_total_supply || 0,
          circulating: parsed.varity_usdc_circulating_supply || 0,
          locked: parsed.varity_usdc_locked_supply || 0
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /metrics/usdc/transactions - USDC transaction metrics
   */
  private async getUSDCTransactions(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.usdcMetrics.getMetrics();
      const parsed = this.parsePrometheusMetrics(metrics);

      res.json({
        success: true,
        data: {
          total: parsed.varity_usdc_transfers_total || 0,
          volume: parsed.varity_usdc_transfer_volume_total || 0,
          avgCost: parsed.varity_usdc_avg_transaction_cost || 0
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /metrics/thirdweb - Thirdweb SDK metrics
   */
  private async getThirdwebMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.thirdwebMetrics.getMetrics();
      const parsed = this.parsePrometheusMetrics(metrics);

      res.json({
        success: true,
        data: {
          totalOperations: parsed.varity_thirdweb_operations_total || 0,
          successCount: parsed.varity_thirdweb_success_total || 0,
          failureCount: parsed.varity_thirdweb_failure_total || 0,
          fallbackCount: parsed.varity_thirdweb_fallback_to_ethers_total || 0
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /metrics/alerts - All alerts
   */
  private async getAlerts(req: Request, res: Response): Promise<void> {
    try {
      const alerts = this.alerts.getActiveAlerts();

      res.json({
        success: true,
        data: alerts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /metrics/alerts/active - Active alerts only
   */
  private async getActiveAlerts(req: Request, res: Response): Promise<void> {
    try {
      const severity = req.query.severity as 'critical' | 'warning' | 'info' | undefined;

      const alerts = severity
        ? this.alerts.getAlertsBySeverity(severity)
        : this.alerts.getActiveAlerts();

      res.json({
        success: true,
        data: alerts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /metrics/alerts/history - Alert history
   */
  private async getAlertHistory(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const history = this.alerts.getAlertHistory(limit);

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /metrics/alerts/summary - Alert summary
   */
  private async getAlertSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = this.alerts.getAlertSummary();

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /metrics/summary - Overall system summary
   */
  private async getSystemSummary(req: Request, res: Response): Promise<void> {
    try {
      const [blockchain, contracts, usdc, health, alerts] = await Promise.all([
        this.blockchainMetrics.getMetrics(),
        this.contractMetrics.getMetrics(),
        this.usdcMetrics.getMetrics(),
        this.nodeHealthMetrics.getMetrics(),
        Promise.resolve(this.alerts.getAlertSummary())
      ]);

      const blockchainParsed = this.parsePrometheusMetrics(blockchain);
      const contractsParsed = this.parsePrometheusMetrics(contracts);
      const usdcParsed = this.parsePrometheusMetrics(usdc);

      res.json({
        success: true,
        data: {
          blockchain: {
            blockHeight: blockchainParsed.varity_blockchain_block_height || 0,
            gasPrice: blockchainParsed.varity_blockchain_gas_price_usdc || 0,
            txThroughput: blockchainParsed.varity_blockchain_tx_throughput_per_second || 0
          },
          contracts: {
            deployed: contractsParsed.varity_contracts_deployed_total || 0,
            interactions: contractsParsed.varity_contract_calls_total || 0
          },
          usdc: {
            totalSupply: usdcParsed.varity_usdc_total_supply || 0,
            holders: usdcParsed.varity_usdc_holders_total || 0
          },
          alerts: alerts,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /metrics/prometheus - All metrics in Prometheus format
   */
  private async getAllPrometheusMetrics(req: Request, res: Response): Promise<void> {
    try {
      const [blockchain, contracts, usdc, health, thirdweb] = await Promise.all([
        this.blockchainMetrics.getMetrics(),
        this.contractMetrics.getMetrics(),
        this.usdcMetrics.getMetrics(),
        this.nodeHealthMetrics.getMetrics(),
        this.thirdwebMetrics.getMetrics()
      ]);

      const allMetrics = [blockchain, contracts, usdc, health, thirdweb]
        .filter(m => m.trim().length > 0)
        .join('\n\n');

      res.set('Content-Type', 'text/plain');
      res.send(allMetrics);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Parse Prometheus metrics into key-value pairs
   */
  private parsePrometheusMetrics(metrics: string): Record<string, number> {
    const result: Record<string, number> = {};
    const lines = metrics.split('\n');

    for (const line of lines) {
      if (line.startsWith('#') || line.trim().length === 0) {
        continue;
      }

      const match = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*(?:\{[^}]+\})?)(\s+)(-?[\d.]+(?:e[+-]?\d+)?)/);
      if (match) {
        const [, metricName, , value] = match;
        const cleanName = metricName.replace(/\{.*\}/, '');
        result[cleanName] = parseFloat(value);
      }
    }

    return result;
  }

  /**
   * Calculate success rate
   */
  private calculateSuccessRate(success: number, failure: number): number {
    const total = success + failure;
    return total > 0 ? (success / total) * 100 : 100;
  }

  /**
   * Get router
   */
  getRouter(): Router {
    return this.router;
  }
}
