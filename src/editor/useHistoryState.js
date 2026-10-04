import { useCallback, useState } from "react";

const LIMIT = 200;
const MERGE_WINDOW_MS = 700;

// Undo/redo around one value. Quick edits to the same field (typing, dragging
// a slider or color picker) merge into a single undo step. No-op updates are
// ignored entirely, so they never create or extend a step.
export function useHistoryState(init) {
  const [history, setHistory] = useState(() => ({
    past: [],
    present: init(),
    future: [],
    lastKey: null,
    lastTime: 0,
  }));

  const set = useCallback((updater, mergeKey = null) => {
    const now = Date.now();
    setHistory((h) => {
      const next = typeof updater === "function" ? updater(h.present) : updater;
      if (Object.is(next, h.present)) return h;
      const merge = mergeKey !== null && h.lastKey === mergeKey && now - h.lastTime < MERGE_WINDOW_MS;
      return {
        past: merge ? h.past : [...h.past, h.present].slice(-LIMIT),
        present: next,
        future: [],
        lastKey: mergeKey,
        lastTime: now,
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((h) =>
      h.past.length
        ? {
            past: h.past.slice(0, -1),
            present: h.past[h.past.length - 1],
            future: [h.present, ...h.future],
            lastKey: null,
            lastTime: 0,
          }
        : h,
    );
  }, []);

  const redo = useCallback(() => {
    setHistory((h) =>
      h.future.length
        ? {
            past: [...h.past, h.present],
            present: h.future[0],
            future: h.future.slice(1),
            lastKey: null,
            lastTime: 0,
          }
        : h,
    );
  }, []);

  return {
    value: history.present,
    set,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}
