import type { CSSProperties, ReactNode, MouseEventHandler, WheelEventHandler, TouchEventHandler } from 'react';

interface StageSlot {
  node: ReactNode;
  className?: string;
  style?: CSSProperties;
}

interface NavStagePortalProps {
  emblem: StageSlot;
  dial: StageSlot;
  hint?: StageSlot;
  debugOverlay?: ReactNode;
  className?: string;
  containerStyle?: CSSProperties;
  onMouseEnter?: MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: MouseEventHandler<HTMLDivElement>;
  onWheel?: WheelEventHandler<HTMLDivElement>;
  onTouchMove?: TouchEventHandler<HTMLDivElement>;
}

/**
 * NavStagePortal ensures ScrollEmblem and KineticDialNav share the same
 * spatial origin, perspective, and transform context.
 */
export function NavStagePortal({
  emblem,
  dial,
  hint,
  debugOverlay,
  className = '',
  containerStyle,
  onMouseEnter,
  onMouseLeave,
  onWheel,
  onTouchMove,
}: NavStagePortalProps) {
  return (
    <div
      className={`absolute top-6 left-6 ${className}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onWheel={onWheel}
      onTouchMove={onTouchMove}
    >
      <div
        className="relative"
        style={{
          width: 120,
          height: 120,
          perspective: '1000px',
          transformStyle: 'preserve-3d',
          transformOrigin: 'center',
          willChange: 'transform, opacity',
          ...(containerStyle ?? {}),
        }}
      >
        <div
          className={`absolute inset-0 flex items-center justify-center ${emblem.className ?? ''}`}
          style={{
            pointerEvents: emblem.style?.pointerEvents ?? 'auto',
            transformStyle: 'preserve-3d',
            ...emblem.style,
          }}
        >
          {emblem.node}
        </div>
        <div
          className={`absolute inset-0 flex items-center justify-center ${dial.className ?? ''}`}
          style={{
            pointerEvents: dial.style?.pointerEvents ?? 'auto',
            transformStyle: 'preserve-3d',
            ...dial.style,
          }}
        >
          {dial.node}
        </div>
        {debugOverlay ? (
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 40 }}>{debugOverlay}</div>
        ) : null}
      </div>
      {hint ? (
        <div
          className={`absolute left-0 right-0 flex justify-center ${hint.className ?? ''}`}
          style={{
            top: '100%',
            marginTop: 8,
            outline: 'none',
            pointerEvents: hint.style?.pointerEvents ?? 'none',
            ...hint.style,
          }}
        >
          {hint.node}
        </div>
      ) : null}
    </div>
  );
}
