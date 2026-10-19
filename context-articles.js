/* Content and maths remain readable without JavaScript. Only mobile navigation needs it. */
(() => {
  const toggle = document.getElementById('mobile-menu');
  const menu = document.querySelector('.article-site-nav .nav-menu');
  if (!toggle || !menu) return;
  const setOpen = (open) => {
    menu.classList.toggle('active', open);
    toggle.classList.toggle('is-active', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });
})();
