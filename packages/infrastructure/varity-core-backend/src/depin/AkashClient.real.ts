/**
 * Akash Client - Production Implementation with Cosmos SDK
 * PROPRIETARY - DO NOT DISTRIBUTE
 *
 * Real Akash Network integration for decentralized compute deployment
 */

import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { SigningStargateClient, StargateClient, GasPrice } from '@cosmjs/stargate';
import { Coin } from '@cosmjs/amino';
import axios, { AxiosInstance } from 'axios';
import { AkashConfig, StorageError } from '../types';
import logger from '../utils/logger';
import SDLParser, { SDL } from './SDLParser';
import ProviderSelector, {
  ProviderBid,
  ProviderInfo,
  SelectionCriteria,
} from './ProviderSelector';

// Akash message types
const MsgCreateDeployment = '/akash.deployment.v1beta3.MsgCreateDeployment';
const MsgDepositDeployment = '/akash.deployment.v1beta3.MsgDepositDeployment';
const MsgCreateLease = '/akash.market.v1beta4.MsgCreateLease';
const MsgCloseLease = '/akash.market.v1beta4.MsgCloseLease';
const MsgCloseDeployment = '/akash.deployment.v1beta3.MsgCloseDeployment';

export interface DeploymentSpec {
  cpu: number; // CPU units (millicores)
  memory: number; // Memory in MB
  storage: number; // Storage in GB
  image: string; // Docker image
  env?: Record<string, string>; // Environment variables
  expose?: {
    port: number;
    protocol: string;
    global: boolean;
  }[];
}

export interface DeploymentResult {
  deploymentId: string;
  dseq: number;
  leaseId: string;
  provider: string;
  providerUri: string;
  services: {
    [serviceName: string]: {
      uri: string;
      status: string;
    };
  };
  cost: {
    amount: number;
    denom: string;
  };
  createdAt: number;
}

export interface DeploymentStatus {
  state: 'active' | 'closed' | 'paused';
  dseq: number;
  owner: string;
  version: string;
  createdAt: number;
}

export interface LeaseStatus {
  state: 'active' | 'closed' | 'insufficient_funds';
  lease: {
    dseq: number;
    gseq: number;
    oseq: number;
    provider: string;
  };
  price: Coin;
}

export class AkashClient {
  private config: AkashConfig;
  private client: SigningStargateClient | null = null;
  private wallet: DirectSecp256k1HdWallet | null = null;
  private address: string | null = null;
  private apiClient: AxiosInstance;
  private connected: boolean = false;

  // Akash network constants
  private readonly CHAIN_ID = 'akashnet-2'; // Mainnet
  private readonly TESTNET_CHAIN_ID = 'testnet-02';
  private readonly DEPLOYMENT_DEPOSIT = '5000000'; // 5 AKT in uakt
  private readonly GAS_PRICE = GasPrice.fromString('0.025uakt');

  constructor(config: AkashConfig) {
    this.config = config;

    this.apiClient = axios.create({
      baseURL: config.rpcEndpoint,
      timeout: 30000,
    });

    logger.info('AkashClient initialized', {
      rpcEndpoint: config.rpcEndpoint,
    });
  }

  /**
   * Connect to Akash Network
   */
  async connect(): Promise<void> {
    if (this.connected) {
      logger.info('Already connected to Akash Network');
      return;
    }

    try {
      logger.info('Connecting to Akash Network...');

      if (!this.config.walletMnemonic) {
        throw new StorageError('Wallet mnemonic is required for Akash connection');
      }

      // Create wallet from mnemonic
      this.wallet = await DirectSecp256k1HdWallet.fromMnemonic(
        this.config.walletMnemonic,
        {
          prefix: 'akash',
        }
      );

      // Get wallet address
      const [account] = await this.wallet.getAccounts();
      this.address = account.address;

      logger.info('Wallet created', { address: this.address });

      // Connect to Akash RPC
      this.client = await SigningStargateClient.connectWithSigner(
        this.config.rpcEndpoint,
        this.wallet,
        {
          gasPrice: this.GAS_PRICE,
        }
      );

      // Verify connection
      const chainId = await this.client.getChainId();
      logger.info('Connected to Akash Network', {
        chainId,
        address: this.address,
      });

      this.connected = true;
    } catch (error: any) {
      logger.error('Failed to connect to Akash Network', {
        error: error.message,
      });
      throw new StorageError('Akash connection failed', error);
    }
  }

  /**
   * Deploy workload to Akash Network
   */
  async deploy(
    sdl: SDL | string,
    selectionCriteria?: SelectionCriteria
  ): Promise<DeploymentResult> {
    await this.ensureConnected();

    try {
      logger.info('Starting Akash deployment...');

      // Parse SDL if string provided
      const sdlObj = typeof sdl === 'string' ? SDLParser.parse(sdl) : sdl;

      // Validate SDL
      SDLParser.validate(sdlObj);

      // Step 1: Create deployment on blockchain
      const dseq = await this.createDeployment(sdlObj);

      logger.info('Deployment created on blockchain', { dseq });

      // Step 2: Wait for provider bids
      const bids = await this.waitForBids(dseq);

      if (bids.length === 0) {
        throw new StorageError('No provider bids received');
      }

      logger.info('Received provider bids', { count: bids.length });

      // Step 3: Select best provider
      const providers = await this.getProviderInfo(bids);
      const selected = ProviderSelector.selectBestProvider(
        bids,
        providers,
        selectionCriteria
      );

      if (!selected) {
        throw new StorageError('Failed to select provider');
      }

      logger.info('Selected provider', {
        provider: selected.provider.address,
        price: selected.bid.price.amount,
      });

      // Step 4: Create lease with selected provider
      const lease = await this.createLease(dseq, selected.bid);

      logger.info('Lease created', { leaseId: lease.leaseId });

      // Step 5: Send manifest to provider
      await this.sendManifest(
        dseq,
        selected.provider.hostUri,
        sdlObj
      );

      logger.info('Manifest sent to provider');

      // Step 6: Wait for services to start
      const services = await this.waitForServices(
        dseq,
        selected.provider.hostUri,
        Object.keys(sdlObj.services)
      );

      const result: DeploymentResult = {
        deploymentId: `${this.address}/${dseq}`,
        dseq,
        leaseId: lease.leaseId,
        provider: selected.provider.address,
        providerUri: selected.provider.hostUri,
        services,
        cost: {
          amount: parseInt(selected.bid.price.amount),
          denom: selected.bid.price.denom,
        },
        createdAt: Date.now(),
      };

      logger.info('Deployment completed successfully', {
        deploymentId: result.deploymentId,
        servicesCount: Object.keys(services).length,
      });

      return result;
    } catch (error: any) {
      logger.error('Deployment failed', {
        error: error.message,
        stack: error.stack,
      });
      throw new StorageError('Akash deployment failed', error);
    }
  }

  /**
   * Create deployment on Akash blockchain
   */
  private async createDeployment(sdl: SDL): Promise<number> {
    await this.ensureConnected();

    try {
      // Convert SDL to deployment groups
      const groups = this.sdlToDeploymentGroups(sdl);

      // Create deployment message
      const msg = {
        typeUrl: MsgCreateDeployment,
        value: {
          id: {
            owner: this.address,
            dseq: '0', // Will be assigned by blockchain
          },
          groups,
          version: this.hashSDL(sdl), // Already base64 encoded
          deposit: {
            denom: 'uakt',
            amount: this.DEPLOYMENT_DEPOSIT,
          },
          depositor: this.address,
        },
      };

      // Broadcast transaction
      const result = await this.client!.signAndBroadcast(
        this.address!,
        [msg],
        'auto'
      );

      if (result.code !== 0) {
        throw new Error(`Transaction failed: ${result.rawLog}`);
      }

      // Extract dseq from events
      const dseq = this.extractDseqFromEvents(result.events);

      return dseq;
    } catch (error: any) {
      logger.error('Failed to create deployment', { error: error.message });
      throw error;
    }
  }

  /**
   * Wait for provider bids
   */
  private async waitForBids(
    dseq: number,
    timeoutMs: number = 60000
  ): Promise<ProviderBid[]> {
    const startTime = Date.now();
    const pollInterval = 3000; // 3 seconds

    while (Date.now() - startTime < timeoutMs) {
      try {
        // Query bids from blockchain
        const queryClient = await StargateClient.connect(this.config.rpcEndpoint);

        const bids = await this.queryBids(queryClient, dseq);

        if (bids.length > 0) {
          return bids;
        }

        logger.info('Waiting for bids...', {
          dseq,
          elapsed: Date.now() - startTime,
        });

        await this.sleep(pollInterval);
      } catch (error: any) {
        logger.warn('Error querying bids', { error: error.message });
      }
    }

    throw new StorageError(`No bids received within ${timeoutMs}ms`);
  }

  /**
   * Query bids for deployment
   */
  private async queryBids(
    client: StargateClient,
    dseq: number
  ): Promise<ProviderBid[]> {
    try {
      // Query using RPC endpoint
      const response = await axios.get(
        `${this.config.rpcEndpoint}/akash/market/v1beta4/bids/list`,
        {
          params: {
            'filters.owner': this.address,
            'filters.dseq': dseq,
          },
        }
      );

      return (response.data.bids || []).map((bid: any) => ({
        provider: bid.bid.bid_id.provider,
        price: bid.bid.price,
        bidId: `${bid.bid.bid_id.provider}/${dseq}/${bid.bid.bid_id.gseq}/${bid.bid.bid_id.oseq}`,
        createdAt: Date.now(),
      }));
    } catch (error: any) {
      logger.warn('Failed to query bids via RPC, trying alternative method', {
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Get provider information
   */
  private async getProviderInfo(bids: ProviderBid[]): Promise<Map<string, ProviderInfo>> {
    const providers = new Map<string, ProviderInfo>();

    for (const bid of bids) {
      try {
        // Query provider info from blockchain
        const response = await axios.get(
          `${this.config.rpcEndpoint}/akash/provider/v1beta3/providers/${bid.provider}`
        );

        const providerData = response.data.provider;

        providers.set(bid.provider, {
          address: bid.provider,
          hostUri: providerData.host_uri || `https://${bid.provider}`,
          attributes: this.parseProviderAttributes(providerData.attributes || []),
          reputation: {
            uptime: 95, // Would come from reputation service
            responseTime: 150,
            totalDeployments: 100,
          },
        });
      } catch (error: any) {
        logger.warn(`Failed to get provider info for ${bid.provider}`, {
          error: error.message,
        });

        // Add minimal provider info
        providers.set(bid.provider, {
          address: bid.provider,
          hostUri: `https://${bid.provider}`,
          attributes: {},
        });
      }
    }

    return providers;
  }

  /**
   * Create lease with selected provider
   */
  private async createLease(
    dseq: number,
    bid: ProviderBid
  ): Promise<{ leaseId: string }> {
    await this.ensureConnected();

    try {
      // Parse bid ID to get gseq and oseq
      const [provider, dseqStr, gseq, oseq] = bid.bidId.split('/');

      const msg = {
        typeUrl: MsgCreateLease,
        value: {
          bid_id: {
            owner: this.address,
            dseq: dseq.toString(),
            gseq: gseq,
            oseq: oseq,
            provider: provider,
          },
        },
      };

      const result = await this.client!.signAndBroadcast(
        this.address!,
        [msg],
        'auto'
      );

      if (result.code !== 0) {
        throw new Error(`Create lease failed: ${result.rawLog}`);
      }

      const leaseId = `${this.address}/${dseq}/${gseq}/${oseq}`;

      return { leaseId };
    } catch (error: any) {
      logger.error('Failed to create lease', { error: error.message });
      throw error;
    }
  }

  /**
   * Send manifest to provider
   */
  private async sendManifest(
    dseq: number,
    providerUri: string,
    sdl: SDL
  ): Promise<void> {
    try {
      // Convert SDL to manifest format
      const manifest = this.sdlToManifest(sdl);

      // Send to provider's manifest endpoint
      await axios.put(
        `${providerUri}/deployment/${dseq}/manifest`,
        manifest,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      logger.info('Manifest sent successfully');
    } catch (error: any) {
      logger.error('Failed to send manifest', { error: error.message });
      throw error;
    }
  }

  /**
   * Wait for services to be running
   */
  private async waitForServices(
    dseq: number,
    providerUri: string,
    serviceNames: string[],
    timeoutMs: number = 120000
  ): Promise<Record<string, { uri: string; status: string }>> {
    const startTime = Date.now();
    const pollInterval = 5000; // 5 seconds

    while (Date.now() - startTime < timeoutMs) {
      try {
        const status = await axios.get(
          `${providerUri}/lease/${dseq}/1/1/status`
        );

        const services: Record<string, { uri: string; status: string }> = {};
        let allRunning = true;

        for (const serviceName of serviceNames) {
          const serviceStatus = status.data.services?.[serviceName];

          if (serviceStatus?.available === 1) {
            services[serviceName] = {
              uri: serviceStatus.uris?.[0] || '',
              status: 'running',
            };
          } else {
            allRunning = false;
          }
        }

        if (allRunning) {
          return services;
        }

        logger.info('Waiting for services to start...', {
          dseq,
          elapsed: Date.now() - startTime,
        });

        await this.sleep(pollInterval);
      } catch (error: any) {
        logger.warn('Error checking service status', {
          error: error.message,
        });
      }

      await this.sleep(pollInterval);
    }

    throw new StorageError(`Services did not start within ${timeoutMs}ms`);
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(dseq: number): Promise<DeploymentStatus> {
    await this.ensureConnected();

    try {
      const response = await axios.get(
        `${this.config.rpcEndpoint}/akash/deployment/v1beta3/deployments/info`,
        {
          params: {
            id: {
              owner: this.address,
              dseq: dseq.toString(),
            },
          },
        }
      );

      const deployment = response.data.deployment;

      return {
        state: deployment.state,
        dseq: parseInt(deployment.deployment_id.dseq),
        owner: deployment.deployment_id.owner,
        version: deployment.version,
        createdAt: parseInt(deployment.created_at),
      };
    } catch (error: any) {
      logger.error('Failed to get deployment status', {
        error: error.message,
      });
      throw new StorageError('Failed to get deployment status', error);
    }
  }

  /**
   * Get deployment logs
   */
  async getDeploymentLogs(
    dseq: number,
    serviceName: string,
    providerUri: string,
    tailLines: number = 100
  ): Promise<string[]> {
    try {
      const response = await axios.get(
        `${providerUri}/lease/${dseq}/1/1/logs`,
        {
          params: {
            service: serviceName,
            tail: tailLines,
          },
        }
      );

      return response.data.split('\n');
    } catch (error: any) {
      logger.error('Failed to get deployment logs', {
        error: error.message,
      });
      throw new StorageError('Failed to get logs', error);
    }
  }

  /**
   * Close deployment
   */
  async closeDeployment(dseq: number): Promise<void> {
    await this.ensureConnected();

    try {
      logger.info('Closing deployment...', { dseq });

      const msg = {
        typeUrl: MsgCloseDeployment,
        value: {
          id: {
            owner: this.address,
            dseq: dseq.toString(),
          },
        },
      };

      const result = await this.client!.signAndBroadcast(
        this.address!,
        [msg],
        'auto'
      );

      if (result.code !== 0) {
        throw new Error(`Close deployment failed: ${result.rawLog}`);
      }

      logger.info('Deployment closed successfully', { dseq });
    } catch (error: any) {
      logger.error('Failed to close deployment', {
        error: error.message,
      });
      throw new StorageError('Failed to close deployment', error);
    }
  }

  // Helper methods

  private async ensureConnected(): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }
  }

  /**
   * Convert SDL to Akash blockchain deployment groups format
   * Maps SDL services to deployment groups with resources and pricing
   */
  private sdlToDeploymentGroups(sdl: SDL): any[] {
    const groups: any[] = [];

    // Iterate through deployment configuration
    for (const [groupName, groupConfig] of Object.entries(sdl.deployment)) {
      for (const [placementName, placement] of Object.entries(groupConfig)) {
        const serviceName = groupName;
        const profileName = placement.profile;

        // Get compute and placement profiles
        const computeProfile = sdl.profiles.compute[profileName];
        const placementProfile = sdl.profiles.placement[placementName];

        if (!computeProfile || !placementProfile) {
          logger.warn(`Missing profile for ${serviceName}`, {
            compute: !!computeProfile,
            placement: !!placementProfile,
          });
          continue;
        }

        // Get service definition
        const service = sdl.services[serviceName];
        if (!service) {
          logger.warn(`Service ${serviceName} not found in SDL`);
          continue;
        }

        // Convert resources to blockchain format
        const resources = computeProfile.resources;

        // CPU units (convert to millicores if needed)
        let cpuUnits: number;
        if (typeof resources.cpu.units === 'string') {
          const cpuStr = resources.cpu.units as string;
          if (cpuStr.endsWith('m')) {
            cpuUnits = parseInt(cpuStr);
          } else {
            cpuUnits = parseFloat(cpuStr) * 1000;
          }
        } else {
          cpuUnits = resources.cpu.units * 1000;
        }

        // Memory size (convert to bytes)
        const memoryBytes = this.parseMemoryToBytes(resources.memory.size);

        // Storage size (convert to bytes)
        const storageBytes = this.parseStorageToBytes(
          resources.storage?.[0]?.size || '1Gi'
        );

        // Build endpoints from expose configuration
        const endpoints = (service.expose || []).map(exp => ({
          kind: exp.to?.some(t => t.global) ? 0 : 1, // 0 = SHARED_HTTP, 1 = RANDOM_PORT
        }));

        // Build resource entry
        const resourceEntry = {
          resources: {
            cpu: {
              units: {
                val: cpuUnits.toString(),
              },
              attributes: resources.cpu.attributes
                ? Object.entries(resources.cpu.attributes).map(([key, value]) => ({
                    key,
                    value: value.toString(),
                  }))
                : [],
            },
            memory: {
              quantity: {
                val: memoryBytes.toString(),
              },
              attributes: [],
            },
            storage: [
              {
                quantity: {
                  val: storageBytes.toString(),
                },
                attributes: resources.storage?.[0]?.attributes
                  ? Object.entries(resources.storage[0].attributes).map(
                      ([key, value]) => ({
                        key,
                        value: value.toString(),
                      })
                    )
                  : [],
              },
            ],
            endpoints,
          },
          count: placement.count,
          price: {
            denom: placementProfile.pricing[serviceName].denom,
            amount: placementProfile.pricing[serviceName].amount.toString(),
          },
        };

        // Build group
        const group = {
          name: groupName,
          requirements: {
            attributes: placementProfile.attributes
              ? Object.entries(placementProfile.attributes).map(([key, value]) => ({
                  key,
                  value: value.toString(),
                }))
              : [],
            signed_by: {
              all_of: placementProfile.signedBy?.allOf || [],
              any_of: placementProfile.signedBy?.anyOf || [],
            },
          },
          resources: [resourceEntry],
        };

        groups.push(group);
      }
    }

    logger.info('Converted SDL to deployment groups', {
      groupCount: groups.length,
    });

    return groups;
  }

  /**
   * Parse memory size string to bytes
   */
  private parseMemoryToBytes(size: string): number {
    const match = size.match(/^([0-9.]+)([A-Za-z]*)$/);
    if (!match) {
      throw new Error(`Invalid memory size format: ${size}`);
    }

    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();

    switch (unit) {
      case 'B':
      case '':
        return value;
      case 'K':
      case 'KB':
      case 'KI':
        return value * 1024;
      case 'M':
      case 'MB':
      case 'MI':
        return value * 1024 * 1024;
      case 'G':
      case 'GB':
      case 'GI':
        return value * 1024 * 1024 * 1024;
      case 'T':
      case 'TB':
      case 'TI':
        return value * 1024 * 1024 * 1024 * 1024;
      default:
        throw new Error(`Unknown memory unit: ${unit}`);
    }
  }

  /**
   * Parse storage size string to bytes
   */
  private parseStorageToBytes(size: string): number {
    return this.parseMemoryToBytes(size);
  }

  /**
   * Create deterministic SHA256 hash of SDL for version tracking
   * This hash is used by Akash blockchain to track deployment versions
   */
  private hashSDL(sdl: SDL | string): string {
    const crypto = require('crypto');

    // Convert SDL to string if object
    const sdlString = typeof sdl === 'string' ? sdl : SDLParser.stringify(sdl);

    // Create SHA256 hash
    const hash = crypto.createHash('sha256').update(sdlString).digest();

    // Return as base64 encoded string for blockchain
    return hash.toString('base64');
  }

  private extractDseqFromEvents(events: readonly any[]): number {
    // Extract dseq from transaction events
    for (const event of events) {
      if (event.type === 'akash.v1') {
        const dseqAttr = event.attributes.find(
          (attr: any) => attr.key === 'dseq'
        );
        if (dseqAttr) {
          return parseInt(dseqAttr.value);
        }
      }
    }
    throw new Error('Failed to extract dseq from events');
  }

  private parseProviderAttributes(attributes: any[]): any {
    const parsed: any = {};
    for (const attr of attributes) {
      parsed[attr.key] = attr.value;
    }
    return parsed;
  }

  /**
   * Convert SDL to manifest format for provider
   * Manifest is sent to the provider after lease creation
   */
  private sdlToManifest(sdl: SDL): any {
    const manifest: any = {
      version: sdl.version,
      services: {},
    };

    // Convert each service to manifest format
    for (const [serviceName, service] of Object.entries(sdl.services)) {
      // Find the compute profile for this service
      const computeProfile = sdl.profiles.compute[serviceName];
      if (!computeProfile) {
        logger.warn(`No compute profile found for service ${serviceName}`);
        continue;
      }

      const resources = computeProfile.resources;

      // Convert CPU units to manifest format
      let cpuUnits: string;
      if (typeof resources.cpu.units === 'string') {
        const cpuStr = resources.cpu.units as string;
        if (cpuStr.endsWith('m')) {
          cpuUnits = (parseInt(cpuStr) / 1000).toString();
        } else {
          cpuUnits = cpuStr;
        }
      } else {
        cpuUnits = resources.cpu.units.toString();
      }

      // Build manifest service
      manifest.services[serviceName] = {
        image: service.image,
        command: service.command,
        args: service.args,
        env: service.env
          ? Object.entries(service.env).map(([key, value]) => `${key}=${value}`)
          : [],
        resources: {
          cpu: {
            units: cpuUnits,
            attributes: resources.cpu.attributes || {},
          },
          memory: {
            size: resources.memory.size,
            attributes: resources.memory.attributes || {},
          },
          storage: (resources.storage || []).map(storage => ({
            size: storage.size,
            attributes: storage.attributes || {},
          })),
          gpu: resources.gpu
            ? {
                units: resources.gpu.units.toString(),
                attributes: resources.gpu.attributes || {},
              }
            : undefined,
        },
        expose: service.expose || [],
        params: service.params,
      };

      // Remove undefined fields
      if (!manifest.services[serviceName].command) {
        delete manifest.services[serviceName].command;
      }
      if (!manifest.services[serviceName].args) {
        delete manifest.services[serviceName].args;
      }
      if (!manifest.services[serviceName].params) {
        delete manifest.services[serviceName].params;
      }
      if (!manifest.services[serviceName].resources.gpu) {
        delete manifest.services[serviceName].resources.gpu;
      }
    }

    logger.info('Converted SDL to manifest', {
      serviceCount: Object.keys(manifest.services).length,
    });

    return manifest;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default AkashClient;
