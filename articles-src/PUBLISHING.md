# Publishing an article

The site publishes static HTML. You can write an essay, a technical manuscript,
or an illustrated idea without changing the site layout. The article collection
is maintained in one file: `content/articles.json`.

## 1. Create the article

Copy `articles-src/article-template.html` into one of the existing content
directories, with a lowercase, hyphenated filename:

```sh
cp articles-src/article-template.html philosophy/your-article-title.html
```

Replace the template's title, description, topic, byline, and article body.
Use a single `h1` for the title. Use `h2` and `h3` for the body, give important
headings stable IDs, and include alternative text for meaningful images.
The reader shell adds a contents list, so heading names should be useful links.

For equations and research papers, preserve the exact mathematical source and
references. The existing Context-Lifted Predictive States workflow is documented
separately in `articles-src/README.md`.

## 2. Add a catalog entry

Append an object to the `articles` array in `content/articles.json`:

```json
{
  "id": "your-article-title",
  "path": "philosophy/your-article-title.html",
  "title": "Your Article Title",
  "summary": "One or two sentences that tell a reader what they will find.",
  "topic": "Language & thinking machines",
  "tags": ["Explanation", "Idea"],
  "published": "2026-11-02",
  "status": "draft",
  "featured": null,
  "art": "language"
}
```

Use the date you intend to publish. Existing writing with only a known month can
use `YYYY-MM`; an exact day is never added automatically. The article's visible
byline should agree with its metadata. RSS omits `pubDate` when only a month is
known, rather than inventing a day.

| Field | How it is used |
| --- | --- |
| `id` | Unique lowercase ID, with hyphens between words |
| `path` | Existing HTML file relative to the repository root; keep it stable |
| `title` | Card, search, RSS, and sitemap collection title |
| `summary` | Short preview on cards and in RSS |
| `topic` | The subject shown above the title and included in search |
| `tags` | One or more of `Formal Philosophy`, `Idea`, `Explanation` |
| `published` | `YYYY-MM-DD`, or `YYYY-MM` when the exact day is unknown |
| `status` | `published` appears in the collection; `draft` is excluded |
| `featured` | `1`, `2`, or `3` for homepage order; `null` for other pieces |
| `art` | One of the abstract thumbnail variants below |

Available art variants are `language`, `states`, `light`, `particle`, `lensing`,
`spectral`, `interface`, and `ripple`. These are lightweight decorative drawings,
not scientific figures attached to the article's claims.

Reading times are calculated from the article body at 220 words per minute.
They are estimates, and there is no reading-time value to maintain by hand.

`draft` hides an entry from the catalog, homepage, feed, and sitemap. It does not
make an HTML file private on a public GitHub Pages site. Keep private drafts
outside this public repository until they are ready to share.

## 3. Apply the shared reader layout

Once the file and metadata entry exist, apply the reader shell:

```sh
node articles-src/reader-shell.mjs philosophy/your-article-title.html
```

The shell retains the article body and adds the shared navigation, reading
layout, contents links, and footer. Run it again when you change article headings
or metadata. It is safe to apply more than once.

## 4. Publish and build

When the article is ready, change `status` to `published`, then run:

```sh
node scripts/build-content.mjs
node scripts/build-content.mjs --check
python3 -m http.server 8765
```

Inspect the homepage, the article collection, and the article itself at
`http://localhost:8765`. Check the title, categories, links, mobile layout, and any
figures or equations. Commit the article, manifest, and generated files together.
The builder also versions local CSS and JavaScript under `assets/` and updates
every page to use matching filenames, including the print stylesheet. Include
these generated files in the same commit; keep older versions for cached pages.
GitHub Pages serves the resulting static files using the repository's deployment
configuration.

## Feature a different article

Give the desired article a unique `featured` rank of `1`, `2`, or `3`. Set the
replaced article's rank to `null`, then rebuild. The builder only updates the
cards between `<!-- ARTICLES:START -->` and `<!-- ARTICLES:END -->` in the
homepage, preserving the rest of the page.

## Update existing writing

Keep the existing `path` and important heading IDs so shared links keep working.
Edit the article text and metadata, reapply the reader shell if headings changed,
and run the builder. The catalog, featured previews, reading times, RSS, and
sitemap stay in sync.

For the two generated context articles, change their Markdown/LaTeX sources and
use `node articles-src/build-context-articles.mjs` instead of editing the generated
HTML. Follow it with `node scripts/build-content.mjs`.
