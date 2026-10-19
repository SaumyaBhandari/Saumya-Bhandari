/** Browser QA for the two static articles. PLAYWRIGHT_MODULE can name an installed module path. */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.ARTICLE_QA_BASE_URL || 'http://127.0.0.1:8765';
const screenshotDirectory = process.env.ARTICLE_QA_SCREENSHOTS;
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const names=['how-words-build-a-world.html','context-lifted-predictive-states-paper.html'];
const assert=(condition,message)=>{if(!condition) throw new Error(message);};
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const checks=[];
try {
  for(const width of [1440,390]) {
    const context=await browser.newContext({viewport:{width,height:960},deviceScaleFactor:1});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('response',response=>{if(response.status()>=400) errors.push(`${response.status()} ${response.url()}`);});
    for(const [index,name] of names.entries()) {
      await page.goto(`${base}/philosophy/${name}`,{waitUntil:'networkidle'});
      const result=await page.evaluate(()=>{
        const ids=[...document.querySelectorAll('[id]')].map(el=>el.id);
        const missing=[...document.querySelectorAll('a[href^="#"]')].filter(a=>!document.getElementById(decodeURIComponent(a.hash.slice(1)))).map(a=>a.hash);
        const rawMath=[...document.querySelectorAll('span.math')].map(el=>el.textContent);
        const maths=[...document.querySelectorAll('math')];
        return {
          title:document.title,
          examples:document.querySelectorAll('.example').length,
          equations:document.querySelectorAll('.equation-guide').length,
          paperEquations:document.querySelectorAll('.paper-equation').length,
          mathCount:maths.length,
          renderedMath:maths.every(el=>el.getBoundingClientRect().width>0&&el.getBoundingClientRect().height>0),
          figures:document.querySelectorAll('figure.diagram').length,
          duplicates:ids.filter((id,i)=>ids.indexOf(id)!==i), missing,rawMath,
          pageOverflow:document.documentElement.scrollWidth>window.innerWidth+1,
          sections:document.querySelectorAll('.paper-body > h2').length,
          externalScripts:[...document.scripts].filter(s=>s.src&&!s.src.startsWith(location.origin)).map(s=>s.src),
          brokenImages:[...document.images].filter(img=>!img.complete||img.naturalWidth===0).map(img=>img.src),
          nav:[...document.querySelectorAll('.nav-menu a')].map(a=>({text:a.textContent,href:a.getAttribute('href')})),
          crossLinks:[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')).filter(h=>h.includes('.html#')),
          words:document.querySelector('article').innerText.split(/\s+/).length
        };
      });
      assert(result.duplicates.length===0,`Duplicate IDs: ${JSON.stringify(result.duplicates)}`);
      assert(result.missing.length===0,`Missing local anchors: ${JSON.stringify(result.missing)}`);
      assert(result.rawMath.length===0,'Unrendered TeX math');
      assert(result.renderedMath,'Zero-size math');
      assert(!result.pageOverflow,`Page overflows at ${width}px: ${name}`);
      assert(!result.externalScripts.length,'Unexpected remote script dependency');
      assert(!result.brokenImages.length,'Broken image');
      if(index===0) {
        assert(result.examples===50,'Expected 50 worked examples');
        assert(result.equations===35,'Expected all 35 equation guides');
        assert(result.figures===5,'Expected five explanatory figures');
        const enoughExamples=await page.locator('.equation-guide').evaluateAll(cards=>cards.every(card=>card.querySelectorAll('li').length>=2));
        assert(enoughExamples,'Missing sentence examples for equation');
      } else {
        assert(result.paperEquations===35,'Expected all 35 original display equations');
        assert(result.sections===18,'Expected abstract, 13 sections, 3 appendices, references');
      }
      for(const href of result.crossLinks) {
        const url=new URL(href,page.url());
        const target=path.join(root,decodeURIComponent(url.pathname));
        assert(fs.existsSync(target),`Missing local target ${target}`);
        const targetText=fs.readFileSync(target,'utf8');
        const id=decodeURIComponent(url.hash.slice(1));
        assert(targetText.includes(`id="${id}"`),`Missing cross-page anchor ${href}`);
      }
      if(width===390) {
        const button=page.locator('#mobile-menu');
        await button.click();
        assert(await button.getAttribute('aria-expanded')==='true','Mobile menu did not open');
        assert(await page.locator('.nav-menu').isVisible(),'Mobile menu invisible');
        await page.keyboard.press('Escape');
        assert(await button.getAttribute('aria-expanded')==='false','Mobile menu did not close');
      }
      if(screenshotDirectory) {
        fs.mkdirSync(screenshotDirectory,{recursive:true});
        await page.screenshot({path:path.join(screenshotDirectory,`${index?'paper':'guide'}-${width}-top.png`)});
        await page.locator(index?'#paper-equation-23':'#equation-23').scrollIntoViewIfNeeded();
        await page.screenshot({path:path.join(screenshotDirectory,`${index?'paper':'guide'}-${width}-math.png`)});
        if(index===0) {
          await page.locator('#figure-stack').scrollIntoViewIfNeeded();
          await page.screenshot({path:path.join(screenshotDirectory,`guide-${width}-diagram.png`)});
        }
      }
      checks.push({width,page:name,...result});
    }
    assert(!errors.length,`Browser errors: ${errors.join('; ')}`);
    await context.close();
  }
  const noJs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  const page=await noJs.newPage();
  for(const name of names) {
    await page.goto(`${base}/philosophy/${name}`);
    assert(await page.locator('math[display="block"]').count()===35,'Math disappears without JS');
    assert(await page.locator('h1').count()===1,'Invalid headline hierarchy');
  }
  await noJs.close();
  console.log(JSON.stringify({passed:true,checks},null,2));
} finally { await browser.close(); }
