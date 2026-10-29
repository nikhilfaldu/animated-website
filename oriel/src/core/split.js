// Accessible word splitting. Screen readers get one unsplit copy; the split words are aria-hidden.
// Elements containing links, buttons or form controls are never split.

const INTERACTIVE = 'a, button, input, select, textarea, [tabindex], [role="link"], [role="button"]';

function splitNode(node, words) {
  if (node.nodeType === Node.TEXT_NODE) {
    const frag = document.createDocumentFragment();
    for (const part of node.textContent.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        frag.append(document.createTextNode(' '));
        continue;
      }
      const outer = document.createElement('span');
      outer.className = 'w';
      const inner = document.createElement('span');
      inner.className = 'w-i';
      inner.textContent = part;
      outer.append(inner);
      frag.append(outer);
      words.push(inner);
    }
    return frag;
  }
  if (node.nodeType === Node.ELEMENT_NODE) {
    if (node.tagName === 'BR') return node.cloneNode();
    const shell = node.cloneNode(false);
    node.childNodes.forEach((child) => shell.append(splitNode(child, words)));
    return shell;
  }
  return document.createDocumentFragment();
}

/**
 * Wraps each word of `el` in `.w > .w-i`. Returns null when the element can't be split safely.
 * @param {HTMLElement} el
 * @param {{ mask?: boolean }} [options]
 */
export function splitWords(el, { mask = true } = {}) {
  if (!el || el.dataset.split === 'true' || el.querySelector(INTERACTIVE)) return null;

  const original = el.innerHTML;
  const text = el.textContent.replace(/\s+/g, ' ').trim();
  const words = [];

  const visual = document.createElement('span');
  visual.className = mask ? 'split' : 'split split--nomask';
  visual.setAttribute('aria-hidden', 'true');
  el.childNodes.forEach((child) => visual.append(splitNode(child, words)));

  const accessible = document.createElement('span');
  accessible.className = 'sr-only';
  accessible.textContent = text;

  el.replaceChildren(accessible, visual);
  el.dataset.split = 'true';

  return {
    el,
    words,
    revert() {
      el.innerHTML = original;
      delete el.dataset.split;
    },
  };
}
