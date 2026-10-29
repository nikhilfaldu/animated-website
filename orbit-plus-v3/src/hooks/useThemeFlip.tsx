import { useEffect, useRef } from "react";

// Global theme flip with Process section exception
export function useThemeFlip(threshold = 0.52) {
  const processOverrideRef = useRef(false);

  useEffect(() => {
    // Prefer precise section-based flip for Pricing (ensures emblem goes white)
    const doc = document.documentElement;
    const pricing = document.getElementById("pricing");
    let pricingObserver: IntersectionObserver | null = null;

    if (pricing && "IntersectionObserver" in window) {
      pricingObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry) return;
          if (entry.isIntersecting && entry.intersectionRatio > 0.15) {
            doc.dataset.theme = "dark"; // dark page → emblem white
          }
        },
        { root: null, threshold: [0, 0.15, 0.5, 0.85, 1] }
      );
      pricingObserver.observe(pricing);
    }

    const onScroll = () => {
      // If Pricing is in view, let the observer set theme
      if (pricingObserver) return;
      
      // Check if we're in the Process section (it handles its own theme)
      const processSection = document.querySelector('section[style*="height: 600vh"]');
      if (processSection) {
        const rect = processSection.getBoundingClientRect();
        const inProcess = rect.top <= 0 && rect.bottom > window.innerHeight;
        
        if (inProcess) {
          processOverrideRef.current = true;
          // Let Process section handle the theme
          return;
        } else if (processOverrideRef.current) {
          // Exiting Process section, reset to global theme logic
          processOverrideRef.current = false;
        }
      }

      // Global theme logic (for non-Process sections)
      const h = doc.scrollHeight - doc.clientHeight;
      const p = h > 0 ? window.scrollY / h : 0;
      const next = p > threshold ? "light" : "dark";
      if (doc.dataset.theme !== next) doc.dataset.theme = next;
    };
    
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      pricingObserver?.disconnect();
    };
  }, [threshold]);
}