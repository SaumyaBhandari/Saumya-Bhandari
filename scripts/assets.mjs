/** Content-addressed browser assets. Old pages keep their matching files. */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sources = [
  'style.css', 'script.js', 'career.css', 'career.js', 'catalog.css', 'articles.js',
  'reader.css', 'reader.js', 'editorial.css', 'context-articles.css',
  'context-articles.js', 'idea-dumps/waves.js', 'idea-dumps/maxwell.js', 'print.css'
];

function assets() {
  return sources.filter(source => fs.existsSync(path.join(root, source))).map(source => {
    const content = fs.readFileSync(path.join(root, source));
    const extension = path.extname(source);
    const name = path.basename(source, extension);
    const hash = createHash('sha256').update(content).digest('hex').slice(0, 16);
    return { source, name, extension, content, target: `assets/${name}.${hash}${extension}` };
  });
}

function transformReferences(html, page, versioned) {
  const inventory = assets();
  return html.replace(/<(?:link|script)\b[^>]*>/gi, tag => tag.replace(/\b(href|src)=(['"])([^'"]+)\2/i, (attribute, name, quote, value) => {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value)) return attribute;
    const pathname = value.split(/[?#]/)[0];
    const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(page), pathname));
    const asset = inventory.find(item => resolved === item.source || (path.posix.dirname(resolved) === 'assets' && path.posix.basename(resolved).startsWith(`${item.name}.`) && path.posix.basename(resolved).endsWith(item.extension)));
    if (!asset) return attribute;
    const destination = versioned ? asset.target : asset.source;
    const relative = path.posix.relative(path.posix.dirname(page), destination);
    return `${name}=${quote}${relative}${quote}`;
  }));
}

export function unversionAssetReferences(html, page) {
  return transformReferences(html, page, false);
}

export function versionAssetReferences(html, page) {
  let output = transformReferences(html, page, true);
  const print = assets().find(item => item.source === 'print.css');
  if (print) {
    // Keep print overrides last, also when a generator adds other styles.
    output = output.replace(/<link\b(?=[^>]*\bhref=['"](?:\.\.\/)*assets\/print\.[a-f0-9]+\.css['"])[^>]*>\s*/gi, '');
    output = output.replace(/<\/head>/i, `<link rel="stylesheet" href="${path.posix.relative(path.posix.dirname(page), print.target)}" media="print">\n</head>`);
  }
  return output;
}

export function syncAssetFiles({ check = false } = {}) {
  const stale = [];
  for (const asset of assets()) {
    const target = path.join(root, asset.target);
    const matches = fs.existsSync(target) && fs.readFileSync(target).equals(asset.content);
    if (matches) continue;
    if (check) stale.push(asset.target);
    else { fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, asset.content); }
  }
  // Never delete older fingerprints: visitors may still have earlier HTML cached.
  if (stale.length) throw new Error(`Versioned assets are missing or stale: ${stale.join(', ')}. Run node scripts/build-content.mjs`);
}

export function syncPageAssets({ check = false, skip = [] } = {}) {
  const excluded = new Set(skip);
  const pages = ['index.html', 'articles.html', 'career-snapshots.html'];
  for (const directory of ['philosophy', 'formal-philosophy', 'idea-dumps']) {
    for (const name of fs.readdirSync(path.join(root, directory))) if (name.endsWith('.html')) pages.push(`${directory}/${name}`);
  }
  const stale = [];
  for (const page of pages) {
    if (excluded.has(page)) continue;
    const file = path.join(root, page);
    const current = fs.readFileSync(file, 'utf8');
    const desired = versionAssetReferences(current, page);
    if (current === desired) continue;
    if (check) stale.push(page);
    else fs.writeFileSync(file, desired);
  }
  if (stale.length) throw new Error(`Pages refer to outdated browser assets: ${stale.join(', ')}. Run node scripts/build-content.mjs`);
}
