import { animate, motion, type Variants } from 'framer-motion';
import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useIsMobile } from '@/hooks/useResponsive';
import { CYL_ITEM_COUNT, CYL_RADIUS, NAV_MORPH_V2 } from './nav/constants';
import type { NavMode } from './nav/types';

export interface NavItem {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
}

interface KineticDialNavProps {
  items: NavItem[];
  mode: NavMode;
  activeIndex: number;
  className?: string;
  onActiveIndexChange?: (index: number) => void;
  visibilityPhase?: 'hidden' | 'fading-in' | 'visible';
  interactive?: boolean;
  enableWheel?: boolean;
  clampIndex?: boolean;
  labelOpacity?: number;
  labelTransitionDuration?: number;
}

/**
 * KineticDialNav - 3D Cylindrical Text Carousel Navigation
 *
 * Creates a 3D cylindrical navigation that appears on emblem hover/click.
 * Demonstrates advanced CSS3D transforms and interactive development capabilities.
 *
 * Features:
 * - Mathematical 3D positioning using translateZ and rotateY
 * - Mouse wheel and drag rotation controls
 * - Smooth animations with Framer Motion
 * - Integration with EmblemOrchestrator states
 */
export function KineticDialNav({
  items,
  mode,
  activeIndex,
  className = '',
  onActiveIndexChange,
  visibilityPhase,
  interactive,
  enableWheel = true,
  clampIndex = false,
  labelOpacity,
  labelTransitionDuration,
}: KineticDialNavProps): React.JSX.Element {
  const [isDragging, setIsDragging] = useState(false);
  const [isWheeling, setIsWheeling] = useState(false);
  const [isInertial, setIsInertial] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [underlineWidth, setUnderlineWidth] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const pendingUnderlineWidthRef = useRef<number | null>(null);
  const wheelSnapTimeout = useRef<number | null>(null);
  const rotationRef = useRef(0); // Track current rotation for smooth wheel events
  const inertiaControlsRef = useRef<ReturnType<typeof animate> | null>(null);
  const dragSamplesRef = useRef<Array<{ time: number; rotation: number }>>([]);
  const activeIndexRef = useRef(activeIndex);
  const isDraggingRef = useRef(false);
  const isInertialRef = useRef(false);
  const lastVelocityRef = useRef(0);
  const wheelAccumulatorRef = useRef(0);
  const wheelGestureTimeRef = useRef(0);
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  const effectiveVisibility: 'hidden' | 'fading-in' | 'visible' =
    visibilityPhase ?? (mode !== 'compact' ? 'visible' : 'hidden');
  const visible = effectiveVisibility !== 'hidden';
  const isInteractive = interactive ?? visible;

  if (process.env.NODE_ENV !== 'production' && NAV_MORPH_V2) {
    if (items.length !== CYL_ITEM_COUNT) {
      console.warn(
        `Expected ${CYL_ITEM_COUNT} navigation items for cylindrical symmetry; received ${items.length}.`
      );
    }
  }

  // Calculate translateZ value for cylindrical positioning using Stack Overflow formula
  const itemCount = Math.max(items.length, 1);
  const theta = itemCount > 1 ? 360 / itemCount : 0;
  const radius = CYL_RADIUS;
  const detentResistance = useCallback(
    (rotationValue: number) => {
      if (items.length < 2) return 1;
      const snapAngle = Math.round(rotationValue / theta) * theta;
      const distance = Math.abs(rotationValue - snapAngle);
      const resistanceZone = theta * 0.35;
      const t = Math.min(1, distance / resistanceZone);
      return 0.55 + 0.45 * t;
    },
    [items.length, theta]
  );

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const getNearestIndex = useCallback(
    (rotationValue: number) => {
      if (items.length === 0) return 0;
      const turns = Math.round(-rotationValue / theta);
      return ((turns % items.length) + items.length) % items.length;
    },
    [items.length, theta]
  );

  const clampIndexValue = useCallback(
    (index: number) => {
      if (items.length === 0) return 0;
      return Math.max(0, Math.min(items.length - 1, index));
    },
    [items.length]
  );

  const snapRotation = useCallback(
    (rotationValue: number) => {
      const turns = Math.round(-rotationValue / theta);
      return -turns * theta;
    },
    [theta]
  );

  const notifyActiveIndex = useCallback(
    (rotationValue: number) => {
      if (!onActiveIndexChange) return;
      const rawIndex = getNearestIndex(rotationValue);
      const nextIndex = clampIndex ? clampIndexValue(rawIndex) : rawIndex;
      if (nextIndex === activeIndexRef.current) return;
      activeIndexRef.current = nextIndex;
      onActiveIndexChange(nextIndex);
    },
    [clampIndex, clampIndexValue, getNearestIndex, onActiveIndexChange]
  );

  const recordSample = useCallback((rotationValue: number) => {
    const now = performance.now();
    const samples = dragSamplesRef.current;
    samples.push({ time: now, rotation: rotationValue });
    const cutoff = now - 80;
    while (samples.length > 0 && samples[0].time < cutoff) {
      samples.shift();
    }
  }, []);

  const getVelocity = useCallback(() => {
    const samples = dragSamplesRef.current;
    if (samples.length < 2) return 0;
    const first = samples[0];
    const last = samples[samples.length - 1];
    const deltaTime = last.time - first.time;
    if (deltaTime <= 0) return 0;
    return (last.rotation - first.rotation) / deltaTime;
  }, []);

  const stopInertia = useCallback(() => {
    if (inertiaControlsRef.current) {
      inertiaControlsRef.current.stop();
      inertiaControlsRef.current = null;
    }
    setIsInertial(false);
    isInertialRef.current = false;
  }, []);

  const startSpringToRotation = useCallback(
    (targetRotation: number) => {
      stopInertia();
      if (prefersReducedMotion) {
        rotationRef.current = targetRotation;
        setRotation(targetRotation);
        notifyActiveIndex(targetRotation);
        return;
      }
      setIsInertial(true);
      isInertialRef.current = true;
      inertiaControlsRef.current = animate(rotationRef.current, targetRotation, {
        type: 'spring',
        stiffness: 260,
        damping: 28,
        mass: 0.9,
        restDelta: 0.1,
        restSpeed: 0.1,
        onUpdate: (value) => {
          rotationRef.current = value;
          setRotation(value);
          notifyActiveIndex(value);
        },
        onComplete: () => {
          setIsInertial(false);
          isInertialRef.current = false;
          inertiaControlsRef.current = null;
          const rawIndex = getNearestIndex(targetRotation);
          const snappedIndex = clampIndex ? clampIndexValue(rawIndex) : rawIndex;
          activeIndexRef.current = snappedIndex;
          onActiveIndexChange?.(snappedIndex);
        },
      });
    },
    [clampIndex, clampIndexValue, getNearestIndex, notifyActiveIndex, onActiveIndexChange, prefersReducedMotion, stopInertia]
  );

  const updateUnderlineWidth = useCallback((force = false) => {
    const widths = labelRefs.current.map((node) => node?.offsetWidth ?? 0);
    const maxWidth = widths.length ? Math.max(...widths) : 0;
    const paddedWidth = maxWidth > 0 ? maxWidth + 8 : 0;
    if (paddedWidth <= 0) return;
    if (!force && mode !== 'compact' && underlineWidth !== null) {
      pendingUnderlineWidthRef.current = paddedWidth;
      return;
    }
    setUnderlineWidth((prev) => {
      if (prev && Math.abs(prev - paddedWidth) < 0.5) return prev;
      return paddedWidth;
    });
  }, [mode, underlineWidth]);

  useLayoutEffect(() => {
    updateUnderlineWidth(true);
  }, [items, updateUnderlineWidth]);

  useEffect(() => {
    const handleResize = () => {
      updateUnderlineWidth(false);
    };
    window.addEventListener('resize', handleResize);
    if ('fonts' in document) {
      document.fonts.ready.then(handleResize).catch(() => {});
    }
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [effectiveVisibility, updateUnderlineWidth]);

  useEffect(() => {
    if (mode !== 'compact') return;
    if (pendingUnderlineWidthRef.current === null) return;
    setUnderlineWidth(pendingUnderlineWidthRef.current);
    pendingUnderlineWidthRef.current = null;
  }, [mode]);

  const handleMobileTap = useCallback(() => {
    if (!isMobile || !isInteractive || items.length < 2) return;
    const nextIndex = (activeIndex + 1) % items.length;
    const newRotation = -nextIndex * theta;
    rotationRef.current = newRotation;
    setRotation(newRotation);
    onActiveIndexChange?.(nextIndex);
  }, [isMobile, isInteractive, activeIndex, items.length, theta, onActiveIndexChange]);

  // Container variants for entrance/exit animations - NO VERTICAL MOVEMENT
  const containerVariants: Variants = NAV_MORPH_V2 ? {} : {
    hidden: {
      opacity: 0,
      x: -20,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  // Sync rotation with activeIndex prop. If dial is revealed after emblem spin ends,
  // keep rotation steady to avoid perceived jumps.
  useEffect(() => {
    if (isDraggingRef.current || isInertialRef.current) return;
    const targetRotation = -activeIndex * theta;
    stopInertia();
    if (NAV_MORPH_V2 && effectiveVisibility === 'hidden') {
      rotationRef.current = targetRotation; // preseed to current lane to prevent snap
      setRotation(targetRotation);
      return;
    }
    rotationRef.current = targetRotation;
    setRotation(targetRotation);
  }, [activeIndex, theta, effectiveVisibility, stopInertia]);

  // Handle mouse wheel rotation - deliberate detents per title
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (isMobile || !visible || !isInteractive || items.length < 2) return;

      e.preventDefault();
      e.stopPropagation();
      stopInertia();

      const now = performance.now();
      const timeSinceGesture = now - wheelGestureTimeRef.current;
      const isNewGesture = timeSinceGesture > 140;
      wheelGestureTimeRef.current = now;

      if (isNewGesture) {
        wheelAccumulatorRef.current = 0;
      }

      wheelAccumulatorRef.current += e.deltaY;

      const baseThreshold = 70;
      const deltaModeMultiplier = e.deltaMode === 1 ? 0.4 : e.deltaMode === 2 ? 1.6 : 1;
      const threshold = baseThreshold * deltaModeMultiplier;

      if (Math.abs(wheelAccumulatorRef.current) < threshold) return;

      const stepDirection = wheelAccumulatorRef.current > 0 ? -1 : 1;
      wheelAccumulatorRef.current = 0;

      const currentIndex = getNearestIndex(rotationRef.current);
      const nextIndex =
        (currentIndex + stepDirection + items.length) % items.length;
      const targetRotation = -nextIndex * theta;

      setIsWheeling(true);
      startSpringToRotation(targetRotation);

      if (wheelSnapTimeout.current !== null) {
        window.clearTimeout(wheelSnapTimeout.current);
      }

      wheelSnapTimeout.current = window.setTimeout(() => {
        setIsWheeling(false);
        wheelSnapTimeout.current = null;
      }, 220);
    },
    [getNearestIndex, isMobile, isInteractive, items.length, startSpringToRotation, stopInertia, theta, visible]
  );

  // Handle drag start - FIXED DRAG PHYSICS WITH INDEX SYNC
  // On mobile, we differentiate between taps and drags:
  // - Taps: Allow click events to propagate (for closing nav when tapping outside)
  // - Drags: Rotate the cylinder (prevent default only after movement detected)
  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!visible || !isInteractive || items.length < 2) return;

      stopInertia();
      const isTouchEvent = 'touches' in e;
      const startY = isTouchEvent ? e.touches[0].clientY : e.clientY;
      const startX = isTouchEvent ? e.touches[0].clientX : e.clientX;

      let lastY = startY;
      let currentRotation = rotationRef.current;
      let hasDragged = false;
      const dragThreshold = 8; // pixels before considering it a drag
      let lastSampleTime = performance.now();
      dragSamplesRef.current = [{ time: performance.now(), rotation: currentRotation }];

      const applyRotation = (clientY: number) => {
        const now = performance.now();
        const deltaTime = Math.max(1, now - lastSampleTime);
        const deltaY = clientY - lastY;
        const sensitivity = 1.2;
        const rotationDelta = -deltaY * sensitivity;
        const resistance = detentResistance(currentRotation + rotationDelta);
        currentRotation += rotationDelta * resistance;
        lastVelocityRef.current = rotationDelta / deltaTime;
        lastSampleTime = now;

        rotationRef.current = currentRotation;
        setRotation(currentRotation);
        recordSample(currentRotation);
        notifyActiveIndex(currentRotation);

        lastY = clientY;
      };

      const finishDrag = () => {
        setIsDragging(false);

        // Only snap if we actually dragged
        if (hasDragged) {
          const rawVelocity = getVelocity();
          const velocity = Math.abs(rawVelocity) > 0 ? rawVelocity : lastVelocityRef.current;
          const minVelocity = 0.02;
          if (Math.abs(velocity) < minVelocity) {
            if (clampIndex) {
              const edgeIndex = clampIndexValue(getNearestIndex(currentRotation));
              startSpringToRotation(-edgeIndex * theta);
            } else {
              startSpringToRotation(snapRotation(currentRotation));
            }
          } else {
            const velocityStep = 0.12;
            const steps = Math.min(3, Math.max(1, Math.round(Math.abs(velocity) / velocityStep)));
            const direction = velocity < 0 ? 1 : -1;
            const currentIndex = getNearestIndex(currentRotation);
            const rawTargetIndex = currentIndex + direction * steps;
            const targetIndex = clampIndex
              ? clampIndexValue(rawTargetIndex)
              : ((rawTargetIndex % items.length) + items.length) % items.length;
            startSpringToRotation(-targetIndex * theta);
          }
        }

        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
        isDraggingRef.current = false;
      };

      const handleMouseMove = (moveE: MouseEvent) => {
        // Check if we've moved enough to consider it a drag
        const deltaX = Math.abs(moveE.clientX - startX);
        const deltaY = Math.abs(moveE.clientY - startY);
        if (!hasDragged && (deltaX > dragThreshold || deltaY > dragThreshold)) {
          hasDragged = true;
          setIsDragging(true);
          isDraggingRef.current = true;
        }
        if (hasDragged) {
          applyRotation(moveE.clientY);
        }
      };

      const handleTouchMove = (moveE: TouchEvent) => {
        if (moveE.touches.length === 0) return;
        const touch = moveE.touches[0];
        // Check if we've moved enough to consider it a drag
        const deltaX = Math.abs(touch.clientX - startX);
        const deltaY = Math.abs(touch.clientY - startY);
        if (!hasDragged && (deltaX > dragThreshold || deltaY > dragThreshold)) {
          hasDragged = true;
          setIsDragging(true);
          isDraggingRef.current = true;
        }
        if (hasDragged) {
          // Only prevent default once we confirm it's a drag
          moveE.preventDefault();
          applyRotation(touch.clientY);
        }
      };

      const handleMouseUp = () => {
        finishDrag();
      };

      const handleTouchEnd = () => {
        finishDrag();
      };

      // For mouse events, prevent default immediately (desktop behavior unchanged)
      if (!isTouchEvent) {
        e.preventDefault();
        setIsDragging(true);
        hasDragged = true;
        isDraggingRef.current = true;
      }
      // For touch events, we wait to see if it's a drag or tap before preventing default

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, {
        passive: false,
      });
      document.addEventListener('touchend', handleTouchEnd);
    },
    [clampIndex, clampIndexValue, detentResistance, getNearestIndex, getVelocity, isInteractive, items.length, notifyActiveIndex, recordSample, snapRotation, startSpringToRotation, stopInertia, theta, visible]
  );

  // Sync rotation ref with state
  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  useEffect(() => {
    return () => {
      stopInertia();
    };
  }, [stopInertia]);

  // Set up event listeners - ONLY WHEEL EVENTS
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isMobile || !enableWheel) return;

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [enableWheel, handleWheel, isMobile]);

  useEffect(() => {
    return () => {
      if (wheelSnapTimeout.current !== null) {
        window.clearTimeout(wheelSnapTimeout.current);
        wheelSnapTimeout.current = null;
      }
    };
  }, []);

  // Handle item selection
  const handleItemClick = useCallback(
    (item: NavItem, index: number) => {
      if (!isInteractive) return;
      onActiveIndexChange?.(index);
      const newRotation = -index * theta;
      rotationRef.current = newRotation;
      setRotation(newRotation);

      if (item.onClick) {
        item.onClick();
        return;
      }

      if (item.href) {
        if (item.href.startsWith('#')) {
          const target = document.querySelector(item.href);
          if (target instanceof HTMLElement) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } else {
          window.location.href = item.href;
        }
        return;
      }

      const fallbackSection = document.getElementById(item.id);
      if (fallbackSection) {
        fallbackSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [theta, onActiveIndexChange, isInteractive]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!visible || !isInteractive || items.length === 0) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          {
            const newIndex = activeIndex > 0 ? activeIndex - 1 : items.length - 1;
            const newRotation = -newIndex * theta;
            rotationRef.current = newRotation;
            setRotation(newRotation);
            onActiveIndexChange?.(newIndex);
          }
          break;
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          {
            const newIndex = activeIndex < items.length - 1 ? activeIndex + 1 : 0;
            const newRotation = -newIndex * theta;
            rotationRef.current = newRotation;
            setRotation(newRotation);
            onActiveIndexChange?.(newIndex);
          }
          break;
        case 'Home':
          e.preventDefault();
          onActiveIndexChange?.(0);
          rotationRef.current = 0;
          setRotation(0);
          break;
        case 'End': {
          e.preventDefault();
          const lastIndex = items.length - 1;
          const newRotation = -lastIndex * theta;
          onActiveIndexChange?.(lastIndex);
          rotationRef.current = newRotation;
          setRotation(newRotation);
          break;
        }
        case 'Enter':
        case ' ':
          e.preventDefault();
          handleItemClick(items[activeIndex], activeIndex);
          break;
      }
    },
    [visible, isInteractive, activeIndex, items, theta, handleItemClick, onActiveIndexChange]
  );

  // Phase-aware text opacity for smoother cross-fade
  // Earlier and longer text fade for magical morph
  const textOpacity = labelOpacity ?? (effectiveVisibility === 'hidden' ? 0 : effectiveVisibility === 'fading-in' ? 0.85 : 1);
  const textTransitionDuration = labelTransitionDuration ?? 0.3;

  return (
    <motion.div
      ref={containerRef}
      className={`kinetic-dial-nav ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate={visible ? 'visible' : 'hidden'}
      style={{
        position: 'relative',
        width: `120px`,
        height: `120px`,
        pointerEvents: isInteractive ? 'auto' : 'none',
        cursor: isMobile ? 'pointer' : !isInteractive ? 'default' : isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={isMobile ? undefined : handleDragStart}
      onTouchStart={isMobile ? undefined : handleDragStart}
      onClick={isMobile ? handleMobileTap : undefined}
      onKeyDown={handleKeyDown}
      role="tablist"
      aria-label="Navigation menu items"
      aria-orientation="vertical"
      tabIndex={isInteractive ? 0 : -1}
    >
      {/* 3D Container for cylindrical positioning */}
      <motion.div
        className="dial-container"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          // FIXED: Keep rotateX for vertical scrolling physics (tilt cylinder forward/backward)
          transform: `translate(-50%, -50%) rotateX(${rotation}deg)`,
          transformOrigin: '50% 50% 0px', // FIXED: cylinder spins around center, not moving up/down
          transition: prefersReducedMotion
            ? 'none'
            : isDragging || isInertial
              ? 'none'
              : isWheeling
                ? 'transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)'
                : effectiveVisibility === 'fading-in'
                  ? `transform ${Math.max(0.2, Math.min(0.9, 0.25))}s cubic-bezier(0.33, 1, 0.68, 1)`
                  : 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        {/* Underline bars that match emblem bar positions for seamless cross-fade */}
        {Array.from({ length: CYL_ITEM_COUNT }, (_, lane) => {
          // Place lines between labels: half-theta offset
          const angle = (360 / CYL_ITEM_COUNT) * (lane + 0.5);
          // Effective front-facing check (container rotation + item angle)
          const normalized = ((angle + rotation) % 360 + 360) % 360;
          const isFront = normalized <= 90 || normalized >= 270;
          const underlineOpacity = isFront ? 0.9 * textOpacity : 0;
          return (
            <div
              key={`underline-${lane}`}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotateX(${angle}deg) translateZ(${radius}px)`,
                pointerEvents: 'none',
                backfaceVisibility: 'hidden',
              }}
              aria-hidden
            >
              <div
                style={{
                  width: underlineWidth ? `${underlineWidth}px` : '56%',
                  height: 2,
                  background: 'rgb(230 230 230)',
                  opacity: underlineOpacity,
                  borderRadius: 9999,
                }}
              />
            </div>
          );
        })}
        {/* Dynamic item positions based on items array */}
        {items.map((item, index) => {
          const angle = (360 / items.length) * index;
          const isActive = index === activeIndex;
          return (
            <motion.div
              key={item.id}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotateX(${angle}deg) translateZ(${radius}px)`,
                padding: '5px',
                backfaceVisibility: 'hidden',
                cursor: 'pointer',
              }}
              onClick={e => {
                e.stopPropagation();
                handleItemClick(item, index);
              }}
              role="tab"
              aria-selected={isActive}
              aria-current={isActive ? 'true' : undefined}
              tabIndex={visible && isActive ? 0 : -1}
            >
              <motion.span
                initial={false}
                animate={{ opacity: textOpacity }}
                transition={{ duration: textTransitionDuration, ease: [0.33, 1, 0.68, 1] }}
                className="whitespace-nowrap"
                ref={(node) => {
                  labelRefs.current[index] = node;
                }}
              >
                {item.label}
              </motion.span>
            </motion.div>
          );
        })}
      </motion.div>

      {/* REMOVED: Navigation indicators dots */}
    </motion.div>
  );
}
