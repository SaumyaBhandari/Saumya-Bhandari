/* Progressive enhancement: every chapter and project remains accessible without JS. */
(() => {
  'use strict';
  document.querySelectorAll('[data-timeline]').forEach(timeline => {
    const map = timeline.querySelector('.life-map');
    const entries = [...timeline.querySelectorAll('.life-entry')];
    const nodes = entries.map(entry => entry.querySelector('[data-life-node]'));
    const cards = entries.map(entry => entry.querySelector('.life-card'));
    const route = timeline.querySelector('.life-route');
    const line = timeline.querySelector('.life-route-line');
    const leader = timeline.querySelector('.life-route-leader');
    const watermark = timeline.querySelector('.life-watermark');
    const status = timeline.querySelector('.life-status');
    const previous = timeline.querySelector('.life-prev');
    const next = timeline.querySelector('.life-next');
    const counter = timeline.querySelector('.life-counter');
    if (!map || !entries.length || nodes.some(node => !node) || cards.some(card => !card)) return;

    const hover = window.matchMedia('(hover: hover) and (pointer: fine)');
    let active = entries.length - 1;
    let pinned = active;
    let cursor = active;
    let points = [];
    let compact = false;
    let cardTop = 12;
    let closing = false;
    let measuredWidth = 0;

    function positionCard() {
      if (active < 0 || !points.length) { leader.setAttribute('d', ''); return; }
      const card = cards[active];
      const point = points[active];
      const left = compact ? 0 : Math.max(0, Math.min(map.clientWidth - card.offsetWidth, point.x - card.offsetWidth / 2));
      card.style.left = `${left}px`;
      card.style.top = `${cardTop}px`;
      card.style.setProperty('--pointer-x', `${point.x - left}px`);
      const bottom = card.offsetTop + card.offsetHeight;
      leader.setAttribute('d', compact ? '' : `M ${point.x} ${bottom + 8} L ${point.x} ${point.y - 13}`);
    }

    function select(index, { pin = false, announce = false, focus = false } = {}) {
      index = Math.max(0, Math.min(entries.length - 1, index));
      active = cursor = index;
      if (pin) pinned = index;
      nodes.forEach((node, i) => {
        node.setAttribute('aria-expanded', String(i === index));
        node.tabIndex = i === index ? 0 : -1;
        cards[i].hidden = i !== index;
      });
      watermark.textContent = entries[index].dataset.year;
      counter.textContent = `${String(index + 1).padStart(2, '0')} / ${entries.length}`;
      previous.disabled = index === 0;
      next.disabled = index === entries.length - 1;
      if (announce) status.textContent = `Chapter ${index + 1} of ${entries.length}: ${cards[index].querySelector('h3').textContent}.`;
      positionCard();
      if (focus) nodes[index].focus({ preventScroll: true });
    }

    function close({ restoreFocus = true } = {}) {
      active = pinned = -1;
      cards.forEach(card => { card.hidden = true; });
      nodes.forEach(node => node.setAttribute('aria-expanded', 'false'));
      leader.setAttribute('d', '');
      if (restoreFocus) {
        closing = true;
        nodes[cursor].focus({ preventScroll: true });
        closing = false;
        status.textContent = 'Chapter closed. Choose another point to keep exploring.';
      }
    }

    function draw() {
      const width = map.clientWidth;
      if (!width) return;
      measuredWidth = width;
      compact = window.matchMedia('(max-width: 899px)').matches;
      // Reserve enough room for every card so switching chapters never shifts the page.
      const hidden = cards.map(card => card.hidden);
      map.classList.add('is-measuring');
      cards.forEach(card => { card.hidden = false; });
      const tallest = Math.max(...cards.map(card => card.offsetHeight));
      cards.forEach((card, i) => { card.hidden = hidden[i]; });
      map.classList.remove('is-measuring');
      const baseline = Math.max(320, tallest + 96);
      const rows = Math.ceil(entries.length / 5);
      cardTop = compact ? rows * 108 + 12 : 12;
      const height = compact ? cardTop + tallest + 12 : baseline + 108;
      map.style.height = `${height}px`;
      route.setAttribute('viewBox', `0 0 ${width} ${height}`);
      points = [];
      if (compact) {
        // Fold the same chronological route into three short horizontal runs.
        let remaining = entries.length;
        Array.from({ length: rows }, (_, row) => {
          const count = Math.ceil(remaining / (rows - row));
          remaining -= count;
          return count;
        }).forEach((count, row) => {
          for (let column = 0; column < count; column++) {
            const step = (width - 48) / Math.max(1, count - 1);
            points.push({ x: 24 + (row % 2 ? count - 1 - column : column) * step, y: 34 + row * 108, row });
          }
        });
      } else {
        entries.forEach((_, index) => points.push({
          x: 54 + index * (width - 108) / (entries.length - 1),
          y: baseline + Math.sin(index * .72 - .4) * 19 + Math.sin(index * 1.28) * 7
        }));
      }
      let path = `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const a = points[i], b = points[i + 1];
        if (compact) {
          if (a.row !== b.row) {
            const side = a.row % 2 ? -1 : 1;
            path += ` C ${a.x + side * 24} ${a.y + 32}, ${b.x + side * 24} ${b.y - 32}, ${b.x} ${b.y}`;
          } else {
            const dx = (b.x - a.x) / 3, bend = i % 2 ? 12 : -12;
            path += ` C ${a.x + dx} ${a.y + bend}, ${b.x - dx} ${b.y - bend}, ${b.x} ${b.y}`;
          }
        } else if (entries[i + 1].id === 'life-together') {
          // A small handwritten loop marks the shared chapter in the journey.
          const dx = b.x - a.x;
          path += ` C ${a.x + dx * .5} ${a.y}, ${a.x + dx * 1.25} ${a.y - 64}, ${a.x + dx * .65} ${a.y - 64}`;
          path += ` C ${a.x + dx * .1} ${a.y - 64}, ${a.x + dx * .5} ${b.y + 28}, ${b.x} ${b.y}`;
        } else {
          const before = points[Math.max(0, i - 1)], after = points[Math.min(points.length - 1, i + 2)];
          path += ` C ${a.x + (b.x - before.x) / 6} ${a.y + (b.y - before.y) / 6}, ${b.x - (after.x - a.x) / 6} ${b.y - (after.y - a.y) / 6}, ${b.x} ${b.y}`;
        }
      }
      line.setAttribute('d', path);
      nodes.forEach((node, i) => {
        node.style.setProperty('--point-x', `${points[i].x}px`);
        node.style.setProperty('--point-y', `${points[i].y}px`);
        node.style.setProperty('--label-width', `${compact ? Math.min(76, (width - 48) / Math.max(1, Math.ceil(entries.length / rows) - 1) - 6) : Math.min(98, (width - 108) / Math.max(1, entries.length - 1) - 6)}px`);
      });
      positionCard();
    }

    nodes.forEach((node, index) => {
      node.addEventListener('pointerenter', event => {
        if (hover.matches && event.pointerType !== 'touch') select(index);
      });
      node.addEventListener('click', () => select(index, { pin: true, announce: true }));
      node.addEventListener('focus', () => { if (!closing) select(index, { pin: true, announce: true }); });
      node.addEventListener('keydown', event => {
        const move = { ArrowLeft: index - 1, ArrowUp: index - 1, ArrowRight: index + 1, ArrowDown: index + 1, Home: 0, End: entries.length - 1 }[event.key];
        if (move === undefined) return;
        event.preventDefault();
        select(move, { pin: true, announce: true, focus: true });
      });
      cards[index].querySelector('.life-card-close').addEventListener('click', () => close());
    });
    map.addEventListener('pointerleave', () => {
      if (!hover.matches || map.contains(document.activeElement)) return;
      if (pinned < 0) close({ restoreFocus: false });
      else select(pinned);
    });
    timeline.addEventListener('keydown', event => {
      if (event.key === 'Escape' && active >= 0) { event.preventDefault(); close(); }
    });
    previous.addEventListener('click', () => select(cursor - 1, { pin: true, announce: true }));
    next.addEventListener('click', () => select(cursor + 1, { pin: true, announce: true }));

    timeline.classList.add('timeline-ready');
    [...nodes, ...timeline.querySelectorAll('.life-card-close,.life-instructions,.life-controls,.life-route,.life-watermark')].forEach(element => { element.hidden = false; element.removeAttribute('hidden'); });
    select(active);
    draw();
    if ('ResizeObserver' in window) {
      new ResizeObserver(() => { if (map.clientWidth !== measuredWidth) draw(); }).observe(map);
    } else window.addEventListener('resize', draw);
    if (document.fonts?.ready) document.fonts.ready.then(draw);
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
