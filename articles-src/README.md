# Context-Lifted Predictive States: two-part web edition

The published pages are static HTML. Reading the articles and rendering their
MathML equations requires no JavaScript library, CDN, server, or build step.
The small `context-articles.js` file controls the existing mobile navigation.

## Sources

- `context-guide.md`: the illustrated reading companion and 50 numbered examples.
- `context-equations.json`: explanations and two sentence examples for every
  displayed source expression, including intermediate proof equations.
- `context-paper.tex`: the matching editable Theory Version 1.0 source, with the
  author line aligned to the supplied PDF.
- `../papers/context-lifted-predictive-states-v1.pdf`: unchanged supplied PDF.

The HTML edition regularizes cross-reference labels to the displayed theorem
numbers and converts the original table to semantic HTML. Every one of the
source's 198 inline/display mathematical expressions is retained. The 35 display
equations are cross-linked to their individual guide cards. The web-edition note
documents the reference corrections. There are no new empirical results.

## Regenerate

Requires Node.js and Pandoc 3 or later:

```sh
node articles-src/build-context-articles.mjs
```

This regenerates only the two article pages. Homepage cards and shared article
CSS are maintained separately. The builder reuses the portfolio navbar from
`philosophy/when-light-takes-time.html`.

## Verify

Static integrity tests require Python 3, lxml, and Pandoc:

```sh
python3 articles-src/check-context-static.py
```

Checks include original PDF checksum, all source mathematics, all 35 displayed
expressions, 70 sentence-level equation examples, 50 numbered worked examples,
10 proofs, 18 bibliography entries, nine comparison-table rows, internal links,
cross-page anchors, existing article retention, and matching portfolio navigation.

Optional browser checks require Playwright and an installed Chromium browser:

```sh
python3 -m http.server 8765
# In a separate terminal:
node articles-src/check-context-articles.mjs
```

The browser suite checks desktop/mobile layout, math visibility, no-JavaScript
reading, and mobile menu behavior. It can save review screenshots using
`ARTICLE_QA_SCREENSHOTS`. `PLAYWRIGHT_MODULE` may point to an existing installation.
The publishing environment passed the static suite; browser QA could not run
because its Chromium executable was unavailable.
