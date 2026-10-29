# Contributing

Thanks for helping improve Scroll-Cinema. This project is intentionally
dependency-light: **plain HTML/CSS/JS, no build step.**

## Ways to help

- 🐛 Bug reports — especially scroll/seek behaviour on specific browsers or GPUs.
- 🎬 New choreography presets (camera moves, object paths, beat layouts).
- 📌 Anchoring examples (content pinned to objects in the footage).
- 🧊 Blender export improvements / model-friendly fallbacks.
- 📝 Docs and the AI-agent skill (`skill/`).

## Dev setup

```bash
git clone https://github.com/indranilnnd-creator/amazing-3d-animated-website-creator.git
cd amazing-3d-animated-website-creator
python -m http.server 8080      # any static server works
```

Add your own `assets/media/scrub-film.mp4` and `assets/Objects/hero.glb` to see
the full effect. Neither is committed (see [NOTICE.md](NOTICE.md)).

Re-vendoring libraries after an upgrade:

```bash
npm install gsap@3 three@0.160.0 lenis@1.1.14
npm run vendor
```

## Guidelines

- **Don't commit media.** No videos, images, or models. `.gitkeep` files keep the
  folders. Anything you add locally should stay out of the diff.
- **Keep it dependency-free.** No frameworks, no bundler. CDN is not used at
  runtime — libraries are vendored.
- **Preserve the non-negotiables** (see `skill/SKILL.md` §0):
  all-intra film, scroll owns `currentTime` (never `play()`/`loop`), canvas
  renderer holds the last frame, 3D in a fixed layer.
- **Bump the cache-buster.** Increment `?v=N` on the CSS/JS links and the HUD
  build badge with any change.
- **Verify, don't assume.** Run the browser harness
  (`skill/references/verification.md`) before opening a PR — it asserts that the
  scrub tracks scroll, that nothing auto-plays, and that the background never
  flashes black.

## Pull requests

1. Fork and branch (`feat/…`, `fix/…`).
2. Keep diffs focused; explain the change and how you verified it.
3. Include a screenshot or short clip if it's visual.
4. Confirm you added no licensed media.

By contributing you agree your work is licensed under the repository's
[MIT license](LICENSE).
