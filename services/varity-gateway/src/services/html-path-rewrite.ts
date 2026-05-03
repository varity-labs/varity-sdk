/**
 * Rewrite absolute asset paths in HTML so they resolve under the app prefix.
 */
export function rewriteHtmlPathsForApp(html: string, appName: string): string {
  const prefix = `/${appName}`;
  const escaped = appName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Skip paths already prefixed with /{appName}/ to avoid double-prefixing
  // when apps are built with basePath (e.g. Next.js NEXT_PUBLIC_BASE_PATH)
  const dq = new RegExp(`(href|src|action)="\\/(?!\\/|${escaped}\\/)`, 'g');
  const sq = new RegExp(`(href|src|action)='\\/(?!\\/|${escaped}\\/)`, 'g');
  const cssUrl = new RegExp(`url\\((['"]?)\\/(?!\\/|${escaped}\\/)`, 'g');
  return html
    .replace(dq, `$1="${prefix}/`)
    .replace(sq, `$1='${prefix}/`)
    .replace(cssUrl, `url($1${prefix}/`);
}
