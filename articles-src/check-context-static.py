"""Static integrity checks for the two articles; requires lxml and Pandoc."""
from pathlib import Path
import collections
import hashlib
import json
import re
import subprocess
from urllib.parse import unquote, urlsplit
from lxml import html

ROOT = Path(__file__).resolve().parent.parent
NAMES = ['how-words-build-a-world.html', 'context-lifted-predictive-states-paper.html']
CLASS = lambda name: f'contains(concat(" ", normalize-space(@class), " "), " {name} ")'

def parse(path):
    return html.fromstring(path.read_text())

def normalize_math(value):
    return re.sub(r'\s+', '', value.replace(r'\textsc{', r'\mathrm{'))

def math_nodes(node):
    if isinstance(node, dict):
        if node.get('t') == 'Math':
            yield node['c']
        for value in node.values():
            yield from math_nodes(value)
    elif isinstance(node, list):
        for value in node:
            yield from math_nodes(value)

results = []
for name in NAMES:
    path = ROOT / 'philosophy' / name
    doc = parse(path)
    ids = doc.xpath('//@id')
    assert len(ids) == len(set(ids)), f'Duplicate IDs in {name}'
    assert len(doc.xpath('//h1')) == 1
    assert not doc.xpath('//span[@class="math display" or @class="math inline"]')
    assert not doc.xpath('//script[starts-with(@src,"https:")]')
    for link in doc.xpath('//a[@href]'):
        href = link.get('href')
        url = urlsplit(href)
        if url.scheme or url.netloc:
            continue
        target = (path.parent / unquote(url.path)).resolve() if url.path else path
        assert target.is_relative_to(ROOT), f'Unexpected target outside site: {href}'
        # The pre-existing CV is in the remote repository and is unchanged by this task.
        if target.name == 'cv.pdf':
            continue
        assert target.is_file(), f'Missing file {href}'
        if url.fragment:
            target_doc = doc if target == path else parse(target)
            assert unquote(url.fragment) in target_doc.xpath('//@id'), f'Missing anchor {href}'
    for asset in doc.xpath('//link[@href]/@href | //script[@src]/@src | //img[@src]/@src'):
        url = urlsplit(asset)
        if not url.scheme and not url.netloc:
            assert (path.parent / unquote(url.path)).resolve().is_file(), f'Missing asset {asset}'
    display = doc.xpath('//math[@display="block"]')
    assert len(display) == 35, f'Missing displayed math in {name}'
    results.append({'file': name, 'display_equations': len(display), 'ids': len(ids), 'links': len(doc.xpath('//a[@href]'))})

guide = parse(ROOT / 'philosophy' / NAMES[0])
examples = guide.xpath(f'//div[{CLASS("example")}]')
assert len(examples) == 50
assert [item.get('id') for item in examples] == [f'example-{i:02d}' for i in range(1,51)]
cards = guide.xpath(f'//section[{CLASS("equation-guide")}]')
assert len(cards) == 35
assert all(len(card.xpath('./ul/li')) >= 2 for card in cards)
assert len(guide.xpath(f'//figure[{CLASS("diagram")}]')) == 5
paper = parse(ROOT / 'philosophy' / NAMES[1])
body = paper.xpath(f'//div[{CLASS("paper-body")}]')[0]
assert len(body.xpath('./h2')) == 18
assert len(body.xpath('.//table/tbody/tr')) == 9, 'All nine source comparison rows must survive'
assert len(body.xpath('.//table/thead/tr/th')) == 3
references = body.xpath('./h2[@id="references"]/following-sibling::p')
assert len(references) == 18
assert len(body.xpath('.//em[text()="Proof."]')) == 10
assert not body.xpath('.//div[@class="longtable"]'), 'Unconverted source table'

tex = (ROOT / 'articles-src/context-paper.tex').read_text()
ast = json.loads(subprocess.check_output(['pandoc','-f','latex','-t','json'], input=tex.encode()))
source_math = collections.Counter(normalize_math(item[1]) for item in math_nodes(ast))
web_math = collections.Counter(normalize_math(''.join(item.itertext())) for item in body.xpath('.//annotation[@encoding="application/x-tex"]'))
assert source_math == web_math, f'Math mismatch. Missing: {source_math-web_math}; extra: {web_math-source_math}'
source_displays = [normalize_math(item[1]) for item in math_nodes(ast) if item[0]['t']=='DisplayMath']
guide_displays = [normalize_math(''.join(item.itertext())) for item in guide.xpath('//math[@display="block"]//annotation')]
assert source_displays == guide_displays, 'Guide equations must match source order and content'

original_nav = parse(ROOT / 'philosophy/when-light-takes-time.html').xpath('//ul[@class="nav-menu"]//a')
for name in NAMES:
    new_nav = parse(ROOT / 'philosophy' / name).xpath('//ul[@class="nav-menu"]//a')
    assert [(a.get('href'),a.text_content()) for a in original_nav] == [(a.get('href'),a.text_content()) for a in new_nav]
home = parse(ROOT / 'index.html')
article_links = home.xpath('//*[@id="philosophy-articles"]//a/@href')
assert all(f'philosophy/{name}' in article_links for name in NAMES)
assert len(article_links) == 4, 'Keep both existing philosophy articles'
assert 'philosophy/context-lifted-predictive-states-paper.html' in home.xpath('//*[@id="formal-philosophy"]//a/@href')
assert hashlib.sha256((ROOT / 'papers/context-lifted-predictive-states-v1.pdf').read_bytes()).hexdigest() == '65066801808f7d967ff79b4f9f0511fb5512d5190c8b5ce101c51b4edefe671c'
print(json.dumps({'passed':True,'pages':results,'numbered_examples':50,'equation_sentence_examples':sum(len(c.xpath('./ul/li')) for c in cards),'source_math_expressions':sum(source_math.values()),'paper_proofs':10,'bibliography_entries':18,'pdf_unchanged':True},indent=2))
