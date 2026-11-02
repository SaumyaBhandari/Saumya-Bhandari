#!/usr/bin/env node
/**
 * Navigation and publishing integrity checks for the static site.
 * Run from any directory: node scripts/check-site.mjs
 * Uses Node built-ins only; does not fetch external URLs or modify files.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (process.argv.includes('--help')) {
  console.log('Usage: node scripts/check-site.mjs\nChecks local assets and fragments, shared navigation, and article catalog/home consistency.');
  process.exit(0);
}

const problems = [];
const problem = (file, message) => problems.push(`${file}: ${message}`);
const relative = filename => path.relative(root, filename).split(path.sep).join('/');
const exists = filename => fs.existsSync(filename) && fs.statSync(filename).isFile();
const decodeEntities = value => String(value).replace(/&(#(?:x[\da-f]+|\d+)|amp|quot|apos|lt|gt|nbsp);/gi, (match, entity) => {
  const names = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: '\u00a0' };
  if (entity[0] !== '#') return names[entity.toLowerCase()] ?? match;
  const hexadecimal = entity[1].toLowerCase() === 'x';
  const codePoint = Number.parseInt(entity.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
  return codePoint >= 0 && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : match;
});
const decodeURL = value => {
  try { return decodeURIComponent(value); } catch { return value; }
};

// A small tokenizer is sufficient here: it honors quoted attributes, comments,
// raw script/style text, and void elements, without treating JS strings as HTML.
function parseHTML(source) {
  const nodes = [], ids = new Map(), stack = [];
  const token = /<!--[\s\S]*?-->|<![^>]*>|<\/?[A-Za-z][A-Za-z0-9:.-]*(?:\s+(?:[^\s<>"'=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?))*\s*\/?>/g;
  const voids = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
  let match;
  while ((match = token.exec(source))) {
    const raw = match[0];
    if (raw.startsWith('<!')) continue;
    const closing = raw.startsWith('</');
    const name = raw.match(/^<\/?([^\s/>]+)/)[1].toLowerCase();
    if (closing) {
      for (let index = stack.length - 1; index >= 0; index -= 1) {
        if (nodes[stack[index]].tag !== name) continue;
        nodes[stack[index]].end = token.lastIndex;
        stack.length = index;
        break;
      }
      continue;
    }
    const attrs = {};
    const tagPrefix = raw.match(/^<[A-Za-z][A-Za-z0-9:.-]*/)[0];
    const attributeText = raw.slice(tagPrefix.length, -1);
    const attribute = /([^\s/<>"'=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    let attr;
    while ((attr = attribute.exec(attributeText))) {
      attrs[attr[1].toLowerCase()] = decodeEntities(attr[2] ?? attr[3] ?? attr[4] ?? '');
    }
    const node = { tag: name, attrs, start: match.index, end: token.lastIndex, parent: stack.at(-1), index: nodes.length };
    nodes.push(node);
    if (attrs.id) {
      if (!ids.has(attrs.id)) ids.set(attrs.id, []);
      ids.get(attrs.id).push(node);
    }
    if (['script', 'style', 'textarea', 'title'].includes(name)) {
      const close = new RegExp(`</${name}\\s*>`, 'gi');
      close.lastIndex = token.lastIndex;
      const end = close.exec(source);
      if (end) {
        node.text = source.slice(token.lastIndex, end.index);
        node.end = close.lastIndex;
        token.lastIndex = close.lastIndex;
      }
    } else if (!voids.has(name) && !raw.endsWith('/>')) stack.push(node.index);
  }
  return { nodes, ids };
}
const classNames = node => new Set((node.attrs.class || '').split(/\s+/));
const hasClass = (node, className) => classNames(node).has(className);
const descendantOf = (node, ancestor, nodes) => {
  for (let parent = node.parent; parent !== undefined; parent = nodes[parent].parent) {
    if (parent === ancestor.index) return true;
  }
  return false;
};

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(path.join(root, 'content/articles.json'), 'utf8'));
  if (!Array.isArray(manifest.articles) || !manifest.siteUrl) throw new Error('Missing siteUrl or articles array');
} catch (error) {
  console.error(`FAIL content/articles.json: ${error.message}`);
  process.exit(1);
}
const site = new URL(manifest.siteUrl);
const localHosts = new Set([site.hostname, site.hostname.replace(/^www\./, '')]);
const publicArticles = manifest.articles.filter(article => article.status === 'published');
const pagePaths = [...new Set(['index.html', 'articles.html', 'career-snapshots.html', ...publicArticles.map(article => article.path)])];
const documents = new Map();
const loadDocument = filename => {
  if (!documents.has(filename)) {
    const source = fs.readFileSync(filename, 'utf8');
    documents.set(filename, { source, ...parseHTML(source) });
  }
  return documents.get(filename);
};

// Resolve public-origin links like relative links. External links, mailto, tel,
// data and blob URLs are outside this offline gate's scope.
function localReference(value, from) {
  const cleaned = value.trim();
  if (!cleaned) return null;
  if (/^(?:mailto|tel|data|blob):/i.test(cleaned)) return null;
  if (/^javascript:/i.test(cleaned)) return { error: 'javascript: URLs are not navigable links' };
  let url;
  try { url = new URL(cleaned, new URL(from, site)); }
  catch { return { error: `Invalid URL ${JSON.stringify(cleaned)}` }; }
  if (!['http:', 'https:'].includes(url.protocol) || !localHosts.has(url.hostname)) return null;
  let pathname = decodeURL(url.pathname).replace(/^\//, '');
  if (!pathname || pathname.endsWith('/')) pathname += 'index.html';
  let filename = path.resolve(root, pathname);
  if (filename !== root && !filename.startsWith(`${root}${path.sep}`)) return { error: `Local URL escapes the website: ${cleaned}` };
  if (fs.existsSync(filename) && fs.statSync(filename).isDirectory()) filename = path.join(filename, 'index.html');
  // A browser text fragment can accompany a normal ID but is not itself an ID.
  const fragment = decodeURL(url.hash.slice(1)).split(':~:')[0];
  return { filename, fragment, path: relative(filename) };
}

let referenceCount = 0, fragmentCount = 0;
const assets = new Set(), titles = new Map();
for (const filename of pagePaths) {
  const absolute = path.resolve(root, filename);
  if (!absolute.startsWith(`${root}${path.sep}`) || !exists(absolute)) {
    problem(filename, 'Published HTML page is missing');
    continue;
  }
  const doc = loadDocument(absolute);
  for (const [id, elements] of doc.ids) {
    if (elements.length > 1) problem(filename, `Duplicate ID ${JSON.stringify(id)} (${elements.length} occurrences)`);
  }
  const title = decodeEntities(doc.nodes.find(node => node.tag === 'title')?.text || '').trim();
  if (!title) problem(filename, 'Page needs a nonempty <title>');
  else if (titles.has(title)) problem(filename, `Page title duplicates ${titles.get(title)}`);
  else titles.set(title, filename);
  if (doc.nodes.filter(node => node.tag === 'h1').length !== 1) problem(filename, 'Page should have exactly one h1');
  const main = doc.nodes.find(node => node.tag === 'main');
  if (!main) problem(filename, 'Main content landmark is missing');
  const skipLink = doc.nodes.find(node => node.tag === 'a' && hasClass(node, 'skip-link'));
  if (!skipLink?.attrs.href?.startsWith('#')) problem(filename, 'Keyboard skip link to page content is missing');

  const references = [];
  for (const node of doc.nodes) {
    for (const attr of ['href', 'src', 'poster', 'data-lightbox', 'xlink:href']) {
      if (!(attr in node.attrs)) continue;
      if (!node.attrs[attr].trim()) {
        problem(filename, `Empty ${attr} on <${node.tag}>`);
        continue;
      }
      references.push({ value: node.attrs[attr], label: `<${node.tag}> ${attr}` });
    }
    if (node.tag === 'object' && node.attrs.data) references.push({ value: node.attrs.data, label: '<object> data' });
    if (node.attrs.srcset && !node.attrs.srcset.trim().startsWith('data:')) {
      for (const candidate of node.attrs.srcset.split(',')) {
        const value = candidate.trim().split(/\s+/)[0];
        if (value) references.push({ value, label: `<${node.tag}> srcset` });
      }
    }
  }
  for (const { value, label } of references) {
    const ref = localReference(value, filename);
    if (!ref) continue;
    referenceCount += 1;
    if (ref.error) { problem(filename, `${label}: ${ref.error}`); continue; }
    if (!exists(ref.filename)) {
      problem(filename, `${label} target is missing: ${value}`);
      continue;
    }
    assets.add(ref.path);
    if (ref.fragment && /\.html?$/i.test(ref.filename)) {
      fragmentCount += 1;
      const target = loadDocument(ref.filename);
      // Legacy named anchors remain valid browser destinations.
      const namedAnchor = target.nodes.some(node => node.tag === 'a' && node.attrs.name === ref.fragment);
      if (!target.ids.has(ref.fragment) && !namedAnchor) problem(filename, `${label} fragment is missing: ${value}`);
    }
  }

  const nav = doc.nodes.find(node => node.tag === 'nav' && node.attrs.id === 'primary-navigation');
  if (!nav) {
    problem(filename, 'Shared primary navigation is missing');
  } else {
    const links = doc.nodes.filter(node => node.tag === 'a' && descendantOf(node, nav, doc.nodes));
    const targets = links.map(node => localReference(node.attrs.href || '', filename)).filter(ref => ref && !ref.error);
    const expected = [
      ['index.html', null, 'Overview'],
      ['articles.html', '', 'Articles'],
      ['career-snapshots.html', '', 'Career'],
      ['index.html', 'about', 'About'],
      ['index.html', 'contact', 'Contact']
    ];
    for (const [target, fragment, name] of expected) {
      if (!targets.some(ref => ref.path === target && (fragment === null || ref.fragment === fragment))) {
        problem(filename, `Primary navigation lacks a working ${name} destination`);
      }
    }
    const toggle = doc.nodes.find(node => node.tag === 'button' && node.attrs['aria-controls'] === nav.attrs.id);
    if (!toggle || !['false', 'true'].includes(toggle.attrs['aria-expanded']) || !toggle.attrs['aria-label']) {
      problem(filename, 'Mobile navigation toggle needs aria-controls, aria-expanded, and an accessible label');
    }
  }
}

const home = documents.get(path.join(root, 'index.html'));
const catalog = documents.get(path.join(root, 'articles.html'));
const expectedPublished = new Set(publicArticles.map(article => article.path));
if (catalog) {
  const cards = catalog.nodes.filter(node => node.tag === 'a' && hasClass(node, 'article-card'));
  const paths = cards.map(card => localReference(card.attrs.href || '', 'articles.html')?.path);
  if (cards.length !== expectedPublished.size || new Set(paths).size !== cards.length || paths.some(filename => !expectedPublished.has(filename))) {
    problem('articles.html', 'Article cards must link exactly once to every published manifest entry, with no drafts or duplicates');
  }
}
if (home) {
  const start = '<!-- ARTICLES:START -->', end = '<!-- ARTICLES:END -->';
  const starts = home.source.split(start).length - 1, ends = home.source.split(end).length - 1;
  if (starts !== 1 || ends !== 1 || home.source.indexOf(start) >= home.source.indexOf(end)) {
    problem('index.html', 'Homepage requires one correctly ordered ARTICLES:START / ARTICLES:END marker pair');
  } else {
    const region = parseHTML(home.source.slice(home.source.indexOf(start) + start.length, home.source.indexOf(end)));
    const actual = region.nodes.filter(node => node.tag === 'a' && hasClass(node, 'article-card'))
      .map(node => localReference(node.attrs.href || '', 'index.html')?.path);
    const expected = publicArticles.filter(article => article.featured != null)
      .sort((a, b) => a.featured - b.featured).slice(0, 3).map(article => article.path);
    if (actual.length !== Math.min(3, expectedPublished.size) || JSON.stringify(actual) !== JSON.stringify(expected)) {
      problem('index.html', 'Homepage must contain the first three featured articles in manifest order');
    }
  }
}

if (problems.length) {
  console.error(`FAIL: ${problems.length} site integrity ${problems.length === 1 ? 'issue' : 'issues'}\n`);
  problems.slice(0, 60).forEach(message => console.error(`  - ${message}`));
  if (problems.length > 60) console.error(`  …and ${problems.length - 60} more.`);
  process.exitCode = 1;
} else {
  console.log(`PASS: ${pagePaths.length} HTML pages, ${referenceCount} local references, ${fragmentCount} fragment destinations, ${assets.size} referenced files.`);
  console.log(`PASS: shared navigation, ${publicArticles.length} published articles, and three featured homepage cards.`);
  console.log('External URLs and runtime interactions are outside this offline check.');
}
