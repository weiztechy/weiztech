(() => {
  'use strict';

  const config = window.WEIZTECH_CONFIG || {};
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduceMotion = motionQuery.matches;
  document.documentElement.classList.add('motion-ready');
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('page-ready')));

  const header = $('.site-header');
  const progressBar = $('#scroll-progress-bar');
  const updateHeader = () => {
    header?.classList.toggle('is-scrolled', window.scrollY > 8);
    if (progressBar) {
      const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100));
      progressBar.style.transform = `scaleX(${progress / 100})`;
    }
  };
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });
  window.addEventListener('resize', updateHeader, { passive: true });

  const menuButton = $('.menu-toggle');
  const nav = $('#main-nav');
  const setMenu = (open, restoreFocus = false) => {
    if (!menuButton || !nav) return;
    nav.classList.toggle('open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    document.body.classList.toggle('menu-open', open && window.matchMedia('(max-width: 700px)').matches);
    if (restoreFocus) menuButton.focus();
  };

  menuButton?.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  $$('#main-nav a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('click', event => {
    if (!nav?.contains(event.target) && !menuButton?.contains(event.target)) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav?.classList.contains('open')) setMenu(false, true);
  });
  window.matchMedia('(max-width: 700px)').addEventListener('change', () => setMenu(false));

  const email = config.email || 'weiztech@proton.me';
  if ($('#email-link')) $('#email-link').href = `mailto:${email}`;
  if ($('#email-display')) $('#email-display').textContent = email;

  (Array.isArray(config.phones) ? config.phones.slice(0, 2) : []).forEach((phone, index) => {
    const link = $(`#phone-link-${index + 1}`);
    const display = $(`#phone-display-${index + 1}`);
    if (phone?.link && link) link.href = `tel:${phone.link}`;
    if (phone?.display && display) display.textContent = phone.display;
  });

  const topicSelect = $('#topic');
  $$('[data-topic]').forEach(link => link.addEventListener('click', () => {
    if (!topicSelect) return;
    topicSelect.value = link.dataset.topic || '';
  }));

  // Price estimator. Travel outside Weiz is intentionally marked as an estimate.
  let duration = 30;
  const area = $('#service-area');
  const distanceInput = $('#travel-distance');
  const distanceControl = $('#distance-control');
  const travelConfig = config.travelEstimate || {};
  const travelPerKm = Number.isFinite(Number(travelConfig.perKm)) ? Number(travelConfig.perKm) : 0.50;
  const travelMinimum = Number.isFinite(Number(travelConfig.minimum)) ? Number(travelConfig.minimum) : 5;
  const travelMultiplier = travelConfig.roundTrip === false ? 1 : 2;
  const euro = value => `${Number(value).toLocaleString('de-AT', { minimumFractionDigits: value % 1 ? 2 : 0, maximumFractionDigits: 2 })} €`;

  const replayAnimation = (element, className, timeout = 420) => {
    if (!element || reduceMotion) return;
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
    window.setTimeout(() => element.classList.remove(className), timeout);
  };

  const updateEstimate = () => {
    const serviceTotal = 35 + ((duration - 30) / 30) * 20;
    const outside = area?.value === 'outside';
    const oneWayKm = Math.max(0, Number(distanceInput?.value || 0));
    const travelEstimate = outside && oneWayKm > 0
      ? Math.max(travelMinimum, oneWayKm * travelMultiplier * travelPerKm)
      : 0;
    const grandTotal = serviceTotal + travelEstimate;
    const priceTotal = $('#price-total');
    const previousPrice = priceTotal?.textContent;
    const oldPrice = $('.price-old');
    const pricePrefix = $('#price-prefix');
    if (!priceTotal) return;

    if (distanceControl) distanceControl.hidden = !outside;
    if (pricePrefix) pricePrefix.hidden = !outside;
    priceTotal.textContent = outside
      ? grandTotal.toLocaleString('de-AT', { maximumFractionDigits: 2 })
      : serviceTotal.toLocaleString('de-AT');
    $('#price-duration').textContent = outside
      ? `geschätzt für ${duration} Minuten inkl. Anfahrt`
      : (duration === 30 ? 'für die ersten 30 Minuten' : `für ${duration} Minuten Arbeitszeit`);
    if (oldPrice) oldPrice.hidden = duration !== 30 || outside;

    const estimateTotalEl = $('#estimate-total');
    const travelTotalEl = $('#travel-total');
    $('#estimate-description').textContent = `${duration} Minuten Arbeitszeit`;
    estimateTotalEl.textContent = euro(serviceTotal);
    $('#travel-description').textContent = outside ? `Anfahrt ca. ${oneWayKm || 0} km einfach` : 'Anfahrt in Weiz';
    travelTotalEl.textContent = outside ? `ca. ${euro(travelEstimate)}` : 'inklusive';

    const grandDescription = $('#grand-description');
    const grandTotalEl = $('#grand-total');
    if (grandDescription) grandDescription.hidden = !outside;
    if (grandTotalEl) {
      grandTotalEl.hidden = !outside;
      grandTotalEl.textContent = `ca. ${euro(grandTotal)}`;
    }

    $('#estimate-note').textContent = outside
      ? `Unverbindliche Schätzung auf Basis von ca. ${travelPerKm.toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €/km ${travelMultiplier === 2 ? 'für Hin- und Rückfahrt' : 'für die Strecke'}${travelMinimum > 0 ? ` (mind. ${euro(travelMinimum)} Anfahrt)` : ''}. Der tatsächliche Anfahrtspreis wird vor dem Termin bestätigt. Arbeitszeit wird in angefangenen 30 Minuten abgerechnet.`
      : 'Unverbindliches Rechenbeispiel. Abgerechnet wird nach tatsächlicher Arbeitszeit in angefangenen 30 Minuten.';

    $$('[data-duration]').forEach(button => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.duration) === duration));
    });

    if (previousPrice !== priceTotal.textContent) {
      replayAnimation(priceTotal.closest('strong'), 'value-change');
      replayAnimation(estimateTotalEl, 'estimate-value-change', 320);
      replayAnimation(travelTotalEl, 'estimate-value-change', 320);
      replayAnimation(grandTotalEl, 'estimate-value-change', 320);
    }
  };

  $$('[data-duration]').forEach(button => button.addEventListener('click', () => {
    duration = Number(button.dataset.duration);
    updateEstimate();
  }));
  const areaButtons = $$('[data-area]');
  areaButtons.forEach(button => button.addEventListener('click', () => {
    if (!area) return;
    area.value = button.dataset.area || 'weiz';
    areaButtons.forEach(option => option.setAttribute('aria-pressed', String(option === button)));
    updateEstimate();
    if (area.value === 'outside' && distanceInput) {
      window.setTimeout(() => distanceInput.focus({ preventScroll: true }), 180);
    }
  }));
  distanceInput?.addEventListener('input', updateEstimate);
  $('#estimate-cta')?.addEventListener('click', () => {
    const location = $('#location');
    if (!location || location.value.trim()) return;
    if (area?.value === 'weiz') location.value = 'Weiz';
    else if (distanceInput?.value) location.value = `Außerhalb von Weiz (ca. ${distanceInput.value} km entfernt)`;
  });
  updateEstimate();

  // Motion engine: smooth navigation, ripples, spotlight depth and reveal choreography.
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const hash = link.getAttribute('href');
      if (!hash || hash === '#') return;
      if (hash === '#top') {
        event.preventDefault();
        window.scrollTo({ top: 0, left: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
        return;
      }
      const target = document.querySelector(hash);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', hash);
      if (!reduceMotion) {
        target.classList.remove('section-flash');
        requestAnimationFrame(() => target.classList.add('section-flash'));
        window.setTimeout(() => target.classList.remove('section-flash'), 800);
      }
    });
  });

  // Click ripples on controls. Uses a child element so the effect follows the pointer exactly.
  const rippleTargets = $$('.button, .problem-grid a, .duration-options button, .area-option, .mobile-cta a');
  rippleTargets.forEach(element => {
    element.addEventListener('pointerdown', event => {
      if (reduceMotion || event.button > 0) return;
      const rect = element.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'wt-ripple';
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;
      element.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    });
  });

  // Magnetic buttons on fine pointers. Deliberately limited to a few pixels.
  if (!reduceMotion && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    $$('.button').forEach(button => {
      button.classList.add('interactive-magnetic');
      button.addEventListener('pointermove', event => {
        const rect = button.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - .5) * 7;
        const y = ((event.clientY - rect.top) / rect.height - .5) * 5;
        button.style.setProperty('--mag-x', `${x}px`);
        button.style.setProperty('--mag-y', `${y}px`);
      });
      button.addEventListener('pointerleave', () => {
        button.style.setProperty('--mag-x', '0px');
        button.style.setProperty('--mag-y', '0px');
      });
    });

    // Pointer-following spotlight + restrained 3D tilt on larger surfaces.
    $$('.hero-panel, .service-card, .price-calculator, .local-card, .contact-form, .scope-banner').forEach(card => {
      let frame = 0;
      card.addEventListener('pointerenter', () => card.classList.add('is-pointer'));
      card.addEventListener('pointermove', event => {
        if (frame) cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const px = (event.clientX - rect.left) / rect.width;
          const py = (event.clientY - rect.top) / rect.height;
          card.style.setProperty('--spot-x', `${px * 100}%`);
          card.style.setProperty('--spot-y', `${py * 100}%`);
          const maxTilt = card.classList.contains('service-card') ? 1.7 : 1.05;
          card.style.setProperty('--tilt-y', `${(px - .5) * maxTilt * 2}deg`);
          card.style.setProperty('--tilt-x', `${(.5 - py) * maxTilt * 2}deg`);
        });
      });
      card.addEventListener('pointerleave', () => {
        if (frame) cancelAnimationFrame(frame);
        card.classList.remove('is-pointer');
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
        card.style.setProperty('--spot-x', '50%');
        card.style.setProperty('--spot-y', '50%');
      });
    });

    // The hero glow follows the pointer very gently.
    const hero = $('.hero');
    hero?.addEventListener('pointermove', event => {
      const rect = hero.getBoundingClientRect();
      hero.style.setProperty('--hero-x', `${((event.clientX - rect.left) / rect.width) * 100}%`);
      hero.style.setProperty('--hero-y', `${((event.clientY - rect.top) / rect.height) * 100}%`);
    });
  }

  // Rich one-time reveals. Direction alternates so the page feels composed, not templated.
  if ('IntersectionObserver' in window && !reduceMotion) {
    const revealTargets = $$([
      '.section-heading', '.pricing-copy', '.about-copy', '.contact-copy',
      '.service-card', '.trust-grid > div', '.steps-grid article', '.boundary-list article',
      '.accordion > details', '.price-calculator', '.local-card', '.contact-form', '.scope-banner'
    ].join(','));
    revealTargets.forEach((element, index) => {
      element.classList.add('reveal-ready');
      if (element.matches('.pricing-copy, .contact-copy, .section-heading')) element.classList.add('reveal-left');
      else if (element.matches('.price-calculator, .contact-form, .local-card')) element.classList.add('reveal-right');
      else if (element.matches('.scope-banner')) element.classList.add('reveal-scale');
      element.style.setProperty('--reveal-delay', `${Math.min(index % 7, 6) * 52}ms`);
    });
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.11, rootMargin: '0px 0px -40px' });
    revealTargets.forEach(element => revealObserver.observe(element));
  }

  // Smooth FAQ open/close using the Web Animations API while preserving native <details> semantics.
  if (!reduceMotion && 'animate' in Element.prototype) {
    $$('.accordion details').forEach(details => {
      const summary = details.querySelector('summary');
      if (!summary) return;
      let animation = null;
      let closing = false;
      let expanding = false;

      const cleanup = () => {
        details.style.height = '';
        details.style.overflow = '';
        animation = null;
        closing = false;
        expanding = false;
      };

      const close = () => {
        closing = true;
        const start = `${details.offsetHeight}px`;
        const end = `${summary.offsetHeight}px`;
        details.style.overflow = 'hidden';
        animation?.cancel();
        animation = details.animate({ height: [start, end], opacity: [1, .94] }, { duration: 300, easing: 'cubic-bezier(.16,1,.3,1)' });
        animation.onfinish = () => { details.open = false; cleanup(); };
        animation.oncancel = cleanup;
      };

      const open = () => {
        expanding = true;
        details.style.height = `${details.offsetHeight}px`;
        details.open = true;
        const start = `${summary.offsetHeight}px`;
        const end = `${details.scrollHeight}px`;
        details.style.overflow = 'hidden';
        animation?.cancel();
        animation = details.animate({ height: [start, end], opacity: [.94, 1] }, { duration: 380, easing: 'cubic-bezier(.16,1,.3,1)' });
        animation.onfinish = cleanup;
        animation.oncancel = cleanup;
      };

      summary.addEventListener('click', event => {
        event.preventDefault();
        if (closing || !details.open) open();
        else if (expanding || details.open) close();
      });
    });
  }

  // Active navigation state follows the reader with a small animated indicator.
  if ('IntersectionObserver' in window) {
    const navLinks = $$('#main-nav a[href^="#"]:not(.button)');
    const sectionMap = new Map(navLinks.map(link => [link.getAttribute('href')?.slice(1), link]));
    const observedSections = [...sectionMap.keys()].map(id => document.getElementById(id)).filter(Boolean);
    const navObserver = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      navLinks.forEach(link => link.removeAttribute('aria-current'));
      sectionMap.get(visible.target.id)?.setAttribute('aria-current', 'page');
    }, { rootMargin: '-28% 0px -58% 0px', threshold: [0, .1, .35, .6] });
    observedSections.forEach(section => navObserver.observe(section));
  }

  // Form micro-interactions: change confirmation and helpful invalid-field shake.
  $$('.contact-form input, .contact-form select, .contact-form textarea').forEach(field => {
    field.addEventListener('change', () => replayAnimation(field, 'form-field-changed'));
    field.addEventListener('invalid', () => {
      const target = field.closest('label') || field;
      replayAnimation(target, 'field-shake', 480);
    });
  });

  if ('IntersectionObserver' in window) {
    const cta = $('.mobile-cta');
    const contact = $('#kontakt');
    if (cta && contact) {
      new IntersectionObserver(entries => {
        cta.classList.toggle('is-hidden', entries[0].isIntersecting);
      }, { threshold: 0.05 }).observe(contact);
    }
  }

  const form = $('#contact-form');
  const status = $('#form-status');
  const submitButton = form?.querySelector('button[type="submit"]');
  const fallback = $('#email-fallback');
  let formStartedAt = Date.now();
  let submitting = false;

  const setStatus = (message, success = false) => {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('success', success);
    if (message) replayAnimation(status, 'form-field-changed');
  };

  const backendIsConfigured = () => {
    try {
      return new URL(config.backendUrl).protocol === 'https:' && !config.backendUrl.includes('YOUR_PROJECT_REF');
    } catch {
      return false;
    }
  };

  const prepareEmail = payload => {
    if (!fallback) return;
    const subject = `WeizTech Anfrage: ${payload.topic}`;
    const body = `Name: ${payload.name}\nTelefon: ${payload.phone}\nE-Mail: ${payload.email}\nOrt: ${payload.location}\nThema: ${payload.topic}\n\n${payload.message}`;
    fallback.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    fallback.hidden = false;
  };

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
      name: value('name'),
      phone: value('phone'),
      email: value('email'),
      location: value('location'),
      topic: value('topic'),
      message: value('message'),
      consent: data.get('consent') === 'on',
      website: value('website'),
      startedAt: formStartedAt
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
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
})();
