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

The contact form keeps the original backend URL, payload, timeout and e-mail fallback. Prices and legal text are unchanged.

## Files

- index.html: content and structure (German).
- styles.css: design tokens, both themes, layout and responsive rules.
- script.js: theme toggle, navigation, price calculator, enquiry form.
- motion.js: animation pause, price digit roll, FAQ animation, process line.
- scene.js: one shared WebGL renderer, hero stage, service scenes, neighbourhood model.
- models.js: materials, geometry helpers and the three hero devices.
- illustrations.js: six service illustrations.
- legal.js: theme toggle for the legal pages.
- config.js: contact and backend configuration.
- impressum.html, datenschutz.html: legal pages.
- server.mjs, Start-Website.cmd: local preview only.

For static hosting, upload the HTML, CSS and JavaScript files, sitemap.xml, robots.txt and the whole assets folder.

## Licences

Three.js is bundled with its MIT licence in assets/vendor. Outfit and Manrope are bundled with their SIL Open Font Licences in assets/fonts.
