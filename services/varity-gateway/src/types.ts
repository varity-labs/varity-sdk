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
}
