/** Apply the shared reader chrome without rewriting the article's source content. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { estimateReadingMinutes } from '../scripts/content-utils.mjs';
import { versionAssetReferences, unversionAssetReferences } from '../scripts/assets.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const escape = text => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const plain = html => html.replace(/<annotation\b[\s\S]*?<\/annotation>/gi, '').replace(/<(script|style|svg)\b[\s\S]*?<\/\1>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const decode = text => text.replace(/&#(x[0-9a-f]+|\d+);/gi, (_, code) => String.fromCodePoint(code[0].toLowerCase() === 'x' ? parseInt(code.slice(1),16) : Number(code))).replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, name) => ({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '})[name]);

export const readerHeader = `<header class="navbar" id="navbar">
  <div class="nav-container">
    <a href="../index.html" class="nav-logo" aria-label="Saumya Bhandari, home"><img src="../Images/logo.png" alt="" class="logo-mark" width="50" height="30"><span class="logo-text">Saumya Bhandari<span class="logo-period">.</span></span></a>
    <button type="button" class="nav-toggle" id="mobile-menu" aria-label="Open navigation" aria-expanded="false" aria-controls="primary-navigation"><span class="bar"></span><span class="bar"></span><span class="bar"></span></button>
    <nav id="primary-navigation" class="nav-menu" aria-label="Primary navigation">
      <a href="../index.html" class="nav-link">Overview</a>
      <a href="../articles.html" class="nav-link active" aria-current="true">Articles</a>
      <a href="../career-snapshots.html" class="nav-link">Career</a>
      <a href="../index.html#about" class="nav-link">About</a>
      <a href="../index.html#contact" class="nav-link nav-contact">Let’s talk <span aria-hidden="true">↗</span></a>
    </nav>
  </div>
</header>`;

const footer = `<footer class="site-footer"><div class="container"><a class="footer-name" href="../index.html">Saumya Bhandari<span>Engineering intelligence. Exploring ideas.</span></a><nav aria-label="Footer navigation"><a href="../articles.html">Articles</a><a href="../career-snapshots.html">Career snapshots</a><a href="../index.html#contact">Contact</a><a href="../feed.xml">RSS</a></nav><p>© ${new Date().getFullYear()} Saumya Bhandari · Kathmandu, Nepal</p></div></footer>`;

/** html must be a complete page with a single <article>. Existing IDs are preserved. */
export function decorateReader(html, { topic = 'Writing & research', path: articlePath = '' } = {}) {
  html = unversionAssetReferences(html, articlePath || 'philosophy/article.html');
  // Decoration is deliberately idempotent, so either content generator can call it.
  const match = html.match(/<article\b([^>]*)>([\s\S]*?)<\/article>/i);
  if (!match) throw new Error(`Reader page needs one <article>: ${articlePath}`);
  let content = match[2]
    .replace(/<details\b[^>]*class="[^"]*reading-toc[^\"]*"[^>]*>[\s\S]*?<\/details>/g, '')
    .replace(/<!-- READER-END:START -->[\s\S]*?<!-- READER-END:END -->/g, '')
    .replaceAll('../index.html#philosophy-articles', '../articles.html')
    .replaceAll('../index.html#formal-philosophy', '../articles.html?tag=Formal%20Philosophy')
    .replaceAll('../index.html#idea-dumps', '../articles.html?tag=Idea');
  // A literal j<k in TeX was parsed as an HTML element in the legacy manuscript.
  // Escaping the delimiter retains the identical equation for MathJax and closes the DOM correctly.
  content = content.replace(/(<div class="math">)([\s\S]*?)(<\/div>)/g, (_, start, math, end) => start + math.replaceAll('<', '&lt;') + end);
  const knownIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
  const entries = [];
  let headingIndex = 0;
  content = content.replace(/<h2\b([^>]*)>([\s\S]*?)<\/h2>/g, (whole, attrs, label) => {
    headingIndex++;
    let id = attrs.match(/\bid="([^"]+)"/)?.[1];
    if (!id) {
      id = `section-${headingIndex}`;
      while (knownIds.has(id)) id += '-heading';
      knownIds.add(id);
      attrs += ` id="${id}"`;
    }
    entries.push({ id, label: decode(plain(label)).replace(/^\d+\.\s*/, '') });
    return `<h2${attrs}>${label}</h2>`;
  });
  const readMinutes = estimateReadingMinutes(`<article>${content}</article>`);
  const toc = `<aside class="reader-sidebar" aria-label="Article contents"><details class="reading-toc" open><summary>On this page <span aria-hidden="true">⌄</span></summary><ol>${entries.map(({ id, label }) => `<li><a href="#${escape(id)}">${escape(label)}</a></li>`).join('')}</ol></details><a href="../articles.html" class="reader-library-link"><span aria-hidden="true">←</span> All articles</a></aside>`;

  let head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || '';
  head = head.replace(/<script\b[^>]*src="\.\.\/(?:context-articles|reader|script)\.js"[^>]*><\/script>/g, '')
    .replace(/<link\b[^>]*href="\.\.\/reader\.css"[^>]*>/g, '')
    .replace(/<link\b[^>]*href="\.\.\/style\.css"[^>]*>/g, '');
  head = `<link rel="stylesheet" href="../style.css">${head}`;
  if (!head.includes('fonts.googleapis.com/css2')) head += '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">';
  if (!head.includes('rel="canonical"') && articlePath) head += `<link rel="canonical" href="https://www.saumyabhandari.com.np/${escape(articlePath)}">`;
  head += '<link rel="stylesheet" href="../reader.css"><script src="../script.js" defer></script><script src="../reader.js" defer></script>';

  let before = html.slice(html.search(/<body\b/i), html.indexOf(match[0])).replace(/^<body\b[^>]*>/i, '')
    .replace(/<header\b[\s\S]*?<\/header>/i, '')
    .replace(/<a\b[^>]*class="skip-link"[^>]*>[\s\S]*?<\/a>/g, '')
    .replace(/<main\b[^>]*>/g, '')
    .replace(/<!-- READER-BEFORE:START -->[\s\S]*?<!-- READER-BEFORE:END -->/g, '')
    .replace(/<!-- READER-TOOLS:START -->[\s\S]*?<!-- READER-TOOLS:END -->/g, '')
    .replace(/<div class="reader-layout">[\s\S]*$/g, '');
  // On re-decoration the existing layout sits after the original hero.
  before = before.replace(/<aside class="reader-sidebar"[\s\S]*?<\/aside>/g, '');
  before = before.replace(/<div class="reading-meta">([\s\S]*?)<\/div>/g, (_, value) => `<div class="reading-meta">${value.replace(/<span>Readable without JavaScript<\/span>/g, '').replace(/<span>About \d+ minutes<\/span>/g, '')}</div>`);
  const breadcrumb = `<div class="reader-breadcrumb"><a href="../articles.html"><span aria-hidden="true">←</span> Articles</a><span aria-hidden="true">/</span><span>${escape(topic)}</span></div>`;
  before = before.replace(/(<div class="hero"><div>)/, `$1${breadcrumb}`)
    .replace(/(<div class="reader-breadcrumb">[\s\S]*?<\/div>)(\s*<div class="reader-breadcrumb">[\s\S]*?<\/div>)+/g, '$1');

  const bodyClass = html.match(/<body\b[^>]*class="([^"]*)"/i)?.[1] || '';
  const classes = [...new Set([...bodyClass.split(/\s+/).filter(Boolean), 'reader-page'])].join(' ');
  const tail = html.slice(html.indexOf(match[0]) + match[0].length)
    .replace(/<footer\b[\s\S]*?<\/footer>/g, '')
    .replace(/<a class="back-top"[^>]*>[\s\S]*?<\/a>/g, '')
    .replace(/<script\b(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g, (whole, source) => source.includes("document.getElementById('mobile-menu')") ? '' : whole)
    .replace(/<\/?(?:main|body|html)>/g, '')
    .replace(/^\s*<\/div>\s*/, '').trim();
  const tools = `<div class="reader-tools"><span class="reader-duration">${readMinutes} min read</span><span class="reader-tools-rule" aria-hidden="true"></span><span class="reader-format">${articlePath.startsWith('formal-philosophy/') || articlePath.includes('states-paper') ? 'Research manuscript' : articlePath.startsWith('idea-dumps/') ? 'Thought experiment' : 'Essay & explanation'}</span><button class="reader-copy" type="button" data-copy-article hidden>Copy article link <span aria-hidden="true">↗</span></button><span class="reader-copy-status" role="status" aria-live="polite"></span></div>`;
  const end = `<!-- READER-END:START --><div class="reader-end"><span>Keep exploring.</span><a href="../articles.html">Browse all articles <span aria-hidden="true">↗</span></a><a href="#top">Back to top <span aria-hidden="true">↑</span></a></div><!-- READER-END:END -->`;
  const decorated = `<!doctype html>\n<html lang="en"><head>${head}</head><body class="${classes}" id="top"><a class="skip-link" href="#main-content">Skip to article</a>${readerHeader}<!-- READER-BEFORE:START --><div class="reader-progress" aria-hidden="true"><span></span></div><!-- READER-BEFORE:END --><main>${before}<!-- READER-TOOLS:START --><div class="reader-tools-wrap">${tools}</div><!-- READER-TOOLS:END --><div class="reader-layout">${toc}<article id="main-content">${content}${end}</article></div></main>${footer}${tail}</body></html>\n`;
  return versionAssetReferences(decorated, articlePath || 'philosophy/article.html');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'content/articles.json'), 'utf8'));
  const selected = process.argv.slice(2);
  for (const name of selected) if (!manifest.articles.some(item => item.path === name)) throw new Error(`Add ${name} to content/articles.json before decorating it.`);
  const articles = selected.length ? manifest.articles.filter(item => selected.includes(item.path)) : manifest.articles;
  for (const item of articles) {
    const file = path.join(root, item.path);
    fs.writeFileSync(file, decorateReader(fs.readFileSync(file, 'utf8'), item));
  }
  console.log(`Updated ${articles.length} article reader shells.`);
}
