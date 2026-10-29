import { useEffect, useState } from 'react';

const getSize = () => {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }

  return { width: window.innerWidth, height: window.innerHeight };
};

export function useViewportSize() {
  const [size, setSize] = useState(getSize);

  useEffect(() => {
    const update = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };

    update();

    let frame = 0;
    const handleResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const min = size.width && size.height ? Math.min(size.width, size.height) : 0;

  return { ...size, min };
}
