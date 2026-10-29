import { motion, useReducedMotion, useTime, useTransform } from 'framer-motion';
import { useMemo } from 'react';

interface WaveTextProps {
  children: string;
  className?: string;
  baseWeight?: number;
  peakWeight?: number;
  duration?: number;
  direction?: 'ltr' | 'rtl';
}

export function WaveText({
  children,
  className = '',
  baseWeight = 100,
  peakWeight = 900,
  duration = 3,
  direction = 'ltr',
}: WaveTextProps) {
  const prefersReducedMotion = useReducedMotion();
  const characters = useMemo(() => children.split(''), [children]);

  if (prefersReducedMotion) {
    return (
      <span className={`inline-block font-big-shoulders ${className}`}>{children}</span>
    );
  }

  const totalChars = Math.max(characters.length - 1, 1);

  return (
    <span className={`inline-block font-big-shoulders ${className}`}>
      {characters.map((char, index) => {
        if (char === ' ') {
          return <span key={`${char}-${index}`}>&nbsp;</span>;
        }

        return (
          <WaveChar
            key={`${char}-${index}`}
            char={char}
            index={index}
            totalChars={totalChars}
            baseWeight={baseWeight}
            peakWeight={peakWeight}
            duration={duration}
            direction={direction}
          />
        );
      })}
    </span>
  );
}

function WaveChar({
  char,
  index,
  totalChars,
  baseWeight,
  peakWeight,
  duration,
  direction,
}: {
  char: string;
  index: number;
  totalChars: number;
  baseWeight: number;
  peakWeight: number;
  duration: number;
  direction: 'ltr' | 'rtl';
}) {
  const time = useTime();
  const totalDuration = Math.max(duration, 0.1) * 1000;
  const falloffWidth = 0.18;
  const weight = useTransform(time, (t) => {
    const progress = (t % totalDuration) / totalDuration;
    let hotSpotPosition = 0.5 - 0.5 * Math.cos(2 * Math.PI * progress);

    if (direction === 'rtl') {
      hotSpotPosition = 1 - hotSpotPosition;
    }

    const charPosition = totalChars > 0 ? index / totalChars : 0;
    const distance = Math.abs(charPosition - hotSpotPosition);
    const intensity = Math.exp(-(distance * distance) / (2 * falloffWidth * falloffWidth));

    return baseWeight + (peakWeight - baseWeight) * intensity;
  });
  const fontVariationSettings = useTransform(weight, (w) => `'wght' ${w.toFixed(0)}`);

  return (
    <motion.span className="inline-block" style={{ fontVariationSettings }}>
      {char}
    </motion.span>
  );
}
