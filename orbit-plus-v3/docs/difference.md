
## Best Practice: CSS `mix-blend-mode: difference`

For a black-and-white site where you need dynamic, pixel-perfect color inversion, **pure CSS is the cleanest solution**. Framer Motion isn't needed here—this is a compositing problem, not an animation problem.

### Core Implementation

```css
.logo {
  position: fixed;
  z-index: 9999;
  mix-blend-mode: difference;
  color: white; /* or fill: white for SVG */
}
```

**How `difference` works:** It subtracts the darker color from the lighter. White on white = black. White on black = white. Partial overlaps invert proportionally at the pixel level.

### Critical Gotchas

**1. Stacking Context Trap**
`mix-blend-mode` creates a new stacking context. If your logo's parent (or any ancestor) has `transform`, `opacity < 1`, `filter`, `will-change`, or `isolation: isolate`, the blend won't reach elements outside that context.

**Fix:** Ensure your logo sits outside any transformed containers, or flatten your DOM hierarchy so it blends against the `<body>`.

```jsx
// ❌ Won't work — parent creates isolated stacking context
<motion.div style={{ opacity: 0.99 }}>
  <Logo className="blend" />
</motion.div>

// ✅ Works — logo is a direct child of body-level container
<Logo className="blend" />
<main>{/* content */}</main>
```

**2. SVG Specifics**
Apply `mix-blend-mode` via CSS `style` attribute, not as an SVG attribute:

```jsx
// ❌ Won't work
<svg mix-blend-mode="difference">

// ✅ Works
<svg style={{ mixBlendMode: 'difference' }}>
```

For inline SVGs, set `fill: white` (or `currentColor` with `color: white`) on the paths.

**3. Transparent Backgrounds**
The logo element needs content to blend. If you're using an SVG with transparent areas, those areas won't invert—only the filled portions will.

### React Implementation

```tsx
const Logo = () => (
  <div
    style={{
      position: 'fixed',
      top: 24,
      left: 24,
      zIndex: 9999,
      mixBlendMode: 'difference',
    }}
  >
    <svg style={{ fill: 'white' }}>
      {/* your paths */}
    </svg>
  </div>
);
```

### When to Use Framer Motion Instead

If you want **animated transitions** between color states (smooth fade rather than instant invert), you'd combine `useScroll` + `useTransform` to detect sections and animate fill color:

```tsx
const { scrollYProgress } = useScroll();
const fill = useTransform(
  scrollYProgress,
  [0, 0.5, 1],
  ['#000', '#fff', '#000']
);

return <motion.svg style={{ fill }} />;
```

But this requires manual breakpoint mapping and won't handle partial overlaps (half-on-white, half-on-black). For true pixel-level inversion, `mix-blend-mode: difference` is the answer.

### Alternative: `exclusion`

`mix-blend-mode: exclusion` behaves similarly but produces 50% gray (instead of black) when colors are identical. Slightly softer result. Try both.

---

**TL;DR:** Use `mix-blend-mode: difference` with `color/fill: white`. Keep the logo outside any ancestor with `transform`, `opacity`, or `filter`. No JS required for the core effect.