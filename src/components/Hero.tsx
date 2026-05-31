import { HERO_HINT, SITE_SUBTITLE, SITE_TITLE } from '../content';

const DRIFT_HEARTS = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: `${8 + (i * 7.5) % 85}%`,
  delay: `${i * 1.7}s`,
  duration: `${14 + (i % 5) * 2}s`,
  size: 0.75 + (i % 4) * 0.2,
}));

export function Hero() {
  return (
    <header className="hero">
      <div className="hero__hearts" aria-hidden="true">
        {DRIFT_HEARTS.map((h) => (
          <span
            key={h.id}
            className="drift-heart"
            style={{
              left: h.left,
              animationDelay: h.delay,
              animationDuration: h.duration,
              fontSize: `${h.size}rem`,
            }}
          >
            ♥
          </span>
        ))}
      </div>
      <h1 className="display-title">{SITE_TITLE}</h1>
      <p className="display-subtitle">{SITE_SUBTITLE}</p>
      <p className="hint">{HERO_HINT}</p>
    </header>
  );
}
