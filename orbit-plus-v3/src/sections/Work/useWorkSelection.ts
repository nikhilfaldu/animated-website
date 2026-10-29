// src/sections/Work/useWorkSelection.ts
// Selection model supporting hover, scroll focus, and keyboard focus

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type SelectionSource = 'init' | 'scroll' | 'keyboard' | 'click';

export type WorkSelectionState = {
  activeId: string;
  hoveredId: string | null;
  focusedId: string | null;
  source: SelectionSource;
};

export type WorkSelectionApi = {
  // Derived display value (priority: hover > focus > active)
  displayId: string;

  // Full state access
  state: WorkSelectionState;

  // Refs for measurement + observers
  registerCardRef: (id: string) => (el: HTMLElement | null) => void;
  getCardEl: (id: string) => HTMLElement | null;
  getActiveRect: () => DOMRect | null;

  // Actions
  setActive: (id: string, source: SelectionSource) => void;
  setHovered: (id: string | null) => void;
  setFocused: (id: string | null) => void;
};

type Options = {
  ids: string[];
  // Intersection behavior tuning
  rootMargin?: string;
  threshold?: number | number[];
};

export function useWorkSelection(opts: Options): WorkSelectionApi {
  const ids = useMemo(() => opts.ids, [opts.ids]);
  const firstId = ids[0] ?? '';

  const cardRefs = useRef<Record<string, HTMLElement | null>>({});
  const activeIdRef = useRef<string>(firstId);

  const [state, setState] = useState<WorkSelectionState>({
    activeId: firstId,
    hoveredId: null,
    focusedId: null,
    source: 'init',
  });

  // Keep ref in sync with state for IntersectionObserver callback
  useEffect(() => {
    activeIdRef.current = state.activeId;
  }, [state.activeId]);

  const setActive = useCallback((id: string, source: SelectionSource) => {
    if (!id) return;
    setState((s) => (s.activeId === id && s.source === source ? s : { ...s, activeId: id, source }));
  }, []);

  const setHovered = useCallback((id: string | null) => {
    setState((s) => (s.hoveredId === id ? s : { ...s, hoveredId: id }));
  }, []);

  const setFocused = useCallback((id: string | null) => {
    setState((s) => (s.focusedId === id ? s : { ...s, focusedId: id }));
  }, []);

  const registerCardRef = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      cardRefs.current[id] = el;
    },
    []
  );

  const getCardEl = useCallback((id: string) => cardRefs.current[id] ?? null, []);

  const getActiveRect = useCallback(() => {
    const el = cardRefs.current[state.activeId];
    return el ? el.getBoundingClientRect() : null;
  }, [state.activeId]);

  // Display priority: hover > focus > active
  const displayId = state.hoveredId ?? state.focusedId ?? state.activeId;

  // IntersectionObserver: choose the most "centered" card in viewport
  useEffect(() => {
    if (!ids.length) return;

    const margin = opts.rootMargin ?? '-35% 0px -35% 0px';
    const threshold = opts.threshold ?? [0.25, 0.5, 0.75];

    const scores = new Map<string, number>();

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = (e.target as HTMLElement).dataset.workId;
          if (!id) continue;

          // Score: intersection ratio + closeness to viewport center
          const r = e.boundingClientRect;
          const centerY = r.top + r.height / 2;
          const viewportCenter = window.innerHeight / 2;
          const dist = Math.abs(centerY - viewportCenter);
          const distNorm = 1 - Math.min(1, dist / viewportCenter);

          const score = e.intersectionRatio * 0.7 + distNorm * 0.3;
          scores.set(id, e.isIntersecting ? score : 0);
        }

        // Pick best score (use ref to avoid stale closure)
        let bestId = activeIdRef.current;
        let best = -1;

        for (const id of ids) {
          const sc = scores.get(id) ?? 0;
          if (sc > best) {
            best = sc;
            bestId = id;
          }
        }

        if (bestId && bestId !== activeIdRef.current) {
          setActive(bestId, 'scroll');
        }
      },
      { root: null, rootMargin: margin, threshold }
    );

    for (const id of ids) {
      const el = cardRefs.current[id];
      if (el) io.observe(el);
    }

    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join('|')]);

  return {
    displayId,
    state,
    registerCardRef,
    getCardEl,
    getActiveRect,
    setActive,
    setHovered,
    setFocused,
  };
}
