/* Progressive reader helpers; text, math and contents never depend on JavaScript. */
(() => {
  const article = document.querySelector('.reader-page article');
  if (!article) return;
  const progress = document.querySelector('.reader-progress > span');
  const toc = document.querySelector('.reader-sidebar .reading-toc');
  const links = [...document.querySelectorAll('.reader-sidebar a[href^="#"]')];
  const headings = links.map(link => document.getElementById(decodeURIComponent(link.hash.slice(1)))).filter(Boolean);
  const compact = window.matchMedia('(max-width: 800px)');
  if (toc) {
    toc.open = !compact.matches;
    compact.addEventListener('change', () => { toc.open = !compact.matches; });
    links.forEach(link => link.addEventListener('click', () => { if (compact.matches) toc.open = false; }));
  }

  let queued = false;
  const update = () => {
    queued = false;
    const start = article.getBoundingClientRect().top + window.scrollY - 100;
    const range = Math.max(1, article.offsetHeight - window.innerHeight + 100);
    if (progress) progress.style.transform = `scaleX(${Math.max(0, Math.min(1, (window.scrollY - start) / range))})`;
    let active = -1;
    for (let i = 0; i < headings.length; i++) {
      if (headings[i].getBoundingClientRect().top <= 150) active = i;
      else break;
    }
    links.forEach((link, index) => {
      if (index === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', schedule, { passive:true });
  window.addEventListener('resize', schedule, { passive:true });
  window.addEventListener('load', update, { once:true });
  update();

  const copyButton = document.querySelector('[data-copy-article]');
  const status = document.querySelector('.reader-copy-status');
  let statusTimeout;
  if (copyButton && navigator.clipboard?.writeText) {
    copyButton.hidden = false;
    copyButton.addEventListener('click', async () => {
      const url = document.querySelector('link[rel="canonical"]')?.href || location.href.split('#')[0];
      try {
        await navigator.clipboard.writeText(url);
        status.textContent = 'Link copied';
      } catch {
        status.textContent = 'Copy the URL from your address bar';
      }
      clearTimeout(statusTimeout);
      statusTimeout = setTimeout(() => { status.textContent = ''; }, 4000);
    });
  }
})();
