import { config } from './config.js';

const CONSOLE_API_URL = process.env.AKASH_CONSOLE_API_URL || 'https://console-api.akash.network';
const AKASH_BLOCK_SECONDS = 6;
const BLOCKS_PER_MONTH = (30 * 24 * 3600) / AKASH_BLOCK_SECONDS; // 432,000
const MARGIN_MULTIPLIER = 2.0;

interface ConsoleDeploymentResponse {
  data: {
    deployment: { state: string };
    leases: Array<{
      state: string;
      price?: { denom: string; amount: string };
    }>;
  };
}

export interface DeploymentCost {
  status: 'active' | 'closed' | 'pending' | 'failed';
  monthlyUsd?: number;
  hourlyUsd?: number;
}

export async function getDeploymentCost(deploymentId: string): Promise<DeploymentCost> {
  try {
    const response = await fetch(`${CONSOLE_API_URL}/v1/deployments/${deploymentId}`, {
      headers: {
        'x-api-key': config.akashConsoleKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) return { status: 'failed' };
      throw new Error(`Console API error: ${response.status}`);
    }

    const result = (await response.json()) as ConsoleDeploymentResponse;
    const { deployment, leases } = result.data;

    let monthlyUsd: number | undefined;
    let hourlyUsd: number | undefined;

    if (leases?.length > 0) {
      const activeLease = leases.find((l) => l.state === 'active');
      const priceSource = activeLease ?? leases[0];
      const denom = priceSource?.price?.denom;

      if (denom === 'uact' || denom === 'uusdc') {
        const perBlockMicroUsd = Number(priceSource!.price!.amount);
        if (Number.isFinite(perBlockMicroUsd) && perBlockMicroUsd > 0) {
          const rawMonthly = (perBlockMicroUsd / 1e6) * BLOCKS_PER_MONTH;
          monthlyUsd = Math.round(rawMonthly * MARGIN_MULTIPLIER * 100) / 100;
          hourlyUsd = Math.round((monthlyUsd / 730) * 10000) / 10000;
        }
      }
    }

    const status =
      deployment.state === 'active'
        ? 'active'
        : deployment.state === 'closed'
          ? 'closed'
          : 'pending';

    return { status, monthlyUsd, hourlyUsd };
  } catch (error) {
    console.error(`[akash-cost] Failed for deployment ${deploymentId}:`, error);
    return { status: 'failed' };
  }
}
