/* Progressive enhancement: the complete article collection is present in HTML. */
(() => {
  const list = document.querySelector('[data-article-list]');
  if (!list) return;

  const cards = [...list.querySelectorAll('.article-card')];
  const controls = document.querySelector('[data-article-controls]');
  const search = document.querySelector('#article-search');
  const sort = document.querySelector('#article-sort');
  const filters = [...document.querySelectorAll('[data-article-filter]')];
  const counter = document.querySelector('[data-article-count]');
  const empty = document.querySelector('[data-article-empty]');
  const reset = document.querySelector('[data-article-reset]');
  const selected = new Set();
  const normalize = value => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  function update() {
    const words = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
    let matches = 0;
    const ordered = [...cards].sort((a, b) => {
      if (sort.value === 'reading') return Number(a.dataset.minutes) - Number(b.dataset.minutes) || Number(a.dataset.order) - Number(b.dataset.order);
      const dates = a.dataset.date.localeCompare(b.dataset.date);
      return (sort.value === 'oldest' ? dates : -dates) || Number(a.dataset.order) - Number(b.dataset.order);
    });

    for (const card of ordered) {
      const tags = card.dataset.tags.split('|');
      const show = (!selected.size || tags.some(tag => selected.has(tag))) && words.every(word => normalize(card.dataset.search).includes(word));
      card.hidden = !show;
      if (show) matches += 1;
      list.append(card);
    }

    for (const filter of filters) {
      const active = filter.dataset.articleFilter === 'All' ? !selected.size : selected.has(filter.dataset.articleFilter);
      filter.classList.toggle('active', active);
      filter.setAttribute('aria-pressed', String(active));
    }
    counter.textContent = `${matches} ${matches === 1 ? 'article' : 'articles'}${matches !== cards.length ? ` of ${cards.length}` : ''}`;
    empty.hidden = matches !== 0;
    reset.hidden = !selected.size && !search.value;
  }

  controls.hidden = false;
  filters.forEach(filter => filter.addEventListener('click', () => {
    const tag = filter.dataset.articleFilter;
    if (tag === 'All') selected.clear();
    else if (selected.has(tag)) selected.delete(tag);
    else selected.add(tag);
    update();
  }));
  search.addEventListener('input', update);
  sort.addEventListener('change', update);
  reset.addEventListener('click', () => {
    selected.clear();
    search.value = '';
    update();
    search.focus();
  });
  const requestedTag = new URLSearchParams(window.location.search).get('tag');
  if (filters.some(filter => filter.dataset.articleFilter === requestedTag && requestedTag !== 'All')) selected.add(requestedTag);
  update();
})();
