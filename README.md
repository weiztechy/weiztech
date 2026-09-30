# WeizTech 5

A new version of WeizTech, built from weiztech4. The original folder is unchanged.

## Open the website

Double-click **Start-Website.cmd**. Keep its terminal window open while using the preview. Open **http://127.0.0.1:5174** if your browser does not open automatically. Node.js is required; no npm installation or build step is needed.

Alternatively, run `node server.mjs` in this folder. Change the port using the `WEIZTECH_PORT` environment variable.

## What changed

- New visual design, locally hosted Outfit and Manrope fonts, and the original WeizTech logo and favicon throughout.
- Actual Three.js 3D laptop, WLAN router, and printer, built from geometry and local canvas textures.
- Device switching, pointer interaction, mouse dragging, floating motion, lighting, and shadows.
- Scroll reveals, spatial brand artwork, a new local-service illustration, and a reading progress indicator.
- Responsive desktop and mobile navigation, native FAQ disclosures, pricing calculator, and mobile contact bar.
- Motion pause, automatic reduced-motion support, and a CSS device illustration if WebGL is unavailable. Animation stops outside the viewport and in hidden browser tabs.
- All render assets are served locally. The only external request in normal operation is the existing contact API when someone submits a valid enquiry.

## Edit and publish

- `index.html`: German content and page structure.
- `styles.css`: styling and breakpoints.
- `scene.js`: 3D models, interactions, and motion.
- `script.js`: calculator, navigation, FAQ, validation, and contact submission.
- `config.js`: existing phone numbers, email, and backend URL.
- `impressum.html` and `datenschutz.html`: original legal content with updated styling.

For a static host, upload the HTML, CSS, JavaScript, robots.txt, sitemap.xml, and the entire assets folder. The local server and launcher are only for preview and do not need uploading. Use an HTTP server for local preview; opening index.html through file:// will not load JavaScript modules reliably.

The existing contact endpoint, payload, timeout handling, and email fallback are preserved. Local validation was checked without sending a production enquiry; successful live delivery still depends on the existing backend and its CORS configuration. Business prices and legal text were carried over from the supplied website. Nothing has been deployed.

## Licenses

Three.js 0.180.0 is bundled with its MIT license in `assets/vendor`. Outfit and Manrope are bundled under their SIL Open Font Licenses in `assets/fonts`.
