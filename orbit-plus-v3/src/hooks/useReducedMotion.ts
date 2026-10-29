import { useState, useEffect } from 'react';

/**
 * Hook to detect if the user prefers reduced motion
 * Respects the prefers-reduced-motion media query
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check initial preference
    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery?.matches ?? false);

    // Listen for changes - handle both modern and legacy APIs
    const handleChange = (e: MediaQueryListEvent | Event) => {
      const matches = 'matches' in e ? e.matches : false;
      setPrefersReducedMotion(matches);
    };

    // Use addEventListener if available, fallback to addListener
    if (mediaQuery?.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else if (mediaQuery?.addListener) {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery?.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else if (mediaQuery?.removeListener) {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return prefersReducedMotion;
}