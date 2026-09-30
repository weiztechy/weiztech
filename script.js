(() => {
  'use strict';
  const config = window.WEIZTECH_CONFIG || {};
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

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
  $$('#main-nav a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('click', event => {
    if (!nav?.contains(event.target) && !menuButton?.contains(event.target)) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav?.classList.contains('open')) setMenu(false, true);
  });
  nav?.addEventListener('focusout', event => {
    if (event.relatedTarget && !nav.contains(event.relatedTarget) && event.relatedTarget !== menuButton) setMenu(false);
  });
  window.matchMedia('(max-width: 900px)').addEventListener('change', () => setMenu(false));

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

  let duration = 30;
  const area = $('#service-area');
  function updateEstimate() {
    const total = 35 + ((duration - 30) / 30) * 20;
    const outside = area?.value === 'outside';
    if (!$('#price-total')) return;
    $('#price-total').textContent = total;
    $('#price-duration').textContent = duration === 30 ? 'für die ersten 30 Minuten' : `für ${duration} Minuten Arbeitszeit`;
    $('.price-old').hidden = duration !== 30;
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


  // Subtle orange page glow that increases with scroll depth.
  const updateScrollProgress = () => {
    const scrollRange = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, window.scrollY / scrollRange));
    document.documentElement.style.setProperty('--scroll-progress', progress.toFixed(3));
  };
  updateScrollProgress();
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('resize', updateScrollProgress);

  // Keep mobile actions clear of the enquiry form.
  if ('IntersectionObserver' in window) {
    const cta = $('.mobile-cta');
    const contact = $('#kontakt');
    if (cta && contact) new IntersectionObserver(entries => {
      cta.classList.toggle('is-hidden', entries[0].isIntersecting);
    }, { threshold: 0 }).observe(contact);
  }

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
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitting) return;
    setStatus('');
    if (!form.reportValidity()) return;
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

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const revealElements = $$('.section-heading, .service-card, .pricing-copy, .price-calculator, .steps-grid article, .local-graphic, .about-copy, .faq-grid > div, .contact-copy, .contact-form, .connection-grid > div');
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    revealElements.forEach((el, i) => { el.classList.add('reveal'); el.style.setProperty('--reveal-delay', `${el.classList.contains('service-card') ? (i % 3) * 70 : 0}ms`); });
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    }), {threshold: .08});
    revealElements.forEach(el => observer.observe(el));
    reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) revealElements.forEach(el => el.classList.add('visible')); });
  }
  // Native scrolling remains interruptible; anchor targets receive keyboard focus.
  $$('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
    const href = link.getAttribute('href');
    if (href === '#') return;
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    event.preventDefault();
    setMenu(false);
    if (href === '#top') window.scrollTo({top:0, behavior:reducedMotion.matches ? 'instant' : 'smooth'});
    else target.scrollIntoView({behavior: reducedMotion.matches ? 'instant' : 'smooth', block:'start'});
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex','-1');
    target.focus({preventScroll:true});
    history.pushState(null, '', href);
  }));
  // Lightweight progress and depth; no scroll hijacking.
  let scrollPending = false;
  const progressBar = $('.reading-progress');
  function updateDepth() {
    scrollPending = false;
    const progress = window.scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
    if (progressBar) progressBar.style.transform = `scaleX(${progress})`;
    $('.site-header')?.classList.toggle('scrolled', scrollY > 40);
    if (!reducedMotion.matches) $('.connection-art')?.style.setProperty('--spin', `${scrollY * .018}deg`);
  }
  window.addEventListener('scroll', () => { if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateDepth); } }, {passive:true});
  updateDepth();
  // One FAQ at a time, using accessible native details controls.
  $$('.accordion details').forEach(detail => detail.addEventListener('toggle', () => {
    if (detail.open) $$('.accordion details').forEach(other => { if (other !== detail) other.open = false; });
  }));
  if (matchMedia('(pointer:fine)').matches) {
    $$('.service-card').forEach(card => {
      card.addEventListener('pointermove', event => {
        if (reducedMotion.matches) return;
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--pointer-x', `${event.clientX - rect.left}px`);
        card.style.setProperty('--pointer-y', `${event.clientY - rect.top}px`);
      }, {passive:true});
    });
  }
})();
