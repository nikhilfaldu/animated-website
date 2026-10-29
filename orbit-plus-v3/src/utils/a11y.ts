/**
 * Accessibility Utilities
 *
 * Part of Clarity & Magic Guardrails - ensures non-visual state changes
 * are announced to screen readers.
 *
 * Reference: docs/stories/8. STORY-clarity-magic-guardrails.md Section 7
 */

/**
 * Announce a message to screen readers via ARIA live region
 *
 * Uses requestAnimationFrame to ensure the announcement is picked up
 * by clearing and then setting the content in separate frames.
 *
 * @param message - The message to announce to screen readers
 *
 * @example
 * ```ts
 * announce('Constellation expanded — network aligned momentarily.');
 * announce('Form submitted successfully.');
 * announce('Proof Bloom activated.');
 * ```
 */
export function announce(message: string): void {
  const region = document.getElementById('live-region');

  if (!region) {
    console.warn('[a11y] Live region not found. Add <div id="live-region" /> to your app.');
    return;
  }

  // Clear first, then announce in next frame
  // This ensures screen readers pick up the change even if the same message is announced twice
  region.textContent = '';

  requestAnimationFrame(() => {
    region.textContent = message;
  });
}

/**
 * Focus management utilities
 */

/**
 * Trap focus within a container element (useful for modals/portals)
 *
 * @param container - The container element to trap focus within
 * @returns Cleanup function to remove the trap
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    // Shift + Tab (backwards)
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    }
    // Tab (forwards)
    else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  // Focus first element
  firstElement?.focus();

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Restore focus to a previously focused element
 *
 * @param element - The element to restore focus to
 */
export function restoreFocus(element: HTMLElement | null): void {
  if (element && document.contains(element)) {
    element.focus();
  }
}
