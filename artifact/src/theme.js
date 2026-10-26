// Manual light/dark switch. It starts from the viewer's own theme (data-theme set by the
// viewer, else the system setting) and switches for this visit only: the page keeps nothing
// (AD-12), so the choice is not stored. The intro stays cream either way.
(function () {
  'use strict';
  const button = document.getElementById('theme-toggle');
  if (!button) return;
  const root = document.documentElement;
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  function isDark() {
    const chosen = root.getAttribute('data-theme');
    if (chosen === 'dark') return true;
    if (chosen === 'light') return false;
    return systemDark.matches;
  }

  function sync() {
    button.setAttribute('aria-pressed', String(isDark()));
  }

  button.addEventListener('click', () => {
    root.setAttribute('data-theme', isDark() ? 'light' : 'dark');
    sync();
  });
  // Stay in step if the viewer's theme or the system setting changes while the page is open.
  systemDark.addEventListener('change', sync);
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  sync();
})();
