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
  // WhatsApp links follow config.whatsapp; without a number they are removed.
  const whatsapp = String(config.whatsapp || '').replace(/\D/g, '');
  $$('[data-whatsapp]').forEach(link => {
    if (!whatsapp) { link.remove(); return; }
    link.href = `https://wa.me/${whatsapp}?text=${encodeURIComponent('Hallo WeizTech, ich brauche Hilfe bei: ')}`;
  });
  if (!whatsapp) $('.mobile-cta')?.classList.add('mobile-cta-two');
  $$('[data-topic]').forEach(link => link.addEventListener('click', () => {
    if ($('#topic')) $('#topic').value = link.dataset.topic;
  }));

  // Prices come from config.js; the seasonal offer ends on its own (see the inline check in <head>).
  const promoActive = !root.classList.contains('promo-ended');
  const prices = { first30: Number(config.prices?.first30) || 45, extra30: Number(config.prices?.extra30) || 20 };
  const firstPrice = promoActive && config.promo?.first30 ? Number(config.promo.first30) : prices.first30;
  const priceFor = minutes => firstPrice + Math.max(0, Math.ceil((minutes - 30) / 30)) * prices.extra30;
  window.WEIZTECH_PRICES = { priceFor, promoActive };

  // Price estimate.
  let duration = 30;
  const area = $('#service-area');
  function updateEstimate(instant = false) {
    const total = priceFor(duration);
    const outside = area?.value === 'outside';
    if (!$('#price-total')) return;
    $('#price-duration').textContent = duration === 30 ? 'für die ersten 30 Minuten' : `für ${duration} Minuten Arbeitszeit`;
    $('.price-old').hidden = duration !== 30;
    document.dispatchEvent(new CustomEvent('weiztech:estimate', { detail: { total, duration, instant } }));
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
  area?.addEventListener('change', () => updateEstimate());
  updateEstimate(true);
  window.WEIZTECH_SET_DURATION = minutes => { if ([30, 60, 90, 120].includes(minutes)) { duration = minutes; updateEstimate(); } };
  $('#estimate-cta')?.addEventListener('click', () => {
    const location = $('#location');
    if (area?.value === 'weiz' && location && !location.value.trim()) location.value = 'Weiz';
  });

  // "Was ist los?" helper. Durations are rough guide values in minutes; edit freely.
  const problems = [
    { label: 'Computer ist langsam', icon: 'i-laptop', topic: 'PC oder Laptop', min: 30, max: 60,
      text: 'Oft stecken Autostart-Programme, ein voller Speicher oder fehlende Updates dahinter. Wir prüfen das Gerät, räumen auf und sagen ehrlich, ob sich ein Aufrüsten lohnt.' },
    { label: 'Fehlermeldung oder startet nicht', icon: 'i-alert', topic: 'PC oder Laptop', min: 30, max: 60,
      text: 'Fotografieren Sie die Meldung, wenn möglich. Wir finden die Ursache vor Ort und erklären, was zu tun ist. Ist eine Werkstatt nötig, sagen wir es offen.' },
    { label: 'WLAN schwach oder bricht ab', icon: 'i-wifi', topic: 'WLAN oder Internet', min: 30, max: 60,
      text: 'Wir prüfen Router-Standort, Funkkanal und Einstellungen und verbinden Ihre Geräte neu. Bei großen Wohnungen beraten wir zu Repeatern oder Mesh-Systemen.' },
    { label: 'Drucker druckt nicht', icon: 'i-printer', topic: 'Drucker oder Zubehör', min: 30, max: 30,
      text: 'Meist liegt es an der Verbindung oder am Treiber. Wir richten den Drucker neu ein – auf Wunsch auch fürs Drucken vom Handy.' },
    { label: 'Neues Gerät einrichten', icon: 'i-spark', topic: 'Einrichtung', min: 60, max: 90,
      text: 'Wir richten Konto, E-Mail, WLAN und Ihre wichtigsten Programme ein und zeigen Ihnen in Ruhe, wie alles funktioniert.' },
    { label: 'Daten aufs neue Gerät', icon: 'i-transfer', topic: 'Datenübertragung', min: 60, max: 120,
      text: 'Fotos, Dokumente, Kontakte: Wir übertragen alles Wichtige und prüfen gemeinsam mit Ihnen, dass nichts fehlt. Die Dauer hängt von der Datenmenge ab.' },
    { label: 'Verdächtige Nachricht oder Virus?', icon: 'i-shield', topic: 'Anderes', min: 30, max: 60, urgent: true,
      text: 'Geben Sie keine Passwörter oder Codes ein und rufen Sie keine Nummern aus der Nachricht zurück. Wir prüfen Ihr Gerät und zeigen, woran man Betrugsversuche erkennt.' },
    { label: 'Welches Gerät soll ich kaufen?', icon: 'i-cart', topic: 'Kaufberatung', min: 30, max: 60,
      text: 'Wir klären, wofür Sie das Gerät brauchen, und empfehlen passende Modelle – unabhängig und ohne Verkaufsdruck.' },
    // Business problems ("Im Betrieb"). min/max null = individual offer.
    { group: 'business', label: 'Neuer Arbeitsplatz für Mitarbeiter', icon: 'i-laptop', topic: 'Einrichtung', min: 60, max: 120,
      text: 'Wir bereiten den Computer vor, legen Konten an, richten E-Mail, Drucker und Programme ein – damit der erste Arbeitstag nicht mit Technikproblemen beginnt.' },
    { group: 'business', label: 'Büro-WLAN oder Netzwerk instabil', icon: 'i-network', topic: 'WLAN oder Internet', min: 60, max: 120,
      text: 'Wir messen, wo das Signal schwach ist, prüfen Router und Verkabelung und trennen auf Wunsch das Gäste-WLAN vom Firmennetz.' },
    { group: 'business', label: 'Kein oder unsicheres Backup', icon: 'i-database', topic: 'Anderes', min: 60, max: 120,
      text: 'Wir richten automatische Sicherungen ein, testen die Wiederherstellung und zeigen Ihnen, wie Sie prüfen, ob das Backup läuft.' },
    { group: 'business', label: 'Firmen-E-Mail oder eigene Domain', icon: 'i-mail', topic: 'Einrichtung', min: 60, max: 90,
      text: 'E-Mail-Adressen mit Ihrer Domain, gemeinsame Kalender und Kontakte – eingerichtet auf allen Geräten im Team.' },
    { group: 'business', label: 'Drucker oder Scanner im Büro', icon: 'i-printer', topic: 'Drucker oder Zubehör', min: 30, max: 60,
      text: 'Wir binden den Drucker ins Netzwerk ein, damit alle drucken können, und richten Scannen direkt in Ordner oder E-Mail ein.' },
    { group: 'business', label: 'Phishing-Mail geöffnet?', icon: 'i-shield', topic: 'Anderes', min: 30, max: 60, urgent: true,
      text: 'Ändern Sie nichts überstürzt und geben Sie keine weiteren Daten ein. Wir prüfen betroffene Geräte und Konten, sichern Zugänge ab und schulen Ihr Team auf Wunsch.' },
    { group: 'business', label: 'Neue Hardware für den Betrieb', icon: 'i-cart', topic: 'Kaufberatung', min: 30, max: 60,
      text: 'Wir klären, was Ihr Betrieb wirklich braucht, vergleichen Angebote und richten die neuen Geräte anschließend ein.' },
    { group: 'business', label: 'Laufende IT-Betreuung', icon: 'i-calendar', topic: 'Anderes', min: null, max: null,
      text: 'Regelmäßige Checks von Backups und Updates, bevorzugte Termine und feste Ansprechpartner. Umfang und Preis vereinbaren wir individuell.' }
  ];
  let finderMode = 'home';
  const finderOptions = $('#finder-options');
  const finderResult = $('#finder-result');
  const icon = id => `<svg class="icon" aria-hidden="true"><use href="#${id}"/></svg>`;
  const escapeHtml = text => text.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const minutesText = (a, b) => a === b ? `ca. ${a} Minuten` : `ca. ${a}–${b} Minuten`;
  const euroText = (a, b) => a === b ? `${a} €` : `${a}–${b} €`;
  function goTo(id, focusEl) {
    const target = document.getElementById(id);
    target?.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
    if (focusEl) setTimeout(() => focusEl.focus({ preventScroll: true }), reducedMotion.matches ? 0 : 600);
  }
  function showProblem(index) {
    const p = problems[index];
    $$('#finder-options button').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.problem) === index)));
    const individual = p.min == null;
    const phone = config.phones?.[0] || { display: '0650 709 25 27', link: '+436507092527' };
    finderResult.innerHTML = `
      <div class="finder-card">
        <span class="finder-card-icon${p.urgent ? ' is-urgent' : ''}">${icon(p.icon)}</span>
        <h3>${escapeHtml(p.label)}</h3>
        <p>${escapeHtml(p.text)}</p>
        ${p.urgent ? `<a class="finder-urgent" href="tel:${escapeHtml(phone.link)}">${icon('i-phone')}<span><strong>Dringend?</strong> Rufen Sie uns direkt an: ${escapeHtml(phone.display)}</span></a>` : ''}
        <dl class="finder-facts">
          <div><dt>${icon('i-clock')} Richtwert</dt><dd>${individual ? 'Nach Bedarf' : minutesText(p.min, p.max)}</dd></div>
          <div><dt>${icon('i-tag')} Kosten</dt><dd>${individual ? 'Individuelles Angebot' : euroText(priceFor(p.min), priceFor(p.max))}</dd></div>
        </dl>
        <p class="fine-print">${individual ? 'Wir besprechen gemeinsam, was Ihr Betrieb braucht, und machen Ihnen ein unverbindliches Angebot.' : `Unverbindliche Einschätzung. Abgerechnet wird die tatsächliche Arbeitszeit${area?.value === 'outside' ? ' zuzüglich Anfahrt' : ', Anfahrt in Weiz inklusive'}.`}</p>
        <div class="finder-actions">
          <button type="button" class="button button-primary" data-finder-request>Damit anfragen ${icon('i-arrow')}</button>
          ${individual ? '<a class="button button-secondary" href="unternehmen.html#betreuung">Mehr zur Betreuung</a>' : '<button type="button" class="button button-secondary" data-finder-calc>Im Rechner ansehen</button>'}
        </div>
      </div>`;
    finderResult.querySelector('[data-finder-request]').addEventListener('click', () => {
      const topic = $('#topic'), message = $('#message');
      if (topic) topic.value = p.topic;
      if (p.group === 'business') setRequestType('unternehmen');
      if (message && (!message.value.trim() || message.dataset.prefilled === message.value)) {
        message.value = `Problem: ${p.label}\n`;
        message.dataset.prefilled = message.value;
      }
      goTo('kontakt', message);
    });
    finderResult.querySelector('[data-finder-calc]')?.addEventListener('click', () => {
      window.WEIZTECH_SET_DURATION?.(p.min);
      goTo('preise', document.querySelector(`[data-duration="${p.min}"]`));
    });
  }
  const finderEmpty = finderResult?.innerHTML;
  function renderFinder() {
    finderOptions.innerHTML = problems
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => (p.group || 'home') === finderMode)
      .map(({ p, i }) => `<button type="button" aria-pressed="false" data-problem="${i}">${icon(p.icon)}<span>${escapeHtml(p.label)}</span></button>`).join('');
    finderResult.innerHTML = finderEmpty;
    $$('[data-finder-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.finderMode === finderMode)));
    $('.finder-mode')?.style.setProperty('--mode-index', finderMode === 'business' ? '1' : '0');
  }
  if (finderOptions && finderResult) {
    renderFinder();
    finderOptions.addEventListener('click', event => {
      const button = event.target.closest('[data-problem]');
      if (button) showProblem(Number(button.dataset.problem));
    });
    $$('[data-finder-mode]').forEach(b => b.addEventListener('click', () => {
      if (finderMode === b.dataset.finderMode) return;
      finderMode = b.dataset.finderMode; renderFinder();
    }));
  }

  // Who the enquiry is for. It travels inside the message, like the callback time.
  function setRequestType(type) {
    const radio = document.querySelector(`input[name="requestType"][value="${type}"]`);
    if (!radio) return;
    radio.checked = true;
    updateRequestType();
  }
  function updateRequestType() {
    const type = document.querySelector('input[name="requestType"]:checked')?.value || 'privat';
    const orgField = $('#org-field');
    if (orgField) orgField.hidden = type === 'privat';
    const orgLabel = $('#org-label');
    if (orgLabel) orgLabel.textContent = type === 'verein' ? 'Name des Vereins' : 'Name des Betriebs';
  }
  $$('input[name="requestType"]').forEach(radio => radio.addEventListener('change', updateRequestType));
  const requested = new URLSearchParams(location.search).get('anfrage');
  if (requested === 'unternehmen' || requested === 'verein') setRequestType(requested);
  else updateRequestType();

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
    // Preferred callback time travels inside the message so the backend payload stays unchanged.
    const requestType = value('requestType');
    if (requestType && requestType !== 'privat' && payload.message) {
      const org = value('organisation');
      payload.message = `Anfrage für: ${requestType === 'verein' ? 'Verein' : 'Unternehmen'}${org ? ` – ${org}` : ''}\n\n${payload.message}`.slice(0, 3000);
    }
    const callback = value('callback');
    if (callback && payload.message) payload.message = `${payload.message}\n\nAm besten erreichbar: ${callback}`.slice(0, 3000);
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
      updateRequestType();
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
  const navLinks = $$('#main-nav a:not(.button)').filter(link => link.getAttribute('href').startsWith('#'));
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
