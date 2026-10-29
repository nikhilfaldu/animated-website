import { useEffect, useRef, useState, createContext, useContext } from 'react';
import Lenis from 'lenis';

interface LenisContextValue {
  lenis: Lenis | null;
}

const LenisContext = createContext<LenisContextValue>({ lenis: null });

// eslint-disable-next-line react-refresh/only-export-components
export const useLenis = () => useContext(LenisContext);

interface LenisProviderProps {
  children: React.ReactNode;
  options?: {
    duration?: number;
    easing?: (t: number) => number;
    orientation?: 'vertical' | 'horizontal';
    gestureOrientation?: 'vertical' | 'horizontal' | 'both';
    smoothWheel?: boolean;
    smoothTouch?: boolean;
    wheelMultiplier?: number;
    touchMultiplier?: number;
    normalizeWheel?: boolean;
    infinite?: boolean;
  };
}

export function LenisProvider({
  children,
  options = {
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // https://www.desmos.com/calculator/brs54l4xou
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    smoothTouch: false,
    wheelMultiplier: 1,
    touchMultiplier: 2,
    normalizeWheel: true,
    infinite: false,
  }
}: LenisProviderProps) {
  const lenisRef = useRef<Lenis | null>(null);
  const rafIdRef = useRef<number | null>(null);
  // Use state to trigger re-render when Lenis is initialized
  const [lenisInstance, setLenisInstance] = useState<Lenis | null>(null);

  useEffect(() => {
    // Initialize Lenis
    const lenis = new Lenis({
      ...options,
      // Ensure scroll wrapper is properly set
      wrapper: window,
      content: document.documentElement,
    });

    lenisRef.current = lenis;
    setLenisInstance(lenis);

    // RAF loop for Lenis
    function raf(time: number) {
      lenis.raf(time);
      rafIdRef.current = requestAnimationFrame(raf);
    }

    rafIdRef.current = requestAnimationFrame(raf);

    // Expose lenis to window for debugging
    if (typeof window !== 'undefined') {
      (window as unknown as { lenis: Lenis }).lenis = lenis;
    }

    // Handle anchor links
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a[href^="#"]');
      
      if (anchor && anchor instanceof HTMLAnchorElement) {
        const href = anchor.getAttribute('href');
        if (href && href !== '#') {
          e.preventDefault();
          const targetElement = document.querySelector(href);
          if (targetElement instanceof HTMLElement) {
            lenis.scrollTo(targetElement, {
              offset: 0,
              duration: 1.2,
              easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            });
          }
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);

    return () => {
      document.removeEventListener('click', handleAnchorClick);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      lenis.destroy();
      setLenisInstance(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // options should not change after mount

  return (
    <LenisContext.Provider value={{ lenis: lenisInstance }}>
      {children}
    </LenisContext.Provider>
  );
}
