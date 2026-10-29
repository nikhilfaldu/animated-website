import { memo, type CSSProperties } from 'react';
import { EMBLEM_PATHS } from '@/assets/emblemPaths';

type Props = {
  className?: string;
  style?: CSSProperties;
};

/**
 * Canonical emblem glyph. Renders the stroke-only emblem used across the experience.
 * This component purposefully avoids motion side-effects so downstream consumers
 * can control transforms without risking visual drift.
 */
export const EmblemSVG = memo(function EmblemSVG({ className = '', style }: Props) {
  return (
    <svg
      viewBox="0 0 600 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden
    >
      {EMBLEM_PATHS.map((d, i) => (
        <path
          key={i}
          d={d}
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
});
