# Jungle Cursor Canopy

An immersive procedural jungle canopy that reacts to the pointer. Leaves bend away
from the cursor, respond to press-and-hold input, drift in layered wind, and transition
through a GSAP-driven landing sequence. The scene is rendered with Three.js and runs as
a single standalone web page.

## Live demo

[Open Jungle Cursor Canopy](https://kaolti.github.io/jungle-cursor-canopy/)

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

Vite will print the local URL. To verify the production build:

```bash
npm run build
npm run preview
```

## How it works

- Three.js creates the WebGL renderer, camera, lighting, shadows, fog, and post-processing.
- Five procedural leaf species are generated from canvas textures and deformed geometry.
- Custom material shader hooks add wind, turbulence, surface noise, and photographic texture detail.
- Pointer movement creates a spring-based wake through the foliage; holding the pointer deepens it.
- GSAP coordinates the intro, clearing reveal, leaf lift, vortex, and fly-past transitions.
- Settings are stored in the browser under the `understory-params-v16` local-storage key.
- The leaf colour and normal maps live in `public/assets/` and are copied into the production build.

## Customisation

Open the **Canopy parameters** panel in the top-right corner of the demo. It exposes:

- quality, render scale, shadows, frame-rate limit, and adaptive performance;
- foliage density, leaf scale, species variation, surface detail, and wetness;
- cursor wake, collision, spring, damping, lift, and press depth;
- wind strength, speed, and turbulence;
- depth of field, camera angle, distance, and cursor-driven tilt;
- key and fill light colour, intensity, position, and shadow behaviour;
- fog, exposure, vignette, dither, and air-mote appearance;
- intro timing, clearing size, content reveal, lift, vortex, and exit motion.

Use **Copy JSON** to copy the current settings. To make a configuration the default,
replace matching values in `defaultParams` inside `index.html`. The **Reset** button
returns the page to those defaults.

Text content can be changed directly in the `#label` and `#landing` elements near the
top of `index.html`. Colours and typography are defined in the page’s inline CSS.

## Project structure

```text
.
├── index.html                 # Complete scene, UI, styles, and interaction code
├── public/assets/             # Leaf colour and normal textures
├── package.json               # Three.js, GSAP, Vite, and local commands
├── vite.config.js             # Portable relative paths for project-site hosting
└── .github/workflows/         # GitHub Pages deployment
```

## Browser support

The experiment requires WebGL and works best in current desktop versions of Chrome,
Safari, Firefox, and Edge. It includes coarse-pointer and reduced-motion handling, but
high-quality depth of field and 4K shadows can be demanding on mobile or integrated GPUs.
Use the **Balanced** or **Eco** preset when necessary.

## License

The source code is released under the [MIT License](LICENSE). See
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for texture provenance.
