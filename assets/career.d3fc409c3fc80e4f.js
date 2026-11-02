/* Progressive enhancement: every chapter and project remains accessible without JS. */
(() => {
  'use strict';
  document.querySelectorAll('[data-timeline]').forEach(timeline => {
    const filters = timeline.querySelector('.timeline-filters');
    const buttons = [...timeline.querySelectorAll('[data-timeline-filter]')];
    const items = [...timeline.querySelectorAll('.timeline-item')];
    const history = timeline.querySelector('.timeline-history');
    const feedback = timeline.querySelector('.timeline-feedback');
    if (!filters || !history) return;
    filters.hidden = false;
    let historyWasOpen = history.open;
    let activeFilter = 'all';
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const filter = button.dataset.timelineFilter;
        if (filter === activeFilter) return;
        if (activeFilter === 'all') historyWasOpen = history.open;
        activeFilter = filter;
        buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
        let count = 0;
        items.forEach(item => {
          const visible = filter === 'all' || item.dataset.kind === filter;
          item.hidden = !visible;
          if (visible) count += 1;
        });
        const earlierMatches = [...history.querySelectorAll('.timeline-item')].some(item => !item.hidden);
        history.hidden = !earlierMatches;
        history.open = filter === 'all' ? historyWasOpen : earlierMatches;
        const label = filter === 'all' ? 'All' : button.textContent.trim();
        feedback.textContent = `${label}: ${count} ${count === 1 ? 'chapter' : 'chapters'}.`;
      });
    });
  });

  const projectLinks = [...document.querySelectorAll('.career-jump a')];
  if (projectLinks.length && 'IntersectionObserver' in window) {
    const visible = new Map();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => visible.set(entry.target.id, entry));
      const current = [...visible.values()]
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      projectLinks.forEach(link => {
        if (current && link.hash === `#${current.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-140px 0px -50% 0px', threshold: 0 });
    document.querySelectorAll('.career-entry').forEach(project => observer.observe(project));
  }
})();
