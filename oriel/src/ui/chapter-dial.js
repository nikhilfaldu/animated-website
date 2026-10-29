// Fixed mini dial (index, ≥ 900px): the hand follows page progress, the label names the chapter in
// view. Hidden over the hero and the footer. Purely decorative, so the whole widget is aria-hidden.
import { gsap, EASE } from '../core/motion.js';
import { env } from '../core/env.js';

const SIZE = 56;
const C = SIZE / 2;

/** @returns {() => void} destroy */
export function initChapterDial() {
  const sections = [...document.querySelectorAll('main [data-chapter]')];
  if (sections.length < 2) return () => {};

  const { root, hand, text } = build();
  document.body.append(root);

  const footer = document.querySelector('[data-footer]');
  const chapters = new Map(sections.map((section, i) => [section, { index: i, ...describe(section, i) }]));
  const inView = new Set();
  let current = null;
  let footerInView = false;

  // Lowest refresh priority: page length is only final once every pin above has been measured.
  const handTween = gsap.to(hand, {
    rotation: 360,
    svgOrigin: `${C} ${C}`,
    ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: env.reducedMotion ? true : 0.6, refreshPriority: -1 },
  });

  const render = () => {
    const active = sections.filter((s) => inView.has(s)).pop() ?? null;
    if (active && active !== current) {
      swapLabel(text, chapters.get(active), current ? chapters.get(current).index : -1);
      current = active;
    }
    const visible = Boolean(active) && active !== sections[0] && !footerInView;
    root.classList.toggle('is-visible', visible);
  };

  const chapterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => (e.isIntersecting ? inView.add(e.target) : inView.delete(e.target)));
      render();
    },
    { rootMargin: '-49% 0px -50% 0px' },
  );
  sections.forEach((s) => chapterObserver.observe(s));

  // The footer counts as "in view" once it reaches the dial's corner of the screen.
  const footerObserver = new IntersectionObserver(
    ([entry]) => {
      footerInView = entry.isIntersecting;
      render();
    },
    { rootMargin: '0px 0px -14% 0px' },
  );
  if (footer) footerObserver.observe(footer);

  return function destroy() {
    chapterObserver.disconnect();
    footerObserver.disconnect();
    handTween.scrollTrigger?.kill();
    handTween.kill();
    gsap.killTweensOf(text.children);
    root.remove();
  };
}

/** "§ 02" from the section's chapter mark when it has one, otherwise its position. */
function describe(section, i) {
  const mark = section.querySelector('.mark__num')?.textContent.trim() ?? '';
  return {
    num: mark.startsWith('§') ? mark : `§ ${String(i).padStart(2, '0')}`,
    name: section.dataset.chapter,
  };
}

function swapLabel(container, chapter, previousIndex) {
  const incoming = document.createElement('span');
  incoming.className = 'chapter-dial__item';
  const num = document.createElement('span');
  num.className = 'chapter-dial__num';
  num.textContent = chapter.num;
  const name = document.createElement('span');
  name.className = 'chapter-dial__name';
  name.textContent = chapter.name;
  incoming.append(num, name);

  const outgoing = [...container.children];
  container.append(incoming);

  if (env.reducedMotion || previousIndex < 0) {
    outgoing.forEach((el) => el.remove());
    return;
  }
  // Scrolling down, the new name rises from below; scrolling up, it drops in from above.
  const dir = chapter.index > previousIndex ? 1 : -1;
  gsap.fromTo(incoming, { yPercent: 100 * dir }, { yPercent: 0, duration: 0.55, ease: EASE.out });
  outgoing.forEach((el) => {
    gsap.killTweensOf(el);
    gsap.to(el, { yPercent: -100 * dir, duration: 0.55, ease: EASE.out, onComplete: () => el.remove() });
  });
}

function build() {
  // Twelve hour ticks; the quarters are longer and 12 o'clock is gold.
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    const at = (r) => [(C + Math.sin(a) * r).toFixed(2), (C - Math.cos(a) * r).toFixed(2)];
    const [x1, y1] = at(C - 4);
    const [x2, y2] = at(C - (i % 3 === 0 ? 10 : 7.5));
    const cls = i === 0 ? 'chapter-dial__tick chapter-dial__tick--major' : 'chapter-dial__tick';
    return `<line class="${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  }).join('');

  const root = document.createElement('div');
  root.className = 'chapter-dial';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = `
    <svg class="chapter-dial__face" viewBox="0 0 ${SIZE} ${SIZE}" focusable="false">
      <circle class="chapter-dial__rim" cx="${C}" cy="${C}" r="${C - 0.5}"/>
      ${ticks}
      <line class="chapter-dial__hand" x1="${C}" y1="${C + 5}" x2="${C}" y2="${C - 17}"/>
      <circle class="chapter-dial__pin" cx="${C}" cy="${C}" r="2"/>
    </svg>
    <span class="chapter-dial__text"></span>`;

  return { root, hand: root.querySelector('.chapter-dial__hand'), text: root.querySelector('.chapter-dial__text') };
}
