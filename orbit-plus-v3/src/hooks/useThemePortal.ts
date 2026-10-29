import { useCallback, useEffect, useRef, useState } from "react";

export function useThemePortal(duration = 700) {
  const [active, setActive] = useState(false);
  const guardRef = useRef(0);

  const open = useCallback(() => {
    const now = Date.now();
    if (now < guardRef.current) return;
    guardRef.current = now + duration + 200;
    setActive(true);
    setTimeout(() => setActive(false), duration);
  }, [duration]);

  // Optional: respect reduced motion → no portal, just flip
  const prefersReduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  useEffect(() => {
    if (!active || !prefersReduced) return;
    setActive(false);
  }, [active, prefersReduced]);

  return { active, open };
}