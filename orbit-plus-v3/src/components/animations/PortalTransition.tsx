import { motion, useSpring, useTransform } from "framer-motion";

type Props = {
  active: boolean;
  // expects CSS vars --emblem-x / --emblem-y set by EmblemNav
  invertTo?: "light" | "dark"; // which theme to set at peak
  duration?: number; // ms
};

export function PortalTransition({ active, invertTo = "light", duration = 700 }: Props) {
  // Target radius large enough to cover viewport
  const r = Math.hypot(window.innerWidth, window.innerHeight);

  const t = useSpring(active ? 1 : 0, { stiffness: 180, damping: 24, mass: 0.6 });
  const clip = useTransform(t, v => {
    const radius = v * (r * 0.75) + 1; // ~75% of diagonal
    const x = getComputedStyle(document.documentElement).getPropertyValue("--emblem-x") || `${window.innerWidth - 80}px`;
    const y = getComputedStyle(document.documentElement).getPropertyValue("--emblem-y") || `80px`;
    return `circle(${radius}px at ${x.trim()} ${y.trim()})`;
  });

  // Flip theme precisely at mid animation
  if (active) {
    setTimeout(() => { document.documentElement.dataset.theme = invertTo; }, duration * 0.5);
  }

  return (
    <motion.div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1000,
        clipPath: clip,
        WebkitClipPath: clip,
        background: "var(--fg)", // invert through foreground color over bg
        filter: "blur(0.4px)"    // *very* subtle edge softness
      }}
    />
  );
}