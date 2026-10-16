(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let userPaused = false;
  try { userPaused = sessionStorage.getItem('weiztech-motion-paused') === 'true'; } catch {}
  let override = false; // An explicit "play" overrides the OS reduced-motion preference.
  const state = { paused: false, reduced: false };
  window.WEIZTECH_MOTION = state;
  const activeAnimations = new Set();
  function animate(element, frames, options) {
    if (state.paused || state.reduced || !element?.animate) return null;
    const animation = element.animate(frames, options);
    activeAnimations.add(animation);
    animation.finished.catch(() => {}).finally(() => activeAnimations.delete(animation));
    return animation;
  }
  function updateMotion() {
    state.reduced = reduced.matches && !override;
    state.paused = userPaused || state.reduced;
    document.documentElement.classList.toggle('motion-paused', state.paused);
    if (state.paused) {
      activeAnimations.forEach(animation => animation.finish());
      document.querySelectorAll('.reveal').forEach(element => element.classList.add('visible'));
    }
    ['motion-toggle', 'global-motion'].forEach(id => {
      const button = document.getElementById(id);
      if (!button) return;
      button.setAttribute('aria-pressed', String(state.paused));
      button.setAttribute('aria-label', state.paused ? 'Animationen starten' : 'Animationen pausieren');
      const text = button.querySelector('.global-motion-text');
      if (text) text.textContent = state.paused ? 'Animationen starten' : 'Animationen pausieren';
    });
    document.dispatchEvent(new CustomEvent('weiztech:motion', { detail: state }));
  }
  ['motion-toggle', 'global-motion'].forEach(id => document.getElementById(id)?.addEventListener('click', () => {
    if (state.paused) { userPaused = false; if (reduced.matches) override = true; }
    else userPaused = true;
    try { sessionStorage.setItem('weiztech-motion-paused', String(userPaused)); } catch {}
    updateMotion();
  }));
  reduced.addEventListener('change', () => { override = false; updateMotion(); });
  updateMotion();

  // Rolling digits keep the visible total and the accessible value synchronized.
  const price = document.getElementById('price-total');
  let lastPrice = price?.textContent || '35';
  let priceAnimations = [];
  const segmented = document.querySelector('.segmented');
  document.addEventListener('weiztech:estimate', event => {
    const index = [30, 60, 90, 120].indexOf(event.detail.duration);
    segmented?.style.setProperty('--duration-index', String(Math.max(0, index)));
    if (!price) return;
    const next = String(event.detail.total);
    if (next === lastPrice) return;
    priceAnimations.forEach(animation => animation?.cancel()); priceAnimations = [];
    const previous = lastPrice.padStart(next.length, ' ').slice(-next.length), increasing = Number(next) > Number(lastPrice);
    lastPrice = next;
    if (state.paused || state.reduced || event.detail.instant) { price.textContent = next; return; }
    const accessible = document.createElement('span'); accessible.className = 'price-accessible'; accessible.textContent = next;
    const visual = document.createElement('span'); visual.className = 'price-digits'; visual.setAttribute('aria-hidden', 'true');
    [...next].forEach((digit, index) => {
      const old = previous[index] || ' ', windowEl = document.createElement('span'); windowEl.className = 'digit-window';
      const reel = document.createElement('span'); reel.className = 'digit-reel';
      const changed = old !== digit;
      const values = changed ? (increasing ? [old, digit] : [digit, old]) : [digit];
      values.forEach(value => { const glyph = document.createElement('span'); glyph.textContent = value === ' ' ? ' ' : value; reel.appendChild(glyph); });
      reel.style.transform = changed && increasing ? 'translateY(-50%)' : 'translateY(0)'; windowEl.appendChild(reel); visual.appendChild(windowEl);
      if (changed) priceAnimations.push(animate(reel, [{ transform: increasing ? 'translateY(0)' : 'translateY(-50%)' }, { transform: increasing ? 'translateY(-50%)' : 'translateY(0)' }], { duration: 460, delay: index * 35, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }));
    });
    price.replaceChildren(accessible, visual);
    animate(document.getElementById('estimate-total'), [{ opacity: .45 }, { opacity: 1 }], { duration: 260 });
  });

  // Native disclosures remain usable with JavaScript disabled.
  const disclosures = new Map();
  document.querySelectorAll('.accordion details').forEach(detail => {
    const summary = detail.querySelector('summary');
    const content = document.createElement('div');
    content.className = 'details-content';
    [...detail.children].filter(child => child !== summary).forEach(child => content.appendChild(child));
    detail.appendChild(content);
    let animation = null, contentAnimation = null, closing = false, generation = 0;
    function setOpen(open) {
      const startHeight = detail.getBoundingClientRect().height;
      const currentGeneration = ++generation;
      animation?.cancel(); contentAnimation?.cancel(); animation = null;
      closing = !open;
      if (state.paused || state.reduced) { detail.open = open; closing = false; return; }
      detail.open = true;
      const endHeight = open ? detail.getBoundingClientRect().height : summary.getBoundingClientRect().height;
      animation = animate(detail, [{ height: `${startHeight}px` }, { height: `${endHeight}px` }], { duration: open ? 380 : 280, easing: 'cubic-bezier(.2,.7,.2,1)' });
      contentAnimation = animate(content, open ? [{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'translateY(0)' }] : [{ opacity: 1 }, { opacity: 0 }], { duration: open ? 320 : 180, easing: 'ease-out' });
      if (!animation) { detail.open = open; closing = false; return; }
      animation.onfinish = () => { if (currentGeneration !== generation) return; detail.open = open; closing = false; animation = null; };
    }
    disclosures.set(detail, setOpen);
    summary.addEventListener('click', event => {
      event.preventDefault();
      const wasOpen = detail.open && !closing;
      if (!wasOpen) document.querySelectorAll('.accordion details').forEach(other => { if (other !== detail && other.open) disclosures.get(other)?.(false); });
      setOpen(!wasOpen);
    });
  });

  // The process line fills as the steps scroll into view.
  let pending = false;
  const steps = document.querySelector('.steps');
  function updateScroll() {
    pending = false;
    if (!steps) return;
    const rect = steps.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (innerHeight * .85 - rect.top) / Math.max(1, rect.height + innerHeight * .2)));
    steps.style.setProperty('--process-progress', String(state.paused ? 1 : progress));
  }
  addEventListener('scroll', () => { if (!pending) { pending = true; requestAnimationFrame(updateScroll); } }, { passive: true });
  addEventListener('resize', updateScroll);
  document.addEventListener('weiztech:motion', updateScroll);
  updateScroll();
})();
