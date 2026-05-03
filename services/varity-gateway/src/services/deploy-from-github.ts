/**
 * Deploy From GitHub Service
 *
 * Orchestrates deployment from a GitHub repository URL:
 * 1. Detect framework from repo contents via GitHub API
 * 2. Generate Akash SDL
 * 3. Create deployment via Akash Console API
 * 4. Poll for bids, accept cheapest
 * 5. Return deployment ID for status polling
 */

import { spawn } from 'node:child_process';
import path from 'node:path';

const CONSOLE_API_URL = process.env.AKASH_CONSOLE_API_URL || 'https://console-api.akash.network';
const GITHUB_API_URL = 'https://api.github.com';

function getAkashApiKey(): string {
  const key = process.env.VARITY_AKASH_CONSOLE_KEY;
  if (!key) throw new Error('VARITY_AKASH_CONSOLE_KEY not configured');
  return key;
}

export type Framework = 'nextjs' | 'react' | 'vue' | 'nuxt' | 'svelte' | 'express' | 'nodejs' | 'python' | 'fastapi' | 'django' | 'flask' | 'unknown';

interface DeployResult {
  deploymentId: string;
  subdomain: string;
  status: string;
  providerUrl?: string;
  provider?: string;
  estimatedMonthlyCost?: number;
  plan?: Record<string, unknown>;
}

interface OrchestratorBridgeResult {
  success: boolean;
  error?: string;
  deploymentId?: string;
  providerUrl?: string;
  provider?: string;
  estimatedMonthlyCost?: number;
  plan?: Record<string, unknown>;
}

export function extractRepoInfo(url: string): { owner: string; repo: string } | null {
  const match = url.trim().match(/github\.com\/([\w.-]+)\/([\w.-]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, '').replace(/\/.*$/, '') };
}

export interface RepoValidationResult {
  reachable: boolean;
  requiresAuth: boolean;
  error?: string;
}

export async function validateRepo(owner: string, repo: string): Promise<RepoValidationResult> {
  const url = `https://github.com/${owner}/${repo}`;
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual',
      signal: AbortSignal.timeout(5000),
      headers: { 'User-Agent': 'Varity-Gateway/1.0' },
    });
    if (res.status === 200) return { reachable: true, requiresAuth: false };
    if (res.status === 301 || res.status === 302) return { reachable: true, requiresAuth: true };
    if (res.status === 404) return { reachable: false, requiresAuth: false, error: 'Repository not found. Check the URL.' };
    // Unexpected status (e.g. rate-limited) — allow deployment to proceed
    return { reachable: true, requiresAuth: false };
  } catch {
    // Network error reaching GitHub — don't block deployment
    return { reachable: true, requiresAuth: false };
  }
}

export async function detectFramework(githubUrl: string): Promise<Framework> {
  const info = extractRepoInfo(githubUrl);
  if (!info) return 'unknown';

  try {
    const contentsRes = await fetch(`${GITHUB_API_URL}/repos/${info.owner}/${info.repo}/contents`, {
      headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'Varity-Gateway/1.0' },
    });
    if (!contentsRes.ok) return 'unknown';

    const contents = (await contentsRes.json()) as { name: string; type: string }[];
    const files = contents.filter(c => c.type === 'file').map(c => c.name);

    if (files.some(f => /^next\.config\.(js|mjs|ts)$/.test(f))) return 'nextjs';
    if (files.some(f => /^nuxt\.config\.(js|ts)$/.test(f))) return 'nuxt';
    if (files.includes('svelte.config.js')) return 'svelte';

    if (files.includes('package.json')) {
      const pkgRes = await fetch(`${GITHUB_API_URL}/repos/${info.owner}/${info.repo}/contents/package.json`, {
        headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'Varity-Gateway/1.0' },
      });
      if (pkgRes.ok) {
        const pkgFile = (await pkgRes.json()) as { content: string };
        const pkg = JSON.parse(Buffer.from(pkgFile.content, 'base64').toString());
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (allDeps.next) return 'nextjs';
        if (allDeps.nuxt) return 'nuxt';
        if (allDeps.vue) return 'vue';
        if (allDeps.svelte) return 'svelte';
        if (allDeps.react) return 'react';
        if (allDeps.express) return 'express';
        return 'nodejs';
      }
    }

    if (files.includes('requirements.txt') || files.includes('pyproject.toml')) {
      const reqFile = files.includes('requirements.txt') ? 'requirements.txt' : 'pyproject.toml';
      const reqRes = await fetch(`${GITHUB_API_URL}/repos/${info.owner}/${info.repo}/contents/${reqFile}`, {
        headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'Varity-Gateway/1.0' },
      });
      if (reqRes.ok) {
        const reqData = (await reqRes.json()) as { content: string };
        const content = Buffer.from(reqData.content, 'base64').toString();
        if (content.includes('fastapi')) return 'fastapi';
        if (content.includes('django')) return 'django';
        if (content.includes('flask')) return 'flask';
        return 'python';
      }
    }

    return 'unknown';
  } catch {
    return 'unknown';
  }
}

function getPort(framework: Framework): number {
  switch (framework) {
    case 'nextjs': return 3000;
    case 'nuxt': return 3000;
    case 'react': return 3000;
    case 'vue': return 3000;
    case 'svelte': return 3000;
    case 'express': return 3000;
    case 'nodejs': return 3000;
    case 'fastapi': return 8000;
    case 'django': return 8000;
    case 'flask': return 5000;
    case 'python': return 8000;
    default: return 3000;
  }
}

function getBuildCommand(framework: Framework, githubUrl: string, port: number, migrateFromVercel = false): string {
  const cloneCmd = `apt-get update && apt-get install -y git openssl ca-certificates && git clone ${githubUrl} /app && cd /app`;
  const nodeInstall = 'corepack enable || true; if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; else npm install --legacy-peer-deps; fi';
  const nodeBuild = 'if [ -f package.json ] && node -e "const p=require(\'./package.json\');process.exit(p.scripts&&p.scripts.build?0:1)"; then npm run build; fi';
  const spaServe = `OUT=dist; [ -d build ] && OUT=build; [ -d "$OUT" ] || (echo "Build output directory not found" && exit 1); npx --yes serve -s "$OUT" -l ${port}`;
  const pythonInstall = 'if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; elif [ -f pyproject.toml ]; then pip install --no-cache-dir .; fi';

  // Ignore Vercel routing/build config when migrating. Keep @vercel/* packages:
  // some apps use @vercel/blob, @vercel/postgres, analytics, or KV at runtime.
  const vercelStrip = migrateFromVercel
    ? ` && [ -f vercel.json ] && mv vercel.json vercel.json.varity-backup || true`
    : '';

  switch (framework) {
    case 'nextjs':
      return `${cloneCmd}${vercelStrip} && ${nodeInstall} && npm run build && npm start`;
    case 'nuxt':
      return `${cloneCmd}${vercelStrip} && ${nodeInstall} && npm run build && node .output/server/index.mjs`;
    case 'react':
    case 'vue':
    case 'svelte':
      return `${cloneCmd}${vercelStrip} && ${nodeInstall} && ${nodeBuild} && ${spaServe}`;
    case 'express':
    case 'nodejs':
      return `${cloneCmd}${vercelStrip} && ${nodeInstall} && npm start`;
    case 'fastapi':
      return `apt-get update && apt-get install -y git && git clone ${githubUrl} /app && cd /app && ${pythonInstall} && uvicorn main:app --host 0.0.0.0 --port ${port}`;
    case 'django':
      return `apt-get update && apt-get install -y git && git clone ${githubUrl} /app && cd /app && ${pythonInstall} && python manage.py migrate && python manage.py runserver 0.0.0.0:${port}`;
    case 'flask':
      return `apt-get update && apt-get install -y git && git clone ${githubUrl} /app && cd /app && ${pythonInstall} && flask run --host=0.0.0.0 --port=${port}`;
    case 'python':
      return `apt-get update && apt-get install -y git && git clone ${githubUrl} /app && cd /app && ${pythonInstall} && python main.py`;
    default:
      return `${cloneCmd}${vercelStrip} && ${nodeInstall} && npm start`;
  }
}

function formatEnvValue(key: string, value: string): string {
  return JSON.stringify(`${key}=${value}`);
}

function getImage(framework: Framework): string {
  switch (framework) {
    case 'python':
    case 'fastapi':
    case 'django':
    case 'flask':
      return 'python:3.11-slim';
    default:
      return 'node:20-slim';
  }
}

export function generateSdl(
  githubUrl: string,
  framework: Framework,
  envVars?: Record<string, string>,
  opts: { migrateFromVercel?: boolean } = {},
): string {
  const port = getPort(framework);
  const buildCmd = getBuildCommand(framework, githubUrl, port, opts.migrateFromVercel);
  const image = getImage(framework);

  const isPython = ['python', 'fastapi', 'django', 'flask'].includes(framework);
  const defaultEnv: Record<string, string> = isPython
    ? { PYTHONUNBUFFERED: '1', PORT: String(port) }
    : {
        NODE_ENV: 'production',
        PORT: String(port),
        HOST: '0.0.0.0',
        HOSTNAME: '0.0.0.0',
        NODE_OPTIONS: '--max-old-space-size=3584',
      };
  const reservedEnv = new Set(Object.keys(defaultEnv));
  const userEnv = Object.fromEntries(
    Object.entries(envVars || {}).filter(([key]) => !reservedEnv.has(key))
  );
  const mergedEnv = { ...userEnv, ...defaultEnv };

  const envLines = Object.entries(mergedEnv)
    .filter(([key]) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(key))
    .map(([key, value]) => `      - ${formatEnvValue(key, String(value))}`)
    .join('\n');
  const envBlock = envLines ? `\n    env:\n${envLines}` : '';

  return `---
version: "2.0"
services:
  app:
    image: ${image}
    command:
      - "/bin/sh"
      - "-c"
    args:
      - |-
        ${buildCmd}${envBlock}
    expose:
      - port: ${port}
        as: 80
        to:
          - global: true
profiles:
  compute:
    app:
      resources:
        cpu:
          units: 2
        memory:
          size: ${isPython ? '4Gi' : '8Gi'}
        storage:
          size: 4Gi
  placement:
    dcloud:
      pricing:
        app:
          denom: uakt
          amount: 10000
deployment:
  app:
    dcloud:
      profile: app
      count: 1
`;
}

async function akashFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${CONSOLE_API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': getAkashApiKey(),
      'User-Agent': 'Varity/1.0',
      ...options.headers,
    },
  });
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function createDeployment(
  githubUrl: string,
  framework: Framework,
  envVars?: Record<string, string>,
  opts: { migrateFromVercel?: boolean } = {},
): Promise<{ dseq: string; manifest: string }> {
  const sdl = generateSdl(githubUrl, framework, envVars, opts);

  const res = await akashFetch('/v1/deployments', {
    method: 'POST',
    body: JSON.stringify({ data: { sdl, deposit: 5 } }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Akash deployment creation failed (${res.status}): ${errText}`);
  }

  const result = await res.json() as { data: { dseq: string; manifest: string } };
  return { dseq: result.data.dseq, manifest: result.data.manifest };
}

export async function waitForBidsAndAccept(
  dseq: string,
  manifest: string,
): Promise<void> {
  let provider: string | null = null;
  let cheapestPrice = Infinity;

  for (let i = 0; i < 10; i++) {
    await sleep(3000);

    const bidsRes = await akashFetch(`/v1/bids?dseq=${dseq}`);
    if (!bidsRes.ok) continue;

    const bidsData = await bidsRes.json() as {
      data: Array<{
        bid: {
          id: { provider: string; gseq: number; oseq: number };
          price?: { amount: string; denom: string };
        };
      }>;
    };

    if (bidsData.data && bidsData.data.length > 0) {
      for (const entry of bidsData.data) {
        const price = Number(entry.bid?.price?.amount ?? '0');
        if (price < cheapestPrice) {
          cheapestPrice = price;
          provider = entry.bid?.id?.provider ?? null;
        }
      }
      break;
    }
  }

  if (!provider) {
    throw new Error('No providers bid on the deployment. Try again later.');
  }

  const leaseRes = await akashFetch('/v1/leases', {
    method: 'POST',
    body: JSON.stringify({
      manifest,
      leases: [{ dseq, gseq: 1, oseq: 1, provider }],
    }),
  });

  if (!leaseRes.ok) {
    const errText = await leaseRes.text();
    throw new Error(`Failed to accept bid (${leaseRes.status}): ${errText}`);
  }
}

export async function deployFromGithub(
  githubUrl: string,
  email: string,
  subdomain: string,
  framework?: string,
  envVars?: Record<string, string>,
  opts: { migrateFromVercel?: boolean } = {},
): Promise<DeployResult> {
  // Normalize to canonical URL form to eliminate shell-injection surface in build command.
  const info = extractRepoInfo(githubUrl);
  if (!info) throw new Error('Invalid GitHub URL');
  const safeUrl = `https://github.com/${info.owner}/${info.repo}`;

  const result = await runCanonicalOrchestrator({
    githubUrl: safeUrl,
    subdomain,
    framework,
    migrateFromVercel: opts.migrateFromVercel,
    envVars,
  });

  return {
    deploymentId: result.deploymentId!,
    subdomain,
    status: 'deploying',
    providerUrl: result.providerUrl,
    provider: result.provider,
    estimatedMonthlyCost: result.estimatedMonthlyCost,
    plan: result.plan,
  };
}

function runCanonicalOrchestrator(payload: Record<string, unknown>): Promise<OrchestratorBridgeResult> {
  return new Promise((resolve, reject) => {
    const script = path.resolve(process.cwd(), 'orchestrator/deploy_from_github.py');
    const child = spawn('python3', [script], {
      env: {
        ...process.env,
        AKASH_CONSOLE_API_KEY: process.env.AKASH_CONSOLE_API_KEY || process.env.VARITY_AKASH_CONSOLE_KEY || '',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', chunk => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', chunk => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', code => {
      const parsed = (() => {
        try {
          return JSON.parse(stdout.trim() || '{}') as OrchestratorBridgeResult;
        } catch {
          const jsonLine = stdout
            .trim()
            .split(/\r?\n/)
            .reverse()
            .find(line => line.trim().startsWith('{') && line.trim().endsWith('}'));
          if (!jsonLine) return null;
          try {
            return JSON.parse(jsonLine) as OrchestratorBridgeResult;
          } catch {
            return null;
          }
        }
      })();

      if (!parsed) {
        reject(new Error(`Canonical orchestrator returned invalid output: ${stderr || stdout || `exit ${code}`}`));
        return;
      }
      if (code !== 0 || !parsed.success || !parsed.deploymentId) {
        reject(new Error(parsed.error || stderr || `Canonical orchestrator failed with exit ${code}`));
        return;
      }
      resolve(parsed);
    });

    child.stdin.end(JSON.stringify(payload));
  });
}
