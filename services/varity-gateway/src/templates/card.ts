import { DomainRecord } from '../types';
import { FONT_CSS } from './font-css';

// ---------------------------------------------------------------------------
// Brand constants (mirrors deployment-cards-dev/shared/brand.js)
// ---------------------------------------------------------------------------

const colors = {
  bg:             '#030712',
  foreground:     '#F8FAFC',
  foregroundMuted: '#94A3B8',
  foregroundDim:  '#64748B',
  brand500:       '#14B8A6',
  brand400:       '#2DD4BF',
  brand600:       '#0D9488',
  blue400:        '#3B82F6',
  purple400:      '#A855F7',
  border:         '#1E293B',
};

const fonts = {
  display: "Cabinet Grotesk, sans-serif",
  body:    "Satoshi, sans-serif",
  mono:    "JetBrains Mono, monospace",
};

// ---------------------------------------------------------------------------
// Developer Card SVG — App name hero with ghost terminal texture
// ---------------------------------------------------------------------------

export function cardSvgDev(record: DomainRecord, _baseDomain: string): string {
  const displayName = record.appName || titleCase(record.subdomain);
  const subdomain = record.subdomain || 'my-app';
  const appUrl = `varity.app/${esc(subdomain)}`;

  // Truncate long app names
  const truncName = displayName.length > 28
    ? displayName.slice(0, 26) + '...'
    : displayName;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <style>${FONT_CSS}</style>

    <!-- Background gradient (deep space) -->
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#030712"/>
      <stop offset="50%" stop-color="#0a1628"/>
      <stop offset="100%" stop-color="#030712"/>
    </linearGradient>

    <!-- Accent gradient -->
    <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#14B8A6"/>
      <stop offset="50%" stop-color="#2DD4BF"/>
      <stop offset="100%" stop-color="#3B82F6"/>
    </linearGradient>

    <!-- Logo gradients -->
    <linearGradient id="logoFacet1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#5EEAD4"/><stop offset="100%" stop-color="#0D9488"/>
    </linearGradient>
    <linearGradient id="logoFacet2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#60A5FA"/><stop offset="100%" stop-color="#1D4ED8"/>
    </linearGradient>
    <linearGradient id="logoFacet4" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#14B8A6"/><stop offset="100%" stop-color="#2DD4BF"/>
    </linearGradient>

    <!-- Glow filter -->
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="20" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Grid pattern -->
    <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#ffffff" stroke-width="1"/>
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGradient)"/>

  <!-- Grid pattern -->
  <g opacity="0.03">
    <rect width="1200" height="630" fill="url(#grid)"/>
  </g>

  <!-- Decorative orbs -->
  <ellipse cx="200" cy="150" rx="300" ry="200" fill="#14B8A6" opacity="0.05" filter="url(#glow)"/>
  <ellipse cx="1000" cy="500" rx="350" ry="250" fill="#3B82F6" opacity="0.05" filter="url(#glow)"/>

  <!-- 1px border for dark-mode feed visibility -->
  <rect x="0" y="0" width="1200" height="630" fill="none" stroke="#1E293B" stroke-width="1"/>

  <!-- Top accent line (4px) -->
  <rect x="0" y="0" width="1200" height="4" fill="url(#accentGradient)"/>

  <!-- Ghost terminal lines as background texture (8% opacity) -->
  <g opacity="0.08" font-family="${fonts.mono}" font-size="13" fill="#94A3B8">
    <text x="80" y="100">$ varitykit deploy</text>
    <text x="80" y="124">Analyzing your app...</text>
    <text x="80" y="148">  &#x2713; Detected: Next.js application</text>
    <text x="80" y="172">  &#x2713; Setting up: Auth, payments, storage</text>
    <text x="80" y="196">  &#x2713; Optimizing for production</text>
    <text x="80" y="244">Deploying to Varity...</text>
    <text x="80" y="268">  &#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588; 100%</text>
    <text x="660" y="100">&#x2705; Live at: https://${appUrl}</text>
    <text x="660" y="124">Monthly cost: $49/mo</text>
    <text x="660" y="172">$ varitykit status</text>
    <text x="660" y="196">  App: ${esc(displayName)}</text>
    <text x="660" y="220">  Status: healthy</text>
    <text x="660" y="244">  Uptime: 99.9%</text>
    <text x="80" y="520">$ _</text>
    <text x="660" y="520">  Requests: 12,847 today</text>
  </g>

  <!-- Varity wordmark top-left with crystal logo -->
  <g transform="translate(48, 40)">
    <g transform="scale(0.375)">
      <path d="M32 6 L48 22 L32 32 L16 22 Z" fill="url(#logoFacet4)"/>
      <path d="M16 22 L32 32 L32 58 L8 36 Z" fill="url(#logoFacet1)"/>
      <path d="M48 22 L56 36 L32 58 L32 32 Z" fill="url(#logoFacet2)"/>
      <path d="M8 36 L32 58 L20 58 Z" fill="url(#logoFacet1)" opacity="0.7"/>
      <path d="M56 36 L44 58 L32 58 Z" fill="url(#logoFacet2)" opacity="0.7"/>
      <path d="M32 12 L40 22 L32 28 L24 22 Z" fill="white" opacity="0.25"/>
    </g>
    <text x="30" y="18" font-family="${fonts.body}" font-size="18" font-weight="700" fill="#94A3B8">Varity</text>
  </g>

  <!-- HERO CONTENT (centered) -->
  <g transform="translate(600, 280)">
    <!-- App name — THE HERO (52px, white, extrabold) -->
    <text x="0" y="0" font-family="${fonts.display}" font-size="52" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="-1">
      ${esc(truncName)}
    </text>

    <!-- "is live." in teal (40px) -->
    <text x="0" y="52" font-family="${fonts.display}" font-size="40" font-weight="700" fill="#2DD4BF" text-anchor="middle" letter-spacing="-0.5">
      is live.
    </text>

    <!-- Proof metrics line (22px, muted) -->
    <text x="0" y="100" font-family="${fonts.body}" font-size="22" font-weight="500" fill="#64748B" text-anchor="middle">
      Deployed in under 60s &#xB7; 70% cheaper than AWS
    </text>
  </g>

  <!-- Bottom bar: app URL left, varity.so right -->
  <text x="48" y="600" font-family="${fonts.body}" font-size="16" font-weight="500" fill="#475569">${appUrl}</text>
  <text x="1152" y="600" font-family="${fonts.body}" font-size="16" font-weight="500" fill="#475569" text-anchor="end">varity.so</text>

  <!-- Bottom accent line (4px) -->
  <rect x="0" y="626" width="1200" height="4" fill="url(#accentGradient)"/>
</svg>`;
}

// ---------------------------------------------------------------------------
// User Card SVG — App-centric with tagline and CTA pill
// ---------------------------------------------------------------------------

export function cardSvgUser(record: DomainRecord, _baseDomain: string): string {
  const displayName = record.appName || titleCase(record.subdomain);
  const subdomain = record.subdomain || 'my-app';
  const appUrl = `varity.app/${esc(subdomain)}`;
  const tagline = record.tagline || 'Built and deployed on Varity';

  // Truncate long names/taglines
  const truncName = displayName.length > 28
    ? displayName.slice(0, 26) + '...'
    : displayName;

  const truncTagline = tagline.length > 60
    ? tagline.slice(0, 58) + '...'
    : tagline;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <style>${FONT_CSS}</style>

    <!-- Background gradient (deep space) -->
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#030712"/>
      <stop offset="50%" stop-color="#0a1628"/>
      <stop offset="100%" stop-color="#030712"/>
    </linearGradient>

    <!-- Accent gradient -->
    <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#14B8A6"/>
      <stop offset="50%" stop-color="#2DD4BF"/>
      <stop offset="100%" stop-color="#3B82F6"/>
    </linearGradient>

    <!-- Logo gradients -->
    <linearGradient id="logoFacet1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#5EEAD4"/><stop offset="100%" stop-color="#0D9488"/>
    </linearGradient>
    <linearGradient id="logoFacet2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#60A5FA"/><stop offset="100%" stop-color="#1D4ED8"/>
    </linearGradient>
    <linearGradient id="logoFacet4" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#14B8A6"/><stop offset="100%" stop-color="#2DD4BF"/>
    </linearGradient>

    <!-- Glow filter -->
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="20" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Grid pattern -->
    <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#ffffff" stroke-width="1"/>
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGradient)"/>

  <!-- Grid pattern -->
  <g opacity="0.03">
    <rect width="1200" height="630" fill="url(#grid)"/>
  </g>

  <!-- Decorative orbs -->
  <ellipse cx="200" cy="150" rx="300" ry="200" fill="#14B8A6" opacity="0.05" filter="url(#glow)"/>
  <ellipse cx="1000" cy="500" rx="350" ry="250" fill="#3B82F6" opacity="0.05" filter="url(#glow)"/>

  <!-- 1px border for dark-mode feed visibility -->
  <rect x="0" y="0" width="1200" height="630" fill="none" stroke="#1E293B" stroke-width="1"/>

  <!-- Top accent line (4px) -->
  <rect x="0" y="0" width="1200" height="4" fill="url(#accentGradient)"/>

  <!-- HERO CONTENT (centered) -->
  <g transform="translate(600, ${record.logoUrl ? 275 : 290})">
    ${record.logoUrl ? `
    <!-- Developer's app icon (64x64 with rounded corners) -->
    <defs>
      <clipPath id="iconClip">
        <rect x="-32" y="-100" width="64" height="64" rx="12" ry="12"/>
      </clipPath>
    </defs>
    <image href="${esc(record.logoUrl)}" x="-32" y="-100" width="64" height="64" clip-path="url(#iconClip)"/>
    ` : ''}

    <!-- App name — THE HERO (56px, white, extrabold) -->
    <text x="0" y="0" font-family="${fonts.display}" font-size="56" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="-1">
      ${esc(truncName)}
    </text>

    <!-- Tagline (26px, muted) -->
    <text x="0" y="46" font-family="${fonts.body}" font-size="26" font-weight="400" fill="#94A3B8" text-anchor="middle">
      ${esc(truncTagline)}
    </text>

    <!-- App URL (prominent, teal, clickable-looking) -->
    <text x="0" y="86" font-family="${fonts.mono}" font-size="20" font-weight="400" fill="#2DD4BF" text-anchor="middle">
      ${appUrl}
    </text>
  </g>

  <!-- "Built with Varity" bottom-center -->
  <g transform="translate(556, 560)">
    <g transform="translate(-54, -14) scale(0.25)">
      <path d="M32 6 L48 22 L32 32 L16 22 Z" fill="url(#logoFacet4)"/>
      <path d="M16 22 L32 32 L32 58 L8 36 Z" fill="url(#logoFacet1)"/>
      <path d="M48 22 L56 36 L32 58 L32 32 Z" fill="url(#logoFacet2)"/>
      <path d="M8 36 L32 58 L20 58 Z" fill="url(#logoFacet1)" opacity="0.7"/>
      <path d="M56 36 L44 58 L32 58 Z" fill="url(#logoFacet2)" opacity="0.7"/>
      <path d="M32 12 L40 22 L32 28 L24 22 Z" fill="white" opacity="0.25"/>
    </g>
    <text x="0" y="0" font-family="${fonts.body}" font-size="16" font-weight="500" fill="#64748B" text-anchor="middle">
      Built with Varity
    </text>
  </g>

  <!-- Bottom accent line (4px) -->
  <rect x="0" y="626" width="1200" height="4" fill="url(#accentGradient)"/>
</svg>`;
}

// ---------------------------------------------------------------------------
// Default card SVG (user card — used for og:image)
// ---------------------------------------------------------------------------

export function cardSvg(record: DomainRecord, baseDomain: string): string {
  return cardSvgUser(record, baseDomain);
}

// ---------------------------------------------------------------------------
// Card HTML page — shareable page with OG tags and both cards
// ---------------------------------------------------------------------------

export function cardHtml(record: DomainRecord, baseDomain: string): string {
  const appUrl = `https://${baseDomain}/${record.subdomain}`;
  const storeUrl = `https://store.varity.so/${record.subdomain}`;
  const cardUrl = `https://${baseDomain}/card/${record.subdomain}`;
  const imageUrl = `https://${baseDomain}/card/${record.subdomain}/image.png`;
  const imageUserUrl = `https://${baseDomain}/card/${record.subdomain}/image-user.png`;
  const displayName = record.appName || titleCase(record.subdomain);
  const tagline = record.tagline || 'Built and deployed on Varity';

  // Share tweet
  const tweetText = encodeURIComponent(`Check out ${displayName} \u2014 ${tagline}\n\n${appUrl}`);
  const twitterUrl = `https://x.com/intent/tweet?text=${tweetText}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(cardUrl)}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(displayName)} — Built with Varity</title>

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(displayName)} — Built with Varity">
  <meta property="og:description" content="${esc(tagline)}. Built and deployed in under 60 seconds. 70% cheaper than AWS.">
  <meta property="og:url" content="${cardUrl}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/png">
  <meta property="og:site_name" content="Varity">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(displayName)} — Built with Varity">
  <meta name="twitter:description" content="${esc(tagline)}. Built and deployed in under 60 seconds. 70% cheaper than AWS.">
  <meta name="twitter:image" content="${imageUrl}">
  <meta name="twitter:site" content="@VarityLabs">

  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: ${colors.bg};
      color: ${colors.foreground};
      min-height: 100vh;
      padding: 3rem 1.5rem;
    }

    .page {
      max-width: 720px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 2rem;
    }
    .header svg { width: 22px; height: 22px; }
    .header span {
      font-size: 0.875rem;
      font-weight: 600;
      color: ${colors.foregroundMuted};
      letter-spacing: -0.2px;
    }

    h1 {
      font-size: 1.75rem;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 0.25rem;
    }
    h1 .teal { color: ${colors.brand400}; }

    .subtitle {
      color: ${colors.foregroundDim};
      font-size: 0.875rem;
      margin-bottom: 2.5rem;
    }

    .card-section {
      margin-bottom: 2rem;
    }
    .card-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: ${colors.foregroundDim};
      margin-bottom: 0.75rem;
    }
    .card-img {
      width: 100%;
      border-radius: 8px;
      border: 1px solid ${colors.border};
    }

    .actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 0.75rem;
      flex-wrap: wrap;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.8125rem;
      font-weight: 500;
      text-decoration: none;
      transition: background 0.15s;
      cursor: pointer;
      border: none;
    }
    .btn-primary {
      background: ${colors.brand500};
      color: ${colors.bg};
    }
    .btn-primary:hover { background: ${colors.brand400}; }
    .btn-linkedin {
      background: #0a66c2;
      color: white;
    }
    .btn-linkedin:hover { background: #0b7ad4; }
    .btn-secondary {
      background: transparent;
      color: ${colors.foregroundMuted};
      border: 1px solid ${colors.border};
    }
    .btn-secondary:hover { background: rgba(255,255,255,0.05); }

    .divider {
      border: none;
      border-top: 1px solid ${colors.border};
      margin: 2rem 0;
    }

    .footer {
      text-align: center;
      color: ${colors.foregroundDim};
      font-size: 0.8125rem;
      line-height: 1.6;
    }
    .footer a {
      color: ${colors.brand500};
      text-decoration: none;
    }
    .footer a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hF1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#5EEAD4"/><stop offset="100%" stop-color="#0D9488"/></linearGradient>
          <linearGradient id="hF2" x1="100%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#60A5FA"/><stop offset="100%" stop-color="#1D4ED8"/></linearGradient>
          <linearGradient id="hF4" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#14B8A6"/><stop offset="100%" stop-color="#2DD4BF"/></linearGradient>
        </defs>
        <path d="M32 6 L48 22 L32 32 L16 22 Z" fill="url(#hF4)"/>
        <path d="M16 22 L32 32 L32 58 L8 36 Z" fill="url(#hF1)"/>
        <path d="M48 22 L56 36 L32 58 L32 32 Z" fill="url(#hF2)"/>
        <path d="M8 36 L32 58 L20 58 Z" fill="url(#hF1)" opacity="0.7"/>
        <path d="M56 36 L44 58 L32 58 Z" fill="url(#hF2)" opacity="0.7"/>
        <path d="M32 12 L40 22 L32 28 L24 22 Z" fill="white" opacity="0.25"/>
      </svg>
      <span>Varity</span>
    </div>

    <h1>${esc(displayName)} <span class="teal">is live.</span></h1>
    <p class="subtitle">Share your deployment</p>

    <!-- Deployment Card -->
    <div class="card-section">
      <img class="card-img" src="${imageUserUrl}" alt="${esc(displayName)} deployment card" width="1200" height="630">
      <div class="actions">
        <a class="btn btn-primary" href="${twitterUrl}" target="_blank" rel="noopener">Share on X</a>
        <a class="btn btn-linkedin" href="${linkedinUrl}" target="_blank" rel="noopener">Share on LinkedIn</a>
        <a class="btn btn-secondary" href="${imageUserUrl}" download="${record.subdomain}-card.png">Download PNG</a>
      </div>
    </div>

    <div class="actions" style="margin-top:0.5rem">
      <a class="btn btn-secondary" href="${appUrl}">Visit App</a>
      <a class="btn btn-secondary" href="${storeUrl}">View Store Listing</a>
    </div>

    <hr class="divider">

    <div class="footer">
      <p>Built and deployed with <a href="https://varity.so">Varity</a> &mdash; 70% cheaper than AWS</p>
      <p><a href="https://varity.so">Build your own app</a></p>
    </div>
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function esc(str: string): string {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function titleCase(slug: string): string {
  return slug
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
