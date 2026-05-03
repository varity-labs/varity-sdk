/**
 * Build-time script: copies saas-starter template into ./template/
 * Excludes node_modules, .next, .env.local, lockfiles, e2e tests, husky hooks.
 * Renames .gitignore → gitignore (npm strips dotfiles from tarballs).
 */

import { cpSync, existsSync, renameSync, rmSync, mkdirSync } from "fs";
import { resolve, dirname, basename, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const TEMPLATE_SRC = resolve(ROOT, "..", "..", "..", "templates", "saas-starter");
const TEMPLATE_DST = resolve(ROOT, "template");

const EXCLUDE = new Set([
  "node_modules",
  ".next",
  "out",
  ".env.local",
  ".env.development.local",
  ".env.production.local",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "e2e",
  ".husky",
  "playwright.config.ts",
]);

if (!existsSync(TEMPLATE_SRC)) {
  console.error(`Template source not found: ${TEMPLATE_SRC}`);
  process.exit(1);
}

// Clean destination
if (existsSync(TEMPLATE_DST)) {
  rmSync(TEMPLATE_DST, { recursive: true, force: true });
}
mkdirSync(TEMPLATE_DST, { recursive: true });

// Copy with filter
cpSync(TEMPLATE_SRC, TEMPLATE_DST, {
  recursive: true,
  filter: (src) => {
    const name = basename(src);
    return !EXCLUDE.has(name);
  },
});

// Rename dotfiles that npm strips from tarballs
for (const [dotName, plainName] of [
  [".gitignore", "gitignore"],
  [".npmrc", "npmrc"],
]) {
  const dotPath = join(TEMPLATE_DST, dotName);
  const plainPath = join(TEMPLATE_DST, plainName);
  if (existsSync(dotPath)) {
    renameSync(dotPath, plainPath);
  }
}

console.log("✓ Template copied to ./template/");
