import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { sounds } from '../audio/soundEffects';

interface TimerBadgeProps {
  phaseEndsAt?: string | null;
  onExpire?: () => void;
  label?: string;
}

export const TimerBadge: React.FC<TimerBadgeProps> = ({
  phaseEndsAt,
  onExpire,
  label = 'Thời gian còn lại',
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!phaseEndsAt) {
      setSecondsLeft(null);
      return;
    }

    const targetTime = new Date(phaseEndsAt).getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((targetTime - now) / 1000));
      setSecondsLeft(diff);

      if (diff <= 5 && diff > 0) {
        sounds.playTick();
      }

      if (diff <= 0) {
        clearInterval(interval);
        if (onExpire) onExpire();
      }
    }, 1000);

    // Initial calculation
    const initialDiff = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
    setSecondsLeft(initialDiff);

    return () => clearInterval(interval);
  }, [phaseEndsAt, onExpire]);

  if (secondsLeft === null) return null;

  const isUrgent = secondsLeft <= 10;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold font-mono transition-all ${
        isUrgent
          ? 'bg-red-950/80 border-red-500 text-red-300 animate-pulse'
          : 'bg-slate-900/80 border-slate-700 text-amber-300'
      }`}
    >
      <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-red-400' : 'text-amber-400'}`} />
      <span className="font-normal font-sans text-slate-400">{label}:</span>
      <span className="text-sm font-bold tracking-wider">
        {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}
      </span>
    </div>
  );
};
