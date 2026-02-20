export interface DomainRecord {
  id: string;
  subdomain: string;
  cid: string;
  appName: string;
  ownerId?: string;
  registeredBy: string;
  createdAt: string;
  updatedAt?: string;
}
