# Orbit-Plus V3 🌌

**Interactive creative manifesto for brands beyond the template**

A cinematic, narrative-driven portfolio website featuring a living orbital emblem system that transforms through scroll-driven states. Built for Awwwards recognition while maintaining clarity and purpose.

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)
![License](https://img.shields.io/badge/license-Private-red.svg)

---

## ✨ Features

### Core Experience
- **🎭 Living Emblem System** - 32 radials that transform through 5 distinct states as you scroll
- **📖 5-Act Narrative Structure** - Assembly → Exploration → Process → Proof → Connection
- **🎬 Cinematic Transitions** - Smooth, purposeful animations that enhance comprehension
- **⚡ High Performance** - 60 FPS animations with optimized WebGL and particle systems
- **🎨 Dynamic Theming** - Intelligent theme flipping based on scroll position
- **🌀 Portal Transitions** - Circular clip-path expansions for seamless section transitions

### Technical Highlights
- **Three.js Integration** - Custom 3D orbital mechanics and particle fields
- **Scroll-Driven Animations** - Velocity-reactive transforms with magnetic snap points
- **Accessibility First** - Keyboard navigation, screen reader support, reduced motion respect
- **Responsive Design** - Fluid from 320px mobile to 4K displays
- **Modern Stack** - React 18, TypeScript, Vite, Tailwind CSS

---

## 🚀 Tech Stack

### Core
- **[React 18](https://react.dev/)** - UI framework with modern hooks
- **[TypeScript 5.9](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Vite 7](https://vite.dev/)** - Lightning-fast build tool
- **[Tailwind CSS 3](https://tailwindcss.com/)** - Utility-first CSS

### Animation & 3D
- **[Three.js](https://threejs.org/)** - WebGL 3D library
- **[React Three Fiber](https://docs.pmnd.rs/react-three-fiber)** - React renderer for Three.js
- **[@react-three/drei](https://github.com/pmndrs/drei)** - Useful helpers for R3F
- **[@react-three/postprocessing](https://github.com/pmndrs/react-postprocessing)** - Post-processing effects
- **[Framer Motion 11](https://www.framer.com/motion/)** - Production-ready motion library

### State & Scroll
- **[Lenis](https://lenis.darkroom.engineering/)** - Smooth scroll library
- **[Zustand](https://zustand-demo.pmnd.rs/)** - Lightweight state management
- **[Valtio](https://valtio.pmnd.rs/)** - Proxy-based state management

### Utilities
- **[Tone.js](https://tonejs.github.io/)** - Web audio framework
- **[react-intersection-observer](https://www.npmjs.com/package/react-intersection-observer)** - Viewport detection
- **[react-use-measure](https://www.npmjs.com/package/react-use-measure)** - Element dimension tracking

---

## 📦 Installation

### Prerequisites
- **Node.js** >= 20.0.0
- **npm** >= 10.0.0

### Setup

```bash
# Clone the repository
git clone <repository-url> orbit-plus-v3
cd orbit-plus-v3

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open automatically at `http://localhost:5173`

---

## 🛠️ Development Commands

```bash
# Start dev server (opens in browser)
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview

# Analyze bundle size
npm run analyze

# Clean build artifacts and dependencies
npm run clean
```

---

## 📁 Project Structure

```
orbit-plus-v3/
├── src/
│   ├── components/
│   │   ├── emblem/           # Core emblem component
│   │   ├── navigation/       # Global, Orbit, and Kinetic Dial nav
│   │   ├── animations/       # Hero line drops, portal transitions
│   │   ├── particles/        # Particle system components
│   │   └── ui/              # Reusable UI elements
│   ├── context/
│   │   └── OrbitSystem.tsx  # Central orbit state management
│   ├── sections/
│   │   ├── Hero.tsx         # Act 1: Assembly
│   │   ├── Positioning.tsx  # Act 2: Exploration (Positioning)
│   │   ├── Services.tsx     # Act 2: Exploration (Services)
│   │   ├── Process.tsx      # Act 3: Process
│   │   ├── Work.tsx         # Portfolio work showcase
│   │   ├── Proof.tsx        # Act 4: Proof
│   │   ├── Pricing.tsx      # Pricing information
│   │   └── Contact.tsx      # Act 5: Connection
│   ├── hooks/
│   │   ├── useThemeFlip.tsx      # Theme switching logic
│   │   ├── useThemePortal.ts     # Portal transition hook
│   │   └── useReducedMotion.ts   # Accessibility hook
│   ├── assets/              # SVG emblems and static assets
│   ├── shaders/             # GLSL shader files
│   ├── styles/              # Global CSS and Tailwind config
│   └── utils/               # Helper functions
├── docs/
│   ├── PRD-ORBIT-SYSTEM.md       # Product requirements
│   ├── IMPLEMENTATION-CHECKLIST.md
│   └── architecture/             # Technical documentation
└── dist/                    # Production build output
```

---

## 🎯 Key Concepts

### The Scroll Narrative

**Core principle:** You don't watch the brand. You move through it.

The emblem is composed of **32 radials** (SVG path elements) that exist as a unified system. The scroll experience tells a story:

| Section | Emblem State | Purpose |
|---------|--------------|---------|
| **Hero** | Assembles | Brand arrives |
| **Positioning** | Scales up, centers | Brand takes the stage |
| **Tunnel In** | You pass THROUGH it | Color invert via traversal |
| **Services** | Absent | Capabilities in light world |
| **Tunnel Out** | You pass back | Return to dark |
| **Process** | Morphs/breathes | Brand at work |
| **Reveal** | Aperture SNAPS | Payoff moment |
| **Work** | Viewfinder framing | Results |
| **Contact** | Recedes | Resolution |

See **[Scroll Sequence Architecture](./docs/SCROLL-SEQUENCE-ARCHITECTURE.md)** for full implementation details.

### The Tunnel (Color Invert)

The color invert isn't a wipe you watch — it's a threshold you cross. You scroll *through* the emblem center using a WebGL shader tunnel, emerging into the inverted color space.

- Three.js shader with radial spokes and rings creating depth
- `uFadeToWhite` uniform handles the color transition
- Physical traversal, not passive observation

### The Morphing Emblem (Process)

During Process, the emblem breathes and twists behind the content:

```typescript
const explosionRadius = useTransform(scrollYProgress, [0.05, 0.5, 0.95], [0, 250, 0]);
const rotation = useTransform(scrollYProgress, [0, 1], [0, -360]);
```

Radials expand outward while the whole form counter-rotates. The brand working, iterating, refining.

### The Aperture Snap (Reveal)

The aperture animates on **time**, not scroll. A scroll threshold triggers a 400-600ms spring animation. Decisiveness sells the moment — scrubbing feels mushy.

### Motion Language

**Easing curves by emotional intent:**
- **Assembly**: `cubic-bezier(0.25, 0.46, 0.45, 0.94)` - Confident arrival
- **Orbit**: `cubic-bezier(0.33, 1, 0.68, 1)` - Perpetual motion
- **Machine**: `cubic-bezier(0.68, -0.55, 0.265, 1.55)` - Mechanical precision
- **Portal**: `cubic-bezier(0.87, 0, 0.13, 1)` - Gravitational pull

---

## ⚡ Performance

### Optimization Strategies
- GPU-accelerated transforms only (`transform`, `opacity`)
- RequestAnimationFrame for smooth animations
- Intersection Observer for scroll detection
- Progressive enhancement with CSS fallbacks
- Lazy loading for heavy 3D scenes
- Maximum 200 well-choreographed particles

### Target Metrics
- **60 FPS** minimum for all animations
- **< 100ms** interaction response time
- **Lighthouse Performance** > 90
- **Zero accessibility violations**

### Reduced Motion Support
All animations respect `prefers-reduced-motion` media query:
```typescript
const prefersReducedMotion = useReducedMotion();
// Animations automatically simplified or disabled
```

---

## 🎨 Design System

### Color Palette
```css
:root {
  --bg: 10 10 10;        /* #0A0A0A - near black */
  --fg: 245 245 245;     /* #F5F5F5 - near white */
  --accent: 0 255 255;   /* #00FFFF - cyan (surgical use) */
}
```

### Typography Scale
- **h0**: `clamp(48px, 10vw, 128px)` - Hero headlines
- **h1**: `clamp(34px, 6.8vw, 72px)` - Section titles
- **h2**: `clamp(24px, 3.4vw, 40px)` - Subsections
- **p**: `clamp(16px, 1.4vw, 18px)` - Body text

---

## 🧪 Philosophy

> **70% Clarity, 30% Magic**

Every animation must earn its complexity by enhancing comprehension, not competing with it. This isn't just about Awwwards recognition—it's about demonstrating competence through restraint.

### Guiding Principles
1. **Purpose Over Flash** - Every motion serves the narrative
2. **Performance First** - 60 FPS is non-negotiable
3. **Accessibility Always** - Beautiful for everyone
4. **Mobile Matters** - Simplified but not diminished
5. **Real Users Win** - Test with non-technical users

---

## 🗺️ Roadmap

### Phase 1: Core Scrollytelling ✅
- [x] Base section structure with smooth scrolling
- [x] Theme flip and portal transitions
- [x] Basic scroll-driven animations

### Phase 2: Emblem State Machine ✅
- [x] OrbitSystem context
- [x] 5 core animation states
- [x] Velocity-based responses

### Phase 3: 3D Integration 🚧
- [ ] Particle field for Positioning section
- [ ] Data visualization for Proof section
- [ ] SVG-to-WebGL handoff

### Phase 4: Polish & Refinement
- [ ] Add one perfect surprise moment
- [ ] User testing with non-technical users
- [ ] Performance optimization
- [ ] Cross-browser testing

---

## 📚 Documentation

For detailed specifications and implementation guides, see:
- **[Scroll Sequence Architecture](./docs/SCROLL-SEQUENCE-ARCHITECTURE.md)** - The definitive guide to section flow and emblem states
- [Product Requirements Document](./docs/PRD-ORBIT-SYSTEM.md)
- [Implementation Checklist](./docs/IMPLEMENTATION-CHECKLIST.md)
- [Architecture Documentation](./docs/architecture/)

---

## 👨‍💻 Author

**Gary Walker**

---

## 📄 License

Private - All rights reserved

---

## 🙏 Acknowledgments

### Design Inspiration
- [Active Theory](https://activetheory.net/) - Cinematic transitions
- [Locomotive](https://locomotive.ca/) - Scroll-driven storytelling
- [Zajno Motion](https://motion.zajno.com/) - Surprise moments

### Technology
Built with love using the incredible work of the [Poimandres](https://pmnd.rs/) collective and the React community.

---

<div align="center">

**[Documentation](./docs) • [Architecture](./docs/architecture) • [PRD](./docs/PRD-ORBIT-SYSTEM.md)**

*The emblem isn't just a logo — it's a living orbital system representing the creative process*

</div>

