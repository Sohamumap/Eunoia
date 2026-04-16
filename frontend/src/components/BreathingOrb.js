import React, { useEffect, useState } from 'react';

/**
 * BreathingOrb — animated 4-7-8 style orb.
 * phases: inhale(4s) -> hold(7s) -> exhale(8s)
 */
export default function BreathingOrb({ running = true, cycleDurations = [4, 7, 8] }) {
  const [phase, setPhase] = useState(0);
  const [countdown, setCountdown] = useState(cycleDurations[0]);

  useEffect(() => {
    if (!running) return;
    const tick = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          setPhase(p => (p + 1) % 3);
          return cycleDurations[(phase + 1) % 3];
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [running, phase, cycleDurations]);

  useEffect(() => { setCountdown(cycleDurations[phase]); }, [phase, cycleDurations]);

  const labels = ['Breathe in', 'Hold', 'Breathe out'];
  const scale = phase === 0 ? 1.25 : phase === 1 ? 1.25 : 0.85;
  const duration = cycleDurations[phase];

  return (
    <div className="relative flex flex-col items-center justify-center py-8" data-testid="breathing-orb">
      <div className="relative w-[260px] h-[260px] flex items-center justify-center">
        <div
          className="breath-orb"
          style={{
            transform: `scale(${scale})`,
            transition: `transform ${duration}s cubic-bezier(0.4, 0, 0.6, 1)`,
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-serif text-white text-5xl font-bold drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]">{countdown}</span>
          <span className="font-sans text-white/90 text-sm font-medium mt-1 drop-shadow">{labels[phase]}</span>
        </div>
      </div>
    </div>
  );
}
