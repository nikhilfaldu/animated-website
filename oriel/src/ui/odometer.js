// Rolling-digit odometer. Each digit is a vertical strip clipped to one cell; separators stay static.
// Columns turn like a mechanical counter: forward when the value rises, backward when it falls,
// lower-order columns travelling further. Screen readers get one plain copy of the current value.
import { gsap, EASE } from '../core/motion.js';
import { env } from '../core/env.js';

const numberFormat = new Intl.NumberFormat('en-IE', { maximumFractionDigits: 0 });
const defaultFormat = (value) => numberFormat.format(value);
const isDigit = (ch) => ch >= '0' && ch <= '9';
const shapeOf = (text) => text.replace(/\d/g, '#');
const mod10 = (n) => ((n % 10) + 10) % 10;

const span = (className, text) => {
  const node = document.createElement('span');
  node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

/**
 * @param {HTMLElement} el
 * @param {{ value?: number, format?: (n: number) => string, from?: number,
 *   duration?: number, stagger?: number, turns?: number }} [options]
 *   from: the value shown before the first set() (the accessible text always holds `value`);
 *   turns: max extra full turns a column makes on large changes (0 = shortest roll).
 * @returns {{ set(value: number, options?: { immediate?: boolean }): gsap.core.Timeline | null, get(): number, destroy(): void }}
 */
export function createOdometer(el, { value, format = defaultFormat, from, duration = 0.9, stagger = 0.04, turns = 1 } = {}) {
  const maxTurns = Math.max(0, Math.floor(turns));
  const cells = 10 * (maxTurns + 2);
  /** The accessible value, and the value the columns show (they differ until the first set()). */
  let current = Number(value ?? from ?? 0);
  let shown = Number(from ?? current);
  let columns = [];
  let shape = '';
  let timeline = null;

  const sr = span('sr-only');
  const visual = span('odo');
  visual.setAttribute('aria-hidden', 'true');

  function createColumn() {
    const col = span('odo__col');
    // Ten stacked, invisible digits give the column the widest digit's width and the text baseline.
    for (let d = 0; d < 10; d += 1) col.append(span('odo__ghost', String(d)));
    const strip = span('odo__strip');
    for (let i = 0; i < cells; i += 1) strip.append(span('odo__cell', String(i % 10)));
    col.append(strip);
    return { el: col, strip, pos: 0, fresh: false };
  }

  const draw = (column) => {
    column.strip.style.transform = `translateY(${(-100 * column.pos) / cells}%)`;
  };

  /** Builds columns for `text`; seed digits are right-aligned, missing leading ones start at 0. */
  function build(text, seed) {
    shape = shapeOf(text);
    const digitCount = text.replace(/\D/g, '').length;
    const nodes = [];
    columns = [];
    let k = digitCount - 1;
    for (const ch of text) {
      if (!isDigit(ch)) {
        nodes.push(span('odo__char', ch));
        continue;
      }
      const column = createColumn();
      const seeded = seed[seed.length - 1 - k];
      column.pos = seeded ?? 0;
      column.fresh = seeded == null;
      draw(column);
      columns.push(column);
      nodes.push(column.el);
      k -= 1;
    }
    visual.replaceChildren(...nodes);
  }

  const digitsOf = (text) => [...text].filter(isDigit).map(Number);
  const settle = () => {
    for (const column of columns) {
      column.pos = mod10(column.pos);
      column.fresh = false;
      draw(column);
      column.el.style.opacity = '';
    }
  };

  function set(next, { immediate = false } = {}) {
    const nextValue = Number(next);
    if (!Number.isFinite(nextValue)) return null;
    const previous = shown;
    current = nextValue;
    shown = nextValue;
    const text = format(nextValue);
    sr.textContent = text;
    if (nextValue === previous && timeline?.isActive()) return timeline;

    timeline?.kill();
    timeline = null;
    settle();

    if (shapeOf(text) !== shape) build(text, columns.map((c) => Math.round(c.pos) % 10));
    const targets = digitsOf(text);

    if (immediate || env.reducedMotion || nextValue === previous) {
      columns.forEach((column, i) => {
        column.pos = targets[i];
      });
      settle();
      return null;
    }

    const forward = nextValue > previous;
    const delta = Math.abs(nextValue - previous);
    timeline = gsap.timeline({ onComplete: settle });
    columns.forEach((column, i) => {
      const order = columns.length - 1 - i;
      const extra = Math.min(maxTurns, Math.floor(delta / 10 ** (order + 1)));
      const a = column.pos;
      const b = targets[i];
      const steps = mod10(forward ? b - a : a - b) + 10 * extra;
      if (column.fresh) timeline.fromTo(column.el, { opacity: 0 }, { opacity: 1, duration: duration * 0.6, ease: EASE.out }, i * stagger);
      if (steps < 1e-3) return;
      const start = forward ? a : b + steps;
      const end = forward ? a + steps : b;
      timeline.fromTo(column, { pos: start }, { pos: end, duration, ease: EASE.out, onUpdate: () => draw(column) }, i * stagger);
    });
    return timeline;
  }

  // Initial render: the template comes from `value`; `from` digits fill it right-aligned.
  const template = format(current);
  const seedText = from != null ? format(Number(from)) : template;
  el.replaceChildren(sr, visual);
  sr.textContent = template;
  build(template, digitsOf(seedText));
  settle();

  return {
    set,
    get: () => current,
    destroy() {
      timeline?.kill();
      timeline = null;
      el.textContent = format(current);
    },
  };
}
