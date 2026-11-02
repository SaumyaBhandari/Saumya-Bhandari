#!/usr/bin/env node
/**
 * Browser regression for the complete, interactive life timeline.
 * Requires Playwright with Chromium: node scripts/check-timeline.mjs
 * Optional: PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, TIMELINE_SCREENSHOT_DIR.
 * Uses a temporary loopback server; never contacts or writes the production site.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES
  ? path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright') : 'playwright');
const screenshotDir = process.env.TIMELINE_SCREENSHOT_DIR;
if (screenshotDir) fs.mkdirSync(screenshotDir, { recursive: true });
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const server = http.createServer((request, response) => {
  try {
    const url = new URL(request.url, 'http://127.0.0.1');
    const name = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
    const filename = path.resolve(root, name);
    if (!filename.startsWith(`${root}${path.sep}`)) { response.writeHead(403).end(); return; }
    response.writeHead(200, { 'Content-Type': mime[path.extname(name)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(fs.readFileSync(filename));
  } catch { response.writeHead(404).end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const sizes = [{ width: 1440, height: 1000 }, { width: 1024, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 740 }];
const errors = [];
let browser;

async function settle(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function selected(page, index) {
  const nodes = page.locator('#timeline .life-node');
  assert.equal(await page.locator('#timeline .life-card:visible').count(), 1, 'Exactly one chapter card should be open');
  assert.equal(await nodes.nth(index).getAttribute('aria-expanded'), 'true', `Chapter ${index + 1} must report its expanded state`);
  const id = await nodes.nth(index).getAttribute('aria-controls');
  assert(id && await page.locator(`[id="${id}"]`).isVisible(), 'The expanded point must control its visible card');
  const geometry = await page.locator(`[id="${id}"]`).evaluate(card => {
    const rect = card.getBoundingClientRect();
    const stage = card.closest('.life-map').getBoundingClientRect();
    return { left: rect.left, right: rect.right, top: rect.top - stage.top, bottom: rect.bottom - stage.bottom, width: innerWidth };
  });
  assert(geometry.left >= -1 && geometry.right <= geometry.width + 1, 'The open card must stay within the screen width');
  assert(geometry.top >= -1 && geometry.bottom <= 1, 'The open card must stay inside its reserved timeline area');
}

try {
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'],
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
  for (const viewport of sizes) {
    const mobile = viewport.width < 900;
    const context = await browser.newContext({ viewport, hasTouch: mobile, ignoreHTTPSErrors: true, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin, { waitUntil: 'networkidle' });
    await page.locator('#timeline.timeline-ready').waitFor();
    await page.evaluate(() => document.fonts.ready);
    await settle(page);
    const timeline = page.locator('#timeline');
    const nodes = timeline.locator('.life-node');
    assert.equal(await timeline.locator('.life-entry').count(), 13, 'All 13 chapters must remain in the timeline');
    assert.equal(await nodes.count(), 13, 'Every chapter must have a point');
    const references = await nodes.evaluateAll(buttons => buttons.map(button => button.getAttribute('aria-controls')));
    assert.equal(new Set(references).size, 13, 'Every point must control a distinct chapter card');
    assert(await timeline.locator('.life-route-line').getAttribute('d'), 'The connected route must be drawn');
    const layout = await nodes.evaluateAll(buttons => ({ overflow: document.documentElement.scrollWidth - innerWidth, width: innerWidth,
      points: buttons.map(button => { const r = button.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height, visible: getComputedStyle(button).visibility !== 'hidden' && r.width > 0 }; }) }));
    assert(layout.overflow <= 1, `${viewport.width}px: the page must not scroll horizontally`);
    for (const point of layout.points) {
      assert(point.visible, 'Every chapter point must be visible');
      assert(point.width >= 44 && point.height >= 44, 'Chapter points need at least 44px touch targets');
      assert(point.left >= -1 && point.right <= layout.width + 1, 'Every point must fit inside the screen width');
    }
    for (let i = 0; i < layout.points.length; i++) for (let j = i + 1; j < layout.points.length; j++) {
      const a = layout.points[i], b = layout.points[j];
      assert(Math.min(a.right, b.right) - Math.max(a.left, b.left) <= 1 || Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) <= 1, 'Chapter touch targets must not overlap');
    }
    await selected(page, 12);
    for (const index of [0, 6, 12]) {
      await nodes.nth(index)[mobile ? 'tap' : 'click']();
      await settle(page);
      await selected(page, index);
    }
    if (screenshotDir) await timeline.screenshot({ path: path.join(screenshotDir, `timeline-${viewport.width}.png`) });

    if (viewport.width === 1440) {
      await nodes.first().hover();
      await selected(page, 0);
      await nodes.nth(12).focus();
      for (const [key, index] of [['Home', 0], ['ArrowRight', 1], ['End', 12], ['ArrowLeft', 11]]) {
        await page.keyboard.press(key);
        await selected(page, index);
        assert(await nodes.nth(index).evaluate(button => button === document.activeElement), `${key} must move keyboard focus with the selected chapter`);
      }
      await page.keyboard.press('Escape');
      assert.equal(await timeline.locator('.life-card:visible').count(), 0, 'Escape must dismiss the card');
      assert(await nodes.nth(11).evaluate(button => button === document.activeElement), 'Escape must retain focus on the chapter point');
      await page.keyboard.press('Enter');
      await selected(page, 11);
      await timeline.locator('.life-card:visible .life-card-close').click();
      assert.equal(await timeline.locator('.life-card:visible').count(), 0, 'The close button must dismiss the card');
      assert(await nodes.nth(11).evaluate(button => button === document.activeElement), 'Closing a card must restore focus to its point');
      await page.keyboard.press('Enter');
      await timeline.locator('.life-next').click();
      await selected(page, 12);
      await timeline.locator('.life-prev').click();
      await selected(page, 11);

      await page.emulateMedia({ media: 'print' });
      assert.equal(await timeline.locator('.life-card:visible').count(), 13, 'Printing must include every chapter, including closed cards');
      assert.equal(await timeline.locator('.life-node:visible').count(), 0, 'Printed output must hide chapter controls');
      assert(!(await timeline.locator('.life-route').isVisible()), 'Printed output must hide the decorative route');
      await page.emulateMedia({ media: 'screen' });
    }
    await context.close();
  }
  const noScript = await browser.newContext({ viewport: sizes[2], javaScriptEnabled: false, ignoreHTTPSErrors: true });
  const fallback = await noScript.newPage();
  await fallback.goto(origin, { waitUntil: 'networkidle' });
  assert.equal(await fallback.locator('#timeline .life-card:visible').count(), 13, 'Without JavaScript, all chapter cards must remain readable');
  assert.equal(await fallback.locator('#timeline .life-node:visible').count(), 0, 'The noninteractive fallback must not show inactive controls');
  assert(await fallback.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 1, 'The fallback must fit mobile widths');
  await noScript.close();
  assert.deepEqual(errors, [], 'The timeline must not throw browser errors');
  console.log('PASS: all 13 life chapters fit at 1440, 1024, 390, and 320px; touch targets and open cards stay inside the viewport.');
  console.log('PASS: hover, tap, arrow/Home/End navigation, Escape, close/focus restoration, and previous/next chapter controls.');
  console.log('PASS: every chapter remains readable without JavaScript and in print.');
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
