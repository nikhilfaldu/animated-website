import { motion, type MotionValue, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

export type Rings2Ring = "Strategy" | "Design" | "Build";

type RingDatum = {
  r: number;
  label: Rings2Ring;
  outcome: string;
  dash?: boolean;
};

function clampNumber(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function isMotionValue(x: unknown): x is MotionValue<number> {
  if (typeof x !== "object" || x === null) return false;
  const maybe = x as { get?: unknown; on?: unknown };
  return typeof maybe.get === "function" && typeof maybe.on === "function";
}

export function Rings2({
  activeRing = null,
  interactive = true,
  className,
  energy = 0,
}: {
  activeRing?: Rings2Ring | null;
  interactive?: boolean;
  className?: string;
  energy?: number | MotionValue<number>;
}) {
  const [hoveredRing, setHoveredRing] = useState<Rings2Ring | null>(null);

  const ringData: RingDatum[] = useMemo(
    () => [
      { r: 90, label: "Strategy", outcome: "Positioning that resonates with your exact audience" },
      { r: 62, label: "Design", outcome: "Systems that scale without losing their soul", dash: true },
      { r: 34, label: "Build", outcome: "Performance first code that converts visitors into believers" },
    ],
    []
  );

  const displayRing = interactive ? hoveredRing ?? activeRing : activeRing;

  // Normalize energy to an internal MotionValue (no conditional hooks)
  const e = useMotionValue(0);

  useEffect(() => {
    if (isMotionValue(energy)) {
      e.set(clampNumber(energy.get(), 0, 1));
      const unsub = energy.on("change", (v) => e.set(clampNumber(v, 0, 1)));
      return () => {
        if (typeof unsub === "function") unsub();
      };
    } else {
      e.set(clampNumber(energy ?? 0, 0, 1));
    }
  }, [energy, e]);

  // Energy drives a subtle flare + global stroke lift
  const flareOpacity = useTransform(e, [0, 1], [0, 0.22]);
  const flareScale = useTransform(e, [0, 1], [1, 1.08]);

  const generateTicks = (r: number, count: number = 24) => {
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
      const x1 = 100 + Math.cos(angle) * (r - 1);
      const y1 = 100 + Math.sin(angle) * (r - 1);
      const x2 = 100 + Math.cos(angle) * (r + 1);
      const y2 = 100 + Math.sin(angle) * (r + 1);
      return { x1, y1, x2, y2 };
    });
  };

  const ringStyle = {
    position: "relative",
    width: "60vmin",
    height: "60vmin",
    // CSS var so SVG strokes can react to energy without per-element hooks
    "--ringE": e,
  } as React.CSSProperties;

  return (
    <motion.div
      className={className}
      style={ringStyle}
    >
      {/* Energy flare layer (this makes the rings feel alive at the cut) */}
      <motion.div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          opacity: flareOpacity,
          scale: flareScale,
          transformOrigin: "center",
          filter: "blur(10px)",
        }}
      >
        <svg viewBox="0 0 200 200" width="100%" height="100%">
          <circle cx="100" cy="100" r="92" fill="currentColor" opacity="0.05" />
          <circle cx="100" cy="100" r="64" fill="currentColor" opacity="0.05" />
          <circle cx="100" cy="100" r="36" fill="currentColor" opacity="0.05" />
        </svg>
      </motion.div>

      <svg viewBox="0 0 200 200" width="100%" height="100%" aria-hidden="true">
        {ringData.map(({ r, label, dash }) => {
          const isActive = displayRing === label;
          const cursor = interactive ? "pointer" : "default";

          // Energy lifts stroke width + opacity via CSS calc using --ringE
          const circleStyle: React.CSSProperties = {
            cursor,
            opacity: isActive ? "calc(0.95 + var(--ringE) * 0.08)" : "calc(0.28 + var(--ringE) * 0.04)",
            strokeWidth: isActive ? "calc(3.25px + var(--ringE) * 1.0px)" : "calc(2px + var(--ringE) * 0.5px)",
          };

          const tickStyle: React.CSSProperties = {
            opacity: isActive ? "calc(0.55 + var(--ringE) * 0.18)" : "calc(0.32 + var(--ringE) * 0.12)",
            pointerEvents: "none",
          };

          return (
            <g key={label}>
              <motion.circle
                r={r}
                cx="100"
                cy="100"
                fill="none"
                stroke="currentColor"
                strokeDasharray={dash ? "2 8" : "0 999"}
                style={circleStyle}
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.9 }}
                onMouseEnter={interactive ? () => setHoveredRing(label) : undefined}
                onMouseLeave={interactive ? () => setHoveredRing(null) : undefined}
              />

              {generateTicks(r, 24).map((tick, i) => (
                <motion.line
                  key={`${label}-tick-${i}`}
                  x1={tick.x1}
                  y1={tick.y1}
                  x2={tick.x2}
                  y2={tick.y2}
                  stroke="currentColor"
                  strokeWidth={1}
                  style={tickStyle}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: "-10% 0px" }}
                  transition={{ delay: 0.22 + i * 0.01, duration: 0.2 }}
                />
              ))}

              <motion.text
                x="100"
                y={100 - r + 10}
                textAnchor="middle"
                className="caption"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 0.65 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ delay: 0.25, duration: 0.4 }}
                style={{ pointerEvents: "none" }}
              >
                {label}
              </motion.text>
            </g>
          );
        })}
      </svg>

      <div
        style={{
          position: "absolute",
          bottom: "-3rem",
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          textAlign: "center",
          minHeight: "2rem",
        }}
      >
        {ringData.map(({ label, outcome }) => (
          <motion.p
            key={label}
            className="caption"
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: displayRing === label ? 1 : 0,
              y: displayRing === label ? 0 : 10,
            }}
            transition={{ duration: 0.18 }}
            style={{
              position: "absolute",
              width: "100%",
              left: 0,
              pointerEvents: "none",
            }}
          >
            {outcome}
          </motion.p>
        ))}
      </div>
    </motion.div>
  );
}
