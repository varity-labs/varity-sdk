/**
 * Akash Deployment Status & Management
 *
 * The CLI handles deployment creation (SDL generation + Console API).
 * The Gateway only needs status checks and close operations (for the dashboard).
 *
 * API: https://console-api.akash.network
 * Auth: x-api-key header
 */

const CONSOLE_API_URL = process.env.AKASH_CONSOLE_API_URL || 'https://console-api.akash.network';

// Akash block time ~6s. Monthly estimate uses 30 days.
const AKASH_BLOCK_SECONDS = 6;
const BLOCKS_PER_MONTH = (30 * 24 * 3600) / AKASH_BLOCK_SECONDS; // 432,000

// Developer pays 2x the raw Akash lease cost. Margin is hidden.
const MARGIN_MULTIPLIER = 2.0;

function getApiKey(): string {
  const key = process.env.VARITY_AKASH_CONSOLE_KEY;
  if (!key) {
    throw new Error('VARITY_AKASH_CONSOLE_KEY not configured');
  }
  return key;
}

/**
 * Get deployment status via Console API.
 *
 * Returns status, the app URL (if available), and monthlyUsd when the lease
 * price is denominated in uusdc (Managed Wallet mode). Margin applied here so
 * callers never see the raw cost.
 */
export async function getDeploymentStatus(deploymentId: string): Promise<{
  status: 'pending' | 'active' | 'closed' | 'failed';
  url?: string;
  monthlyUsd?: number;
}> {
  try {
    const response = await fetch(`${CONSOLE_API_URL}/v1/deployments/${deploymentId}`, {
      headers: {
        'x-api-key': getApiKey(),
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      if (response.status === 404) return { status: 'failed' };
      throw new Error(`Console API error: ${response.status}`);
    }

    const result = await response.json() as {
      data: {
        deployment: { state: string };
        leases: Array<{
          state: string;
          price?: { denom: string; amount: string };
          status?: {
            services?: Record<string, { uris?: string[] }>;
          };
        }>;
      };
    };

    const { deployment, leases } = result.data;

    let url: string | undefined;
    let monthlyUsd: number | undefined;

    if (leases?.length > 0) {
      const activeLease = leases.find(l => l.state === 'active');

      if (activeLease?.status?.services) {
        const firstService = Object.values(activeLease.status.services)[0];
        url = firstService?.uris?.[0];
      }

      const priceSource = activeLease ?? leases[0];
      // Managed Wallet mode returns "uact" (Akash Credit Token, USD-pegged).
      // "uusdc" also appears for IBC USDC leases. Both are micro-USD (1e-6 USD).
      const denom = priceSource?.price?.denom;
      if (denom === 'uact' || denom === 'uusdc') {
        const perBlockMicroUsd = Number(priceSource!.price!.amount);
        if (Number.isFinite(perBlockMicroUsd) && perBlockMicroUsd > 0) {
          const rawMonthly = (perBlockMicroUsd / 1e6) * BLOCKS_PER_MONTH;
          monthlyUsd = Math.round(rawMonthly * MARGIN_MULTIPLIER * 100) / 100;
        }
      }
    }

    const status = deployment.state === 'active' ? 'active'
      : deployment.state === 'closed' ? 'closed'
      : 'pending';

    return { status, url, monthlyUsd };
  } catch (error) {
    console.error('[akash] Status check failed:', error);
    return { status: 'pending' };
  }
}

/**
 * Close deployment via Console API
 */
export async function closeDeployment(deploymentId: string): Promise<boolean> {
  try {
    const response = await fetch(`${CONSOLE_API_URL}/v1/deployments/${deploymentId}`, {
      method: 'DELETE',
      headers: {
        'x-api-key': getApiKey(),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) return false;

    const result = await response.json() as { data: { success: boolean } };
    return result.data.success;
  } catch {
    return false;
  }
}

/**
 * Check if Akash credentials are configured
 */
export function isConfigured(): boolean {
  return !!process.env.VARITY_AKASH_CONSOLE_KEY;
}
