/**
 * Akash Deployment Service - Correct Approach
 *
 * Uses the same deployment method Varity uses for production services.
 * Supports both Varity's account (free tier) and developer accounts (pro tier).
 *
 * Payment: USD via Akash Console, not AKT tokens
 * Authentication: Console API key, not blockchain wallet
 */

export interface AkashResources {
  cpu: string;
  memory: string;
  storage: string;
}

export interface AkashDeploymentConfig {
  containerImage: string;
  resources: AkashResources;
  env: Record<string, string>;
  port: number;
  name?: string;
}

export interface AkashDeploymentResult {
  deploymentId: string;
  url: string;
  estimatedCost: string;
  provider: string;
  tier: 'free' | 'pro';
}

/**
 * Generate SDL manifest (same format Varity uses)
 */
export function generateSDL(config: AkashDeploymentConfig): string {
  const { containerImage, resources, env, port, name } = config;

  // Convert env vars to SDL format
  const envVars = Object.entries(env)
    .map(([key, value]) => `      - ${key}=${value}`)
    .join('\n');

  const sdl = `---
version: "2.0"

services:
  web:
    image: ${containerImage}
    expose:
      - port: ${port}
        as: 80
        to:
          - global: true
${envVars ? `    env:\n${envVars}` : ''}

profiles:
  compute:
    web:
      resources:
        cpu:
          units: ${resources.cpu}
        memory:
          size: ${resources.memory}
        storage:
          - size: ${resources.storage}

  placement:
    akash:
      pricing:
        web:
          denom: uakt
          amount: 1000

deployment:
  web:
    akash:
      profile: web
      count: 1
`;

  return sdl;
}

/**
 * Get deployment credentials
 * Checks for developer key (pro tier) or uses Varity key (free tier)
 */
function getDeploymentCredentials(): {
  apiKey: string;
  tier: 'free' | 'pro';
  accountEmail?: string;
} {
  // Check for developer's Akash Console API key (pro tier)
  const devKey = process.env.USER_AKASH_CONSOLE_KEY;
  if (devKey) {
    return {
      apiKey: devKey,
      tier: 'pro',
      accountEmail: process.env.USER_EMAIL,
    };
  }

  // Use Varity's Akash Console API key (free tier)
  const varietyKey = process.env.VARITY_AKASH_CONSOLE_KEY;
  if (!varietyKey) {
    throw new Error(
      'No Akash credentials configured. Set VARITY_AKASH_CONSOLE_KEY environment variable.'
    );
  }

  return {
    apiKey: varietyKey,
    tier: 'free',
  };
}

/**
 * Deploy to Akash Network via Console API
 *
 * This uses the same method Varity uses for production deployments.
 * Payment is via USD (Console billing), not AKT tokens.
 *
 * API: https://console-api.akash.network
 * Docs: https://console-api.akash.network/v1/swagger
 */
export async function deployToAkash(
  config: AkashDeploymentConfig
): Promise<AkashDeploymentResult> {
  try {
    const { apiKey, tier, accountEmail } = getDeploymentCredentials();
    const sdl = generateSDL(config);

    console.log(`[akash-deploy] Deploying via ${tier} tier`);
    if (tier === 'pro' && accountEmail) {
      console.log(`[akash-deploy] Using developer account: ${accountEmail}`);
    }

    // Call Akash Console API
    const consoleApiUrl = process.env.AKASH_CONSOLE_API_URL || 'https://console-api.akash.network';
    const response = await fetch(`${consoleApiUrl}/v1/deployments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {
          sdl,
          deposit: 5 // $5 initial deposit (will be billed from account balance)
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Akash Console API error (${response.status}): ${errorText}`);
    }

    const result = await response.json() as {
      data: {
        dseq: number;
        manifest: string;
        signTx: any;
      };
    };

    // Response format: { data: { dseq, manifest, signTx } }
    const { dseq, manifest } = result.data;

    console.log(`[akash-deploy] Deployment created: ${dseq}`);

    // The URL will be available after lease is created and manifest is sent
    // For now, we'll check the deployment status to get the URL
    const deployment = {
      deploymentId: dseq.toString(),
      url: `https://deploy-${dseq}.provider.akash.network`, // Placeholder until lease is active
      estimatedCost: calculateEstimatedCost(config.resources),
      provider: 'pending', // Will be assigned when lease is created
      tier,
    };

    console.log(`[akash-deploy] Deployment ID (dseq): ${deployment.deploymentId}`);
    console.log(`[akash-deploy] Estimated cost: ${deployment.estimatedCost}`);

    return deployment;
  } catch (error) {
    console.error('[akash-deploy] Deployment failed:', error);
    throw error;
  }
}

/**
 * Calculate estimated monthly cost in USD
 */
function calculateEstimatedCost(resources: AkashResources): string {
  // Rough estimate based on Akash pricing
  // Actual cost depends on provider bids and market rates

  const cpuCost = parseFloat(resources.cpu) * 10; // $10 per CPU/month
  const memoryCost = parseInt(resources.memory) / 1024; // $1 per GB/month
  const storageCost = parseInt(resources.storage) / 1024 * 0.5; // $0.50 per GB/month

  const totalCost = cpuCost + memoryCost + storageCost;

  return `$${Math.round(totalCost)}/month`;
}

/**
 * Get deployment status via Console API
 */
export async function getDeploymentStatus(deploymentId: string): Promise<{
  status: 'pending' | 'active' | 'closed' | 'failed';
  url?: string;
  tier?: 'free' | 'pro';
}> {
  try {
    const { apiKey, tier } = getDeploymentCredentials();

    const consoleApiUrl = process.env.AKASH_CONSOLE_API_URL || 'https://console-api.akash.network';
    const response = await fetch(
      `${consoleApiUrl}/v1/deployments/${deploymentId}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return {
          status: 'failed',
          tier
        };
      }
      throw new Error(`Failed to get deployment status: ${response.statusText}`);
    }

    const result = await response.json() as {
      data: {
        deployment: {
          state: string;
        };
        leases: Array<{
          state: string;
          status?: {
            services?: Array<{
              uris?: string[];
            }>;
          };
        }>;
      };
    };

    // Response format: { data: { deployment: { state: "active" }, leases: [...] } }
    const { deployment, leases } = result.data;

    // Extract URL from lease status if available
    let url: string | undefined;
    if (leases && leases.length > 0) {
      const activeLease = leases.find((l: any) => l.state === 'active');
      if (activeLease && activeLease.status) {
        url = activeLease.status.services?.[0]?.uris?.[0];
      }
    }

    // Map Akash state to our status enum
    let status: 'pending' | 'active' | 'closed' | 'failed';
    switch (deployment.state) {
      case 'active':
        status = 'active';
        break;
      case 'closed':
        status = 'closed';
        break;
      default:
        status = 'pending';
    }

    return {
      status,
      url,
      tier
    };
  } catch (error) {
    console.error('[akash-deploy] Status check failed:', error);
    return {
      status: 'failed',
    };
  }
}

/**
 * Close deployment via Console API
 */
export async function closeDeployment(deploymentId: string): Promise<boolean> {
  try {
    const { apiKey } = getDeploymentCredentials();

    const consoleApiUrl = process.env.AKASH_CONSOLE_API_URL || 'https://console-api.akash.network';
    const response = await fetch(
      `${consoleApiUrl}/v1/deployments/${deploymentId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to close deployment: ${errorText}`);
    }

    const result = await response.json() as {
      data: {
        success: boolean;
      };
    };

    // Response format: { data: { success: true } }
    console.log(`[akash-deploy] Deployment closed: ${deploymentId}`);
    return result.data.success;
  } catch (error) {
    console.error('[akash-deploy] Close failed:', error);
    return false;
  }
}

/**
 * Get account tier and credits info
 */
export async function getAccountInfo(): Promise<{
  tier: 'free' | 'pro';
  email?: string;
  creditsRemaining?: number;
}> {
  const { tier, accountEmail } = getDeploymentCredentials();

  // For free tier (Varity account), we don't expose balance details
  if (tier === 'free') {
    return {
      tier,
      email: undefined, // Don't expose Varity's account email
      creditsRemaining: undefined,
    };
  }

  // For pro tier, could fetch actual balance from Console API
  // For now, return basic info
  return {
    tier,
    email: accountEmail,
    creditsRemaining: undefined, // Could implement: GET /v1/user/balance or similar
  };
}
