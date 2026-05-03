export type DeploymentType = 'ipfs' | 'akash' | 'custom';

export interface DomainRecord {
  id: string;
  subdomain: string;
  cid: string;
  appName: string;
  tagline?: string;
  logoUrl?: string;
  ownerId?: string;
  registeredBy: string;
  createdAt: string;
  updatedAt?: string;
  deploymentType?: DeploymentType;
  deploymentUrl?: string;
  deploymentId?: string;
}

export interface AuthenticatedUser {
  userId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
