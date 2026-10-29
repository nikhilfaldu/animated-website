import { useState, useEffect } from 'react';

/**
 * Clarity/Magic Mode Toggle (Development Tool)
 *
 * Toggles between clarity mode (70% - predictable, trustworthy)
 * and magic mode (30% - memorable, organic) for testing the
 * Clarity & Magic Guardrails system.
 *
 * This component is for development/testing only.
 * Reference: docs/stories/8. STORY-clarity-magic-guardrails.md Section 11
 *
 * @example
 * ```tsx
 * // Add to App.tsx for testing
 * import { ClarityMagicToggle } from '@/components/dev/ClarityMagicToggle';
 *
 * function App() {
 *   return (
 *     <>
 *       <YourApp />
 *       {process.env.NODE_ENV === 'development' && <ClarityMagicToggle />}
 *     </>
 *   );
 * }
 * ```
 */
export function ClarityMagicToggle() {
  const [mode, setMode] = useState<'clarity' | 'magic'>('clarity');

  useEffect(() => {
    // Set the data-mode attribute on the body element
    document.body.dataset.mode = mode;
  }, [mode]);

  const handleToggle = () => {
    setMode((prevMode) => (prevMode === 'clarity' ? 'magic' : 'clarity'));
  };

  return (
    <button
      onClick={handleToggle}
      className="fixed bottom-6 right-6 z-50 rounded-full px-3 py-1 text-xs font-medium shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
      style={{
        background: mode === 'clarity' ? 'rgb(var(--fg))' : 'hsl(var(--accent))',
        color: mode === 'clarity' ? 'rgb(var(--bg))' : 'rgb(var(--bg))',
      }}
      aria-label={`Switch to ${mode === 'clarity' ? 'magic' : 'clarity'} mode`}
    >
      {mode === 'clarity' ? '✨ Magic' : '🧭 Clarity'}
    </button>
  );
}
