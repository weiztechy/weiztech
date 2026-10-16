(() => {
  'use strict';
  const config = window.WEIZTECH_CONFIG || {};
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const root = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  // Light is the default; an explicit choice is remembered per browser.
  const themeButton = $('#theme-toggle');
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  function currentTheme() { return root.dataset.theme === 'dark' ? 'dark' : 'light'; }
  function applyTheme(theme, persist) {
    root.dataset.theme = theme;
    if (themeMeta) themeMeta.content = theme === 'dark' ? '#0d0e10' : '#ffffff';
    if (themeButton) {
      themeButton.setAttribute('aria-pressed', String(theme === 'dark'));
      themeButton.setAttribute('aria-label', theme === 'dark' ? 'Helles Design aktivieren' : 'Dunkles Design aktivieren');
    }
    if (persist) { try { localStorage.setItem('weiztech-theme', theme); } catch {} }
    document.dispatchEvent(new CustomEvent('weiztech:theme', { detail: { theme } }));
  }
  applyTheme(currentTheme(), false);
  themeButton?.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    const swap = () => applyTheme(next, true);
    if (document.startViewTransition && !reducedMotion.matches) document.startViewTransition(swap);
    else swap();
  });

  // Mobile navigation supports keyboard focus and Escape.
  const menuButton = $('.menu-toggle');
  const nav = $('#main-nav');
  function setMenu(open, restoreFocus = false) {
    if (!menuButton || !nav) return;
    nav.classList.toggle('open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    if (restoreFocus) menuButton.focus();
  }
  menuButton?.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('click', event => {
    if (!nav?.contains(event.target) && !menuButton?.contains(event.target)) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav?.classList.contains('open')) setMenu(false, true);
  });
  nav?.addEventListener('focusout', event => {
    if (event.relatedTarget && !nav.contains(event.relatedTarget) && event.relatedTarget !== menuButton) setMenu(false);
  });
  matchMedia('(max-width: 960px)').addEventListener('change', () => setMenu(false));

  // Preserve the existing public contact configuration and backend contract.
  const email = config.email || 'weiztech@proton.me';
  if ($('#email-link')) $('#email-link').href = `mailto:${email}`;
  if ($('#email-display')) $('#email-display').textContent = email;
  (Array.isArray(config.phones) ? config.phones.slice(0, 2) : []).forEach((phone, index) => {
    const link = $(`#phone-link-${index + 1}`);
    const display = $(`#phone-display-${index + 1}`);
    if (phone?.link && link) link.href = `tel:${phone.link}`;
    if (phone?.display && display) display.textContent = phone.display;
  });
  $$('[data-topic]').forEach(link => link.addEventListener('click', () => {
    if ($('#topic')) $('#topic').value = link.dataset.topic;
  }));

  // Price estimate.
  let duration = 30;
  const area = $('#service-area');
  function updateEstimate() {
    const total = 35 + ((duration - 30) / 30) * 20;
    const outside = area?.value === 'outside';
    if (!$('#price-total')) return;
    $('#price-duration').textContent = duration === 30 ? 'für die ersten 30 Minuten' : `für ${duration} Minuten Arbeitszeit`;
    $('.price-old').hidden = duration !== 30;
    document.dispatchEvent(new CustomEvent('weiztech:estimate', { detail: { total, duration } }));
    $('#estimate-description').textContent = `${duration} Minuten Arbeitszeit`;
    $('#estimate-total').textContent = `${total} €`;
    $('#travel-description').textContent = outside ? 'Zusätzliche Anfahrt' : 'Anfahrt in Weiz';
    $('#travel-total').textContent = outside ? 'nach Vereinbarung' : 'inklusive';
    $('#estimate-note').textContent = outside
      ? 'Unverbindliches Rechenbeispiel zuzüglich Anfahrt. Die Anfahrtskosten klären wir vorab. Abrechnung nach tatsächlicher Arbeitszeit in angefangenen 30 Minuten.'
      : 'Unverbindliches Rechenbeispiel. Abgerechnet wird nach tatsächlicher Arbeitszeit in angefangenen 30 Minuten.';
    $$('[data-duration]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.duration) === duration)));
  }
  $$('[data-duration]').forEach(button => button.addEventListener('click', () => {
    duration = Number(button.dataset.duration);
    updateEstimate();
  }));
  area?.addEventListener('change', updateEstimate);
  $('#estimate-cta')?.addEventListener('click', () => {
    const location = $('#location');
    if (area?.value === 'weiz' && location && !location.value.trim()) location.value = 'Weiz';
  });

  // Keep mobile actions clear of the enquiry form.
  if ('IntersectionObserver' in window) {
    const cta = $('.mobile-cta');
    const contact = $('#kontakt');
    if (cta && contact) new IntersectionObserver(entries => {
      cta.classList.toggle('is-hidden', entries[0].isIntersecting);
    }, { threshold: 0 }).observe(contact);
  }

  // Enquiry form.
  const form = $('#contact-form');
  const status = $('#form-status');
  const submitButton = form?.querySelector('button[type="submit"]');
  const fallback = $('#email-fallback');
  let formStartedAt = Date.now();
  let submitting = false;
  function setStatus(message, success = false) {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('success', success);
  }
  function backendIsConfigured() {
    try {
      return new URL(config.backendUrl).protocol === 'https:' && !config.backendUrl.includes('YOUR_PROJECT_REF');
    } catch { return false; }
  }
  function prepareEmail(payload) {
    if (!fallback) return;
    const subject = `WeizTech Anfrage: ${payload.topic}`;
    const body = `Name: ${payload.name}\nTelefon: ${payload.phone}\nE-Mail: ${payload.email}\nOrt: ${payload.location}\nThema: ${payload.topic}\n\n${payload.message}`;
    fallback.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    fallback.hidden = false;
  }
  if (!backendIsConfigured() && $('#form-hint')) {
    $('#form-hint').textContent = 'Direktes Senden ist derzeit nicht verfügbar. Sie können Ihre Anfrage hier vorbereiten und anschließend in Ihrem E-Mail-Programm öffnen.';
    if (submitButton) submitButton.textContent = 'E-Mail-Anfrage vorbereiten';
  }
  // Mark fields invalid only after the visitor has interacted with them.
  form?.querySelectorAll('input[required], select[required], textarea[required]').forEach(field => {
    if (field.type === 'checkbox') return;
    const check = () => field.setAttribute('aria-invalid', String(!field.checkValidity()));
    field.addEventListener('blur', () => { if (field.value.trim() || field.dataset.touched) { field.dataset.touched = '1'; check(); } });
    field.addEventListener('input', () => { if (field.dataset.touched) check(); });
  });
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitting) return;
    setStatus('');
    if (!form.checkValidity()) {
      const invalid = [...form.elements].filter(el => el.willValidate && !el.checkValidity());
      invalid.forEach(el => { if (el.type !== 'checkbox') { el.dataset.touched = '1'; el.setAttribute('aria-invalid', 'true'); } });
      form.reportValidity();
      return;
    }
    const data = new FormData(form);
    const value = key => String(data.get(key) || '').trim();
    const payload = {
      name: value('name'), phone: value('phone'), email: value('email'),
      location: value('location'), topic: value('topic'), message: value('message'),
      consent: data.get('consent') === 'on', website: value('website'), startedAt: formStartedAt
    };
    if (payload.website) return;
    for (const field of ['name', 'phone', 'location', 'topic', 'message']) {
      if (!payload[field]) {
        setStatus('Bitte füllen Sie alle Pflichtfelder aus.');
        form.elements.namedItem(field)?.focus();
        return;
      }
    }
    if (!payload.consent) {
      setStatus('Bitte bestätigen Sie die Verwendung Ihrer Angaben zur Bearbeitung der Anfrage.');
      return;
    }
    if (!backendIsConfigured()) {
      prepareEmail(payload);
      setStatus('Ihre Anfrage ist vorbereitet, aber noch nicht gesendet. Öffnen Sie den E-Mail-Link unten und senden Sie die Nachricht in Ihrem E-Mail-Programm.');
      return;
    }
    submitting = true;
    submitButton.disabled = true;
    form.setAttribute('aria-busy', 'true');
    const originalContent = submitButton.innerHTML;
    submitButton.textContent = 'Anfrage wird gesendet …';
    if (fallback) fallback.hidden = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(config.backendUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), signal: controller.signal
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success !== true) throw new Error('submission-failed');
      const number = result.requestNumber ? ` Ihre Anfragenummer: #${String(result.requestNumber)}.` : '';
      setStatus(`Vielen Dank! Ihre Anfrage ist bei uns eingegangen.${number} Wir melden uns persönlich, um einen Termin zu vereinbaren.`, true);
      form.reset();
      form.querySelectorAll('[aria-invalid]').forEach(el => { el.removeAttribute('aria-invalid'); delete el.dataset.touched; });
      formStartedAt = Date.now();
    } catch (error) {
      prepareEmail(payload);
      setStatus(error?.name === 'AbortError'
        ? 'Die Bestätigung dauert zu lange. Möglicherweise ist Ihre Anfrage bereits eingegangen. Bitte kontaktieren Sie uns telefonisch oder per E-Mail, bevor Sie erneut senden.'
        : 'Wir konnten den Eingang Ihrer Anfrage nicht bestätigen. Ihre Angaben bleiben erhalten. Bitte versuchen Sie es später erneut oder kontaktieren Sie uns per Telefon oder E-Mail.');
    } finally {
      window.clearTimeout(timeout);
      submitting = false;
      submitButton.disabled = false;
      submitButton.innerHTML = originalContent;
      form.setAttribute('aria-busy', 'false');
      status?.focus({ preventScroll: true });
    }
  });

  // Gentle reveal on scroll; content is visible without JavaScript.
  const revealElements = $$('.section-head, .service-card, .callout, .step, .pricing-copy, .price-card, .map-card, .about-copy, .faq-intro, .accordion, .contact-copy, .contact-form, .overview-grid');
  if ('IntersectionObserver' in window && !reducedMotion.matches && !root.classList.contains('motion-paused')) {
    revealElements.forEach(el => {
      if (el.getBoundingClientRect().top < innerHeight) return;
      el.classList.add('reveal');
      const siblings = [...el.parentElement.children].filter(child => child.classList.contains(el.classList[0]));
      const index = siblings.indexOf(el);
      if (siblings.length > 1) el.style.setProperty('--reveal-delay', `${(index % 3) * 80}ms`);
    });
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0 });
    revealElements.forEach(el => { if (el.classList.contains('reveal')) observer.observe(el); });
  }

  // Native scrolling remains interruptible; anchor targets receive keyboard focus.
  $$('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
    const href = link.getAttribute('href');
    if (href === '#') return;
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    event.preventDefault();
    setMenu(false);
    const behavior = reducedMotion.matches ? 'auto' : 'smooth';
    if (href === '#top') window.scrollTo({ top: 0, behavior });
    else target.scrollIntoView({ behavior, block: 'start' });
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    history.pushState(null, '', href);
  }));

  // Header border and current-section highlighting.
  const header = $('.site-header');
  const navLinks = $$('#main-nav a:not(.button)');
  const sections = navLinks.map(link => document.getElementById(link.getAttribute('href').slice(1))).filter(Boolean);
  let scrollPending = false;
  function onScroll() {
    scrollPending = false;
    header?.classList.toggle('scrolled', scrollY > 8);
    const line = innerHeight * 0.35;
    let current = null;
    sections.forEach(section => { if (section.getBoundingClientRect().top <= line) current = section.id; });
    navLinks.forEach(link => {
      const active = link.getAttribute('href') === `#${current}`;
      link.classList.toggle('is-current', active);
      if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    });
  }
  addEventListener('scroll', () => { if (!scrollPending) { scrollPending = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
})();
