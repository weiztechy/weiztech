(() => {
  'use strict';
  const root = document.documentElement;
  const button = document.getElementById('theme-toggle');
  const meta = document.querySelector('meta[name="theme-color"]');
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
  // Larger text, remembered per browser.
  const textButton = document.getElementById('text-toggle');
  function applyText(large, persist) {
    if (large) root.dataset.text = 'large'; else delete root.dataset.text;
    textButton?.setAttribute('aria-pressed', String(large));
    textButton?.setAttribute('aria-label', large ? 'Normale Schrift aktivieren' : 'Größere Schrift aktivieren');
    if (persist) { try { localStorage.setItem('weiztech-text', large ? 'large' : 'normal'); } catch {} }
  }
  applyText(root.dataset.text === 'large', false);
  textButton?.addEventListener('click', () => applyText(root.dataset.text !== 'large', true));

  function apply(theme, persist) {
    root.dataset.theme = theme;
    if (meta) meta.content = theme === 'dark' ? '#0d0e10' : '#ffffff';
    button?.setAttribute('aria-pressed', String(theme === 'dark'));
    button?.setAttribute('aria-label', theme === 'dark' ? 'Helles Design aktivieren' : 'Dunkles Design aktivieren');
    if (persist) { try { localStorage.setItem('weiztech-theme', theme); } catch {} }
  }
  apply(root.dataset.theme === 'dark' ? 'dark' : 'light', false);
  button?.addEventListener('click', () => apply(root.dataset.theme === 'dark' ? 'light' : 'dark', true));
})();
