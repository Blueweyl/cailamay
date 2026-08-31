# CAILAMAY

A one-page scroll-driven site for a private luxury villa retreat in Palawan,
Philippines. Live at **https://blueweyl.github.io/cailamay/**.

## What's here

This is a production export of a hand-built prototype: no framework, no
build step, no dependencies beyond a Google Fonts stylesheet — one
`index.html`, one `app.js`, and the image/video assets.

- **Scroll cinema hero.** The hero pins for 8 scroll "legs" (sea, arrival,
  living room, dining, bedroom, bath, pool, Palawan). The first video
  autoplays and loops normally; the other seven are ordinary `<video>`
  elements whose `play()`/`pause()` state tracks which scene is closest to
  fully visible as you scroll — only the active clip ever plays, and only
  the active scene plus the next couple ahead are ever loaded.
- **Responsive layout done in JS**, not media queries — grid columns, spans
  and padding are recomputed from `window.innerWidth` on a rAF loop that
  also drives the scroll easing, parallax layers, and the nav bar's
  solid-on-scroll state.
- **A reservation availability planner** with client-side date/guest
  validation. It's explicitly a preview: it does not send a network request
  or contact anyone.
- **Ambient sound toggle** — a synthesized ocean-noise loop via the Web
  Audio API, no audio file.
- Respects `prefers-reduced-motion` (static posters, no autoplay) and keeps
  every video muted + `playsinline` for mobile autoplay.

## Why it looks like this

The design was authored as a `.dc.html` file for [Claude
Design](https://claude.ai/design)'s canvas editor — a format that lets the
page stay live-editable via an in-browser runtime (React + Babel loaded
from a CDN, components compiled with `eval` at load time). That's a
reasonable trade-off for a design-time tool, but not something to ship
publicly: unpinned third-party script, `eval`-based execution blocks a real
CSP, and there's an editor-only `postMessage` bridge that does nothing on a
real page. This repo is the ahead-of-time-compiled export — same markup and
behavior, same scroll-cinema engine, with all of that stripped out in favor
of one plain static bundle and a `script-src 'self'` CSP (see the `<meta
http-equiv="Content-Security-Policy">` tag in `index.html`).

## License

Site content and code: all rights reserved. Feel free to read the source
for reference.
