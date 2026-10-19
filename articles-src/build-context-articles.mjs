/** Regenerate only the two Context-Lifted Predictive States pages. Requires Pandoc 3+. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const sourceDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(sourceDir);
const read = name => fs.readFileSync(path.join(sourceDir, name), 'utf8');
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const convert = (input, from = 'markdown+tex_math_single_backslash') => execFileSync('pandoc', ['-f', from, '-t', 'html5', '--mathml', '--wrap=none'], { input, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
const paperTex = read('context-paper.tex');
const expressions = [...paperTex.matchAll(/\\\[([\s\S]*?)\\\]/g)].map(match => match[1]);
const guides = JSON.parse(read('context-equations.json'));
if (expressions.length !== 35 || guides.length !== expressions.length) throw new Error('Source equation coverage mismatch');
const latexForMath = expression => expression.replaceAll('\\textsc{', '\\mathrm{');
const renderMath = expression => {
  const rendered = convert(`\\[${latexForMath(expression)}\\]`, 'latex').trim();
  if (!rendered.includes('<math') || rendered.includes('<span class="math')) throw new Error(`Unrendered equation: ${expression}`);
  return rendered.replace(/^<p>/, '').replace(/<\/p>$/, '');
};

const svg = (label, description, content, height = 300) => `<svg viewBox="0 0 780 ${height}" role="img" aria-label="${escape(label)}" xmlns="http://www.w3.org/2000/svg"><desc>${escape(description)}</desc><rect width="780" height="${height}" fill="#1b2527"/><g font-family="system-ui,sans-serif">${content}</g></svg>`;
const rect = (x,y,w,h,fill='#283a3a') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${fill}" stroke="#71897b"/>`;
const txt = (x,y,text,size=22,fill='#e7e8d9') => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}">${escape(text)}</text>`;
const figure = (name, picture, title, explanation) => `<figure class="diagram" id="figure-${name}">${picture}<figcaption><strong>${title}</strong>${explanation} Original explanatory diagram for this article.</figcaption></figure>`;
const diagrams = {
  bank: figure('bank', svg('The same sentence followed by two different clues', 'He went to the bank branches into a money-deposit context and a nearly-drowning context. Both interpretations remain possibilities before the clue arrives.',
    rect(170,25,440,65)+txt(225,67,'He went to the bank.',26)+
    '<path d="M390 90V120H200V150M390 120H580V150" fill="none" stroke="#d7ba7a" stroke-width="3"/>'+
    rect(35,150,340,105)+txt(60,185,'…deposited some money',23)+txt(60,225,'Financial bank favoured',21,'#cdbd95')+
    rect(405,150,340,105)+txt(430,185,'…nearly drowned',23)+txt(430,225,'Riverbank favoured',21,'#b6d4cb')),
    'The words stay the same; the evidence changes.', 'Follow the two continuations. They make different interpretations more plausible. Before the ending arrives, a causal predictor cannot use it.'),
  state: figure('state', svg('Three distinct roles in a structured predictive state', 'Local state tracks the event, the context stack tracks the setting, and referent registers preserve the people and objects. All contribute to the next prediction.',
    txt(35,40,'“At the café, Maya handed Ravi the bill.”',26)+
    rect(30,70,230,130)+txt(50,108,'q · Current event',22,'#e9cd92')+txt(50,150,'Handing over',22)+txt(50,180,'a bill',22)+
    rect(275,70,230,130)+txt(295,108,'Γ · Open context',22,'#e9cd92')+txt(295,150,'Café visit',22)+txt(295,180,'Payment',22)+
    rect(520,70,230,130)+txt(540,108,'R · Live referents',22,'#e9cd92')+txt(540,150,'Maya · Ravi',22)+txt(540,180,'The bill',22)+
    '<path d="M145 200V230H635V200M390 200V255" fill="none" stroke="#a6cbbb" stroke-width="3"/>'+
    txt(195,287,'Together: expectations about what comes next',20),320),
    'One scene, three kinds of bookkeeping.', 'The diagram names proposed computational roles. It does not claim that the brain contains three literal boxes, or that tensor shape alone creates these roles.'),
  stack: figure('stack', svg('Nested belief frames separate claims from the surrounding story', 'An outer story contains Maya’s belief, which contains Ravi’s belief that the door is locked. The sentence does not establish the real door’s state.',
    rect(30,25,720,300,'#253331')+txt(55,63,'Surrounding story',23)+
    rect(80,85,620,205,'#30423b')+txt(105,123,'Maya thinks…',23)+
    rect(135,145,510,105,'#3e4a3c')+txt(160,183,'Ravi believes…',23)+txt(160,220,'“The door is locked.”',25,'#edcf92')+
    txt(55,365,'Closing the inner frame returns to the enclosing perspective.',21),390),
    'Keep the claim inside the right perspective.', 'The innermost sentence is a belief attributed to Ravi inside Maya’s belief. Reading the sentence does not tell us that the door really is locked. Actual discourse can also require crossing links that this simple stack omits.'),
  hankel: figure('hankel', `<div class="table-scroll" style="padding:20px"><table style="width:100%;border-collapse:collapse;text-align:center" aria-label="Identity submatrix for two bracket types at depth two"><caption style="padding-bottom:18px;color:#e8cd99">Each opening has one matching reversed ending</caption><thead><tr><th scope="col">Opening ↓ / Ending →</th><th scope="col">))</th><th scope="col">])</th><th scope="col">)]</th><th scope="col">]]</th></tr></thead><tbody>${['((', '([', '[(', '[['].map((value,i)=>`<tr><th scope="row" style="padding:12px">${value}</th>${[0,1,2,3].map(j=>`<td style="padding:12px;${i===j?'background:#586044;color:#fff3b9;font-weight:700':''}">${i===j?1:0}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`,
    'Four beginnings, four distinct obligations.', 'A 1 means the joined brackets are correctly matched. A 0 means they are not. Here m = 2 and k = 2, so the independent identity submatrix has 2² = 4 rows. The construction grows with depth.'),
  register: figure('register', svg('Names become new-or-equal codes while identities remain distinct', 'Maya enters and is allocated slot one, Ravi enters and is allocated slot two, then Maya waves and refers back to slot one. The same canonical trace results if the two characters are consistently renamed.',
    txt(35,40,'Observation',22,'#e9cd92')+txt(405,40,'Canonical operation',22,'#e9cd92')+
    rect(25,60,730,58)+txt(45,97,'Maya entered.',24)+txt(405,97,'NEW person → slot 1',23)+
    rect(25,135,730,58)+txt(45,172,'Ravi entered.',24)+txt(405,172,'NEW person → slot 2',23)+
    rect(25,210,730,58)+txt(45,247,'Maya waved.',24)+txt(405,247,'EQ[1] · same person',23)+
    txt(35,310,'Rename both consistently: the pattern of operations survives.',21),340),
    'The second Maya is the first Maya again.', 'Repeated identity survives a consistent label change. The bounded theorem compares incoming names with live slots; it does not automatically resolve every pronoun or remember evicted names forever.')
};

function equationCard(number) {
  const item = guides[number - 1];
  if (!item || item.examples.length < 2) throw new Error(`Equation ${number} lacks examples`);
  return `<section class="equation-guide" id="equation-${number}" aria-labelledby="equation-title-${number}"><h3 id="equation-title-${number}"><span class="equation-label">Equation guide ${String(number).padStart(2,'0')} · From the original paper</span>${escape(item.title)}</h3><div class="math-scroll" tabindex="0" role="region" aria-label="Equation ${number}, horizontally scrollable on small screens">${renderMath(expressions[number-1])}</div><p>${escape(item.meaning)}</p><p><strong>Two sentence examples</strong></p><ul>${item.examples.map(e=>`<li>${escape(e)}</li>`).join('')}</ul>${item.note?`<p class="equation-caution">${escape(item.note)}</p>`:''}<a class="equation-source" href="context-lifted-predictive-states-paper.html#paper-equation-${number}">Find this expression in Part II →</a></section>`;
}

const navSource = fs.readFileSync(path.join(root,'philosophy/when-light-takes-time.html'),'utf8');
const header = navSource.match(/<header\b[\s\S]*?<\/header>/)[0]
  .replace('id="mobile-menu"','id="mobile-menu" aria-controls="article-menu"')
  .replace('<ul class="nav-menu">','<ul class="nav-menu" id="article-menu">');
function toc(html) {
  const entries = [...html.matchAll(/<h2\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g)];
  return `<details class="reading-toc" open><summary>On this page · jump to any chapter</summary><ol>${entries.map(([,id,title])=>`<li><a href="#${id}">${title.replace(/^\d+\.\s*/, '')}</a></li>`).join('')}</ol></details>`;
}
const glossary = `<details class="glossary"><summary>A pocket dictionary for the maths</summary><dl><dt>State</dt><dd>What the machine carries forward from what it has observed.</dd><dt>Ontology</dt><dd>A system of categories and distinctions used to interpret the current task.</dd><dt>Referent</dt><dd>The particular person, object, or other entity an expression refers to.</dd><dt>Entropy H(…)</dt><dd>Average uncertainty; different from the history variable Hₜ.</dd><dt>Mutual information I(…;…)</dt><dd>How much observing one variable tells us about another, on average.</dd><dt>Conditional |</dt><dd>“Given what is known on the right-hand side.”</dd><dt>Risk and cross-entropy</dt><dd>Average prediction penalties; lower is better under the chosen score.</dd><dt>Rank</dt><dd>The number of independent directions in a mathematical table, under its specified algebra.</dd><dt>Equivariance</dt><dd>Changing labels consistently changes the internal answer in the corresponding way.</dd><dt>Orbit</dt><dd>All arrangements that differ only by an allowed relabelling.</dd><dt>Predictive sufficiency</dt><dd>A state preserves every history distinction needed for the chosen future target.</dd><dt>Symbols are reused locally</dt><dd>Rₜ is an entity register; R as a resource is a dimension budget. qₜ is local state in Section 3 and q is a forecast in Section 7. Fₜ is a future target; Fⱼ in Section 4 is a context layer. Definitions in the surrounding paragraph determine the meaning.</dd></dl></details>`;
const titles = {guide:'How Words Build a World',paper:'Context-Lifted Predictive States'};
const filenames = {guide:'how-words-build-a-world.html',paper:'context-lifted-predictive-states-paper.html'};
function series(active) {return `<div class="series-links" aria-label="Two-part article series"><a href="${filenames.guide}"${active==='guide'?' aria-current="page"':''}>Part I · The everyday guide</a><a href="${filenames.paper}"${active==='paper'?' aria-current="page"':''}>Part II · The full paper</a><a href="../papers/context-lifted-predictive-states-v1.pdf">Original PDF ↓</a></div>`;}
function page(kind, html) {
  const wordCount = html.replace(/<annotation\b[\s\S]*?<\/annotation>/g,'').replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length;
  const description = kind==='guide'
    ? 'A complete plain-English companion to Context-Lifted Predictive States: 50 everyday examples, all 35 displayed equations, two examples for every equation, and five explanatory diagrams.'
    : 'The complete Theory Version 1.0 manuscript by Saumya Bhandari: all sections, mathematical proofs, appendices and references, with an unchanged original PDF.';
  const deck = kind==='guide'
    ? 'Two meanings of “bank.” A promise that survives a conversation. A belief inside somebody else’s belief. A patient, example-by-example journey through the mathematics of keeping the right things in mind.'
    : 'Representation Complexity, Nested Discourse, and Referential Symmetry';
  const note = kind==='paper' ? `<aside class="note paper-note"><strong>About this web edition.</strong> This is the complete Theory Version 1.0 manuscript, dated 10 August 2026, transcribed from the supplied PDF using its matching editable source. It includes all 13 sections, three appendices, and 18 references. Cross-reference labels are regularized to the displayed statement numbers: Proposition 2.2, Theorem 5.1, Lemma 5.3, Theorem 6.2 in the proof of Theorem 6.3, and Theorem 6.3 in Limitation 6.4. Mathematics is rendered locally in MathML, and guide links are editorial additions. The <a href="../papers/context-lifted-predictive-states-v1.pdf">original PDF is unchanged</a>. This is a theory manuscript, not a report of completed English-language benchmark results.</aside>` : `<aside class="note"><strong>A reading guide to a research proposal.</strong> No previous information theory or computer science is required. All 50 numbered examples are illustrative; numerical examples are invented teaching cases, not experimental results. Every displayed expression in the source paper has a guide card with two sentence examples. The formal results have stated assumptions; the practical language-model gains still need to be tested.</aside>`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"><title>${titles[kind]} | Saumya Bhandari</title><meta name="description" content="${escape(description)}"><link rel="canonical" href="https://www.saumyabhandari.com.np/philosophy/${filenames[kind]}"><meta property="og:type" content="article"><meta property="og:title" content="${titles[kind]}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="https://www.saumyabhandari.com.np/philosophy/${filenames[kind]}"><meta name="author" content="Saumya Bhandari"><link rel="icon" href="../Images/logo.png"><link rel="stylesheet" href="../style.css"><link rel="stylesheet" href="../editorial.css"><link rel="stylesheet" href="../context-articles.css"><script defer src="../context-articles.js"></script><script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'Article',headline:titles[kind],description,author:{'@type':'Person',name:'Saumya Bhandari'},datePublished:kind==='paper'?'2026-08-10':'2026-10-19',dateModified:'2026-10-19',inLanguage:'en',isPartOf:{'@type':'WebSite',name:'Saumya Bhandari',url:'https://www.saumyabhandari.com.np/'}})}</script></head>
<body class="context-article" id="top"><a class="skip-link" href="#main-content">Skip to article</a>${header}
<main><div class="hero"><div><div class="eyebrow article-label">Philosophy Articles · Language, memory &amp; thinking machines · Part ${kind==='guide'?'I':'II'}</div><h1>${titles[kind]}</h1><p class="deck">${deck}</p><div class="byline">Saumya Bhandari · ${kind==='paper'?'Theory Version 1.0 · 10 August 2026':'19 October 2026 · An illustrated reading companion'}</div><div class="reading-meta"><span>About ${Math.ceil(wordCount/210)} minutes</span><span>${kind==='guide'?'50 everyday examples · 35 equation guides · 5 diagrams':'13 sections · 3 appendices · 18 references'}</span><span>Readable without JavaScript</span></div>${series(kind)}</div></div>
<article id="main-content">${note}${toc(html)}${kind==='guide'?glossary:''}<div class="${kind==='paper'?'paper-body':'guide-body'}">${html}</div><div class="next"><a href="${filenames[kind==='guide'?'paper':'guide']}">${kind==='guide'?'Continue to Part II: The full paper':'Return to Part I: The everyday guide'}<span>${kind==='guide'?'Read the definitions, proofs, limitations and complete bibliography →':'Revisit all 50 examples and the sentence-by-sentence equation explanations →'}</span></a><a href="../index.html#philosophy-articles">Philosophy Articles<span>More writing from Saumya Bhandari →</span></a></div></article></main><footer><a href="../index.html">Home</a> · <a href="../index.html#philosophy-articles">Philosophy Articles</a> · <a href="../index.html#formal-philosophy">Formal Philosophy</a></footer><a class="back-top" href="#top" aria-label="Back to top of article">Back to top ↑</a></body></html>`;
}

let guide = convert(read('context-guide.md'));
guide = guide.replace(/<!-- EQ:(\d+) -->/g, (_,number)=>equationCard(Number(number)));
guide = guide.replace(/<!-- FIGURE:(\w+) -->/g, (_,key)=>{if(!diagrams[key]) throw Error(`Missing figure ${key}`); return diagrams[key];});
if ((guide.match(/class="example"/g)||[]).length !== 50 || (guide.match(/class="equation-guide"/g)||[]).length !== 35) throw new Error('Guide coverage check failed');

let input = paperTex.replaceAll('\\textsc{','\\mathrm{');
input = input.replace(/\\hangpara\{1\.5em\}\{1\}/g,'');
// Simplify only the LaTeX table layout syntax; retain every original row and cell.
input = input.replace(/\\begin\{longtable\}[\s\S]*?\\endlastfoot\s*([\s\S]*?)\\end\{longtable\}/, (_,rows) =>
  '\\begin{tabular}{lll}\n\\textbf{Component} & Status & Role in this paper \\\\\n\\hline\n' + rows + '\\end{tabular}');
let paper = convert(input,'latex');
// The page wrapper carries the manuscript title and author, leaving the complete abstract below.
paper = paper.replace(/^<div class="center">[\s\S]*?<\/div>\s*/, '');
paper = paper.replace(/<div class="center">\s*<p><strong>Abstract<\/strong><\/p>\s*<\/div>/, '<h2 id="abstract">Abstract</h2>');
let topLevel = 0;
paper = paper.replace(/<h([12])([^>]*)>([\s\S]*?)<\/h\1>/g, (whole,level,attrs,title)=>{
  if(level==='1') {
    topLevel++;
    const prefix = topLevel<=13 ? `${topLevel}. ` : topLevel<=16 ? `${String.fromCharCode(65+topLevel-14)}. ` : '';
    return `<h2${attrs}>${prefix}${title}</h2>`;
  }
  if(title==='Abstract') return whole;
  const prefixes = {'Context stacking and the Ronaldo example':'3.1 ', 'Finite canonical observations':'6.1 ', 'Finite orbit count':'6.2 '};
  return `<h3${attrs}>${prefixes[title]??''}${title}</h3>`;
});
const crossReferences = {'prop:no-free':'2.2','thm:context-value':'4.1','cor:layerwise':'4.2','thm:flat-rank':'5.1','cor:model-class-separation':'5.2','lem:window':'5.3','thm:canonicalization':'6.2','thm:bounded-realization':'6.3','thm:overflow':'7.1','prop:lexical-decomp':'8.1'};
paper = paper.replace(/(<a\b[^>]*data-reference="([^"]+)"[^>]*>)[\s\S]*?(<\/a>)/g, (whole,start,label,end)=>crossReferences[label]?`${start}${crossReferences[label]}${end}`:whole);
// Pandoc preserves phantomsection labels as spans; all link targets remain available.
let equationIndex = 0;
paper = paper.replace(/<math display="block"[\s\S]*?<\/math>/g, math=>{
  const number = ++equationIndex;
  return `<span class="paper-equation" id="paper-equation-${number}"><span class="math-scroll" style="display:block" tabindex="0" role="region" aria-label="Displayed expression ${number}">${math}</span><a href="how-words-build-a-world.html#equation-${number}">Plain-English explanation ${String(number).padStart(2,'0')} ↗</a></span>`;
});
paper = paper.replace(/(<table\b[\s\S]*?<\/table>)/g,'<div class="table-scroll" tabindex="0" role="region" aria-label="Original paper comparison table">$1</div>');
if(equationIndex!==35) throw new Error(`Formal paper rendered ${equationIndex} display equations`);
if(/\[thm:|\[prop:|\[lem:|<span class="math(?: display| inline)?"/.test(paper)) throw new Error('Unresolved reference or math');
fs.writeFileSync(path.join(root,'philosophy',filenames.guide),page('guide',guide));
fs.writeFileSync(path.join(root,'philosophy',filenames.paper),page('paper',paper));
console.log(JSON.stringify({examples:50,guideEquations:guides.length,paperEquations:equationIndex,figures:Object.keys(diagrams).length,outputs:Object.values(filenames)},null,2));
