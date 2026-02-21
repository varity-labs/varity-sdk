import { DomainRecord } from '../types';

/**
 * Generate a shareable deployment card HTML page with OG meta tags.
 *
 * When shared on Twitter/LinkedIn, the OG tags create a rich preview card
 * showing the app name, live URL, and Varity branding.
 */
export function cardHtml(record: DomainRecord, baseDomain: string): string {
  const appUrl = `https://${baseDomain}/${record.subdomain}`;
  const imageUrl = `https://${baseDomain}/card/${record.subdomain}/image.png`;
  const deployDate = formatDate(record.createdAt);
  const displayName = record.appName || record.subdomain;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(displayName)} — Deployed on Varity</title>

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(displayName)} — Deployed on Varity">
  <meta property="og:description" content="Built and deployed in under 60 seconds. 70% cheaper than AWS, with auth, database, and payments included.">
  <meta property="og:url" content="${appUrl}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Varity">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(displayName)} — Deployed on Varity">
  <meta name="twitter:description" content="Built and deployed in under 60 seconds. 70% cheaper than AWS.">
  <meta name="twitter:image" content="${imageUrl}">
  <meta name="twitter:site" content="@VarityLabs">

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #09090b;
      color: #fafafa;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 2rem;
    }
    .page { max-width: 640px; width: 100%; }

    .card {
      background: linear-gradient(135deg, #18181b 0%, #1e1b2e 100%);
      border: 1px solid #27272a;
      border-radius: 16px;
      padding: 2.5rem;
      margin-bottom: 2rem;
    }
    .card-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 2rem;
    }
    .logo {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #7c3aed, #6d28d9);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.25rem;
      color: #fff;
    }
    .brand { font-size: 1.125rem; font-weight: 600; color: #a78bfa; }

    .app-name {
      font-size: 2rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 0.5rem;
      line-height: 1.2;
    }
    .app-url {
      color: #818cf8;
      text-decoration: none;
      font-size: 1rem;
      display: inline-block;
      margin-bottom: 1.5rem;
    }
    .app-url:hover { text-decoration: underline; }

    .meta {
      display: flex;
      gap: 2rem;
      flex-wrap: wrap;
    }
    .meta-item { }
    .meta-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a; margin-bottom: 0.25rem; }
    .meta-value { font-size: 0.9rem; color: #d4d4d8; }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(124, 58, 237, 0.15);
      border: 1px solid rgba(124, 58, 237, 0.3);
      border-radius: 999px;
      padding: 0.375rem 1rem;
      font-size: 0.8rem;
      color: #a78bfa;
      margin-top: 1.5rem;
    }
    .badge-dot {
      width: 8px; height: 8px;
      background: #22c55e;
      border-radius: 50%;
    }

    .actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      font-size: 0.9rem;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.15s;
    }
    .btn-primary {
      background: #7c3aed;
      color: #fff;
    }
    .btn-primary:hover { background: #6d28d9; }
    .btn-secondary {
      background: #27272a;
      color: #d4d4d8;
      border: 1px solid #3f3f46;
    }
    .btn-secondary:hover { background: #3f3f46; }

    .footer {
      text-align: center;
      color: #52525b;
      font-size: 0.8rem;
      line-height: 1.8;
    }
    .footer a { color: #818cf8; text-decoration: none; }
    .footer a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="page">
    <div class="card">
      <div class="card-header">
        <div class="logo">V</div>
        <span class="brand">Varity</span>
      </div>

      <h1 class="app-name">${esc(displayName)}</h1>
      <a class="app-url" href="${appUrl}">${appUrl}</a>

      <div class="meta">
        <div class="meta-item">
          <div class="meta-label">Deployed</div>
          <div class="meta-value">${deployDate}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Platform</div>
          <div class="meta-value">Varity</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Hosting</div>
          <div class="meta-value">Decentralized</div>
        </div>
      </div>

      <div class="badge">
        <span class="badge-dot"></span>
        Live
      </div>
    </div>

    <div class="actions">
      <a class="btn btn-primary" href="${appUrl}">Visit App</a>
      <a class="btn btn-secondary" href="https://varity.so">Build Your Own</a>
    </div>

    <br>
    <div class="footer">
      <p>Built and deployed with <a href="https://varity.so">Varity</a></p>
      <p>Auth, database, and payments included. 70% cheaper than AWS.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate an SVG deployment card image (1200x630) suitable for OG images
 * and social media sharing.
 */
export function cardSvg(record: DomainRecord, baseDomain: string): string {
  const appUrl = `https://${baseDomain}/${record.subdomain}`;
  const displayName = record.appName || record.subdomain;
  const deployDate = formatDate(record.createdAt);

  // Truncate long names
  const name = displayName.length > 30 ? displayName.slice(0, 27) + '...' : displayName;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#09090b"/>
      <stop offset="100%" style="stop-color:#1e1b2e"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#7c3aed"/>
      <stop offset="100%" style="stop-color:#a78bfa"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Subtle grid pattern -->
  <g opacity="0.03" stroke="#fff" stroke-width="1">
    ${Array.from({ length: 20 }, (_, i) => `<line x1="${i * 60}" y1="0" x2="${i * 60}" y2="630"/>`).join('\n    ')}
    ${Array.from({ length: 11 }, (_, i) => `<line x1="0" y1="${i * 60}" x2="1200" y2="${i * 60}"/>`).join('\n    ')}
  </g>

  <!-- Card border -->
  <rect x="60" y="60" width="1080" height="510" rx="24" fill="none" stroke="#27272a" stroke-width="1"/>

  <!-- Logo -->
  <rect x="100" y="100" width="56" height="56" rx="14" fill="url(#accent)"/>
  <text x="128" y="138" font-family="Liberation Sans, Arial, Helvetica, sans-serif" font-size="28" font-weight="700" fill="#fff" text-anchor="middle">V</text>

  <!-- Brand name -->
  <text x="172" y="137" font-family="Liberation Sans, Arial, Helvetica, sans-serif" font-size="24" font-weight="600" fill="#a78bfa">Varity</text>

  <!-- App name -->
  <text x="100" y="240" font-family="Liberation Sans, Arial, Helvetica, sans-serif" font-size="52" font-weight="700" fill="#ffffff">${esc(name)}</text>

  <!-- App URL -->
  <text x="100" y="290" font-family="Liberation Sans, Arial, Helvetica, sans-serif" font-size="22" fill="#818cf8">${esc(appUrl)}</text>

  <!-- Live badge -->
  <rect x="100" y="330" width="80" height="32" rx="16" fill="#7c3aed" fill-opacity="0.15" stroke="#7c3aed" stroke-opacity="0.3" stroke-width="1"/>
  <circle cx="120" cy="346" r="4" fill="#22c55e"/>
  <text x="148" y="352" font-family="Liberation Sans, Arial, Helvetica, sans-serif" font-size="14" fill="#a78bfa" text-anchor="middle">Live</text>

  <!-- Meta info -->
  <text x="100" y="420" font-family="Liberation Sans, Arial, Helvetica, sans-serif" font-size="13" fill="#71717a" text-transform="uppercase" letter-spacing="1">DEPLOYED</text>
  <text x="100" y="445" font-family="Liberation Sans, Arial, Helvetica, sans-serif" font-size="18" fill="#d4d4d8">${deployDate}</text>

  <text x="350" y="420" font-family="Liberation Sans, Arial, Helvetica, sans-serif" font-size="13" fill="#71717a" text-transform="uppercase" letter-spacing="1">PLATFORM</text>
  <text x="350" y="445" font-family="Liberation Sans, Arial, Helvetica, sans-serif" font-size="18" fill="#d4d4d8">Varity</text>

  <text x="600" y="420" font-family="Liberation Sans, Arial, Helvetica, sans-serif" font-size="13" fill="#71717a" text-transform="uppercase" letter-spacing="1">HOSTING</text>
  <text x="600" y="445" font-family="Liberation Sans, Arial, Helvetica, sans-serif" font-size="18" fill="#d4d4d8">Decentralized</text>

  <!-- Bottom tagline -->
  <text x="100" y="530" font-family="Liberation Sans, Arial, Helvetica, sans-serif" font-size="16" fill="#52525b">Built and deployed with Varity — Auth, database, and payments included.</text>

  <!-- Accent line -->
  <rect x="60" y="570" width="1080" height="3" rx="1.5" fill="url(#accent)" opacity="0.4"/>
</svg>`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(iso: string | undefined): string {
  if (!iso) return 'Recently';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Recently';
  }
}
