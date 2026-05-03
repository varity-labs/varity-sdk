import test from 'node:test';
import assert from 'node:assert/strict';
import { rewriteHtmlPathsForApp } from '../services/html-path-rewrite';

test('rewrites Next.js static assets under app prefix', () => {
  const html = '<script src="/_next/static/chunks/main.js"></script><link href="/_next/static/css/app.css" rel="stylesheet">';
  const rewritten = rewriteHtmlPathsForApp(html, 'dogfood-ecom-0501');

  assert.match(rewritten, /src="\/dogfood-ecom-0501\/_next\/static\/chunks\/main\.js"/);
  assert.match(rewritten, /href="\/dogfood-ecom-0501\/_next\/static\/css\/app\.css"/);
});

test('does not double-prefix when app path already present', () => {
  const html = '<script src="/dogfood-ecom-0501/_next/static/chunks/main.js"></script>';
  const rewritten = rewriteHtmlPathsForApp(html, 'dogfood-ecom-0501');

  assert.equal(rewritten, html);
});

test('rewrites root-relative CSS url assets under app prefix', () => {
  const html = '<style>@font-face{src:url("/_next/static/media/inter.woff2")}body{background:url(/assets/bg.png)}</style>';
  const rewritten = rewriteHtmlPathsForApp(html, 'dogfood-ecom-0501');

  assert.match(rewritten, /url\("\/dogfood-ecom-0501\/_next\/static\/media\/inter\.woff2"\)/);
  assert.match(rewritten, /url\(\/dogfood-ecom-0501\/assets\/bg\.png\)/);
});
