import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";


const steps: [string, string][] = [
  ["Discover", "Define the problem and the audience. Collect constraints."],
  ["Define", "Information architecture, narrative spine, and success metrics."],
  ["Design", "System, type, and motion language—coherent and unmistakable."],
  ["Develop", "Componentized build with performance and accessibility baked in."],
  ["Launch", "QA, analytics, and continuous refinement."]
];

export function Process() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ 
    target: sectionRef, 
    offset: ["start start", "end end"] 
  });

  // Theme switch when panel 5 starts sliding (after 80% scroll)
  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    const theme = progress > 0.85 ? "light" : "dark";
    if (document.documentElement.dataset.theme !== theme) {
      document.documentElement.dataset.theme = theme;
    }
  });

  // White wipe animation - moves with panel 5
  const whiteWipeX = useTransform(
    scrollYProgress,
    [0.8, 1], // When panel 5 starts sliding to when it's gone
    ["100%", "0%"] // White starts off-screen right, ends covering everything
  );

  const slideStart = steps.map((_, i) => i / steps.length);
  const slideEnd = steps.map((_, i) => (i + 0.9) / steps.length);
  const [panelTransforms, setPanelTransforms] = useState(() =>
    steps.map((_, index) => {
      const current = scrollYProgress.get();
      if (current <= slideStart[index]) return "0%";
      if (current >= slideEnd[index]) return "-100vw";
      const t = (current - slideStart[index]) / (slideEnd[index] - slideStart[index]);
      const clamped = Math.min(Math.max(t, 0), 1);
      return `${-100 * clamped}vw`;
    })
  );

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (value) => {
      setPanelTransforms((prev) => {
        const next = [...prev];
        for (let index = 0; index < steps.length; index++) {
          if (value <= slideStart[index]) {
            next[index] = "0%";
            continue;
          }
          if (value >= slideEnd[index]) {
            next[index] = "-100vw";
            continue;
          }
          const t = (value - slideStart[index]) / (slideEnd[index] - slideStart[index]);
          const clamped = Math.min(Math.max(t, 0), 1);
          next[index] = `${-100 * clamped}vw`;
        }
        return next;
      });
    });
    return () => unsubscribe();
  }, [scrollYProgress, slideEnd, slideStart]);
  
  return (
    <section 
      ref={sectionRef} 
      className="process-section"
      id="process"
      style={{ 
        position: "relative", 
        height: `${steps.length * 100}vh`
      }}
    >
      {/* Sticky container */}
      <div 
        style={{ 
          position: "sticky", 
          top: 0, 
          height: "100vh",
          width: "100%",
          overflow: "hidden",
          backgroundColor: "#0A0A0A" // Black background
        }}
      >
        {/* Background text layers - ALL BLACK */}
        {steps.map(([title, copy], i) => (
          <div
            key={`bg-${i}`}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: i + 1,
              backgroundColor: "#0A0A0A", // All content layers are black
              color: "#F5F5F5"
            }}
          >
            <div style={{ textAlign: "center", maxWidth: "800px", padding: "0 5vw" }}>
              <div className="kicker" style={{ marginBottom: "1rem" }}>
                Process — Stage {String(i + 1).padStart(2, "0")}
              </div>
              <h2 className="h1 display" style={{ marginBottom: "2rem" }}>
                {title}
              </h2>
              <p className="p" style={{ fontSize: "1.2rem" }}>
                {copy}
              </p>
            </div>
          </div>
        ))}

        {/* White wipe layer - animated to follow panel 5 */}
        <motion.div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "#F5F5F5",
            zIndex: 10, // Above content layers but below panels
            x: whiteWipeX // Animates from right to left
          }}
        />

        {/* Container for all panels - uses flex to ensure they're side by side */}
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          width: "100%",
          height: "100%"
        }}>
          {/* All 5 sliding panels - each takes 1/5 of the width */}
          {steps.map(([title, copy], i) => (
            <motion.div
              key={`panel-${i}`}
              style={{
                flex: "0 0 20%",
                height: "100%",
                backgroundColor: "#0A0A0A", // All panels are black
                borderRight: i < 4 ? "1px solid rgba(255,255,255,0.2)" : "none",
                x: panelTransforms[i],
                zIndex: 50 - i,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                position: "relative"
              }}
            >
              {/* Title on each panel - vertical, raised up */}
              <div 
                style={{ 
                  position: "absolute",
                  top: "25%",
                  right: "1rem",
                  writingMode: "vertical-rl",
                  textOrientation: "mixed",
                  fontSize: "1.5rem",
                  letterSpacing: "0.1em",
                  opacity: 0.9,
                  fontWeight: "300",
                  color: "#F5F5F5"
                }}
                className="h3"
              >
                {title}
              </div>
              
              {/* Descriptive text - HORIZONTAL in the middle */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "85%",
                  fontSize: "0.75rem",
                  lineHeight: 1.6,
                  opacity: 0.6,
                  textAlign: "center",
                  color: "#F5F5F5"
                }}
              >
                {copy}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
