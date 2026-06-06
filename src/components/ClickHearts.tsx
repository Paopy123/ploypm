import { useCallback, useEffect, useState } from 'react';

type FloatingHeart = {
  id: number;
  x: number;
  y: number;
};

const STORAGE_KEY = 'ploypm-heart-count';

function readStoredCount(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null) return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

function writeStoredCount(count: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(count));
  } catch {
    /* private browsing / storage full */
  }
}

let heartId = 0;

export function useClickHearts() {
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const [tapCount, setTapCount] = useState(readStoredCount);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue != null) {
        const n = parseInt(e.newValue, 10);
        if (Number.isFinite(n) && n >= 0) setTapCount(n);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const spawnHeart = useCallback((clientX: number, clientY: number) => {
    const id = ++heartId;
    setHearts((prev) => [...prev, { id, x: clientX, y: clientY }]);
    setTapCount((c) => {
      const next = c + 1;
      writeStoredCount(next);
      return next;
    });
    window.setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== id));
    }, 1200);
  }, []);

  const HeartLayer = (
    <>
      {hearts.map((h) => (
        <span
          key={h.id}
          className="click-heart"
          style={{ left: h.x, top: h.y }}
          aria-hidden="true"
        >
          ♥
        </span>
      ))}
    </>
  );

  return { tapCount, spawnHeart, HeartLayer };
}
