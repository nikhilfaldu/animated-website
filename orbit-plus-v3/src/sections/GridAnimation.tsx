import { motion, motionValue, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "framer-motion";
import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOrbitSystem } from "@/context/OrbitSystem";

// --- Data Definitions (Adapted for Orbital) ---
interface CellDefinition {
  id: string; row: number; column: number; baseColor: string; accentColor: string;
}
const CELLS: CellDefinition[] = [
  { id: "r1c1", row: 1, column: 1, baseColor: "transparent", accentColor: "transparent" }, 
  { id: "r1c2", row: 1, column: 2, baseColor: "#e9e9e9", accentColor: "#f5f5f5" },
  { id: "r1c3", row: 1, column: 3, baseColor: "transparent", accentColor: "transparent" }, 
  { id: "r1c4", row: 1, column: 4, baseColor: "transparent", accentColor: "transparent" },
  { id: "r2c1", row: 2, column: 1, baseColor: "#e9e9e9", accentColor: "#f5f5f5" }, 
  { id: "r2c2", row: 2, column: 2, baseColor: "transparent", accentColor: "transparent" },
  { id: "r2c3", row: 2, column: 3, baseColor: "#e9e9e9", accentColor: "#f5f5f5" }, 
  { id: "r2c4", row: 2, column: 4, baseColor: "#e9e9e9", accentColor: "#f5f5f5" },
  { id: "r4c1", row: 4, column: 1, baseColor: "#b4b4b4", accentColor: "#d0d0d0" }, 
  { id: "r4c2", row: 4, column: 2, baseColor: "#b4b4b4", accentColor: "#d0d0d0" },
  { id: "r4c3", row: 4, column: 3, baseColor: "#b4b4b4", accentColor: "#d0d0d0" }, 
  { id: "r4c4", row: 4, column: 4, baseColor: "transparent", accentColor: "transparent" },
  { id: "r6c1", row: 6, column: 1, baseColor: "transparent", accentColor: "transparent" }, 
  { id: "r6c2", row: 6, column: 2, baseColor: "#6f6f6f", accentColor: "#8a8a8a" },
  { id: "r6c3", row: 6, column: 3, baseColor: "#6f6f6f", accentColor: "#8a8a8a" }, 
  { id: "r6c4", row: 6, column: 4, baseColor: "#6f6f6f", accentColor: "#8a8a8a" },
  { id: "r8c1", row: 8, column: 1, baseColor: "#3b3b3b", accentColor: "#505050" }, 
  { id: "r8c2", row: 8, column: 2, baseColor: "transparent", accentColor: "transparent" },
  { id: "r8c3", row: 8, column: 3, baseColor: "#3b3b3b", accentColor: "#505050" }, 
  { id: "r8c4", row: 8, column: 4, baseColor: "#3b3b3b", accentColor: "#505050" },
];
const LOCK_SEQUENCE = ["r1c2", "r2c4", "r4c1", "r6c2"];
const GRID_TOP_PADDING = 400;
const GRID_BOTTOM_PADDING = 8;

const BOX_CONTENT: Record<string, { title: string; subtitle: string }> = {
  "r1c2": { title: "Tier One", subtitle: "Looks custom. Feels custom. \nBecause it is custom." },
  "r2c4": { title: "Tier Two", subtitle: "This is the part where you lap everyone.\n\nTwice." },
  "r4c1": { title: "Tier Three", subtitle: "Your brand in high-definition. \nCrystal clear and impossible to ignore." },
  "r6c2": { title: "Custom Pricing", subtitle: "You're at the chef's table now. \nWhat are we creating?" },
};

const PRICING_TIERS = [
    { id: "tier-1", row: 3, stage: 1, label: "Tier One $$", gridColumn: "1 / 3" },
    { id: "tier-2", row: 5, stage: 2, label: "Tier Two $$", gridColumn: "2 / 4" },
    { id: "tier-3", row: 7, stage: 3, label: "Tier Three $$", gridColumn: "3 / 5" },
];

const CELL_LOOKUP = CELLS.reduce<Record<string, CellDefinition>>((acc, cell) => { acc[cell.id] = cell; return acc; }, {});
const LOCK_ROWS = LOCK_SEQUENCE.map((id) => CELL_LOOKUP[id].row);
const cellRows = [...new Set(CELLS.map(s => s.row))].sort((a, b) => a - b);
const DESTINATION_ROWS = LOCK_ROWS.map(startRow => { const currentRowIndex = cellRows.findIndex(r => r === startRow); return cellRows[currentRowIndex + 1]; });
const LOCK_INDEX = LOCK_SEQUENCE.reduce<Record<string, number>>((acc, id, index) => { acc[id] = index; return acc; }, {});
const GRID_ROW_TEMPLATE = ["var(--cellSize)", "var(--cellSize)", "var(--labelSize)", "var(--cellSize)", "var(--labelSize)", "var(--cellSize)", "var(--labelSize)", "var(--cellSize)"].join(" ");

// Orbital motion helpers
const getSpiralOffset = (progress: number, index: number) => {
  const angle = progress * Math.PI * 2 + index * 0.3;
  return {
    x: Math.sin(angle) * 8,
    rotate: progress * 180 * (index % 2 === 0 ? 1 : -1),
  };
};

const getOrbitGlow = (isActive: boolean, stage: number) => {
  if (!isActive) return 'none';
  const intensity = 20 + stage * 10;
  return `0 0 ${intensity}px hsl(194 100% 50% / 0.6), 0 0 ${intensity * 2}px hsl(194 100% 50% / 0.3)`;
};

// Orbital tick marks component
interface TickMarksProps {
  size: number;
  count?: number;
  isActive: boolean;
}

const TickMarks = ({ size, count = 16, isActive }: TickMarksProps) => {
  const ticks = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 360;
    return angle;
  });

  return (
    <svg
      style={{
        position: 'absolute',
        inset: -2,
        width: size + 4,
        height: size + 4,
        pointerEvents: 'none',
      }}
      viewBox={`0 0 ${size + 4} ${size + 4}`}
    >
      {ticks.map((angle, i) => {
        const radius = size / 2;
        const centerX = (size + 4) / 2;
        const centerY = (size + 4) / 2;
        const x1 = centerX + Math.cos((angle - 90) * Math.PI / 180) * (radius - 1);
        const y1 = centerY + Math.sin((angle - 90) * Math.PI / 180) * (radius - 1);
        const x2 = centerX + Math.cos((angle - 90) * Math.PI / 180) * (radius + 2);
        const y2 = centerY + Math.sin((angle - 90) * Math.PI / 180) * (radius + 2);
        
        return (
          <motion.line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={isActive ? "hsl(194 100% 50%)" : "currentColor"}
            strokeWidth={0.5}
            initial={{ opacity: 0 }}
            animate={{ opacity: isActive ? 0.8 : 0.3 }}
            transition={{ delay: i * 0.01, duration: 0.3 }}
          />
        );
      })}
    </svg>
  );
};

// Orbital connection lines overlay
interface OrbitalConnectionsProps {
  cellSize: number;
  activeStage: number;
}

const OrbitalConnections = ({ cellSize, activeStage }: OrbitalConnectionsProps) => {
  if (cellSize === 0) return null;
  
  // Define connections between locked cells (based on LOCK_SEQUENCE)
  const connections = [
    { from: { row: 1, col: 2 }, to: { row: 2, col: 4 }, stage: 0 }, // r1c2 -> r2c4
    { from: { row: 2, col: 4 }, to: { row: 4, col: 1 }, stage: 1 }, // r2c4 -> r4c1
    { from: { row: 4, col: 1 }, to: { row: 6, col: 2 }, stage: 2 }, // r4c1 -> r6c2
  ];
  
  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="orbital-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(194 100% 50%)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="hsl(194 100% 50%)" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      {connections.map((conn, i) => {
        const gap = 12; // matches --gap
        const fromX = (conn.from.col - 1) * (cellSize + gap) + cellSize / 2;
        const fromY = 0; // Simplified - would need full row calculation
        const toX = (conn.to.col - 1) * (cellSize + gap) + cellSize / 2;
        const toY = 100; // Simplified
        
        const isActive = activeStage >= conn.stage;
        
        return (
          <motion.line
            key={i}
            x1={fromX}
            y1={fromY}
            x2={toX}
            y2={toY}
            stroke="url(#orbital-gradient)"
            strokeWidth={1.5}
            strokeDasharray="4 6"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: isActive ? 1 : 0,
              opacity: isActive ? 0.4 : 0 
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        );
      })}
    </svg>
  );
};

interface ParallaxTextProps {
  content: string;
  color: string;
  yOffset: MotionValue<number>;
  rotation?: number;
}

const ParallaxText = ({ content, color, yOffset, rotation = 0 }: ParallaxTextProps) => {
  const y = useTransform(yOffset, (value: number) => value * 0.05);

  return (
    <motion.div style={{ y }}>
      <div style={{
        fontFamily: 'Shrikhand, cursive',
        fontSize: '1.8rem',
        lineHeight: 1.4,
        color: color,
        fontWeight: 400,
        textShadow: color === '#0a0a0a'
          ? '1px 1px 2px rgba(0,0,0,0.25)'
          : '1px 1px 3px rgba(0,0,0,0.6)',
        transform: `translateY(-5%) rotate(${rotation}deg)`,
        whiteSpace: 'pre-line',
        transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }}>
        {content}
      </div>
    </motion.div>
  );
};

export const GridAnimation = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [cellSize, setCellSize] = useState(0);
  const [stage, setStage] = useState(0);
  
  // Integrate with orbit system for consistent motion language
  const { scrollProgress } = useOrbitSystem();

  const { scrollYProgress: animationProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  
  // Sync with global scroll progress
  useEffect(() => {
    const unsubscribe = animationProgress.on('change', (v) => {
      scrollProgress.set(v);
    });
    return unsubscribe;
  }, [animationProgress, scrollProgress]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const computeMetrics = () => {
      const availableWidth = section.getBoundingClientRect().width * 0.8;
      if (availableWidth === 0) return;
      const gapValue = getComputedStyle(section).getPropertyValue("--gap");
      const gap = Number.parseFloat(gapValue) || 0;
      setCellSize((availableWidth - gap * 3) / 4);
    };
    computeMetrics();
    const resizeObserver = new ResizeObserver(computeMetrics);
    resizeObserver.observe(section);
    return () => resizeObserver.disconnect();
  }, []);
  
  const { totalDistance, alignmentSteps, handoffOffsets, labelSize } = useMemo(() => {
    if (cellSize <= 0) return { totalDistance: 0, alignmentSteps: [], handoffOffsets: [], labelSize: 0 };
    const gapValue = getComputedStyle(document.documentElement).getPropertyValue("--gap");
    const gap = Number.parseFloat(gapValue) || 12;
    const calculatedLabelSize = Math.max(0, cellSize / 3 - gap * 2);
    const rowHeights = [cellSize, cellSize, calculatedLabelSize, cellSize, calculatedLabelSize, cellSize, calculatedLabelSize, cellSize];
    const rowTops: number[] = [];
    let currentTop = 0;
    for (const height of rowHeights) { rowTops.push(currentTop); currentTop += height + gap; }
    const steps = LOCK_ROWS.map((startRow, i) => {
        const fromRowIndex = startRow - 1;
        const toRowIndex = DESTINATION_ROWS[i] - 1;
        return toRowIndex < rowTops.length ? rowTops[toRowIndex] - rowTops[fromRowIndex] : 0;
    });
    const offsets: number[] = [];
    let runningTotal = 0;
    for (const step of steps) { runningTotal += step; offsets.push(runningTotal); }
    const distance = offsets[offsets.length - 1] || 0;
    return { totalDistance: distance, alignmentSteps: steps, handoffOffsets: offsets, labelSize: calculatedLabelSize };
  }, [cellSize]);

  const yOffsets = useMemo(() => LOCK_SEQUENCE.map(() => motionValue(0)), []);
  const cumulativeOffset = useTransform(animationProgress, [0, 1], [0, -totalDistance]);

  const stageFromTravel = useCallback((travelled: number) => {
    let nextStage = 0;
    for (const threshold of handoffOffsets) { if (travelled >= threshold) nextStage++; else break; }
    return Math.min(nextStage, LOCK_SEQUENCE.length);
  }, [handoffOffsets]);

  const handleTravelChange = useCallback((value: number) => {
    const travelled = -value;
    const nextStage = stageFromTravel(travelled);
    setStage(prev => prev === nextStage ? prev : nextStage);
    const stageStartOffsets = [0, ...handoffOffsets];
    const currentStage = Math.min(nextStage, alignmentSteps.length -1);
    const startOffset = stageStartOffsets[currentStage] ?? 0;
    const segmentDistance = alignmentSteps[currentStage] ?? 0;
    const delta = travelled - startOffset;
    const correction = segmentDistance > 0 ? Math.min(Math.max(delta, 0), segmentDistance) : 0;
    
    yOffsets.forEach((y, index) => {
      if (index < currentStage) {
        y.set(alignmentSteps[index]);
      } else if (index === currentStage) {
        y.set(correction);
      } else {
        y.set(0);
      }
    });
  }, [alignmentSteps, handoffOffsets, stageFromTravel, yOffsets]);

  useMotionValueEvent(cumulativeOffset, "change", handleTravelChange);
  useEffect(() => { handleTravelChange(cumulativeOffset.get()); }, [cumulativeOffset, handleTravelChange]);

  const clampedStage = Math.min(stage, LOCK_SEQUENCE.length - 1);
  
  // Add perspective and 3D depth
  const gridStyles: CSSProperties & Record<string, string> = {
    display: "grid", 
    "--cellSize": `${cellSize}px`, 
    "--labelSize": `${labelSize}px`,
    gridTemplateColumns: "repeat(4, 1fr)", 
    gridTemplateRows: GRID_ROW_TEMPLATE,
    gap: "var(--gap)", 
    width: "100%", 
    maxWidth: `calc(4 * var(--cellSize) + 3 * var(--gap))`, 
    margin: "0 auto",
    perspective: "2000px",
    transformStyle: "preserve-3d",
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', backgroundColor: "#030303", paddingTop: `${GRID_TOP_PADDING}px`, paddingBottom: `${GRID_BOTTOM_PADDING}px`, overflow: 'hidden' }}>
      {/* Orbital background pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.03,
        background: `radial-gradient(circle at 50% 50%, transparent 30%, hsl(194 100% 50% / 0.1) 100%)`,
        pointerEvents: 'none',
      }} />
      
      <div style={{
        position: 'absolute', top: '160px', left: '50%', transform: 'translateX(-50%)',
        textTransform: 'uppercase', letterSpacing: '.14em', fontSize: '.8rem', opacity: '.7', color: '#fff'
      }}>Pricing</div>
      
      <section ref={sectionRef} style={{
        height: totalDistance > 0 ? `calc(100vh + ${totalDistance}px)` : "100vh",
        position: "relative", backgroundColor: "transparent", color: "#fff",
        fontFamily: "sans-serif", "--gap": "clamp(8px, 1vw, 12px)",
      } as CSSProperties} id="options">
        <div style={{
            position: "sticky", top: `${GRID_TOP_PADDING}px`, height: `calc(100vh - ${GRID_TOP_PADDING}px)`,
            display: "flex", alignItems: "flex-start", justifyContent: "center", overflow: "visible",
          }}>
          <div style={{ width: '80%', position: 'relative' }}>
            {/* Orbital connection lines */}
            <OrbitalConnections cellSize={cellSize} activeStage={clampedStage} />
            
            <motion.div className="the-grid" style={{ ...gridStyles, y: cumulativeOffset }}>
              {CELLS.map((cellDef) => {
                const lockIndex = LOCK_INDEX[cellDef.id];
                const isLocked = lockIndex !== undefined;
                const isActive = isLocked && lockIndex === clampedStage;
                const progressValue = animationProgress.get();
                const spiralEffect = isLocked ? getSpiralOffset(progressValue, lockIndex) : { x: 0, rotate: 0 };
                
                if (!isLocked) {
                  return (
                    <div 
                      key={cellDef.id} 
                      style={{ 
                        gridRow: `${cellDef.row} / span 1`, 
                        gridColumn: `${cellDef.column} / span 1`, 
                        background: cellDef.baseColor === 'transparent' 
                          ? 'transparent' 
                          : `radial-gradient(circle at 30% 30%, ${cellDef.accentColor}, ${cellDef.baseColor})`,
                        borderRadius: "50%",
                        border: cellDef.baseColor !== 'transparent' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                        position: 'relative',
                      }} 
                    />
                  );
                }
                
                const boxContent = BOX_CONTENT[cellDef.id];
                return (
                  <motion.div 
                    key={cellDef.id} 
                    style={{
                      gridRow: `${cellDef.row} / span 1`, 
                      gridColumn: `${cellDef.column} / span 1`,
                      background: `radial-gradient(circle at 30% 30%, ${cellDef.accentColor}, ${cellDef.baseColor})`,
                      borderRadius: "50%",
                      border: isActive ? '2px solid hsl(194 100% 50%)' : '1px solid rgba(255,255,255,0.1)',
                      y: yOffsets[lockIndex],
                      x: spiralEffect.x,
                      rotate: spiralEffect.rotate,
                      zIndex: isActive ? 10 : 1, 
                      display: 'flex', 
                      flexDirection: 'column',
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      padding: '12px', 
                      textAlign: 'center',
                      position: 'relative',
                      boxShadow: getOrbitGlow(isActive, lockIndex),
                      transformStyle: 'preserve-3d',
                      filter: isActive ? 'blur(0px)' : 'blur(0.5px)',
                    }}
                    animate={{
                      scale: isActive ? [1, 1.05, 1] : 1,
                    }}
                    transition={{
                      scale: {
                        duration: 2,
                        repeat: isActive ? Infinity : 0,
                        ease: "easeInOut",
                      }
                    }}
                  >
                    {/* Tick marks around active cells */}
                    {cellSize > 0 && <TickMarks size={cellSize} count={24} isActive={isActive} />}
                    
                    {boxContent && (
                      <ParallaxText
                        content={boxContent.subtitle}
                        color={lockIndex < 2 ? '#0a0a0a' : '#ffffff'}
                        yOffset={yOffsets[lockIndex]}
                        rotation={spiralEffect.rotate * 0.1}
                      />
                    )}
                  </motion.div>
                );
              })}
              
              {PRICING_TIERS.map((tier) => (
                <motion.div
                  key={tier.id}
                  style={{
                    gridRow: `${tier.row} / span 1`, 
                    gridColumn: tier.gridColumn, 
                    display: "flex",
                    alignItems: "center", 
                    justifyContent: "center", 
                    color: 'hsl(194 100% 50%)',
                    fontSize: `calc(var(--labelSize) * 0.8)`, 
                    letterSpacing: "0.1em",
                    fontWeight: 600,
                    textShadow: clampedStage === tier.stage 
                      ? '0 0 20px hsl(194 100% 50% / 0.6)' 
                      : 'none',
                  }}
                  animate={{ 
                    opacity: clampedStage === tier.stage ? 1 : 0,
                    scale: clampedStage === tier.stage ? [1, 1.02, 1] : 1,
                  }}
                  transition={{ 
                    opacity: { duration: 0.3 },
                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                  }}
                >
                  {tier.label}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};