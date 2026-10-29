import gsap from 'gsap';

// The h1 ships as plain text in index.html so the name is in the initial
// HTML response; this splits it into per-letter spans only when animating.
export function enhanceHeroTitle({ animate = true } = {}) {
  const el = document.querySelector('.hero-title');
  const h1 = el.querySelector('h1');

  if (animate) {
    const name = h1.textContent;
    h1.setAttribute('aria-label', name);
    // Letters are grouped per word so line breaks only happen between
    // words — free-floating letter spans wrap mid-word on narrow screens.
    h1.innerHTML = name
      .split(' ')
      .map(
        (word) =>
          `<span class="hero-title__word" aria-hidden="true">${[...word]
            .map((ch) => `<span>${ch}</span>`)
            .join('')}</span>`,
      )
      .join(' ');
    gsap.from(h1.querySelectorAll('.hero-title__word > span'), {
      autoAlpha: 0,
      y: 24,
      duration: 0.8,
      stagger: 0.05,
      ease: 'power2.out',
      delay: 0.4,
    });
  }

  return {
    el,
    // progress is the [0,3] shader progress; the title is fully gone by
    // 0.35 (~12% of the pin) so the name owns the first screen only.
    setProgress(progress) {
      const t = Math.min(progress / 0.35, 1);
      el.style.opacity = 1 - t;
      el.style.transform = `translateY(${t * -30}px)`;
    },
  };
}
