import { motion, useMotionValueEvent, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
// import { useEmblemOrchestrator } from "../../hooks/useEmblemOrchestrator";

const STEPS: [string, string][] = [
  ["Discover", "Define the problem, the audience, and the core constraints. We listen first."],
  ["Define", "Establish the narrative spine, information architecture, and the metrics for success."],
  ["Design", "Create a coherent visual system—type, motion, and identity—that is unmistakably yours."],
  ["Develop", "Build a performant, accessible, component-based site ready for the future."],
  ["Launch", "Final QA, analytics integration, and a plan for continuous refinement and growth."]
];

const NUM_STEPS = STEPS.length;

export function ProcessNew() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { margin: "-50%" });

  const { rotation: emblemRotation, setImmediate: setEmblemImmediate } = useEmblemOrchestrator();
  const startRotationRef = useRef(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"]
  });

  useEffect(() => {
    if (isInView) {
      startRotationRef.current = emblemRotation.get();
    }
  }, [isInView, emblemRotation]);
  
  const rotation = useTransform(scrollYProgress, [0, 1], [0, 360]);

  useMotionValueEvent(rotation, "change", (latest) => {
    if (isInView) {
      setEmblemImmediate({ rotation: startRotationRef.current + latest });
    }
  });

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    if (!isInView) return;
    const step3Start = 2 / NUM_STEPS;
    const step5Start = 4 / NUM_STEPS;
    const theme = (progress > step3Start && progress < step5Start) ? "light" : "dark";
    if (document.documentElement.dataset.theme !== theme) {
      document.documentElement.dataset.theme = theme;
    }
  });

  const progressCircleRadius = 30;
  const progressCircleCircumference = 2 * Math.PI * progressCircleRadius;
  const strokeDashoffset = useTransform(scrollYProgress, [0, 1], [progressCircleCircumference, 0]);

  // *** THE FIX IS HERE ***
  // We use a state to hold the active step, forcing React to re-render.
  const [activeStep, setActiveStep] = useState(0);
  const currentStepIndex = useTransform(scrollYProgress, p => Math.min(NUM_STEPS - 1, Math.floor(p * NUM_STEPS)));
  
  useMotionValueEvent(currentStepIndex, "change", (latest) => {
    setActiveStep(latest);
  });
  // *** END OF FIX ***

  return (
    <section
      ref={sectionRef}
      id="process"
      style={{
        position: "relative",
        height: `${NUM_STEPS * 100}vh`,
        background: 'var(--bg)'
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          width: "100%",
          overflow: "hidden",
        }}
      >
        <AnimatePresence initial={false}>
          {STEPS.map(([title, copy], i) => (
            // Now we check against the 'activeStep' state, which triggers the animation
            activeStep === i && (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--bg)",
                  color: "var(--fg)",
                }}
              >
                <div style={{ textAlign: "center", maxWidth: "700px", padding: "0 5vw" }}>
                  <div className="kicker" style={{ marginBottom: "1rem" }}>
                    Process — Step {String(i + 1).padStart(2, "0")}
                  </div>
                  <motion.h2 
                    initial={{ y: 20 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="h1 display" style={{ marginBottom: "2rem" }}
                  >
                    {title}
                  </motion.h2>
                  <motion.p 
                    initial={{ y: 20 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="p" style={{ fontSize: "1.2rem", opacity: 0.8 }}
                  >
                    {copy}
                  </motion.p>
                </div>
              </motion.div>
            )
          ))}
        </AnimatePresence>

        <div
          style={{
            position: "absolute",
            bottom: "3rem",
            right: "3rem",
            width: "80px",
            height: "80px",
            zIndex: NUM_STEPS + 1,
            pointerEvents: "none"
          }}
        >
          <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="40" cy="40" r={progressCircleRadius} fill="none" stroke="currentColor" strokeWidth="1" style={{ opacity: 0.2 }} />
            <motion.circle
              cx="40" cy="40" r={progressCircleRadius}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={progressCircleCircumference}
              style={{ strokeDashoffset }}
            />
          </svg>
          <motion.div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "currentColor"
            }}
          >
            {/* This also uses the state-backed value for reliability */}
            {activeStep + 1}
          </motion.div>
        </div>
      </div>
    </section>
  );
}