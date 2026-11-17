import { useEffect, useState } from 'react';

const TICK_MS = 300;
// Share of the step range the bar fills while waiting, and how fast it gets there
const FILL_SHARE = 0.85;
const TIME_CONSTANT_S = 18;

/**
 * Progress that moves from `from` towards `to` while a step runs. The backend reports
 * whole steps only, so without this the bar would stand still during a long step.
 * It slows down as it approaches `to` and never reaches it before the step ends.
 */
export function useCreepingProgress(from: number, to: number, active: boolean): number {
  const segment = `${from}-${to}`;
  const [elapsed, setElapsed] = useState({ segment, seconds: 0 });
  const moving = active && to > from;

  useEffect(() => {
    if (!moving) return;
    const start = performance.now();
    const timer = window.setInterval(() => {
      setElapsed({ segment, seconds: (performance.now() - start) / 1000 });
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [moving, segment]);

  if (!moving) return from;
  const seconds = elapsed.segment === segment ? elapsed.seconds : 0;
  return from + (to - from) * FILL_SHARE * (1 - Math.exp(-seconds / TIME_CONSTANT_S));
}
