#!/usr/bin/env node
/** Build the public article catalog. No packages or browser JavaScript required. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { estimateReadingMinutes } from './content-utils.mjs';
import { versionAssetReferences, syncAssetFiles, syncPageAssets } from './assets.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'content/articles.json'), 'utf8'));
const categories = ['Formal Philosophy', 'Idea', 'Explanation'];
const artworks = ['language', 'states', 'light', 'particle', 'lensing', 'spectral', 'interface', 'ripple'];
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const json = value => JSON.stringify(value).replaceAll('<', '\\u003c');
const fail = message => { throw new Error(message); };
const requiredText = (entry, field) => typeof entry[field] === 'string' && entry[field].trim() || fail(`${entry.id || 'Article'}: ${field} must be a nonempty string`);
const site = new URL(manifest.siteUrl);
if (site.protocol !== 'https:' || site.pathname !== '/' || site.search || site.hash) fail('siteUrl must be an HTTPS origin');
if (typeof manifest.author !== 'string' || !manifest.author.trim()) fail('author is required');
if (!Array.isArray(manifest.articles) || !manifest.articles.length) fail('articles must be a nonempty array');

function validateDate(value, id) {
  if (!/^\d{4}-\d{2}(?:-\d{2})?$/.test(value)) fail(`${id}: use YYYY-MM or YYYY-MM-DD for published`);
  const full = value.length === 7 ? `${value}-01` : value;
  const date = new Date(`${full}T00:00:00Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== full) fail(`${id}: invalid publication date`);
  return date;
}

const ids = new Set(), paths = new Set(), featuredRanks = new Set();
const entries = manifest.articles.map((entry, order) => {
  for (const field of ['id', 'path', 'title', 'summary', 'topic', 'published', 'status', 'art']) requiredText(entry, field);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id) || ids.has(entry.id)) fail(`Duplicate or invalid article ID: ${entry.id}`);
  ids.add(entry.id);
  if (!/^[a-z0-9][a-z0-9/-]*\.html$/.test(entry.path) || entry.path.includes('//') || paths.has(entry.path)) fail(`Duplicate or unsafe article path: ${entry.path}`);
  paths.add(entry.path);
  if (!['published', 'draft'].includes(entry.status)) fail(`${entry.id}: status must be published or draft`);
  if (!Array.isArray(entry.tags) || !entry.tags.length || new Set(entry.tags).size !== entry.tags.length || entry.tags.some(tag => !categories.includes(tag))) fail(`${entry.id}: choose unique tags from ${categories.join(', ')}`);
  if (!artworks.includes(entry.art)) fail(`${entry.id}: unknown artwork variant`);
  if (entry.featured != null) {
    if (!Number.isInteger(entry.featured) || entry.featured < 1 || entry.featured > 3 || featuredRanks.has(entry.featured)) fail(`${entry.id}: featured must be a unique rank from 1 to 3, or null`);
    if (entry.status !== 'published') fail(`${entry.id}: a draft cannot be featured`);
    featuredRanks.add(entry.featured);
  }
  const date = validateDate(entry.published, entry.id);
  const filename = path.resolve(root, entry.path);
  if (!filename.startsWith(`${root}${path.sep}`) || !fs.existsSync(filename)) fail(`${entry.id}: article file is missing`);
  const html = fs.readFileSync(filename, 'utf8');
  const body = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1];
  if (!body) fail(`${entry.id}: article needs a semantic <article> body`);
  if ((html.match(/<h1\b/gi) || []).length !== 1) fail(`${entry.id}: article must have exactly one h1`);
  const readMinutes = estimateReadingMinutes(body);
  const dateLabel = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric', ...(entry.published.length === 10 ? { day: 'numeric' } : {}), timeZone: 'UTC' }).format(date);
  return { ...entry, order, readMinutes, dateLabel, date, url: new URL(entry.path, site).href };
});
const published = entries.filter(entry => entry.status === 'published');
const newest = [...published].sort((a, b) => b.published.localeCompare(a.published) || a.order - b.order);
const featured = [...published].filter(entry => entry.featured != null).sort((a, b) => a.featured - b.featured).slice(0, 3);
if (!published.length) fail('At least one published article is required');

function artwork(kind) {
  const wave = (offset, frequency = 1, amplitude = 25) => Array.from({ length: 81 }, (_, i) => `${i ? 'L' : 'M'}${i * 3} ${(90 + Math.sin(i / 80 * Math.PI * 4 * frequency + offset) * amplitude).toFixed(2)}`).join(' ');
  const drawings = {
    language: '<path d="M41 45h68v43H72L54 104V88H41zM133 78h65v43h-15v17l-20-17h-30z"/><path d="M55 59h38M55 71h25M147 92h36M147 104h26"/><circle cx="121" cy="48" r="3" fill="#c5a059"/><circle cx="119" cy="133" r="3" fill="#c5a059"/><path d="M121 52v15M119 118v12" stroke-dasharray="3 4"/>',
    states: '<rect x="27" y="62" width="48" height="55" rx="3"/><rect x="96" y="49" width="48" height="80" rx="3"/><rect x="165" y="62" width="48" height="55" rx="3"/><path d="M75 90h21M144 90h21"/><text x="51" y="97" text-anchor="middle" fill="#e9d7ad" stroke="none" font-family="Georgia,serif" font-size="24">q</text><text x="120" y="98" text-anchor="middle" fill="#e9d7ad" stroke="none" font-family="Georgia,serif" font-size="24">Γ</text><text x="189" y="98" text-anchor="middle" fill="#e9d7ad" stroke="none" font-family="Georgia,serif" font-size="24">R</text>',
    light: '<circle cx="78" cy="88" r="35"/><path d="M78 53v35l18 14M120 53l91 0M120 88h91M120 123h91"/><path d="m198 47 13 6-13 6m0 23 13 6-13 6m0 23 13 6-13 6"/><circle cx="78" cy="88" r="3" fill="#e9d7ad"/>',
    particle: '<ellipse cx="120" cy="90" rx="81" ry="29"/><ellipse cx="120" cy="90" rx="81" ry="29" transform="rotate(60 120 90)"/><ellipse cx="120" cy="90" rx="81" ry="29" transform="rotate(120 120 90)"/><circle cx="120" cy="90" r="7" fill="#e9d7ad"/><circle cx="193" cy="103" r="4" fill="#c5a059"/>',
    lensing: '<path d="M25 40Q114 72 211 133M25 65Q114 83 211 110M25 90h186M25 115Q114 97 211 70M25 140Q114 108 211 47"/><ellipse cx="110" cy="90" rx="15" ry="65" stroke="#8e9b95"/><path d="M213 25v130" stroke-dasharray="3 4"/>',
    spectral: `<path d="${wave(0, 0.75, 42)}"/><path d="${wave(1, 1.5, 23)}" stroke="#8c9f98"/><path d="M20 90h200" stroke="#606660" stroke-dasharray="3 5"/>`,
    interface: '<path d="M22 130Q70 130 89 90T158 50H218M22 145Q78 145 98 105T160 65H218M22 115Q62 115 80 75T157 35H218"/><path d="M120 22v136" stroke="#8d9a93" stroke-dasharray="4 5"/><circle cx="120" cy="73" r="8" fill="#e9d7ad"/>',
    ripple: '<circle cx="120" cy="90" r="10" fill="#ddc18b"/><circle cx="120" cy="90" r="31"/><circle cx="120" cy="90" r="52" opacity=".7"/><circle cx="120" cy="90" r="73" opacity=".4"/><circle cx="120" cy="90" r="94" opacity=".2"/><path d="M30 90h180" stroke="#8b9e94" stroke-dasharray="3 5"/>'
  };
  return `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><g fill="none" stroke="#c5a059" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">${drawings[kind]}</g></svg>`;
}

function card(entry) {
  const search = [entry.title, entry.summary, entry.topic, ...entry.tags].join(' ');
  return `<a class="article-card" href="${escape(entry.path)}" data-tags="${escape(entry.tags.join('|'))}" data-date="${entry.published}" data-minutes="${entry.readMinutes}" data-order="${entry.order}" data-search="${escape(search)}">
  <div class="article-art article-art-${entry.art}" aria-hidden="true">${artwork(entry.art)}</div>
  <div class="article-copy">
    <div class="article-meta"><span>${escape(entry.topic)}</span><time datetime="${entry.published}">${entry.dateLabel}</time><span>${entry.readMinutes} min read</span></div>
    <h3 class="article-title">${escape(entry.title)}</h3>
    <p class="article-excerpt">${escape(entry.summary)}</p>
    <div class="article-tags">${entry.tags.map(tag => `<span>${escape(tag)}</span>`).join('')}</div><span class="article-read">Read article ↗</span>
  </div>
  <span class="article-arrow" aria-hidden="true">↗</span>
</a>`;
}

const header = `<header class="navbar" id="navbar"><div class="nav-container">
  <a class="nav-logo" href="index.html"><img class="logo-mark" src="Images/logo.png" width="50" height="30" alt=""><span class="logo-text">Saumya Bhandari<span class="logo-period">.</span></span></a>
  <button class="nav-toggle" id="mobile-menu" type="button" aria-expanded="false" aria-controls="primary-navigation" aria-label="Open navigation"><span class="bar"></span><span class="bar"></span><span class="bar"></span></button>
  <nav id="primary-navigation" class="nav-menu" aria-label="Primary navigation"><a class="nav-link" href="index.html">Overview</a><a class="nav-link active" href="articles.html" aria-current="page">Articles</a><a class="nav-link" href="career-snapshots.html">Career</a><a class="nav-link" href="index.html#about">About</a><a class="nav-link nav-contact" href="index.html#contact">Let’s talk <span aria-hidden="true">↗</span></a></nav>
</div></header>`;
const footer = `<footer class="site-footer"><div class="container footer-main"><a href="index.html" class="footer-brand">Saumya Bhandari<span class="gold-period">.</span></a><p>Building with intent. Thinking with curiosity.</p><nav aria-label="Footer navigation"><a href="articles.html">Articles</a><a href="career-snapshots.html">Career</a><a href="feed.xml">RSS</a><a href="cv.pdf" target="_blank" rel="noopener">CV ↗</a></nav></div><div class="container footer-bottom"><span>© <span data-current-year>2026</span> Saumya Bhandari</span><span>Kathmandu, Nepal <span class="footer-dot" aria-hidden="true">·</span> Open to the world</span><a href="#main-content">Back to top ↑</a></div></footer>`;
const articleList = newest.map(card).join('\n');
const structured = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Articles by Saumya Bhandari', url: new URL('articles.html', site).href, description: 'Essays, ideas, and research on artificial intelligence, physics, and philosophy.', mainEntity: { '@type': 'ItemList', itemListElement: newest.map((entry, i) => ({ '@type': 'ListItem', position: i + 1, url: entry.url, name: entry.title })) } };
const catalog = `<!doctype html>
<html lang="en"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="dark">
  <title>Articles — Saumya Bhandari</title><meta name="description" content="Essays, ideas, and research by Saumya Bhandari. Explore artificial intelligence, the philosophy of physics, language, and the mathematics of thought.">
  <link rel="canonical" href="${new URL('articles.html', site).href}"><meta property="og:title" content="Articles — Saumya Bhandari"><meta property="og:description" content="Essays, ideas, and research at the intersection of intelligence, physics, and philosophy."><meta property="og:type" content="website"><meta property="og:url" content="${new URL('articles.html', site).href}">
  <link rel="icon" href="Images/logo.png"><link rel="alternate" type="application/rss+xml" title="Articles by Saumya Bhandari" href="feed.xml">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Cinzel:wght@500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css"><link rel="stylesheet" href="catalog.css"><script defer src="script.js"></script><script defer src="articles.js"></script>
  <script type="application/ld+json">${json(structured)}</script>
</head><body>
<a class="skip-link" href="#main-content">Skip to articles</a>${header}
<main id="main-content" class="catalog-page"><div class="container">
  <header class="catalog-header"><p class="eyebrow section-tag">THE OPEN NOTEBOOK</p><h1>A place for<br>unfinished questions<span class="gold-period">.</span></h1><p>Essays, explanations, and research on intelligence, physics, and philosophy. Follow a question from its first sketch to a full paper.</p><div class="catalog-header-bottom"><span>${published.length} articles &amp; counting</span><a href="feed.xml">Subscribe via RSS <span aria-hidden="true">↗</span></a></div></header>
  <div class="catalog-toolbar" data-article-controls hidden>
    <div class="catalog-control-row"><div class="catalog-search"><label for="article-search">Find an article</label><div class="catalog-search-field"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input id="article-search" type="search" placeholder="Search a title, topic, or idea…" autocomplete="off" aria-controls="article-list"></div></div><div class="catalog-sort"><label for="article-sort">Sort by</label><select id="article-sort" aria-controls="article-list"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="reading">Shortest read</option></select></div></div>
    <div class="catalog-filters" role="group" aria-label="Filter by article category">${['All', ...categories].map(tag => `<button type="button" class="catalog-filter${tag === 'All' ? ' active' : ''}" data-article-filter="${tag}" aria-pressed="${tag === 'All'}" aria-controls="article-list">${tag === 'All' ? 'All writing' : tag}</button>`).join('')}</div>
  </div>
  <div class="catalog-results-bar"><p data-article-count role="status" aria-live="polite" aria-atomic="true">${published.length} articles</p><button type="button" class="catalog-reset" data-article-reset hidden>Clear filters</button></div>
  <section aria-label="Article collection"><h2 class="sr-only">All articles</h2><div class="article-list" id="article-list" data-article-list>${articleList}</div><div class="catalog-empty" data-article-empty hidden><h2>No articles found</h2><p>Try a different search or clear your filters to explore the full collection.</p></div></section>
  <p class="catalog-endnote">Formal Philosophy collects technical manuscripts. Idea is for open questions; Explanation is for guided reading. An article can belong to more than one.</p>
</div></main>${footer}
</body></html>
`;

const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Articles by ${escape(manifest.author)}</title><link>${new URL('articles.html', site).href}</link><description>Essays, ideas, and research on intelligence, physics, and philosophy.</description><language>en</language><atom:link href="${new URL('feed.xml', site).href}" rel="self" type="application/rss+xml"/>${newest.map(entry => `
<item><title>${escape(entry.title)}</title><link>${entry.url}</link><guid isPermaLink="true">${entry.url}</guid><description>${escape(entry.summary)}</description>${entry.published.length === 10 ? `<pubDate>${entry.date.toUTCString()}</pubDate>` : ''}${entry.tags.map(tag => `<category>${escape(tag)}</category>`).join('')}</item>`).join('')}
</channel></rss>
`;
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['', 'articles.html', 'career-snapshots.html', ...published.map(entry => entry.path)].map(url => `\n<url><loc>${new URL(url, site).href}</loc></url>`).join('')}
</urlset>
`;

const outputs = new Map([['articles.html', catalog], ['feed.xml', feed], ['sitemap.xml', sitemap]]);
const homePath = path.join(root, 'index.html');
const home = fs.readFileSync(homePath, 'utf8');
const start = '<!-- ARTICLES:START -->', end = '<!-- ARTICLES:END -->';
if (home.includes(start) && home.includes(end)) {
  if (home.split(start).length !== 2 || home.split(end).length !== 2 || home.indexOf(start) > home.indexOf(end)) fail('Homepage article markers must occur exactly once in order');
  outputs.set('index.html', home.slice(0, home.indexOf(start) + start.length) + '\n' + featured.map(card).join('\n') + '\n' + home.slice(home.indexOf(end)));
} else {
  fail('Add <!-- ARTICLES:START --> and <!-- ARTICLES:END --> inside the homepage article list before building.');
}

// The chronology is maintained once, alongside the article catalog.
const timelineStart = '<!-- TIMELINE:START -->', timelineEnd = '<!-- TIMELINE:END -->';
const generatedHome = outputs.get('index.html');
if (generatedHome.includes(timelineStart) || generatedHome.includes(timelineEnd)) {
  if (generatedHome.split(timelineStart).length !== 2 || generatedHome.split(timelineEnd).length !== 2 || generatedHome.indexOf(timelineStart) > generatedHome.indexOf(timelineEnd)) fail('Homepage timeline markers must occur exactly once in order');
  const timeline = fs.readFileSync(path.join(root, 'content/timeline.html'), 'utf8').trim();
  outputs.set('index.html', generatedHome.slice(0, generatedHome.indexOf(timelineStart) + timelineStart.length) + '\n' + timeline + '\n' + generatedHome.slice(generatedHome.indexOf(timelineEnd)));
}

syncAssetFiles({ check });
const stale = [];
for (const [filename, raw] of outputs) {
  const content = filename.endsWith('.html') ? versionAssetReferences(raw, filename) : raw;
  const target = path.join(root, filename);
  const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;
  if (current === content) continue;
  if (check) stale.push(filename);
  else fs.writeFileSync(target, content);
}
if (stale.length) fail(`Generated content is stale: ${stale.join(', ')}. Run node scripts/build-content.mjs`);
syncPageAssets({ check, skip: [...outputs.keys()] });
console.log(`${check ? 'Verified' : 'Built'} ${published.length} published articles, ${featured.length} featured cards, RSS, and sitemap. Drafts excluded: ${entries.length - published.length}.`);
