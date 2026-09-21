(() => {
  'use strict';
  const config = window.WEIZTECH_CONFIG || {};
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];

  // Site opening animation: short branded intro, then stagger the hero in.
  const startSiteIntro = () => {
    const root = document.documentElement;
    if (!root.classList.contains('site-booting')) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.setTimeout(() => {
        root.classList.add('site-ready');
        window.setTimeout(() => root.classList.remove('site-booting'), 1450);
      }, 720);
    }));
  };
  startSiteIntro();
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
  window.matchMedia('(max-width: 700px)').addEventListener('change', () => setMenu(false));

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

  // Interactive hero tilt and subtle parallax.
  const heroVisual = $('.hero-visual');
  const resetHeroTilt = () => {
    if (!heroVisual) return;
    heroVisual.style.setProperty('--tilt-x', '0deg');
    heroVisual.style.setProperty('--tilt-y', '0deg');
    heroVisual.style.setProperty('--move-x', '0px');
    heroVisual.style.setProperty('--move-y', '0px');
  };
  if (heroVisual && window.matchMedia('(pointer:fine)').matches) {
    resetHeroTilt();
    let heroRaf = null;
    heroVisual.addEventListener('mousemove', event => {
      const rect = heroVisual.getBoundingClientRect();
      const px = ((event.clientX - rect.left) / rect.width) - 0.5;
      const py = ((event.clientY - rect.top) / rect.height) - 0.5;
      if (heroRaf) window.cancelAnimationFrame(heroRaf);
      heroRaf = window.requestAnimationFrame(() => {
        heroVisual.style.setProperty('--tilt-x', `${(-py * 10).toFixed(2)}deg`);
        heroVisual.style.setProperty('--tilt-y', `${(px * 12).toFixed(2)}deg`);
        heroVisual.style.setProperty('--move-x', `${(px * 22).toFixed(2)}px`);
        heroVisual.style.setProperty('--move-y', `${(py * 20).toFixed(2)}px`);
      });
    });
    heroVisual.addEventListener('mouseleave', resetHeroTilt);
  }

  // Scroll reveals with deliberate direction and enough travel time to feel continuous.
  const revealTargets = $$('.service-card, .price-calculator, .steps-grid article, .trust-grid > div, .local-graphic, .about-copy, .faq-grid details, .contact-copy, .contact-form, .contact-options > a, .local-stats > div');

  const setRevealDirection = (selector, mode = 'alternate') => {
    $$(selector).forEach((element, index) => {
      if (mode === 'left') element.classList.add('reveal-left');
      else if (mode === 'right') element.classList.add('reveal-right');
      else element.classList.add(index % 2 === 0 ? 'reveal-left' : 'reveal-right');
    });
  };

  setRevealDirection('.service-card');
  setRevealDirection('.steps-grid article');
  setRevealDirection('.trust-grid > div');
  setRevealDirection('.faq-grid details');
  setRevealDirection('.contact-options > a');
  setRevealDirection('.local-stats > div');
  setRevealDirection('.local-graphic', 'left');
  setRevealDirection('.about-copy', 'right');

  revealTargets.forEach(element => element.setAttribute('data-reveal', ''));

  const completeReveal = element => {
    element.classList.add('is-visible');
    const cleanup = () => {
      // Remove reveal-only state after the transition so normal hover transforms work again.
      element.removeAttribute('data-reveal');
      element.classList.remove('reveal-left', 'reveal-right', 'is-visible');
    };
    window.setTimeout(cleanup, 1250);
  };

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      const visibleEntries = entries.filter(entry => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      visibleEntries.forEach((entry, index) => {
        revealObserver.unobserve(entry.target);
        // Tiny local stagger only for elements entering together; avoids the old "pop" effect.
        window.setTimeout(() => completeReveal(entry.target), index * 72);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    revealTargets.forEach(element => revealObserver.observe(element));
  } else {
    revealTargets.forEach((element, index) => window.setTimeout(() => completeReveal(element), index * 60));
  }


  // Premium click feedback: tactile press + localized ripple.
  const clickTargets = '.button, .text-link, .hero-quicknav a, .duration-options button, .visual-bottom > a, .contact-options > a, .accordion summary, .mobile-cta > a, .main-nav a, .legal-nav-link, .legal-back';
  $$(clickTargets).forEach(element => {
    element.classList.add('clicky');
    element.addEventListener('pointerdown', event => {
      element.classList.remove('is-clicked');
      void element.offsetWidth;
      element.classList.add('is-clicked');
      window.setTimeout(() => element.classList.remove('is-clicked'), 260);

      const rect = element.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ui-ripple';
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;
      element.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 620);
    }, { passive: true });
  });

  // Smooth FAQ opening/closing instead of the browser's instant snap.
  $$('.accordion details').forEach(details => {
    const summary = details.querySelector('summary');
    const content = details.querySelector('p');
    if (!summary || !content) return;
    content.classList.add('accordion-content');

    summary.addEventListener('click', event => {
      event.preventDefault();
      if (details.dataset.animating === 'true') return;
      details.dataset.animating = 'true';

      if (!details.open) {
        details.open = true;
        content.style.height = '0px';
        content.style.opacity = '0';
        content.style.transform = 'translateY(-8px)';
        requestAnimationFrame(() => requestAnimationFrame(() => {
          content.style.height = `${content.scrollHeight}px`;
          content.style.opacity = '1';
          content.style.transform = 'translateY(0)';
        }));
        const finish = () => {
          content.style.height = 'auto';
          details.dataset.animating = 'false';
          content.removeEventListener('transitionend', finish);
        };
        content.addEventListener('transitionend', finish);
      } else {
        content.style.height = `${content.scrollHeight}px`;
        content.style.opacity = '1';
        requestAnimationFrame(() => {
          content.style.height = '0px';
          content.style.opacity = '0';
          content.style.transform = 'translateY(-8px)';
        });
        const finish = () => {
          details.open = false;
          content.style.height = '';
          content.style.opacity = '';
          content.style.transform = '';
          details.dataset.animating = 'false';
          content.removeEventListener('transitionend', finish);
        };
        content.addEventListener('transitionend', finish);
      }
    });
  });

  // Deliberately smooth in-page navigation with a soft ease rather than a snap.
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const easeInOutQuint = t => t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
  const smoothScrollTo = (targetY, duration = 880) => {
    if (prefersReducedMotion) {
      window.scrollTo(0, targetY);
      return;
    }
    const startY = window.scrollY;
    const distance = targetY - startY;
    const started = performance.now();
    const tick = now => {
      const progress = Math.min(1, (now - started) / duration);
      window.scrollTo(0, startY + distance * easeInOutQuint(progress));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const id = link.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      event.preventDefault();
      const headerOffset = window.innerWidth <= 700 ? 78 : 112;
      const targetY = Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerOffset);
      smoothScrollTo(targetY);
      if (history.pushState) history.pushState(null, '', id);
    });
  });

  // Scroll navigator: section number + orange progress trail. Only visible while scrolling.
  const sectionMap = [
    { el: $('.hero'), number: '00' },
    { el: $('#leistungen'), number: '01' },
    { el: $('#preise'), number: '02' },
    { el: $('#ablauf'), number: '03' },
    { el: $('#ueber-uns'), number: '04' },
    { el: $('#faq'), number: '05' },
    { el: $('#kontakt'), number: '06' }
  ].filter(item => item.el);

  const scrollHud = document.createElement('div');
  scrollHud.className = 'scroll-hud';
  scrollHud.setAttribute('aria-hidden', 'true');
  scrollHud.innerHTML = '<div class="scroll-hud-number">00</div><div class="scroll-hud-track"><span class="scroll-hud-progress"></span><i class="scroll-hud-dot"></i></div>';
  document.body.appendChild(scrollHud);
  const hudNumber = scrollHud.querySelector('.scroll-hud-number');
  const hudProgress = scrollHud.querySelector('.scroll-hud-progress');
  const hudDot = scrollHud.querySelector('.scroll-hud-dot');
  let hudTimer = null;
  let lastSection = '00';
  let hasActuallyScrolled = false;

  const updateScrollHud = () => {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    hudProgress.style.transform = `scaleY(${progress})`;
    hudDot.style.top = `${progress * 100}%`;

    const marker = window.scrollY + window.innerHeight * 0.44;
    let active = sectionMap[0];
    sectionMap.forEach(item => {
      if (item.el.offsetTop <= marker) active = item;
    });
    if (active.number !== lastSection) {
      lastSection = active.number;
      hudNumber.textContent = active.number;
      hudNumber.classList.remove('is-popping');
      void hudNumber.offsetWidth;
      hudNumber.classList.add('is-popping');
      window.setTimeout(() => hudNumber.classList.remove('is-popping'), 500);
    }
  };

  const showScrollHud = () => {
    if (window.scrollY > 4) hasActuallyScrolled = true;
    if (!hasActuallyScrolled) return;
    scrollHud.classList.add('is-visible');
    updateScrollHud();
    window.clearTimeout(hudTimer);
    hudTimer = window.setTimeout(() => scrollHud.classList.remove('is-visible'), 3000);
  };

  window.addEventListener('scroll', showScrollHud, { passive: true });
  window.addEventListener('resize', updateScrollHud);
  updateScrollHud();

})();
