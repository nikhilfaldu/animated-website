import {
    createContext,
    useContext,
    useCallback,
    useMemo,
    useState,
    useRef,
    useEffect,
    type ReactNode
  } from 'react';
  import {
    useMotionValue,
    useTransform,
    animate,
    type MotionValue,
    type AnimationPlaybackControls,
  } from 'framer-motion';
  
  // Simplified to 5 core states
  export type OrbitState = 'intro' | 'assembly' | 'idle' | 'orbit' | 'data' | 'vortex';
  
  // Transform with dynamic origin support (from V1)
  export interface OrbitTransform {
    x: number; // 0-100 viewport percentage (50 = center)
    y: number; // 0-100 viewport percentage (50 = center)
    z: number;
    scale: number;
    rotateX: number;
    rotateY: number;
    rotateZ: number;
    opacity: number;
    originX: number; // 0-100
    originY: number; // 0-100
  }
  
  // State configurations
  const STATE_CONFIGS: Record<OrbitState, Partial<OrbitTransform>> = {
    intro: {
      x: 50,
      y: 50,
      z: 0,
      scale: 0.35,
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      opacity: 0,
      originX: 50,
      originY: 50,
    },
    idle: {
      x: 50,
      y: 50,
      z: 0,
      scale: 1,
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      opacity: 1,
      originX: 50,
      originY: 50,
    },
    assembly: {
      x: 50,
      y: 50,
      z: 0,
      scale: 1,
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      opacity: 1, // Fully visible when assembled
      originX: 50, // Center origin (will transition to 0 for left-pin)
      originY: 50,
    },
    orbit: {
      x: 50,
      y: 50,
      z: 100,
      scale: 1.2,
      rotateX: 25,
      rotateY: 0,
      rotateZ: 0,
      opacity: 1,
      originX: 50,
      originY: 50,
    },
    data: {
      x: 50,
      y: 50,
      z: 0,
      scale: 1.5,
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      opacity: 1,
      originX: 50,
      originY: 50,
    },
    vortex: {
      x: 50,
      y: 50,
      z: -500,
      scale: 0.5,
      rotateX: 60,
      rotateY: 0,
      rotateZ: 360,
      opacity: 0.5,
      originX: 50,
      originY: 50,
    },
  };
  
  // Pre-assembly dispersed state (radials at rest, waiting for first scroll)
  interface OrbitSystemContextValue {
    // Motion values for reactive updates
    x: MotionValue<number>;
    y: MotionValue<number>;
    z: MotionValue<number>;
    scale: MotionValue<number>;
    rotateX: MotionValue<number>;
    rotateY: MotionValue<number>;
    rotateZ: MotionValue<number>;
    opacity: MotionValue<number>;
    originX: MotionValue<number>;
    originY: MotionValue<number>;

    // State management
    currentState: OrbitState;

    // Control methods
    setState: (state: OrbitState) => void;
    animateTo: (state: OrbitState, duration?: number) => Promise<void>;
    setCustomTransform: (
      transform: Partial<OrbitTransform>,
      options?: { animate?: boolean; duration?: number }
    ) => void;

    // Scroll progress (0-1)
    scrollProgress: MotionValue<number>;

    // Velocity for kinetic effects
    scrollVelocity: MotionValue<number>;

    // Activity state derived from velocity (for emblem dynamics)
    activityState: MotionValue<'active' | 'attentive'>;

    // Cross-component coordination (Clarity & Magic Guardrails)
    bloomSignal: MotionValue<number>; // Triggers bloom effects across components
    globalFocus: MotionValue<number>; // Vignette/focus narrowing coordination

    // Pre-computed velocity transform (clamped to 0-4 range)
    clampedVelocity: MotionValue<number>;

    // First-scroll detection (for hero assembly)
    hasFirstScrolled: boolean;
    introComplete: boolean;
    triggerFirstScroll: () => void;

    // Assembly progress (0-1) for tracking radial ingress
    assemblyProgress: MotionValue<number>;

    // Hero text readiness flag (triggers after intro + 300ms delay)
    heroTextReady: boolean;
  }
  
  const OrbitSystemContext = createContext<OrbitSystemContextValue | null>(null);
  
  interface OrbitSystemProviderProps {
    children: ReactNode;
  }
  
  export function OrbitSystemProvider({ children }: OrbitSystemProviderProps) {
    const [currentState, setCurrentState] = useState<OrbitState>('intro');
    const [hasFirstScrolled, setHasFirstScrolled] = useState(false);
    const [introComplete, setIntroComplete] = useState(false);
    const [heroTextReady, setHeroTextReady] = useState(false);
    // Track ALL animation controls for proper lifecycle management
  const animationControlsRef = useRef<AnimationPlaybackControls[]>([]);

    // Initialize motion values - start with assembly state values
    const INITIAL_STATE = STATE_CONFIGS.intro;
    const x = useMotionValue(INITIAL_STATE.x ?? 50);
    const y = useMotionValue(INITIAL_STATE.y ?? 50);
    const z = useMotionValue(INITIAL_STATE.z ?? 0);
    const scale = useMotionValue(INITIAL_STATE.scale ?? 1);
    const rotateX = useMotionValue(INITIAL_STATE.rotateX ?? 0);
    const rotateY = useMotionValue(INITIAL_STATE.rotateY ?? 0);
    const rotateZ = useMotionValue(INITIAL_STATE.rotateZ ?? 0);
    const opacity = useMotionValue(INITIAL_STATE.opacity ?? 1);
    const originX = useMotionValue(INITIAL_STATE.originX ?? 50);
    const originY = useMotionValue(INITIAL_STATE.originY ?? 50);
    const scrollProgress = useMotionValue(0);
    const scrollVelocity = useMotionValue(0);

    // Assembly progress tracker (0-1) - start at 0 so animation can play on mount
    const assemblyProgress = useMotionValue(0);

    // Clarity & Magic Guardrails - cross-component coordination
    const bloomSignal = useMotionValue(0);
    const globalFocus = useMotionValue(0);

    // Activity state derived from velocity (for emblem dynamics)
    const activityState = useTransform(scrollVelocity, (v) =>
      Math.abs(v) > 2.0 ? 'active' : 'attentive'
    ) as MotionValue<'active' | 'attentive'>;

    // Cancel all running animations helper
  const cancelAllAnimations = useCallback(() => {
    animationControlsRef.current.forEach(ctrl => {
      try { ctrl.stop(); } catch { /* already stopped */ }
    });
    animationControlsRef.current = [];
  }, []);

  // Set immediate state (no animation)
  const setState = useCallback((state: OrbitState) => {
    const config = STATE_CONFIGS[state];
    if (!config) return;

    // Cancel all running animations
    cancelAllAnimations();

    // Set values immediately
    const motionValues = { x, y, z, scale, rotateX, rotateY, rotateZ, opacity, originX, originY };
    Object.entries(config).forEach(([key, value]) => {
      const motionValue = motionValues[key as keyof typeof motionValues];
      if (motionValue) {
        motionValue.set(value as number);
      }
    });

    setCurrentState(state);
  }, [x, y, z, scale, rotateX, rotateY, rotateZ, opacity, originX, originY, cancelAllAnimations]);
    
  // Animate to state
  const animateTo = useCallback(async (state: OrbitState, duration = 1) => {
    const config = STATE_CONFIGS[state];
    if (!config) return;

    // Cancel all running animations
    cancelAllAnimations();

    // Animate all values and track controls
    const animations: Promise<void>[] = [];
    const motionValues = { x, y, z, scale, rotateX, rotateY, rotateZ, opacity, originX, originY };

    Object.entries(config).forEach(([key, value]) => {
      const motionValue = motionValues[key as keyof typeof motionValues];
      if (motionValue) {
        const ctrl = animate(motionValue, value as number, {
          duration,
          ease: [0.25, 0.46, 0.45, 0.94], // Custom easing
        });
        animationControlsRef.current.push(ctrl);
        animations.push(ctrl.then(() => undefined));
      }
    });

    // Track assembly progress if animating to assembly state
    if (state === 'assembly') {
      const ctrl = animate(assemblyProgress, 1, {
        duration,
        ease: [0.25, 0.46, 0.45, 0.94],
      });
      animationControlsRef.current.push(ctrl);
      animations.push(ctrl.then(() => undefined));
    }

    setCurrentState(state);
    await Promise.all(animations);
  }, [x, y, z, scale, rotateX, rotateY, rotateZ, opacity, originX, originY, assemblyProgress, cancelAllAnimations]);
    
  // Set custom transform values
  // Note: Only ScrollController should pass `animate: true` to avoid catch-up lag.
  // Future emblem choreography should be routed through ScrollController/state mapping.
  const setCustomTransform = useCallback((
    transform: Partial<OrbitTransform>,
    options?: { animate?: boolean; duration?: number }
  ) => {
    // Cancel existing animations when scroll takes over
    // This prevents the intro fade from fighting with scroll-driven transforms
    cancelAllAnimations();

    const motionValues = { x, y, z, scale, rotateX, rotateY, rotateZ, opacity, originX, originY };
    const shouldAnimate = options?.animate;
    const duration = options?.duration ?? 0.35;

    Object.entries(transform).forEach(([key, value]) => {
      const motionValue = motionValues[key as keyof typeof motionValues];
      if (!motionValue) return;

      if (shouldAnimate) {
        const ctrl = animate(motionValue, value as number, {
          duration,
          ease: [0.25, 0.46, 0.45, 0.94],
        });
        animationControlsRef.current.push(ctrl);
      } else {
        motionValue.set(value as number);
      }
    });
  }, [x, y, z, scale, rotateX, rotateY, rotateZ, opacity, originX, originY, cancelAllAnimations]);

    // Pre-computed velocity transforms for common use cases
    // Sections can use these directly or create their own transforms
    const clampedVelocity = useTransform(scrollVelocity, (v) => Math.min(4, Math.abs(v)));

    // First-scroll trigger (one-shot)
    const triggerFirstScroll = useCallback(() => {
      if (!hasFirstScrolled) {
        setHasFirstScrolled(true);
      }
    }, [hasFirstScrolled]);

  // Play hero assembly on mount, then settle into idle
  useEffect(() => {
    let cancelled = false;

    const runIntro = async () => {
      assemblyProgress.set(0);
      await animateTo('assembly', 1.6);
      if (cancelled) return;
      await animateTo('idle', 0.8);
      if (cancelled) return;

      // Mark intro complete immediately - emblem can now respond to scroll
      setIntroComplete(true);
      setHeroTextReady(true);

      // Start opacity fade to 0.08 (non-blocking)
      // If user scrolls, ScrollController's setCustomTransform will cancel this
      // and take over with scroll-driven opacity values
      const fadeCtrl = animate(opacity, 0.08, {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94]
      });
      animationControlsRef.current.push(fadeCtrl);
    };

    runIntro().catch(() => {
      // Swallow errors to avoid unhandled rejections in edge cases
    });

    return () => {
      cancelled = true;
      // Clean up any pending animations on unmount
      animationControlsRef.current.forEach(ctrl => {
        try { ctrl.stop(); } catch { /* already stopped */ }
      });
    };
  }, [animateTo, assemblyProgress, opacity]);

    const value = useMemo(
      () => ({
        x,
        y,
        z,
        scale,
        rotateX,
        rotateY,
        rotateZ,
        opacity,
        originX,
        originY,
        currentState,
        setState,
        animateTo,
        setCustomTransform,
        scrollProgress,
        scrollVelocity,
        clampedVelocity,
        activityState,
        bloomSignal,
        globalFocus,
        hasFirstScrolled,
        triggerFirstScroll,
        assemblyProgress,
        introComplete,
        heroTextReady,
      }),
      [
        x, y, z, scale, rotateX, rotateY, rotateZ, opacity, originX, originY,
        currentState, setState, animateTo, setCustomTransform, scrollProgress, scrollVelocity,
        clampedVelocity, activityState, bloomSignal, globalFocus, hasFirstScrolled, triggerFirstScroll,
        assemblyProgress, introComplete, heroTextReady,
      ]
    );
    
    return (
      <OrbitSystemContext.Provider value={value}>
        {children}
      </OrbitSystemContext.Provider>
    );
  }
  
  // eslint-disable-next-line react-refresh/only-export-components
  export function useOrbitSystem() {
    const context = useContext(OrbitSystemContext);
    if (!context) {
      throw new Error('useOrbitSystem must be used within OrbitSystemProvider');
    }
    return context;
  }
