/**
 * Deploy From GitHub Routes
 *
 * POST /api/deploy/from-github — Accept a GitHub URL, deploy to Akash, register domain
 *
 * This is the backend for the developer portal's Deploy tab.
 * The endpoint is long-running (~30-60s) because it waits for Akash bids.
 */

import { Router, Request, Response } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { config, DB_COLLECTION } from '../config';
import { deployFromGithub, extractRepoInfo, validateRepo } from '../services/deploy-from-github';
import { fetchAllDomains, invalidateCache } from '../services/resolver';
import { verifyPrivyToken } from '../middleware/privyAuth';
import { closeDeployment } from '../services/akash-deploy';

export const deployRouter = Router();

const deployRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req: Request) => req.user?.userId ?? (req.ip ? ipKeyGenerator(req.ip) : 'unknown'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many deploy requests. Limit is 10 per hour.' },
});

function isValidGithubUrl(url: string): boolean {
  return /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+(\/.*)?$/.test(url.trim());
}

function generateSubdomain(repoName: string): string {
  return repoName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

/**
 * POST /api/deploy/from-github
 *
 * Body: { githubUrl, subdomain?, framework?, envVars? }
 * Returns: { deploymentId, subdomain, status, url }
 */
deployRouter.post('/api/deploy/from-github', verifyPrivyToken, deployRateLimit, async (req: Request, res: Response) => {
  const { githubUrl, subdomain: requestedSubdomain, framework, envVars, migrateFromVercel } = req.body;
  const ownerId = req.user!.userId;

  if (!githubUrl || !isValidGithubUrl(githubUrl)) {
    res.status(400).json({ error: 'A valid GitHub repository URL is required' });
    return;
  }

  const repoInfo = extractRepoInfo(githubUrl);
  if (!repoInfo) {
    res.status(400).json({ error: 'Could not parse repository from URL' });
    return;
  }

  const repoCheck = await validateRepo(repoInfo.owner, repoInfo.repo);
  if (!repoCheck.reachable) {
    res.status(422).json({ error: repoCheck.error ?? 'Repository not found. Check the URL.' });
    return;
  }
  if (repoCheck.requiresAuth) {
    res.status(422).json({
      error: 'This repository is private. Private repository deploys require Varity builder packaging before Akash deployment.',
    });
    return;
  }

  let subdomain = requestedSubdomain
    ? requestedSubdomain.toLowerCase().replace(/[^a-z0-9-]/g, '')
    : generateSubdomain(repoInfo.repo);

  if (subdomain.length < 3) subdomain = `app-${subdomain}`;

  try {
    const domains = await fetchAllDomains();
    if (domains.find(d => d.subdomain === subdomain)) {
      subdomain = `${subdomain}-${Date.now().toString(36).slice(-4)}`;
    }

    console.log(`[deploy] Starting deployment: ${githubUrl} -> varity.app/${subdomain} (user:${ownerId})`);

    const result = await deployFromGithub(githubUrl, ownerId, subdomain, framework, envVars, { migrateFromVercel: !!migrateFromVercel });

    const record: Record<string, unknown> = {
      subdomain,
      cid: `akash:${result.deploymentId}`,
      appName: repoInfo.repo,
      ownerId,
      registeredBy: 'portal',
      createdAt: new Date().toISOString(),
      deploymentType: 'akash',
      deploymentId: result.deploymentId,
      deploymentUrl: result.providerUrl,
      provider: result.provider,
      billing: result.estimatedMonthlyCost != null
        ? { monthlyUsd: result.estimatedMonthlyCost, currency: 'USD' }
        : undefined,
      orchestration: result.plan,
    };

    const addUrl = `${config.dbProxy.url}/db/${DB_COLLECTION}/add`;
    try {
      const addRes = await fetch(addUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.dbProxy.token}`,
        },
        body: JSON.stringify(record),
        signal: AbortSignal.timeout(5000),
      });

      if (!addRes.ok) {
        const errText = await addRes.text();
        console.error(`[deploy] Domain registration failed: ${addRes.status} ${errText}`);
        await closeDeployment(result.deploymentId);
        res.status(500).json({ error: 'Deployment succeeded but routing could not be registered. Please retry.' });
        return;
      }

      invalidateCache(subdomain);
      console.log(`[deploy] Domain registered: varity.app/${subdomain}`);
    } catch (domainErr) {
      console.error('[deploy] Domain registration error:', domainErr);
      await closeDeployment(result.deploymentId);
      res.status(500).json({ error: 'Deployment succeeded but routing could not be registered. Please retry.' });
      return;
    }

    res.json({
      deploymentId: result.deploymentId,
      subdomain,
      status: 'deploying',
      url: `https://varity.app/${subdomain}/`,
    });
  } catch (error) {
    console.error('[deploy] Deployment failed:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Deployment failed',
    });
  }
});
