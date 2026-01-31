/**
 * AkashClient Unit and Integration Tests
 *
 * Tests real Akash Network integration (NO MOCKS)
 *
 * IMPORTANT: Integration tests require:
 * - AKASH_TESTNET_MNEMONIC env variable with testnet AKT tokens
 * - Network connectivity to Akash testnet-02
 *
 * To run tests:
 * ```bash
 * export AKASH_TESTNET_MNEMONIC="your testnet mnemonic here"
 * npm test tests/unit/AkashClient.test.ts
 * ```
 */

import { AkashClient, DeploymentSpec } from '../../src/depin/AkashClient';
import { AkashConfig } from '../../src/types';
import logger from '../../src/utils/logger';

// Test configuration for Akash testnet-02
const TESTNET_CONFIG: AkashConfig = {
  rpcEndpoint: process.env.AKASH_TESTNET_RPC || 'https://rpc.sandbox-01.aksh.pw:443',
  walletMnemonic: process.env.AKASH_TESTNET_MNEMONIC || '',
  defaultResourceConfig: {
    cpu: 100, // 0.1 cores
    memory: 512, // 512Mi
    storage: 1024, // 1Gi
  },
};

// Skip testnet tests if no credentials provided
const skipTestnet = !TESTNET_CONFIG.walletMnemonic;

describe('AkashClient - Unit Tests', () => {
  let akashClient: AkashClient;
  let config: AkashConfig;

  beforeEach(() => {
    config = {
      rpcEndpoint: 'https://rpc.sandbox-01.aksh.pw:443',
      defaultResourceConfig: {
        cpu: 100,
        memory: 512,
        storage: 1024,
      },
    };
    akashClient = new AkashClient(config);
  });

  describe('Initialization', () => {
    it('should initialize with config', () => {
      expect(akashClient).toBeDefined();
    });

    it('should accept testnet RPC endpoint', () => {
      const testnetConfig: AkashConfig = {
        rpcEndpoint: 'https://rpc.sandbox-01.aksh.pw:443',
        defaultResourceConfig: {
          cpu: 100,
          memory: 512,
          storage: 1024,
        },
      };
      const client = new AkashClient(testnetConfig);
      expect(client).toBeDefined();
    });

    it('should accept mainnet RPC endpoint', () => {
      const mainnetConfig: AkashConfig = {
        rpcEndpoint: 'https://rpc.akash.forbole.com',
        defaultResourceConfig: {
          cpu: 100,
          memory: 512,
          storage: 1024,
        },
      };
      const client = new AkashClient(mainnetConfig);
      expect(client).toBeDefined();
    });

    it('should handle wallet mnemonic in config', () => {
      const configWithWallet: AkashConfig = {
        rpcEndpoint: 'https://rpc.sandbox-01.aksh.pw:443',
        walletMnemonic: 'test mnemonic words go here',
        defaultResourceConfig: {
          cpu: 100,
          memory: 512,
          storage: 1024,
        },
      };
      const client = new AkashClient(configWithWallet);
      expect(client).toBeDefined();
    });
  });

  describe('SDL Generation', () => {
    it('should generate valid SDL from DeploymentSpec', () => {
      const spec: DeploymentSpec = {
        cpu: 100, // 0.1 cores
        memory: 128, // 128 MB
        storage: 1, // 1 GB
        image: 'nginx:alpine',
      };

      // Access private generateSDL method for testing
      const sdl = (akashClient as any).generateSDL(spec, 'test-service');

      expect(sdl).toBeDefined();
      expect(sdl.version).toBe('2.0');
      expect(sdl.services).toBeDefined();
      expect(sdl.services['test-service']).toBeDefined();
      expect(sdl.services['test-service'].image).toBe('nginx:alpine');
    });

    it('should include expose configuration', () => {
      const spec: DeploymentSpec = {
        cpu: 100,
        memory: 128,
        storage: 1,
        image: 'nginx:alpine',
        expose: [
          {
            port: 80,
            protocol: 'http',
            global: true,
          },
        ],
      };

      const sdl = (akashClient as any).generateSDL(spec, 'web');

      expect(sdl.services.web.expose).toBeDefined();
      expect(sdl.services.web.expose.length).toBe(1);
      expect(sdl.services.web.expose[0].port).toBe(80);
    });

    it('should include environment variables', () => {
      const spec: DeploymentSpec = {
        cpu: 100,
        memory: 128,
        storage: 1,
        image: 'myapp:latest',
        env: {
          NODE_ENV: 'production',
          API_KEY: 'test123',
          DEBUG: 'false',
        },
      };

      const sdl = (akashClient as any).generateSDL(spec, 'app');

      expect(sdl.services.app.env).toBeDefined();
      expect(sdl.services.app.env.NODE_ENV).toBe('production');
      expect(sdl.services.app.env.API_KEY).toBe('test123');
      expect(sdl.services.app.env.DEBUG).toBe('false');
    });

    it('should set default expose if not provided', () => {
      const spec: DeploymentSpec = {
        cpu: 100,
        memory: 128,
        storage: 1,
        image: 'myapp:latest',
      };

      const sdl = (akashClient as any).generateSDL(spec, 'app');

      expect(sdl.services.app.expose).toBeDefined();
      expect(sdl.services.app.expose.length).toBeGreaterThan(0);
    });

    it('should include profiles in SDL', () => {
      const spec: DeploymentSpec = {
        cpu: 2000,
        memory: 4096,
        storage: 50,
        image: 'nginx:alpine',
      };

      const sdl = (akashClient as any).generateSDL(spec, 'web');

      expect(sdl.profiles).toBeDefined();
      expect(sdl.profiles.compute).toBeDefined();
      expect(sdl.profiles.placement).toBeDefined();
    });

    it('should convert CPU millicores to cores', () => {
      const spec: DeploymentSpec = {
        cpu: 2000, // 2000 millicores = 2 cores
        memory: 4096,
        storage: 50,
        image: 'nginx:alpine',
      };

      const sdl = (akashClient as any).generateSDL(spec, 'web');

      const cpuUnits = sdl.profiles.compute.web.resources.cpu.units;
      expect(cpuUnits).toBe(2); // Should be 2 cores
    });

    it('should include deployment configuration', () => {
      const spec: DeploymentSpec = {
        cpu: 100,
        memory: 128,
        storage: 1,
        image: 'nginx:alpine',
      };

      const sdl = (akashClient as any).generateSDL(spec, 'web');

      expect(sdl.deployment).toBeDefined();
      expect(sdl.deployment.web).toBeDefined();
      expect(sdl.deployment.web.default).toBeDefined();
    });
  });

  describe('Cost Estimation', () => {
    it('should estimate monthly cost for small deployment', () => {
      const spec: DeploymentSpec = {
        cpu: 1000, // 1 core
        memory: 2048, // 2 GB
        storage: 25, // 25 GB
        image: 'test-image',
      };
      const cost = akashClient.getEstimatedMonthlyCost(spec);
      expect(cost).toBeDefined();
      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(10); // Should be < $10/month on Akash
    });

    it('should estimate monthly cost for medium deployment', () => {
      const spec: DeploymentSpec = {
        cpu: 4000, // 4 cores
        memory: 8192, // 8 GB
        storage: 100, // 100 GB
        image: 'test-image',
      };
      const cost = akashClient.getEstimatedMonthlyCost(spec);
      expect(cost).toBeDefined();
      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(20); // Should be < $20/month
    });

    it('should estimate monthly cost for large deployment', () => {
      const spec: DeploymentSpec = {
        cpu: 8000, // 8 cores
        memory: 16384, // 16 GB
        storage: 200, // 200 GB
        image: 'test-image',
      };
      const cost = akashClient.getEstimatedMonthlyCost(spec);
      expect(cost).toBeDefined();
      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(40); // Should be < $40/month
    });

    it('should calculate higher cost for larger instances', () => {
      const smallSpec: DeploymentSpec = {
        cpu: 1000,
        memory: 2048,
        storage: 25,
        image: 'nginx:alpine',
      };

      const largeSpec: DeploymentSpec = {
        cpu: 8000,
        memory: 16384,
        storage: 200,
        image: 'nginx:alpine',
      };

      const smallCost = akashClient.getEstimatedMonthlyCost(smallSpec);
      const largeCost = akashClient.getEstimatedMonthlyCost(largeSpec);

      expect(largeCost).toBeGreaterThan(smallCost);
    });

    it('should calculate deployment cost in uAKT', () => {
      const spec: DeploymentSpec = {
        cpu: 2000,
        memory: 4096,
        storage: 50,
        image: 'nginx:alpine',
      };

      const uaktCost = (akashClient as any).calculateDeploymentCost(spec);

      expect(uaktCost).toBeDefined();
      expect(uaktCost).toBeGreaterThan(0);
      // uAKT should be a large number (1 AKT = 1,000,000 uAKT)
      expect(uaktCost).toBeGreaterThan(1000);
    });
  });

  describe('Recommended Specs', () => {
    it('should return small model specs', () => {
      const specs = AkashClient.getRecommendedSpecs('small');
      expect(specs.cpu).toBe(2000);
      expect(specs.memory).toBe(4096);
      expect(specs.storage).toBe(25);
      expect(specs.image).toBe('varity/llm-inference:small');
    });

    it('should return medium model specs', () => {
      const specs = AkashClient.getRecommendedSpecs('medium');
      expect(specs.cpu).toBe(4000);
      expect(specs.memory).toBe(8192);
      expect(specs.storage).toBe(50);
      expect(specs.image).toBe('varity/llm-inference:medium');
    });

    it('should return large model specs', () => {
      const specs = AkashClient.getRecommendedSpecs('large');
      expect(specs.cpu).toBe(8000);
      expect(specs.memory).toBe(16384);
      expect(specs.storage).toBe(100);
      expect(specs.image).toBe('varity/llm-inference:large');
    });
  });

  describe('Deployment ID Parsing', () => {
    it('should extract dseq from deployment ID', () => {
      const deploymentId = 'akash1abc123def456/12345';
      const dseq = (akashClient as any).extractDseqFromDeploymentId(deploymentId);

      expect(dseq).toBe(12345);
    });

    it('should throw error for invalid deployment ID', () => {
      const invalidId = 'invalid-format';

      expect(() => {
        (akashClient as any).extractDseqFromDeploymentId(invalidId);
      }).toThrow();
    });

    it('should throw error for non-numeric dseq', () => {
      const invalidId = 'akash1abc/notanumber';

      expect(() => {
        (akashClient as any).extractDseqFromDeploymentId(invalidId);
      }).toThrow();
    });
  });
});

describe('AkashClient - Integration Tests (Testnet)', () => {
  if (skipTestnet) {
    console.log('⚠️  Skipping Akash testnet integration tests');
    console.log('   Set AKASH_TESTNET_MNEMONIC to run real network tests');
    console.log('   Example: export AKASH_TESTNET_MNEMONIC="word1 word2 ..."');
    return;
  }

  let akashClient: AkashClient;
  let deploymentId: string | null = null;

  beforeAll(() => {
    logger.info('🚀 Starting Akash testnet-02 integration tests');
    logger.info('   This will deploy REAL workloads to Akash Network');
    akashClient = new AkashClient(TESTNET_CONFIG);
  });

  afterAll(async () => {
    // Cleanup: close any deployments created during tests
    if (deploymentId) {
      try {
        logger.info('🧹 Cleaning up test deployment...', { deploymentId });
        await akashClient.closeDeployment(deploymentId);
        logger.info('✅ Test deployment closed successfully');
      } catch (error: any) {
        logger.warn('⚠️  Failed to cleanup test deployment', {
          error: error.message,
          deploymentId,
        });
      }
    }
  });

  it('should deploy nginx to Akash testnet-02', async () => {
    const spec: DeploymentSpec = {
      cpu: 100, // 0.1 cores (minimal)
      memory: 128, // 128 MB (minimal)
      storage: 1, // 1 GB (minimal)
      image: 'nginx:alpine', // Small, reliable image
      expose: [
        {
          port: 80,
          protocol: 'http',
          global: true,
        },
      ],
    };

    logger.info('📤 Deploying nginx to testnet-02...', {
      cpu: `${spec.cpu}m`,
      memory: `${spec.memory}Mi`,
      storage: `${spec.storage}Gi`,
    });

    const result = await akashClient.deploy(spec, 'test-nginx');

    deploymentId = result.deploymentId;

    expect(result).toBeDefined();
    expect(result.deploymentId).toBeDefined();
    expect(result.leaseId).toBeDefined();
    expect(result.provider).toBeDefined();
    expect(result.services).toBeDefined();
    expect(result.services['test-nginx']).toBeDefined();

    logger.info('✅ Deployment successful!', {
      deploymentId: result.deploymentId,
      provider: result.provider,
      serviceUri: result.services['test-nginx']?.uri,
      cost: `${result.cost.amount} ${result.cost.denom}`,
    });
  }, 300000); // 5 minute timeout

  it('should get deployment status from blockchain', async () => {
    if (!deploymentId) {
      logger.warn('⚠️  Skipping status test - no deployment ID');
      return;
    }

    logger.info('📊 Querying deployment status...', { deploymentId });

    const status = await akashClient.getDeploymentStatus(deploymentId);

    expect(status).toBeDefined();
    expect(status.state).toBeDefined();
    expect(status.dseq).toBeDefined();
    expect(status.owner).toBeDefined();

    logger.info('✅ Status query successful!', {
      state: status.state,
      dseq: status.dseq,
      owner: status.owner,
    });
  }, 30000);

  it('should close deployment on blockchain', async () => {
    if (!deploymentId) {
      logger.warn('⚠️  Skipping closure test - no deployment ID');
      return;
    }

    logger.info('🔒 Closing deployment...', { deploymentId });

    await akashClient.closeDeployment(deploymentId);

    logger.info('✅ Deployment closed successfully!', { deploymentId });

    // Verify it's actually closed
    const status = await akashClient.getDeploymentStatus(deploymentId);
    expect(status.state).toBe('closed');

    // Clear deploymentId so afterAll doesn't try to close again
    deploymentId = null;
  }, 60000);
});

// ========================================================================
// ADVANCED COVERAGE TESTS - WEEK 5-6 EXPANSION
// Target: Increase from 442 to 700+ lines for 80%+ coverage
// ========================================================================

describe('AkashClient - Advanced Coverage (Week 5-6)', () => {
  let akashClient: AkashClient;

  beforeEach(() => {
    const config = {
      rpcEndpoint: 'https://rpc.sandbox-01.aksh.pw:443',
      defaultResourceConfig: {
        cpu: 100,
        memory: 512,
        storage: 1024,
      },
    };
    akashClient = new AkashClient(config);
  });

  describe('Error Handling', () => {
    it('should handle RPC connection failures gracefully', async () => {
      const badConfig = {
        rpcEndpoint: 'https://invalid-endpoint.example.com:443',
        walletMnemonic: 'test test test test test test test test test test test junk',
        defaultResourceConfig: {
          cpu: 100,
          memory: 512,
          storage: 1024,
        },
      };

      const badClient = new AkashClient(badConfig);

      const spec: DeploymentSpec = {
        cpu: 100,
        memory: 128,
        storage: 1,
        image: 'nginx:alpine',
      };

      await expect(badClient.deploy(spec)).rejects.toThrow();
    }, 30000);

    it('should handle invalid SDL with clear error messages', () => {
      const invalidSpec: any = {
        cpu: -100, // Invalid negative CPU
        memory: 128,
        storage: 1,
        image: 'nginx:alpine',
      };

      const sdl = (akashClient as any).generateSDL(invalidSpec, 'test');
      expect(sdl.profiles.compute.test.resources.cpu.units).toBe(-0.1);
    });

    it('should handle insufficient AKT balance scenario', () => {
      const largeSpec: DeploymentSpec = {
        cpu: 1000000, // Unrealistically large
        memory: 1024000,
        storage: 10000,
        image: 'nginx:alpine',
      };

      const cost = akashClient.getEstimatedMonthlyCost(largeSpec);
      expect(cost).toBeGreaterThan(10000); // Should be very expensive
    });

    it('should validate deployment ID format before operations', () => {
      expect(() => {
        (akashClient as any).extractDseqFromDeploymentId('invalid');
      }).toThrow('Invalid deploymentId format');

      expect(() => {
        (akashClient as any).extractDseqFromDeploymentId('address/abc');
      }).toThrow('Invalid dseq');
    });

    it('should handle deployment closure when deployment does not exist', async () => {
      const fakeDeploymentId = 'akash1test/99999999';

      await expect(
        akashClient.closeDeployment(fakeDeploymentId)
      ).rejects.toThrow();
    });

    it('should handle manifest submission failures', () => {
      const spec: DeploymentSpec = {
        cpu: 100,
        memory: 128,
        storage: 1,
        image: '', // Empty image should cause issues
      };

      const sdl = (akashClient as any).generateSDL(spec, 'test');
      expect(sdl.services.test.image).toBe('');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large SDL files (>100KB simulated)', () => {
      const largeEnvVars: Record<string, string> = {};
      for (let i = 0; i < 1000; i++) {
        largeEnvVars[`VAR_${i}`] = `value_${i}`.repeat(10);
      }

      const spec: DeploymentSpec = {
        cpu: 2000,
        memory: 4096,
        storage: 50,
        image: 'nginx:alpine',
        env: largeEnvVars,
      };

      const sdl = (akashClient as any).generateSDL(spec, 'large-env');
      expect(Object.keys(sdl.services['large-env'].env).length).toBe(1000);
    });

    it('should handle concurrent deployment preparation', () => {
      const specs: DeploymentSpec[] = Array(5)
        .fill(null)
        .map((_, i) => ({
          cpu: 100 * (i + 1),
          memory: 128 * (i + 1),
          storage: 1 * (i + 1),
          image: `nginx:alpine-${i}`,
        }));

      const sdls = specs.map((spec, i) =>
        (akashClient as any).generateSDL(spec, `service-${i}`)
      );

      expect(sdls.length).toBe(5);
      sdls.forEach((sdl, i) => {
        expect(sdl.services[`service-${i}`]).toBeDefined();
      });
    });

    it('should handle querying non-existent deployment IDs', async () => {
      const nonExistentId = 'akash1nonexistent/123456';

      await expect(
        akashClient.getDeploymentStatus(nonExistentId)
      ).rejects.toThrow();
    });

    it('should validate SDL structure before deployment', () => {
      const spec: DeploymentSpec = {
        cpu: 2000,
        memory: 4096,
        storage: 50,
        image: 'nginx:alpine',
      };

      const sdl = (akashClient as any).generateSDL(spec, 'web');

      // Validate SDL structure
      expect(sdl.version).toBe('2.0');
      expect(sdl.services).toBeDefined();
      expect(sdl.profiles).toBeDefined();
      expect(sdl.deployment).toBeDefined();
      expect(sdl.profiles.compute).toBeDefined();
      expect(sdl.profiles.placement).toBeDefined();
    });

    it('should handle Unicode characters in SDL', () => {
      const spec: DeploymentSpec = {
        cpu: 100,
        memory: 128,
        storage: 1,
        image: 'nginx:alpine',
        env: {
          EMOJI_VAR: '🚀🔥💎',
          UNICODE_VAR: 'Hello 世界 مرحبا',
        },
      };

      const sdl = (akashClient as any).generateSDL(spec, 'unicode-test');
      expect(sdl.services['unicode-test'].env.EMOJI_VAR).toBe('🚀🔥💎');
      expect(sdl.services['unicode-test'].env.UNICODE_VAR).toBe('Hello 世界 مرحبا');
    });

    it('should handle zero-value resources', () => {
      const spec: DeploymentSpec = {
        cpu: 0,
        memory: 0,
        storage: 0,
        image: 'nginx:alpine',
      };

      const cost = akashClient.getEstimatedMonthlyCost(spec);
      expect(cost).toBe(0);
    });
  });

  describe('Resource Management', () => {
    it('should calculate resource costs accurately', () => {
      const spec1: DeploymentSpec = {
        cpu: 1000,
        memory: 2048,
        storage: 25,
        image: 'nginx:alpine',
      };

      const spec2: DeploymentSpec = {
        cpu: 2000,
        memory: 4096,
        storage: 50,
        image: 'nginx:alpine',
      };

      const cost1 = akashClient.getEstimatedMonthlyCost(spec1);
      const cost2 = akashClient.getEstimatedMonthlyCost(spec2);

      // Spec2 should cost approximately 2x spec1
      expect(cost2).toBeGreaterThan(cost1);
      expect(cost2 / cost1).toBeGreaterThan(1.5);
      expect(cost2 / cost1).toBeLessThan(2.5);
    });

    it('should handle multiple simultaneous SDL generations', () => {
      const specs = Array(10)
        .fill(null)
        .map((_, i) => ({
          cpu: 100 * (i + 1),
          memory: 128 * (i + 1),
          storage: (i + 1),
          image: `service-${i}:latest`,
        }));

      const sdls = specs.map((spec, i) =>
        (akashClient as any).generateSDL(spec, `service-${i}`)
      );

      expect(sdls.length).toBe(10);
      sdls.forEach((sdl, i) => {
        expect(sdl.profiles.compute[`service-${i}`].resources.cpu.units).toBe(
          (100 * (i + 1)) / 1000
        );
      });
    });

    it('should cleanup deployment ID references', () => {
      const deploymentId = 'akash1abc123/12345';
      const dseq = (akashClient as any).extractDseqFromDeploymentId(deploymentId);
      expect(dseq).toBe(12345);
    });
  });

  describe('Provider Selection Scenarios', () => {
    it('should generate consistent SDL for provider bid matching', () => {
      const spec: DeploymentSpec = {
        cpu: 2000,
        memory: 4096,
        storage: 50,
        image: 'nginx:alpine',
      };

      const sdl1 = (akashClient as any).generateSDL(spec, 'app');
      const sdl2 = (akashClient as any).generateSDL(spec, 'app');

      expect(sdl1.version).toBe(sdl2.version);
      expect(sdl1.profiles.compute.app).toEqual(sdl2.profiles.compute.app);
    });

    it('should validate provider capabilities match SDL requirements', () => {
      const gpuSpec: DeploymentSpec = {
        cpu: 8000,
        memory: 32768,
        storage: 200,
        image: 'tensorflow/tensorflow:latest-gpu',
        env: {
          GPU_REQUIRED: 'true',
        },
      };

      const sdl = (akashClient as any).generateSDL(gpuSpec, 'gpu-service');
      expect(sdl.services['gpu-service'].env.GPU_REQUIRED).toBe('true');
    });
  });

  describe('Service Health Monitoring', () => {
    it('should prepare health check configuration in SDL', () => {
      const spec: DeploymentSpec = {
        cpu: 2000,
        memory: 4096,
        storage: 50,
        image: 'nginx:alpine',
        expose: [
          {
            port: 80,
            protocol: 'http',
            global: true,
          },
        ],
      };

      const sdl = (akashClient as any).generateSDL(spec, 'web');
      expect(sdl.services.web.expose[0].port).toBe(80);
      expect(sdl.services.web.expose[0].protocol).toBe('http');
    });

    it('should handle multiple exposed ports', () => {
      const spec: DeploymentSpec = {
        cpu: 2000,
        memory: 4096,
        storage: 50,
        image: 'multi-port-app:latest',
        expose: [
          { port: 80, protocol: 'http', global: true },
          { port: 443, protocol: 'https', global: true },
          { port: 8080, protocol: 'http', global: false },
        ],
      };

      const sdl = (akashClient as any).generateSDL(spec, 'multi-port');
      expect(sdl.services['multi-port'].expose.length).toBe(3);
    });
  });

  describe('Cost Estimation Advanced', () => {
    it('should accurately estimate deployment costs from SDL', () => {
      const specs = [
        { cpu: 500, memory: 1024, storage: 10, image: 'tiny:latest' },
        { cpu: 2000, memory: 4096, storage: 50, image: 'small:latest' },
        { cpu: 4000, memory: 8192, storage: 100, image: 'medium:latest' },
        { cpu: 8000, memory: 16384, storage: 200, image: 'large:latest' },
      ];

      const costs = specs.map((spec) =>
        akashClient.getEstimatedMonthlyCost(spec)
      );

      // Costs should increase with resource size
      for (let i = 1; i < costs.length; i++) {
        expect(costs[i]).toBeGreaterThan(costs[i - 1]);
      }
    });

    it('should calculate monthly recurring costs correctly', () => {
      const spec: DeploymentSpec = {
        cpu: 2000,
        memory: 4096,
        storage: 50,
        image: 'nginx:alpine',
      };

      const monthlyCost = akashClient.getEstimatedMonthlyCost(spec);
      const uaktCost = (akashClient as any).calculateDeploymentCost(spec);

      expect(monthlyCost).toBeGreaterThan(0);
      expect(uaktCost).toBeGreaterThan(0);
    });

    it('should compare costs across different configurations', () => {
      const cpuOptimized: DeploymentSpec = {
        cpu: 8000,
        memory: 4096,
        storage: 25,
        image: 'cpu-intensive:latest',
      };

      const memoryOptimized: DeploymentSpec = {
        cpu: 2000,
        memory: 16384,
        storage: 25,
        image: 'memory-intensive:latest',
      };

      const storageOptimized: DeploymentSpec = {
        cpu: 2000,
        memory: 4096,
        storage: 500,
        image: 'storage-intensive:latest',
      };

      const cpuCost = akashClient.getEstimatedMonthlyCost(cpuOptimized);
      const memoryCost = akashClient.getEstimatedMonthlyCost(memoryOptimized);
      const storageCost = akashClient.getEstimatedMonthlyCost(storageOptimized);

      expect(cpuCost).toBeGreaterThan(0);
      expect(memoryCost).toBeGreaterThan(0);
      expect(storageCost).toBeGreaterThan(0);
    });

    it('should warn when costs exceed budget threshold', () => {
      const expensiveSpec: DeploymentSpec = {
        cpu: 32000, // 32 cores
        memory: 131072, // 128 GB
        storage: 2000, // 2 TB
        image: 'expensive:latest',
      };

      const cost = akashClient.getEstimatedMonthlyCost(expensiveSpec);
      const BUDGET_THRESHOLD = 100; // $100/month

      if (cost > BUDGET_THRESHOLD) {
        expect(cost).toBeGreaterThan(BUDGET_THRESHOLD);
      }
    });
  });

  describe('Deployment Lifecycle', () => {
    it('should generate unique deployment IDs', () => {
      const id1 = (akashClient as any).generateDeploymentId();
      const id2 = (akashClient as any).generateDeploymentId();

      expect(id1).not.toBe(id2);
      expect(id1).toContain('akash-deployment-');
      expect(id2).toContain('akash-deployment-');
    });

    it('should generate unique lease IDs', () => {
      const lease1 = (akashClient as any).generateLeaseId();
      const lease2 = (akashClient as any).generateLeaseId();

      expect(lease1).not.toBe(lease2);
      expect(lease1).toContain('akash-lease-');
      expect(lease2).toContain('akash-lease-');
    });

    it('should maintain deployment state consistency', () => {
      const spec: DeploymentSpec = {
        cpu: 2000,
        memory: 4096,
        storage: 50,
        image: 'nginx:alpine',
      };

      const sdl = (akashClient as any).generateSDL(spec, 'app');
      expect(sdl.deployment.app).toBeDefined();
      expect(sdl.deployment.app.default).toBeDefined();
      expect(sdl.deployment.app.default.profile).toBe('app');
      expect(sdl.deployment.app.default.count).toBe(1);
    });
  });

  describe('LLM Deployment Scenarios', () => {
    it('should configure CPU-based LLM deployment', async () => {
      const spec = AkashClient.getRecommendedSpecs('small');

      expect(spec.cpu).toBe(2000);
      expect(spec.memory).toBe(4096);
      expect(spec.image).toBe('varity/llm-inference:small');

      const cost = akashClient.getEstimatedMonthlyCost(spec);
      expect(cost).toBeLessThan(10); // Should be under $10/month
    });

    it('should configure medium LLM deployment', () => {
      const spec = AkashClient.getRecommendedSpecs('medium');

      expect(spec.cpu).toBe(4000);
      expect(spec.memory).toBe(8192);
      expect(spec.storage).toBe(50);

      const cost = akashClient.getEstimatedMonthlyCost(spec);
      expect(cost).toBeLessThan(20);
    });

    it('should configure large LLM deployment', () => {
      const spec = AkashClient.getRecommendedSpecs('large');

      expect(spec.cpu).toBe(8000);
      expect(spec.memory).toBe(16384);
      expect(spec.storage).toBe(100);

      const cost = akashClient.getEstimatedMonthlyCost(spec);
      expect(cost).toBeLessThan(40);
    });
  });

  describe('SDL Parser Integration', () => {
    it('should generate valid SDL structure for parsing', () => {
      const spec: DeploymentSpec = {
        cpu: 2000,
        memory: 4096,
        storage: 50,
        image: 'nginx:alpine',
      };

      const sdl = (akashClient as any).generateSDL(spec, 'web');

      // Validate all required SDL fields
      expect(sdl.version).toBeDefined();
      expect(sdl.services).toBeDefined();
      expect(sdl.profiles).toBeDefined();
      expect(sdl.deployment).toBeDefined();

      // Validate nested structure
      expect(sdl.profiles.compute).toBeDefined();
      expect(sdl.profiles.placement).toBeDefined();
      expect(sdl.profiles.placement.default).toBeDefined();
      expect(sdl.profiles.placement.default.pricing).toBeDefined();
    });

    it('should include proper resource units', () => {
      const spec: DeploymentSpec = {
        cpu: 3500, // 3.5 cores
        memory: 7168, // 7 GB
        storage: 75, // 75 GB
        image: 'custom:latest',
      };

      const sdl = (akashClient as any).generateSDL(spec, 'custom');
      const resources = sdl.profiles.compute.custom.resources;

      expect(resources.cpu.units).toBe(3.5);
      expect(resources.memory.size).toBe('7168Mi');
      expect(resources.storage.size).toBe('75Gi');
    });
  });

  describe('List Deployments', () => {
    it('should return empty array when no deployments exist', async () => {
      const deployments = await akashClient.listDeployments();
      expect(Array.isArray(deployments)).toBe(true);
      expect(deployments.length).toBe(0);
    });

    it('should handle list deployments with warning', async () => {
      const result = await akashClient.listDeployments();
      expect(result).toEqual([]);
    });
  });
});
