# Pipeline Review

Scope: Files used directly by `src/App.tsx` plus root/config files.

## Findings

### 1) React hook rule violation inside render loop
- File: `src/sections/Process/Process.tsx:106`
- Status: Resolved
- Problem: `useTransform` is called inside `EMBLEM_PATHS.map(...)`.
- Impact: Violates the Rules of Hooks (lint error) and can break if the list length ever changes; also allocates new MotionValues on every render.
- Fix: Move the per-radial motion logic into a child component (one hook call per component) or precompute values outside the loop and pass motion values in.
- Expected behavior when fixed: No hook-rule violations, stable MotionValue instances, and predictable rendering.

### 2) React hook rule violation inside render loop
- File: `src/sections/WorkBridge/WorkBridgeOverlay.tsx:51`
- Status: Resolved
- Problem: Multiple `useTransform` calls occur inside `projects.slice(0, 4).map(...)`.
- Impact: Same hook-rule violation risk as above; also re-creates MotionValues on every render.
- Fix: Extract a `BridgeWindow` child component (one set of hooks per window) or precompute static transforms outside the map and pass MotionValues in.
- Expected behavior when fixed: Hook ordering is stable; motion values are created once per window.

### 3) Lenis RAF loop not canceled on unmount
- File: `src/components/LenisProvider.tsx:60`
- Status: Resolved
- Problem: The recursive `requestAnimationFrame` loop is never canceled in cleanup.
- Impact: Orphaned RAF loops continue after unmount (worse in React StrictMode), increasing CPU usage and calling `lenis.raf` after `lenis.destroy()`.
- Fix: Store the RAF id (e.g., `rafIdRef`) and cancel it in the cleanup function.
- Expected behavior when fixed: No orphaned RAF loops; Lenis stops cleanly on unmount.

### 4) Lenis hover-stop effect never runs after Lenis initializes
- File: `src/components/navigation/KineticDialNav.tsx:272`
- Status: Resolved
- Problem: The effect that pauses/resumes Lenis does not include `lenis` in its dependency list. When `lenis` changes from `null` to an instance, the effect does not rerun.
- Impact: Hovering the dial may never pause scrolling on first load; behavior depends on timing of Lenis initialization.
- Fix: Add `lenis` to the effect dependencies or move the pause/resume logic into a `useEffect` that depends on `lenis`.
- Expected behavior when fixed: Lenis consistently pauses/resumes on hover as soon as it becomes available.

### 5) Unprotected `document.fonts` usage
- File: `src/sections/Services/Services.tsx:183`
- Status: Resolved
- Problem: `document.fonts.ready` is called without checking that `document.fonts` exists.
- Impact: Runtime errors in browsers that do not support the Font Loading API (older Safari/WebViews).
- Fix: Guard with `if ('fonts' in document)` or `document.fonts?.ready` and fall back to a timeout.
- Expected behavior when fixed: The section works in all supported browsers without throwing.

### 6) Work bridge start positions never update on resize
- File: `src/sections/WorkBridge/WorkBridgeOverlay.tsx:31`
- Status: Resolved
- Problem: `startRects` are calculated once (`useMemo` with empty deps) using `window.innerWidth/innerHeight`.
- Impact: On resize/orientation changes, the exposure windows start from stale center positions.
- Fix: Track viewport size (state or a `useWindowSize` hook) and recompute `startRects` when it changes.
- Expected behavior when fixed: Windows stay centered and aligned after resizing.

### 7) CountUp rounds away decimal metrics
- File: `src/sections/Proof.tsx:25`
- Status: Resolved
- Problem: `Math.round(eased * to)` forces all values to integers.
- Impact: Decimal metrics (e.g., 3.2x) render as 3x or 4x, which is inaccurate.
- Fix: Support precision (e.g., pass a `precision` prop, use `toFixed`, or round based on `Number.isInteger(to)`).
- Expected behavior when fixed: Decimal metrics display and animate with the correct precision.

### 8) TunnelIn scene continuously invalidates frames in demand mode
- File: `src/components/GlobalCanvas/scenes/TunnelInScene.tsx:607`
- Status: Resolved
- Problem: `useFrame` calls `invalidate()` every frame while visible, defeating `frameloop="demand"`.
- Impact: Continuous rendering even when scroll is static; extra GPU/CPU usage.
- Fix: Remove the `useFrame` invalidation or gate it to actual time-based animation; rely on scroll-driven invalidation only.
- Expected behavior when fixed: Rendering happens only when motion values change, reducing idle cost.

### 9) Debug logging left in Services layout measurement
- File: `src/sections/Services/Services.tsx:153`
- Status: Resolved
- Problem: `console.log` calls run on every `updateOrigins` invocation.
- Impact: Console noise and minor performance overhead in production.
- Fix: Remove or guard logs with `if (process.env.NODE_ENV === 'development')`.
- Expected behavior when fixed: Clean console output in production.

### 10) Duplicate image preloads
- Files: `src/App.tsx:69`, `src/sections/Work/Work.tsx:64`
- Status: Resolved
- Problem: The same preview images are preloaded in both App and Work.
- Impact: Redundant decoding/requests (typically cached, but still extra work).
- Fix: Centralize preloading in one place or add a cache guard.
- Expected behavior when fixed: Previews are warmed once with no duplicate work.

### 11) Untracked timeouts after Contact submission
- File: `src/sections/Contact.tsx:25`
- Status: Resolved
- Problem: The `setTimeout` that returns the emblem to idle is not cleared if the component unmounts.
- Impact: Potentially triggers global animations after unmount; can produce React warnings in dev.
- Fix: Store the timeout id and clear it on unmount (or guard with an `isMounted` ref).
- Expected behavior when fixed: No delayed side effects after navigation away from Contact.
