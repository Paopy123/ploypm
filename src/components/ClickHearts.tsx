import { useCallback, useState } from 'react';

type FloatingHeart = {
  id: number;
  x: number;
  y: number;
};

let heartId = 0;

export function useClickHearts() {
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const [tapCount, setTapCount] = useState(0);

  const spawnHeart = useCallback((clientX: number, clientY: number) => {
    const id = ++heartId;
    setHearts((prev) => [...prev, { id, x: clientX, y: clientY }]);
    setTapCount((c) => c + 1);
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
