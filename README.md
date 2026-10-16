# WeizTech 7

Complete redesign of the WeizTech website: light (white) design by default, an optional dark mode, new typography, rebuilt 3D models and a clearer page structure.

## Open the website

Double-click Start-Website.cmd (Node.js required, no install or build step) and keep the window open while viewing http://127.0.0.1:5176. You can also run `node server.mjs`; `WEIZTECH_PORT` selects another port. Opening index.html directly will not load the JavaScript modules.

## What changed in version 7

- **Light by default, dark on request.** All colours are design tokens in styles.css (`:root` = light, `[data-theme="dark"]` = dark). The sun/moon button in the header switches themes; the choice is remembered in the browser (`localStorage`, key `weiztech-theme`). The 3D scenes re-light themselves when the theme changes.
- **Typography and readability.** Body text is Manrope at 17 px with a 1.65 line height (it was 10–15 px), headings use Outfit to match the wordmark, line lengths are limited, and secondary text meets WCAG AA contrast in both themes. Fonts remain local (no Google Fonts requests).
- **Logo as SVG.** The mark is inline SVG, so it adapts to light and dark backgrounds (the old PNG was white-only). assets/logo-mark.svg and assets/favicon.svg are standalone copies.
- **Clearer structure.** Hero → at-a-glance price/service overview → services → three-step process → pricing table and calculator → about → FAQ → contact. Navigation highlights the current section.
- **Rebuilt 3D models** (models.js, illustrations.js): a laptop with a real keyboard layout, hinge, logo on the lid and a crisp UI screen; a Wi-Fi 6 router with blade antennas; a white all-in-one printer that prints a page. The six service illustrations now have real screen content (dashboard, setup checklist, phone), and the neighbourhood is a white "clay model". Lighting uses a photo-studio environment, neutral tone mapping and soft shadows.
- **Interaction.** Device tabs, a "try it" action per device, drag (or arrow keys) to rotate, and a status card. Animations can be paused in the hero and the footer; reduced-motion preferences are respected.
- **Removed:** the scroll-driven "Zusammenspiel" story and the logo sculpture section, to keep the page focused.

The contact form keeps the original backend URL, payload, timeout and e-mail fallback. Legal text is unchanged.

## Everyday changes (config.js)

- **Prices:** `prices.first30` (first 30 minutes) and `prices.extra30` (each further started 30 minutes). The calculator and the problem helper use these values.
- **Seasonal offer:** `promo` holds the offer price and its end moment. The Herbst-Aktion runs up to and including 30 November 2026 (`ends: "2026-12-01T00:00:00+01:00"`). From then on the banner, offer badges and struck-through prices disappear by themselves, and every price shows the regular 45 €. In index.html, promo-only text carries `data-promo` and its regular replacement carries `data-regular`. For a new offer, change `promo` and, if needed, the dates written in those texts ("bis 30. November").
- **WhatsApp:** `whatsapp` is the number in international format without "+". Leave it empty to remove every WhatsApp button.

## More features

- **"Was ist los?" helper** (below the services): visitors pick a symptom and see what we do, a rough time and cost range, and buttons to pre-fill the form or open the calculator. The entries and their minute ranges are the `problems` list in script.js.
- **Larger text:** the "A+" button in the header enlarges all text by 15 % on every page and is remembered per browser.
- **Callback time:** the form asks for the preferred time of day. It is added to the end of the message, so the backend payload is unchanged.
- **Social preview image:** assets/og-image.png (1200×630) is used when the site is shared on WhatsApp, Facebook and similar. To re-render it after design changes, start the preview server and run:
  `"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless=new --enable-unsafe-swiftshader --use-angle=swiftshader --hide-scrollbars --window-size=1200,630 --virtual-time-budget=15000 --screenshot="%CD%\assets\og-image.png" http://127.0.0.1:5176/tools/og-image.html`
  tools/og-image.html is only needed for this and does not have to be uploaded.

## Files

- index.html: content and structure (German).
- styles.css: design tokens, both themes, layout and responsive rules.
- script.js: theme toggle, navigation, price calculator, enquiry form.
- motion.js: animation pause, price digit roll, FAQ animation, process line.
- scene.js: one shared WebGL renderer, hero stage, service scenes, neighbourhood model.
- models.js: materials, geometry helpers and the three hero devices.
- illustrations.js: six service illustrations.
- legal.js: theme and text-size toggles for the legal pages.
- tools/og-image.html: renders the social preview image (development only).
- config.js: contact and backend configuration.
- impressum.html, datenschutz.html: legal pages.
- server.mjs, Start-Website.cmd: local preview only.

For static hosting, upload the HTML, CSS and JavaScript files, sitemap.xml, robots.txt and the whole assets folder.

## Licences

Three.js is bundled with its MIT licence in assets/vendor. Outfit and Manrope are bundled with their SIL Open Font Licences in assets/fonts.
