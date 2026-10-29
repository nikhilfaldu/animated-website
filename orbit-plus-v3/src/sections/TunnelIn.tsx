/**
 * TunnelIn Section
 *
 * Scroll runway for the tunnel-in animation.
 * No visible content - just provides scroll height for GlobalCanvas TunnelInScene.
 *
 * Height: 200vh
 * Position: Between Positioning and Services
 */
import { useIsMobile } from '@/hooks/useResponsive';

export function TunnelIn() {
  const isMobile = useIsMobile();

  return (
    <section
      id="tunnel-in"
      className="relative w-full"
      style={{ height: isMobile ? '80vh' : '200vh' }}
      aria-hidden="true"
    >
      {isMobile ? (
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgb(var(--bg)) 0%, rgb(var(--bg)) 35%, rgb(var(--fg)) 100%)',
          }}
        />
      ) : null}
    </section>
  );
}
