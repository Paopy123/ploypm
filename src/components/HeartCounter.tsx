import { HeartIcon } from './HeartIcon';

type HeartCounterProps = {
  count: number;
};

export function HeartCounter({ count }: HeartCounterProps) {
  return (
    <div className="heart-counter" aria-live="polite" aria-label={`${count} hearts collected`}>
      <HeartIcon pulse size={16} />
      <span>{count}</span>
    </div>
  );
}
