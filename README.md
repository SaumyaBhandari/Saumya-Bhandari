# Saumya Bhandari — personal website

A static portfolio and publishing home for engineering, research, and writing.
The production site is [www.saumyabhandari.com.np](https://www.saumyabhandari.com.np/),
served by GitHub Pages from this repository. There is no application server or
runtime package installation.

## Preview locally

```sh
python3 -m http.server 8765
```

Open `http://localhost:8765`. Use an HTTP server rather than opening individual
files from the filesystem when checking navigation and browser behavior.

## Publish or update writing

Article metadata lives in [`content/articles.json`](content/articles.json).
The articles themselves remain readable HTML at their existing URLs. Read the
[publishing guide](articles-src/PUBLISHING.md) for the full workflow and the
[new-article template](articles-src/article-template.html).

After changing an article or its metadata:

```sh
node scripts/build-content.mjs
node scripts/build-content.mjs --check
```

The dependency-free builder validates article references and metadata, derives
reading times from the article bodies, and produces:

- `articles.html`: the complete collection, with search, category filters, and sorting.
- The three featured cards between the article markers in `index.html`.
- The homepage timeline from `content/timeline.html`.
- `feed.xml`: an RSS feed of published articles.
- `sitemap.xml`: the main pages and published article URLs.
- Content-hashed CSS and JavaScript in `assets/`, with matching references on every page.

All article links and content remain available without JavaScript. Search,
filtering, sorting, mobile navigation, and reader enhancements use small local
scripts. Existing mathematical articles retain their original rendering tools.

## Site structure

| File or directory | Purpose |
| --- | --- |
| `index.html` | Homepage, biography, selected writing, career, timeline, and contact |
| `career-snapshots.html` | Career and project archive |
| `style.css`, `script.js` | Shared design system and site behavior |
| `content/articles.json` | Single source for the public article collection |
| `content/timeline.html` | Timeline milestones; run the content builder after editing |
| `career.css`, `career.js` | Career presentation, project navigation, and timeline filters |
| `Images/optimized/` | Lightweight WebP previews; originals remain available for full-size viewing |
| `articles.js`, `catalog.css` | Article search, filters, sort, and catalog layout |
| `philosophy/`, `formal-philosophy/`, `idea-dumps/` | Existing public article URLs |
| `reader.css`, `reader.js` | Shared reading layout and enhancements |
| `print.css` | Shared paper and PDF presentation |
| `assets/` | Generated, versioned copies of browser styles and scripts |
| `articles-src/` | Publishing template, source manuscripts, and context-paper builder |
| `papers/` | Original research PDFs |

## The two-part Context-Lifted Predictive States edition

Its Markdown/LaTeX sources and mathematical integrity checks are documented in
[`articles-src/README.md`](articles-src/README.md). To regenerate that edition,
Node.js and Pandoc are required:

```sh
node articles-src/build-context-articles.mjs
node scripts/build-content.mjs
```

Keep the existing article URLs, equation anchors, and original PDF when updating
the presentation. Do not hand-edit the generated article catalog or the featured
card region; their contents come from the manifest.

## Validation

```sh
node scripts/build-content.mjs --check
node scripts/check-site.mjs
```

The second command checks all local assets and links, article anchors, duplicate
IDs, shared navigation, and featured-card consistency. GitHub Actions also runs
a browser regression that caches the previous site's CSS and JavaScript, then
loads the current page and checks the article layout and mobile navigation.
This needs Playwright with Chromium and full Git history; run it locally with
`node scripts/check-browser.mjs`. The mathematical edition has its
additional integrity checks in `articles-src/README.md`.

## Update styles or browser behavior

Edit the original CSS or JavaScript files, then run
`node scripts/build-content.mjs`. The builder copies each browser asset to a
filename containing a hash of its contents and updates the pages to match.
Commit the generated assets and HTML together. This ensures returning visitors
fetch the matching styles and scripts even while older files remain cached.
Do not edit generated files in `assets/` or remove older fingerprints: cached
pages may still refer to them. `--check` rejects missing assets and stale page
references.

Design previews are included in `docs/previews/`. The site uses the existing
GitHub Pages deployment and custom domain; no new hosting service is needed.
