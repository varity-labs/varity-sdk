export interface DomainRecord {
  id: string;
  subdomain: string;
  cid: string;
  appName: string;
  registeredBy: string;
  createdAt: string;
  updatedAt?: string;
}
