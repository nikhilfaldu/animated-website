  Refined Brainstorm: Services Typography Elevation

  Based on research from https://tympanus.net/codrops/tag/typography/, https://www.awwwards.com/typography-heavy-design.html, https://24ways.org/2019/interactivity-and-animation-with-variable-fonts/, and https://motion.dev/docs/react-scroll-animations.

  ---
  Key Research Insights
  Source: https://tympanus.net/codrops/2023/12/05/on-scroll-sliced-text-animation/
  Technique: Grid-based text segmentation with staggered transforms
  Relevance to Your Zoom-Through: Fragments can converge during zoom approach, scatter during zoom-through
  ────────────────────────────────────────
  Source: https://tympanus.net/codrops/2024/11/06/how-to-create-an-organic-text-distortion-effect-with-infinite-scrolling/
  Technique: Sine/cosine wave displacement tied to scroll velocity
  Relevance to Your Zoom-Through: Characters ripple when scrolling fast, stabilize when slow
  ────────────────────────────────────────
  Source: https://blog.olivierlarose.com/tutorials/text-parallax
  Technique: Horizontal text slides driven by useTransform
  Relevance to Your Zoom-Through: Horizontal marquee exits viewport during vertical zoom
  ────────────────────────────────────────
  Source: https://valhead.com/2020/11/15/animating-variable-fonts-with-css/
  Technique: wght axis tied to scroll progress
  Relevance to Your Zoom-Through: Key words thicken as scroll approaches their section
  ────────────────────────────────────────
  Source: https://tympanus.net/codrops/2021/01/20/on-scroll-letter-animations/
  Technique: Per-letter translation based on scroll direction/speed
  Relevance to Your Zoom-Through: Letters compress toward anchor as zoom begins
  ---
  Direction A (Revised): "Converging Manifesto"

  Core insight from research: The Codrops sliced text technique shows that fragmented text converging creates anticipation. Combined with your zoom-through, this creates a visual "inhale" before the zoom "exhale."

  Behavior:
  SCROLL 0%           SCROLL 40%              SCROLL 60%+
  ──────────          ──────────              ────────────
  E V E R Y           EVERY                   [ZOOMING INTO ●]
  C H O I C E         CHOICE
  H A S               HAS
  A   J O B .         A JOB●

  [letters spread]    [letters converge]      [page scales from ●]

  Implementation with Framer Motion:
  // Per-character letter spacing tied to inverse scroll
  const letterSpacing = useTransform(
    scrollYProgress,
    [0, 0.4, 0.5],      // phases
    ['0.3em', '0em', '0em']  // spread → normal → hold
  );

  // Characters also translate toward anchor
  const charX = useTransform(
    scrollYProgress,
    [0, 0.4],
    [randomOffset, 0]  // deterministic offset per char
  );

  Why this works with zoom: The visual "compression" of text toward the anchor primes the eye for the zoom. When scale begins, text is already compact near the origin—maximizing visibility during transition.

  ---
  Direction B (Revised): "Velocity-Responsive Weight"

  Core insight: Variable font wght axis can be tied to scroll velocity (not just position). Fast scrolling = light weight (readable at speed). Slow scrolling = heavy weight (emphasis when attention is available).

  Behavior:
  FAST SCROLL         SLOW SCROLL / PAUSE
  ───────────         ───────────────────
  EVERY CHOICE        𝗘𝗩𝗘𝗥𝗬 𝗖𝗛𝗢𝗜𝗖𝗘
  HAS A JOB.          𝗛𝗔𝗦 𝗔 𝗝𝗢𝗕.

  (weight 300)        (weight 700)

  Font requirement: Syne is NOT variable. Would need to swap to:
  - Clash Display (variable, brutalist)
  - Satoshi (variable, geometric)
  - Space Grotesk (variable, technical)

  Implementation:
  // Get scroll velocity from Lenis
  const [velocity, setVelocity] = useState(0);
  useLenis(({ velocity: v }) => setVelocity(Math.abs(v)));

  // Map velocity to weight
  const fontWeight = useTransform(
    [velocity],
    ([v]) => Math.max(300, 700 - Math.min(v * 0.5, 400))
  );

  // Apply to text
  <motion.span style={{ fontWeight }}>
    Every choice has a job.
  </motion.span>

  Why this works with zoom: During fast scroll-through, text is light (less visual noise). When user pauses to read, weight increases naturally—no explicit reveal trigger needed.

  ---
  Direction C (Revised): "Horizontal Exit / Vertical Persist"

  Core insight from https://blog.olivierlarose.com/tutorials/text-parallax: Horizontal text with nowrap and translateX exits the viewport laterally while a vertical element stays centered.

  Layout:
  ┌──────────────────────────────────────────────┐
  │                                              │
  │  ──── EVERY CHOICE HAS A JOB ────────►      │  ← horizontal marquee, exits left
  │                                              │
  │                 STRATEGY●                    │  ← stays centered (anchor)
  │                                              │
  └──────────────────────────────────────────────┘

  Behavior: As scroll increases, horizontal tagline translates left (eventually off-screen). Title stays fixed at anchor. When zoom begins, only the title is visible—clean transition.

  Implementation:
  const taglineX = useTransform(
    scrollYProgress,
    [0, 0.4],
    ['0%', '-100%']  // slides out left
  );

  <motion.div className="absolute w-[200%] whitespace-nowrap" style={{ x: taglineX }}>
    EVERY CHOICE HAS A JOB · EVERY CHOICE HAS A JOB ·
  </motion.div>

  Why this works with zoom: Horizontal exit is orthogonal to vertical zoom—no collision. Marquee repetition means text is visible longer during exit. Title isolation at zoom moment is guaranteed.

  ---
  Distilled Copy (Final)

  Applying the "survives 0.5s visibility" rule with anchor preservation:
  ┌──────────┬─────────────────────┬───────────────────────────────┐
  │ Service  │ Title (with anchor) │      Tagline (5-7 words)      │
  ├──────────┼─────────────────────┼───────────────────────────────┤
  │ Strategy │ Strategy●           │ Every choice earns its place. │
  ├──────────┼─────────────────────┼───────────────────────────────┤
  │ Design   │ Des●gn              │ One continuous sentence.      │
  ├──────────┼─────────────────────┼───────────────────────────────┤
  │ Build    │ Bu●ld               │ Evolve without breaking.      │
  └──────────┴─────────────────────┴───────────────────────────────┘
  Anchor notes:
  - Strategy: Period anchor (existing)
  - Design: i-dot anchor (existing, requires clip-path on "i")
  - Build: i-dot moved to title (simpler than lede anchor)

  SR-only fallback (for SEO/accessibility):
  <span class="sr-only">
    Clarity before craft. We map the narrative, market, and decision path
    so every design choice has a job.
  </span>

  ---
  Recommendation Matrix
  ┌─────────────────────────┬────────────┬──────────────────────────┬─────────────────────────────┐
  │        Direction        │ Complexity │       Font Change        │          Best For           │
  ├─────────────────────────┼────────────┼──────────────────────────┼─────────────────────────────┤
  │ A: Converging Manifesto │ Medium     │ No (Syne works)          │ Maximum zoom cohesion       │
  ├─────────────────────────┼────────────┼──────────────────────────┼─────────────────────────────┤
  │ B: Velocity Weight      │ High       │ Yes (need variable font) │ Sophisticated kinetic feel  │
  ├─────────────────────────┼────────────┼──────────────────────────┼─────────────────────────────┤
  │ C: Horizontal Exit      │ Low        │ No                       │ Quick win, clean separation │
  └─────────────────────────┴────────────┴──────────────────────────┴─────────────────────────────┘
  My pick: Direction A with the converging letter behavior. It's the most cohesive with your zoom mechanic, doesn't require font changes, and creates that brutalist "text as object" aesthetic you're after.

  ---
  Next Steps

  1. Prototype Direction A in a sandbox to validate the convergence timing with your existing zoom phases
  2. Test copy distillation with the 5-7 word taglines in situ
  3. Consider hybrid: Direction A behavior + Direction C horizontal marquee as secondary layer