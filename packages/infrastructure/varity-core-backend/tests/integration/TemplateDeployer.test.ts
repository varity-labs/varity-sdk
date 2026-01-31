/**
 * Template Deployer Integration Tests
 */

import { TemplateDeployer } from '../../src/services/TemplateDeployer';
import { ContractManager } from '../../src/services/ContractManager';
import { FilecoinClient } from '../../src/depin/FilecoinClient';
import { AkashClient } from '../../src/depin/AkashClient';
import { CelestiaClient } from '../../src/depin/CelestiaClient';
import { LitProtocolClient } from '../../src/crypto/LitProtocol';

describe('TemplateDeployer Integration', () => {
  let templateDeployer: TemplateDeployer;
  let contractManager: ContractManager;
  let filecoinClient: FilecoinClient;
  let akashClient: AkashClient;
  let celestiaClient: CelestiaClient;
  let litClient: LitProtocolClient;

  beforeAll(async () => {
    // Initialize all dependencies
    const networkConfig = ContractManager.getArbitrumSepoliaConfig();
    contractManager = new ContractManager(networkConfig);

    filecoinClient = new FilecoinClient({
      pinataApiKey: process.env.PINATA_API_KEY || 'test-key',
      pinataSecretKey: process.env.PINATA_SECRET_KEY || 'test-secret',
      gatewayUrl: 'https://gateway.pinata.cloud',
    });

    akashClient = new AkashClient({
      rpcEndpoint: 'https://rpc.akash.forbole.com',
      defaultResourceConfig: {
        cpu: 2000,
        memory: 4096,
        storage: 50,
      },
    });

    celestiaClient = new CelestiaClient({
      rpcEndpoint: 'https://rpc.celestia.test',
      namespace: 'varity-test',
      enableZKProofs: true,
    });

    litClient = new LitProtocolClient();

    templateDeployer = new TemplateDeployer(
      contractManager,
      filecoinClient,
      akashClient,
      celestiaClient,
      litClient
    );
  });

  describe('template deployment', () => {
    it('should deploy finance template successfully', async () => {
      const params = {
        industry: 'finance' as const,
        customization: {
          branding: {
            companyName: 'Test Finance Co',
            primaryColor: '#1E40AF',
            secondaryColor: '#3B82F6',
          },
          modules: ['accounting', 'invoicing', 'financial-reporting'],
          integrations: {
            quickbooks: true,
            stripe: true,
          },
          compliance: {
            required: ['SOX', 'GDPR'],
            enabled: true,
          },
        },
        l3Network: ContractManager.getArbitrumSepoliaConfig(),
        customerWallet: '0x1234567890123456789012345678901234567890',
        customerId: 'test-customer-001',
      };

      const result = await templateDeployer.deploy(params);

      expect(result.success).toBe(true);
      expect(result.dashboardUrl).toBeDefined();
      expect(result.contractAddresses).toBeDefined();
      expect(result.contractAddresses.registry).toBeDefined();
      expect(result.storageReferences.configCID).toBeDefined();
      expect(result.estimatedMonthlyCost).toBeGreaterThan(0);
    }, 30000); // 30 second timeout

    it('should deploy healthcare template successfully', async () => {
      const params = {
        industry: 'healthcare' as const,
        customization: {
          branding: {
            companyName: 'Test Healthcare',
            primaryColor: '#059669',
            secondaryColor: '#10B981',
          },
          modules: ['patient-management', 'appointment-scheduling', 'medical-records'],
          integrations: {
            epic: true,
          },
          compliance: {
            required: ['HIPAA'],
            enabled: true,
          },
        },
        l3Network: ContractManager.getArbitrumSepoliaConfig(),
        customerWallet: '0x2345678901234567890123456789012345678901',
        customerId: 'test-customer-002',
      };

      const result = await templateDeployer.deploy(params);

      expect(result.success).toBe(true);
      expect(result.dashboardUrl).toContain('test-customer-002');
      expect(result.estimatedMonthlyCost).toBeLessThan(300); // Should be < $300/month
    }, 30000);

    it('should deploy retail template successfully', async () => {
      const params = {
        industry: 'retail' as const,
        customization: {
          branding: {
            companyName: 'Test Retail Store',
            primaryColor: '#DC2626',
            secondaryColor: '#EF4444',
          },
          modules: ['inventory-management', 'point-of-sale', 'e-commerce'],
          integrations: {
            shopify: true,
            square: true,
          },
          compliance: {
            required: ['PCI-DSS'],
            enabled: true,
          },
        },
        l3Network: ContractManager.getArbitrumSepoliaConfig(),
        customerWallet: '0x3456789012345678901234567890123456789012',
        customerId: 'test-customer-003',
      };

      const result = await templateDeployer.deploy(params);

      expect(result.success).toBe(true);
      expect(result.storageReferences).toBeDefined();
    }, 30000);

    it('should deploy ISO template successfully', async () => {
      const params = {
        industry: 'iso' as const,
        customization: {
          branding: {
            companyName: 'Test ISO Merchant',
            primaryColor: '#7C3AED',
            secondaryColor: '#8B5CF6',
          },
          modules: ['merchant-onboarding', 'payment-processing', 'risk-management'],
          integrations: {
            stripe: true,
          },
          compliance: {
            required: ['PCI-DSS', 'KYC'],
            enabled: true,
          },
        },
        l3Network: ContractManager.getArbitrumSepoliaConfig(),
        customerWallet: '0x4567890123456789012345678901234567890123',
        customerId: 'test-customer-004',
      };

      const result = await templateDeployer.deploy(params);

      expect(result.success).toBe(true);
    }, 30000);
  });

  describe('deployment status', () => {
    it('should get deployment status', async () => {
      const status = await templateDeployer.getDeploymentStatus('test-customer-001');
      expect(status).toBeDefined();
      expect(status.customerId).toBe('test-customer-001');
    });
  });
});
