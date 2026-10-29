// src/sections/Work/Work.tsx
// Work section with unified selection system (hover, scroll, keyboard)

import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MOTION } from '@/styles/motion';
import { PROJECTS } from './workData';
import { useWorkSelection } from './useWorkSelection';
import { WorkViewfinder } from './WorkViewfinder';
import { WorkWatermark } from './WorkWatermark';

export function Work() {
  const prefersReducedMotion = useReducedMotion();
  const ids = useMemo(() => PROJECTS.map((p) => p.id), []);

  const sel = useWorkSelection({
    ids,
    rootMargin: '-35% 0px -35% 0px',
    threshold: [0.25, 0.5, 0.75],
  });

  const activeProject = useMemo(() => {
    return PROJECTS.find((p) => p.id === sel.displayId) ?? PROJECTS[0];
  }, [sel.displayId]);

  // Track announcement for screen readers (only on click/keyboard, not scroll)
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    // Only announce on click or keyboard selection, not scroll
    if (sel.state.source === 'click' || sel.state.source === 'keyboard') {
      setAnnouncement(`${activeProject.title} selected`);
    }
  }, [sel.state.activeId, sel.state.source, activeProject.title]);

  const [rect, setRect] = useState<DOMRect | null>(null);

  // Keep rect in sync with displayId + resize/scroll
  useEffect(() => {
    let raf = 0;

    const measure = () => {
      const el = sel.getCardEl(sel.displayId);
      if (!el) return;
      setRect(el.getBoundingClientRect());
    };

    const measureSoon = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    measureSoon();
    window.addEventListener('resize', measureSoon);
    window.addEventListener('scroll', measureSoon, { passive: true });

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', measureSoon);
      window.removeEventListener('scroll', measureSoon);
    };
  }, [sel, sel.displayId]);

  const slice = activeProject?.sliceIndex ?? 0;

  return (
    <section id="work" className="section min-h-[140vh] pt-24 relative bg-black text-white">
      <div className="relative mx-auto max-w-6xl px-6">
        {/* Screen reader announcement for selection changes (click/keyboard only) */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {announcement}
        </div>

        <WorkWatermark sliceIndex={slice} visible={!prefersReducedMotion} />
        <WorkViewfinder rect={rect} visible={!prefersReducedMotion} />

        {/* Header */}
        <motion.header
          className="relative z-10 mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: prefersReducedMotion ? 0 : MOTION.d.medium, ease: MOTION.ease.clarity }}
        >
          <h2 className="h1 display">Built for Impact.</h2>
          <p className="mt-4 max-w-2xl mx-auto text-white/70">
            Scroll, hover, or tab through. The selection system is unified across input modes.
          </p>
        </motion.header>

        {/* Project Grid */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-8">
          {PROJECTS.slice(0, 4).map((project, index) => {
            const isActive = sel.displayId === project.id;

            return (
              <motion.article
                key={project.id}
                id={`work-card-${project.id}`}
                data-work-id={project.id}
                ref={sel.registerCardRef(project.id)}
                tabIndex={0}
                role="button"
                aria-label={`${project.title}${project.category ? ` - ${project.category}` : ''}. ${project.description}`}
                aria-pressed={isActive}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-black"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: prefersReducedMotion ? 0 : MOTION.d.medium, delay: prefersReducedMotion ? 0 : index * 0.1, ease: MOTION.ease.clarity }}
                onMouseEnter={() => sel.setHovered(project.id)}
                onMouseLeave={() => sel.setHovered(null)}
                onFocus={() => {
                  sel.setFocused(project.id);
                  sel.setActive(project.id, 'keyboard');
                }}
                onBlur={() => sel.setFocused(null)}
                onClick={() => sel.setActive(project.id, 'click')}
                animate={{
                  borderColor: isActive ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.10)',
                }}
              >
                {/* Screenshot layer */}
                <div className="aspect-[3/2] bg-white/5 relative overflow-hidden">
                  {project.screenshotUrl ? (
                    <img
                      src={project.screenshotUrl}
                      alt={`Screenshot of ${project.title}`}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{
                        objectPosition: project.previewFocalPoint ?? '50% 50%',
                        filter: isActive ? 'blur(0px)' : 'blur(2px)',
                        transform: 'scale(1.03)',
                        opacity: 0.72,
                        transition: prefersReducedMotion ? 'none' : 'filter 0.3s ease',
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white/20 text-sm">{project.category ?? 'Project'}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
                </div>

                {/* Text content */}
                <div className="relative z-10 p-6">
                  <div className="text-xs tracking-[0.18em] text-white/80 h-4">
                    {isActive ? 'ACTIVE' : ''}
                  </div>
                  <h3 className={`mt-2 text-lg font-semibold ${prefersReducedMotion ? '' : 'group-hover:translate-x-1 transition-transform'}`}>
                    {project.title}
                  </h3>
                  {project.category && (
                    <p className="text-sm uppercase tracking-wider opacity-50 mb-3">
                      {project.category}
                    </p>
                  )}
                  <p className="text-sm text-white/70">{project.description}</p>

                  {project.href && (
                    <div className="mt-5 flex items-center gap-3 text-sm text-white/70">
                      <span className="inline-block h-[1px] w-10 bg-white/20" />
                      <a
                        href={project.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-white transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Visit Site
                      </a>
                    </div>
                  )}
                </div>

                {/* Active state micro response */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={false}
                  animate={{ opacity: isActive ? 1 : 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="absolute inset-0 ring-1 ring-white/10 rounded-2xl" />
                </motion.div>
              </motion.article>
            );
          })}
        </div>

        {/* Index ticks */}
        <div className="relative z-10 mt-10 flex justify-center gap-2">
          {PROJECTS.slice(0, 4).map((p) => {
            const on = sel.displayId === p.id;
            return (
              <motion.button
                key={p.id}
                type="button"
                className="h-11 w-11 md:h-8 md:w-8 rounded-full border border-white/15 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-black"
                style={{ background: 'transparent' }}
                onMouseEnter={() => sel.setHovered(p.id)}
                onMouseLeave={() => sel.setHovered(null)}
                onFocus={() => {
                  sel.setFocused(p.id);
                  sel.setActive(p.id, 'keyboard');
                }}
                onBlur={() => sel.setFocused(null)}
                onClick={() => sel.setActive(p.id, 'click')}
                aria-label={`Select ${p.title}`}
              >
                <motion.div
                  className="h-[2px] w-3 rounded-full bg-white/40"
                  initial={false}
                  animate={{
                    opacity: on ? 1 : 0.35,
                    scaleX: on ? 1.15 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                />
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
