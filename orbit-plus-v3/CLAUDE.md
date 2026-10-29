# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Agents-First Rule

**Use specialized agents (subagents) for tasks whenever possible.**

Before doing work, evaluate if a specialized agent can handle the task better:

1. **Codebase exploration/research** → Use `Explore` agent (subagent_type="Explore")
2. **Feature architecture/planning** → Use `feature-dev:code-architect` agent
3. **Code review** → Use `feature-dev:code-reviewer` agent
4. **Deep code analysis** → Use `feature-dev:code-explorer` agent
5. **Animation/motion design** → Use `animation-director` agent
6. **Scroll-based interactions** → Use `scroll-master` agent
7. **Layout/component structure** → Use `layout-architect` agent
8. **Performance/accessibility audits** → Use `performance-a11y-auditor` agent
9. **Component system/design tokens** → Use `component-system-builder` agent
10. **Refactoring** → Use `code-refactor-steward` agent
11. **Multi-step complex tasks** → Use `general-purpose` agent

**Agents provide:**
- Better context management
- Specialized expertise
- More thorough analysis
- Reduced errors

**Use direct tools (Read, Edit, Grep, etc.) when:**
- The task is trivially simple (single file read, small edit)
- No appropriate agent exists for the task type
- You need quick, targeted information retrieval

---

# Skills-First Rule

**Check for and use relevant skills before starting any task.**

Before doing work, evaluate if a skill applies:

1. **Frontend/UI design** → Use `frontend-design` or `frontend-design-pro` skill
2. **PDF creation/manipulation** → Use `document-skills:pdf` skill
3. **Spreadsheets (xlsx, csv)** → Use `document-skills:xlsx` skill
4. **Word documents** → Use `document-skills:docx` skill
5. **Presentations** → Use `document-skills:pptx` skill
6. **Visual art/posters** → Use `document-skills:canvas-design` skill
7. **Generative/algorithmic art** → Use `document-skills:algorithmic-art` skill
8. **MCP server development** → Use `document-skills:mcp-builder` skill
9. **Web app testing** → Use `document-skills:webapp-testing` skill
10. **GIFs for Slack** → Use `document-skills:slack-gif-creator` skill
11. **Theming/styling artifacts** → Use `document-skills:theme-factory` skill
12. **Complex web artifacts** → Use `document-skills:web-artifacts-builder` skill
13. **Documentation writing** → Use `document-skills:doc-coauthoring` skill
14. **Creating new skills** → Use `document-skills:skill-creator` skill

**Skills provide:**
- Domain-specific knowledge and best practices
- Optimized workflows for specific file types
- Quality guidelines and checklists
- Specialized tools and utilities

**How to use skills:**
- Invoke with the `Skill` tool: `Skill(skill: "frontend-design")`
- Skills load context and instructions for the specific task type
- Follow the skill's guidance exactly

---

# Archon-First Rule

For task management scenarios:
1. Check if Archon MCP server is available
2. Use Archon task management as the primary system
3. Use Archon instead of TodoWrite for this project

# PROJECT ID

**Project ID**: 3c6aeda4-d65b-40e9-a295-90ad77f2f442 (Orbit-Plus V3 Knowledge Collection)

<coding_guidelines>
## Simplicity & Focus

Keep coding logic simple and straightforward. Avoid over-engineering:
- Only make changes that are directly requested or clearly necessary. Keep solutions simple and focused.
- Don't add features, refactor code, or make "improvements" beyond what was asked. A bug fix doesn't need surrounding code cleaned up. A simple feature doesn't need extra configurability.
- Don't add error handling, fallbacks, or validation for scenarios that can't happen. Trust internal code and framework guarantees. Only validate at system boundaries (user input, external APIs). Don't use backwards-compatibility shims when you can just change the code.
- Don't create helpers, utilities, or abstractions for one-time operations. Don't design for hypothetical future requirements. The right amount of complexity is the minimum needed for the current task. Reuse existing abstractions where possible and follow the DRY principle.

## Code Exploration

Read and understand relevant files before proposing code edits. Do not speculate about code you have not inspected. If a user references a specific file/path, open and inspect it before explaining or proposing fixes. Be rigorous and persistent in searching code for key facts. Thoroughly review the style, conventions, and abstractions of the codebase before implementing new features or abstractions.
</coding_guidelines>

# Archon Integration & Workflow

This project uses Archon MCP server for knowledge management, task tracking, and project organization. Start with Archon MCP server task management.

## Core Workflow: Task-Driven Development

**Task cycle before coding:**

1. **Get Task** → `find_tasks(task_id="...")` or `find_tasks(filter_by="status", filter_value="todo")`
2. **Start Work** → `manage_task("update", task_id="...", status="doing")`
3. **Research** → Use knowledge base (see RAG workflow below)
4. **Implement** → Write code based on research
5. **Review** → `manage_task("update", task_id="...", status="review")`
6. **Next Task** → `find_tasks(filter_by="status", filter_value="todo")`

**Don't skip task updates. Check current tasks before coding.**

## RAG Workflow (Research Before Implementation)

### Searching Specific Documentation:
1. **Get sources** → `rag_get_available_sources()` - Returns list with id, title, url
2. **Find source ID** → Match to documentation (e.g., "Supabase docs" → "src_abc123")
3. **Search** → `rag_search_knowledge_base(query="vector functions", source_id="src_abc123")`

### General Research:
```bash
# Search knowledge base (2-5 keywords only!)
rag_search_knowledge_base(query="authentication JWT", match_count=5)

# Find code examples
rag_search_code_examples(query="React hooks", match_count=3)
```

## Project Workflows

### New Project:
```bash
# 1. Create project
manage_project("create", title="My Feature", description="...")

# 2. Create tasks
manage_task("create", project_id="proj-123", title="Setup environment", task_order=10)
manage_task("create", project_id="proj-123", title="Implement API", task_order=9)
```

### Existing Project:
```bash
# 1. Find project
find_projects(query="auth")  # or find_projects() to list all

# 2. Get project tasks
find_tasks(filter_by="project", filter_value="proj-123")

# 3. Continue work or create new tasks
```

## Tool Reference

**Projects:**
- `find_projects(query="...")` - Search projects
- `find_projects(project_id="...")` - Get specific project
- `manage_project("create"/"update"/"delete", ...)` - Manage projects

**Tasks:**
- `find_tasks(query="...")` - Search tasks by keyword
- `find_tasks(task_id="...")` - Get specific task
- `find_tasks(filter_by="status"/"project"/"assignee", filter_value="...")` - Filter tasks
- `manage_task("create"/"update"/"delete", ...)` - Manage tasks

**Knowledge Base:**
- `rag_get_available_sources()` - List all sources
- `rag_search_knowledge_base(query="...", source_id="...")` - Search docs
- `rag_search_code_examples(query="...", source_id="...")` - Find code

## Important Notes

- Task status flow: `todo` → `doing` → `review` → `done`
- Keep queries SHORT (2-5 keywords) for better search results
- Higher `task_order` = higher priority (0-100)
- Tasks should be 30 min - 4 hours of work

## Project Overview

Orbit+ v3 is an interactive creative manifesto for brands, built with React, TypeScript, Three.js, and Framer Motion. The application features a fixed emblem that responds to scroll events and transforms through different states, with smooth scrolling powered by Lenis.

## Commands

### Development
- `npm run dev` - Start dev server on port 5173 with auto-open
- `npm run build` - Type-check and build for production
- `npm run preview` - Preview production build on port 5175

### Code Quality
- `npm run lint` - Run ESLint on TypeScript files
- `npm run type-check` - Run TypeScript compiler without emitting files
- `npm run analyze` - Build with bundle visualizer to analyze bundle size

### Maintenance
- `npm run clean` - Remove dist, node_modules, and .vite directories

## Architecture

### Core System: OrbitSystem

The application is built around a centralized state management system called `OrbitSystem` (src/context/OrbitSystem.tsx:1), which provides:

- **5 Core States**: `idle`, `assembly`, `orbit`, `data`, `vortex` - each with predefined transform configurations
- **Motion Values**: Reactive x, y, z, scale, rotateX/Y/Z, opacity, originX/Y using Framer Motion
- **Scroll Integration**: `scrollProgress` and `scrollVelocity` motion values for scroll-based effects
- **Control Methods**:
  - `setState()` - Immediate state change (no animation)
  - `animateTo()` - Animated state transition with custom duration
  - `setCustomTransform()` - Direct manipulation of transform properties

Access OrbitSystem via `useOrbitSystem()` hook. Must be used within `<OrbitSystemProvider>`.

### Application Structure

1. **App.tsx** - Root component wrapped in `LenisProvider` → `OrbitSystemProvider`
   - `GlobalCanvas` (z-57): Persistent R3F Canvas hosting WebGL scenes (TunnelInScene, etc.)
   - Fixed emblem component (z-56, responds to scroll)
   - `WorkBridgeOverlay`: 4 animated exposure windows bridging Reveal → Work
   - `ScrollIndicator`: Appears after hero text, fades before Positioning
   - Global navigation
   - `ScrollController` wrapping all sections

2. **Smooth Scrolling** - Powered by Lenis (src/components/LenisProvider.tsx:1)
   - Custom easing: `(t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))`
   - Automatic anchor link handling
   - Access via `useLenis()` hook, returns `{ lenis: Lenis | null }`

3. **Sections** - Exported from src/sections/index.ts
   - Hero, Positioning, TunnelIn, Services, Process, Reveal, Work, Proof, Pricing, Contact
   - Each section can interact with OrbitSystem to trigger emblem transformations

### Path Aliases

Configured in both tsconfig.json and vite.config.ts:
- `@/*` → `./src/*`
- `@components/*` → `./src/components/*`
- `@sections/*` → `./src/sections/*`
- `@hooks/*` → `./src/hooks/*`
- `@utils/*` → `./src/utils/*`
- `@context/*` → `./src/context/*`
- `@assets/*` → `./src/assets/*`
- `@shaders/*` → `./src/shaders/*`

Always use these aliases instead of relative imports.

### Styling

- **TailwindCSS** for utility classes
- **CSS Variables** for theming:
  - `--bg` / `--fg` for background/foreground (RGB format)
  - `--accent` for accent color (HSL format)
  - `--radius` for border radius
  - `--transition` for transition duration
- **Custom animations**: `slow-rotate`, `fade-in`, `fade-up`, `scale-in`
- Global styles in src/styles/globals.css

<frontend_aesthetics>
## Frontend Design Quality

Create creative, distinctive frontends that surprise and delight. Avoid generic "AI slop" aesthetics.

**Focus on:**
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt for distinctive choices that elevate aesthetics.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Draw from IDE themes and cultural aesthetics for inspiration.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Framer Motion for React. Focus on high-impact moments: one well-orchestrated page load with staggered reveals creates more delight than scattered micro-interactions.
- **Backgrounds**: Create atmosphere and depth rather than defaulting to solid colors. Layer CSS gradients, use geometric patterns, or add contextual effects that match the overall aesthetic.

**Avoid:**
- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character

Interpret creatively and make unexpected choices that feel genuinely designed for the context. Vary between light and dark themes, different fonts, different aesthetics.
</frontend_aesthetics>

### WebGL Visual System (GlobalCanvas)

The application features a unified WebGL visual system for tunnel/transition effects. Core principle: **"The emblem IS the tunnel"** - same 32 radials morph between emblem and tunnel states.

**Architecture:**
- `GlobalCanvas` (z-57): Persistent R3F Canvas hosting all WebGL scenes
- `TunnelInScene`: Radials extend outward, converge for color invert (Positioning → Services)
- `TunnelOutScene`: Reverse tunnel animation (Services → Process)
- Orthographic camera with zoom=100 for 2D shader work

**SVG/WebGL Handoff:**
- SVG Emblem fades out as WebGL fades in (crossfade with overlap)
- Timing configured in `src/config/emblemConstants.ts`
- Both systems use same 32-blade geometry from `src/components/emblem/ApertureEmblem/bladeConfig.ts`

**Scroll Ranges** (normalized 0-1 in `src/config/scrollRanges.ts`):
| Section | Range | Notes |
|---------|-------|-------|
| hero | 0.000-0.045 | SVG assembly |
| positioning | 0.045-0.182 | SVG scales, moves left |
| tunnelIn | 0.195-0.293 | WebGL radial extension/convergence |
| services | 0.293-0.488 | White world (panel system) |
| process | 0.488-0.732 | Workflow panels with WebGL canvas |
| reveal | 0.732-0.805 | Baton handoff from WebGL to OrbitSystem |
| work | 0.805-0.952 | Portfolio/case studies |
| contact | 0.952-1.000 | Final CTA and contact form |

**Working with Tunnel Shaders:**
## Emblem Geometry: Single Source of Truth

**CRITICAL: All WebGL emblem rendering MUST use `BLADE_VERTICES` from `src/components/emblem/ApertureEmblem/bladeVertices.ts`**

The emblem is made of 32 trapezoid blade shapes, NOT radial lines. Any attempt to approximate with shader-drawn lines or BLADE_CONFIGS angles will NOT match the actual SVG.

### Source Files (in order of authority)

1. **`src/assets/white_emblem.svg`** - The original SVG with 32 blade paths. This is the ultimate source.

2. **`src/components/emblem/ApertureEmblem/bladeVertices.ts`** - Extracted vertex coordinates from the SVG. Each blade has 4 vertices: `[inner1, outer1, outer2, inner2]`. Use this for all WebGL mesh geometry.

3. **`src/components/emblem/ApertureEmblem/bladeConfig.ts`** - Derived metadata (angles, radii, lengths). Use ONLY for reference calculations, NOT for rendering geometry.

### How to Match SVG Emblem Size in WebGL

```typescript
import { BLADE_VERTICES } from '@/components/emblem/ApertureEmblem/bladeVertices';
import { useOrbitEmblemRect } from '@/components/emblem/ApertureEmblem/useOrbitEmblemRect';

// 1. Calculate blade bounds
const BLADE_BOUNDS = (() => {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  for (const blade of BLADE_VERTICES) {
    for (const v of blade) {
      minX = Math.min(minX, v.x);
      maxX = Math.max(maxX, v.x);
      minY = Math.min(minY, v.y);
      maxY = Math.max(maxY, v.y);
    }
  }
  return { width: maxX - minX, height: maxY - minY, centerX: (minX + maxX) / 2, centerY: (minY + maxY) / 2 };
})();

// 2. Measure actual SVG emblem
const orbitRect = useOrbitEmblemRect();

// 3. Calculate scale (with orthographic camera zoom=100)
const targetPx = Math.max(orbitRect.width, orbitRect.height);
const bladeSpan = Math.max(BLADE_BOUNDS.width, BLADE_BOUNDS.height);
const scale = targetPx / (100 * bladeSpan);

// 4. Center offset
const centerOffsetX = -BLADE_BOUNDS.centerX * scale;
const centerOffsetY = -BLADE_BOUNDS.centerY * scale;
```

### Reference Implementation

See `src/components/emblem/ApertureEmblem/IrisShutter.tsx` for the correct approach to WebGL emblem rendering using mesh geometry from BLADE_VERTICES.

**DO NOT:**
- Draw radial lines in shaders based on BLADE_CONFIGS angles
- Use magic numbers for emblem sizing
- Assume the emblem is symmetrical (it has a center offset)
- Skip measuring the actual SVG with `useOrbitEmblemRect()`

### Key Technologies

- **React 18** with TypeScript strict mode
- **Vite** with SWC for fast refresh
- **Three.js + R3F** (@react-three/fiber, @react-three/drei, @react-three/postprocessing)
- **Framer Motion** for animations
- **Lenis** for smooth scrolling
- **GLSL shaders** (vite-plugin-glsl supports .glsl, .vert, .frag)
- **Zustand** and **Valtio** for state management
- **Tone.js** for audio (if needed)

### Build Configuration

- Manual code splitting:
  - `react-vendor`: React core
  - `three-vendor`: Three.js ecosystem
  - `animation-vendor`: Framer Motion
  - `utils`: clsx, tailwind-merge, uuid
- Target: esnext with esbuild minification
- Dev sourcemaps only

## Development Patterns

### Working with Emblem Transforms

To change emblem state in response to scroll or interactions:

```typescript
const { animateTo, setCustomTransform, currentState } = useOrbitSystem();

// Animate to predefined state
await animateTo('orbit', 1.5); // 1.5s duration

// Custom transform
setCustomTransform({
  scale: 1.3,
  rotateZ: 45,
  opacity: 0.8
});
```

### Smooth Scrolling to Elements

```typescript
const { lenis } = useLenis();

lenis?.scrollTo('#section-id', {
  offset: 0,
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
});
```

### Type-safe Motion Values

Motion values from OrbitSystem are typed and reactive. Use Framer Motion's `useTransform()` to derive values:

```typescript
const { scale, opacity } = useOrbitSystem();
const combinedOpacity = useTransform([scale, opacity], ([s, o]) => s * o);
```

## Node/NPM Requirements

- Node >= 20.0.0
- npm >= 10.0.0

## Vision Documentation

For detailed architectural decisions and implementation phases for the WebGL visual system, see:
- `.claude/docs/web-cohesion-vision.md` - Complete vision document with problem/solution analysis
- `.claude/docs/web-cohesion-architect.md` - Agent instructions for visual unity work

Use the `web-cohesion-architect` agent for tasks involving emblem/tunnel visual systems.