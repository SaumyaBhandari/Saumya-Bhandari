#!/usr/bin/env node
/**
 * Regression for returning visitors with the previous CSS/JS cached.
 * Install Playwright (and its Chromium browser), then run:
 *   node scripts/check-browser.mjs
 * Optional: PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/to/chrome
 * Git history must include the legacy commit (use fetch-depth: 0 in CI).
 * The server is temporary and only binds to loopback. No production writes.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const playwrightPath = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES
  ? path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright') : 'playwright';
const { chromium } = require(playwrightPath);
const screenshotDir = process.env.BROWSER_SCREENSHOT_DIR;
if (screenshotDir) fs.mkdirSync(screenshotDir, { recursive: true });
const legacyRef = '55e637bf85f0d4ede610cd5cd25b7a6a4edd89a2';
const legacy = new Map(['index.html', 'style.css', 'script.js'].map(filename => [filename,
  execFileSync('git', ['show', `${legacyRef}:${filename}`], { cwd: root, maxBuffer: 8 * 1024 * 1024 })
]));
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const assetRequests = [];
let phase = 'legacy';
const server = http.createServer((request, response) => {
  try {
    const url = new URL(request.url, 'http://127.0.0.1');
    const name = ['/', '/upgrade.html'].includes(url.pathname) ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
    const filename = path.resolve(root, name);
    if (!filename.startsWith(`${root}${path.sep}`)) { response.writeHead(403).end(); return; }
    const body = phase === 'legacy' && legacy.has(name) ? legacy.get(name) : fs.readFileSync(filename);
    const extension = path.extname(name);
    if (['.css', '.js'].includes(extension)) assetRequests.push({ phase, url: request.url });
    response.writeHead(200, {
      'Content-Type': mime[extension] || 'application/octet-stream',
      // Match the production asset cache policy that exposed the regression.
      'Cache-Control': ['.css', '.js'].includes(extension) ? 'public, max-age=14400' : 'no-store'
    });
    response.end(body);
  } catch { response.writeHead(404).end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox'],
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {})
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, ignoreHTTPSErrors: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(origin, { waitUntil: 'networkidle' });
  assert(assetRequests.some(r => r.phase === 'legacy' && r.url === '/style.css'), 'The old stylesheet must be loaded into the browser cache first');
  assert(assetRequests.some(r => r.phase === 'legacy' && r.url === '/script.js'), 'The old script must be loaded into the browser cache first');

  phase = 'current';
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  // A different HTML URL creates a normal navigation, not a hard reload that
  // bypasses the cache. Relative asset URLs still resolve to the same origin.
  await page.goto(`${origin}/upgrade.html`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const assets = await page.locator('link[rel="stylesheet"][href],script[src]').evaluateAll(nodes => nodes.map(n => n.href || n.src));
  assert(!assets.includes(`${origin}/style.css`), 'Changed CSS must not reuse the previous unversioned URL');
  assert(!assets.includes(`${origin}/script.js`), 'Changed JavaScript must not reuse the previous unversioned URL');

  const desktop = await page.evaluate(() => {
    const card = document.querySelector('.article-card');
    const art = card.querySelector('.article-art').getBoundingClientRect();
    const copy = card.querySelector('.article-copy').getBoundingClientRect();
    return { overflow: document.documentElement.scrollWidth - innerWidth, cardWidth: card.getBoundingClientRect().width, artWidth: art.width, artRight: art.right, copyLeft: copy.left };
  });
  assert(desktop.overflow <= 1, 'Desktop must not overflow horizontally');
  assert(desktop.artWidth < desktop.cardWidth / 2, 'Article thumbnails must remain bounded after a cached upgrade');
  assert(desktop.copyLeft >= desktop.artRight, 'Desktop article copy must remain beside its thumbnail');

  if (screenshotDir) {
    await page.screenshot({ path: path.join(screenshotDir, 'upgrade-desktop.png') });
    await page.locator('#articles').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(screenshotDir, 'upgrade-articles.png') });
  }
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 1, 'Mobile must not overflow horizontally');
  const toggle = page.locator('#mobile-menu');
  const navigation = page.locator('#primary-navigation');
  assert(await toggle.isVisible(), 'Mobile navigation toggle must remain available after the upgrade');
  assert(!(await navigation.isVisible()), 'Mobile navigation starts collapsed');
  await toggle.click();
  assert.equal(await toggle.getAttribute('aria-expanded'), 'true', 'The upgraded mobile script must open navigation');
  assert(await navigation.isVisible(), 'Opened navigation must be visible');
  await page.keyboard.press('Escape');
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false', 'Escape must close navigation');
  assert(await toggle.evaluate(node => node === document.activeElement), 'Escape must return focus to the toggle');
  assert.deepEqual(errors, [], 'The upgraded page must not throw JavaScript errors');
  if (screenshotDir) await page.screenshot({ path: path.join(screenshotDir, 'upgrade-mobile.png') });
  console.log('PASS: a returning visitor with the previous CSS and JS cached receives the current design.');
  console.log('PASS: horizontal article cards, bounded thumbnails, mobile menu, Escape, focus, and responsive widths.');
  console.log(JSON.stringify({ legacyAssetsCached: assetRequests.filter(r => r.phase === 'legacy').map(r => r.url), currentAssetsFetched: assetRequests.filter(r => r.phase === 'current').map(r => r.url) }, null, 2));
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
