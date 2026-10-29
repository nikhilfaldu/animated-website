# Repository Guidelines

Orbit Plus V3 balances cinematic storytelling with high-performance WebGL work. This guide keeps contributions aligned with the established patterns, animation fidelity, and delivery standards expected for Awwwards-ready experiences.

## Project Structure & Module Organization
- `src/components` holds reusable building blocks; emblem, navigation, animation, and particle subfolders encapsulate effect-specific logic.
- Narrative flows live in `src/sections`, mirroring the five-act storyline; compose them in `App.tsx`.
- Shared state and hooks sit in `src/context` and `src/hooks`; prefer Zustand or Valtio stores already in use.
- Visual assets (`src/assets`, `src/shaders`, `src/styles`) pair SVG radials with GLSL shaders and Tailwind layers. Keep new media optimized.
- Reference `docs/` for the product requirements doc and architecture notes before altering core orchestration.

## Build, Test, and Development Commands
- `npm run dev` starts Vite at `http://localhost:5173` with hot reload.
- `npm run type-check` enforces TypeScript soundness; required before every PR.
- `npm run lint` uses ESLint with React Hooks rules; no warnings allowed.
- `npm run build` performs a TypeScript project build plus production Vite bundle.
- `npm run preview` serves the compiled artifacts; use for final QA on animation timing.
- `npm run analyze` opens the bundle visualizer; run before shipping large dependency changes.
- `npm run clean` purges build outputs if local caches misbehave.

## Coding Style & Naming Conventions
- Use TypeScript, functional React components, and hooks; avoid class components.
- Follow the existing 2-space indentation, single quotes, and trailing commas in multiline structures.
- Keep filenames in `kebab-case.tsx` for components and `useCamelCase.ts` for hooks.
- Run `npm run lint` after formatting changes; configure your editor for ESLint auto-fix on save.
- Co-locate CSS modules or Tailwind utilities with their component; centralize global tokens in `src/styles`.

## Testing Guidelines
- Automated tests are not yet in place; rely on `npm run type-check` and `npm run lint` for regression safety.
- Perform manual smoke tests across critical scroll breakpoints (assembly, orbit, machine, data, vortex) in Chrome and Safari.
- For new interactive modules, capture before/after screen recordings and note expected animation durations.
- When adding a test harness, prefer Vitest and Testing Library; place specs beside the implementation as `<name>.test.tsx`.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat:`, `fix:`, `chore:`) as in recent history; scope optional (`feat: hero`).
- Keep commits focused on one behavior change; include relevant doc or asset updates.
- PRs must describe the narrative impact, list validation commands run, and link to tracking issues.
- For visual updates, attach GIFs or short clips demonstrating scroll states and responsive breakpoints.
- Request review from the animation or systems steward when touching Three.js or scroll orchestration.

## Performance & Animation Notes
- Maintain 60 FPS targets: profile heavy scenes with the Chrome Performance panel before merging.
- When introducing shaders or audio, budget Vite bundle size using `npm run analyze` and document tuning knobs in `docs/`.
- Prefer lazy loading for non-critical sections; confirm transitions remain seamless on low-power laptops.

