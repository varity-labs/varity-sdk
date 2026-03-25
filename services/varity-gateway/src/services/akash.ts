/**
 * Akash Network Deployment Service
 *
 * Re-exports from akash-deploy.ts which uses the Akash Console API.
 * This file exists for backward compatibility with any code that imports from './akash'.
 *
 * The previous subprocess approach (akash-subprocess.ts) has been deprecated.
 * All real deployment logic is in akash-deploy.ts.
 */

export {
  deployToAkash,
  getDeploymentStatus,
  closeDeployment,
  generateSDL,
  getAccountInfo,
} from './akash-deploy';

export type {
  AkashResources,
  AkashDeploymentConfig,
  AkashDeploymentResult,
} from './akash-deploy';
