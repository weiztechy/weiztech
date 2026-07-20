(() => {
  const config = window.WEIZTECH_CONFIG || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  $("#year").textContent = new Date().getFullYear();

  const menuButton = $(".menu-toggle");
  const nav = $("#main-nav");
  function setMenu(open) {
    if (!nav || !menuButton) return;
    nav.classList.toggle("open", open);
    document.body.classList.toggle("nav-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
  }

  menuButton?.addEventListener("click", event => {
    event.stopPropagation();
    setMenu(!nav.classList.contains("open"));
  });
  $$("#main-nav a").forEach(link => link.addEventListener("click", () => setMenu(false)));
  document.addEventListener("click", event => {
    if (!nav?.classList.contains("open")) return;
    if (!nav.contains(event.target) && !menuButton?.contains(event.target)) setMenu(false);
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") setMenu(false);
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) setMenu(false);
  });

  const observer = "IntersectionObserver" in window
    ? new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      }), { threshold: 0.12 })
    : null;
  $$(".reveal").forEach(el => observer ? observer.observe(el) : el.classList.add("visible"));

  const emailLink = $("#email-link");
  const emailDisplay = $("#email-display");
  const setupNote = $("#contact-setup-note");
  let contactConfigured = false;

  const phones = Array.isArray(config.phones) ? config.phones.slice(0, 2) : [];
  phones.forEach((phone, index) => {
    const number = index + 1;
    const phoneLink = $(`#phone-link-${number}`);
    const phoneDisplay = $(`#phone-display-${number}`);
    if (!phone?.display || !phone?.link || !phoneLink || !phoneDisplay) return;
    phoneDisplay.textContent = phone.display;
    phoneLink.href = `tel:${phone.link}`;
    phoneLink.hidden = false;
    contactConfigured = true;
  });

  if (config.email) {
    emailDisplay.textContent = config.email;
    emailLink.href = `mailto:${config.email}`;
    emailLink.hidden = false;
    contactConfigured = true;
  }
  if (contactConfigured && setupNote) setupNote.hidden = true;

  const mobileCta = $(".mobile-cta");
  const heroActions = $(".hero-actions");
  const contactSection = $("#kontakt");
  const footer = $(".site-footer");
  if (mobileCta && "IntersectionObserver" in window) {
    const visibleTargets = new Set();
    const ctaObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) visibleTargets.add(entry.target);
        else visibleTargets.delete(entry.target);
      });
      mobileCta.classList.toggle("is-hidden", visibleTargets.size > 0);
    }, { threshold: 0.08 });
    if (heroActions) ctaObserver.observe(heroActions);
    if (contactSection) ctaObserver.observe(contactSection);
    if (footer) ctaObserver.observe(footer);
  }

  const form = $("#contact-form");
  const status = $("#form-status");
  const submitButton = form?.querySelector('button[type="submit"]');
  let formStartedAt = Date.now();

  function setStatus(message, type = "error") {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("success", type === "success");
  }

  function backendIsConfigured() {
    return typeof config.backendUrl === "string"
      && /^https:\/\//.test(config.backendUrl)
      && !config.backendUrl.includes("YOUR_PROJECT_REF");
  }

  form?.addEventListener("submit", async event => {
    event.preventDefault();
    setStatus("");

    if (!form.checkValidity()) {
      form.reportValidity();
      setStatus("Bitte füllen Sie alle Pflichtfelder aus.");
      return;
    }

    if (!backendIsConfigured()) {
      setStatus("Das Anfrageformular ist noch nicht mit Supabase verbunden. Bitte verwenden Sie vorerst Telefon oder E-Mail.");
      return;
    }

    const data = new FormData(form);
    const payload = {
      name: data.get("name"),
      phone: data.get("phone"),
      email: data.get("email"),
      location: data.get("location"),
      topic: data.get("topic"),
      message: data.get("message"),
      consent: data.get("consent") === "on",
      website: data.get("website"),
      startedAt: formStartedAt
    };

    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = "Wird gesendet …";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(config.backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Die Anfrage konnte nicht gesendet werden.");
      }

      const number = result.requestNumber ? ` Ihre Anfragenummer ist #${result.requestNumber}.` : "";
      setStatus(`Vielen Dank! Ihre Anfrage wurde übermittelt.${number}`, "success");
      form.reset();
      formStartedAt = Date.now();
      submitButton.textContent = "Gesendet ✓";
      setTimeout(() => { submitButton.textContent = originalText; }, 2500);
    } catch (error) {
      const message = error?.name === "AbortError"
        ? "Die Verbindung hat zu lange gedauert. Bitte versuchen Sie es erneut oder rufen Sie uns an."
        : (error?.message || "Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut.");
      setStatus(message);
      submitButton.textContent = originalText;
    } finally {
      clearTimeout(timeout);
      submitButton.disabled = false;
    }
  });
})();
