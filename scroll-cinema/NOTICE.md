# NOTICE

## Demo assets are original

This repository ships three small media files, **all generated from code as part
of this project** — no third-party media is redistributed:

| File | Origin | License |
|---|---|---|
| `assets/media/scrub-film.mp4` | rendered by [`scripts/demo-clip.py`](scripts/demo-clip.py) — a fully procedural Blender "neon forest" | project-owned (MIT / CC0) |
| `assets/media/scrub-poster.jpg` | a frame of the above | project-owned (MIT / CC0) |
| `assets/Objects/hero.glb` | exported by [`scripts/demo-model.py`](scripts/demo-model.py) — a procedural faceted crystal | project-owned (MIT / CC0) |

Regenerate any of them yourself with the scripts in `scripts/`. They exist so the
demo works out of the box; replace them with your own assets freely.

Any video, image, or model **you** add is your responsibility to license. Prefer
content you created or that is explicitly licensed for redistribution (e.g.
CC0) — stock-footage licenses often forbid redistribution as a standalone file.

## Third-party software

The libraries under `assets/vendor/` are the property of their authors and are
used under their respective licenses:

| Library | Version | License |
|---|---|---|
| [GSAP](https://gsap.com) + ScrollTrigger | 3.x | GreenSock standard "no charge" license — see <https://gsap.com/licensing/> |
| [Lenis](https://github.com/darkroomengineering/lenis) | 1.1.x | MIT |
| [Three.js](https://threejs.org) | 0.160.0 | MIT |

`scripts/vendor-libs.mjs` copies these files from `node_modules` into
`assets/vendor/` for offline, CDN-free serving. Their license files remain with
the upstream packages.

## Trademarks

Product names referenced (Apple, Stripe, Blender, etc.) are trademarks of their
respective owners and are used here only descriptively.
