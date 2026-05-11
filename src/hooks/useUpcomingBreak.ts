import { useState, useEffect } from 'react';

export interface UpcomingBreakInfo {
  type: string;
  startTime: string;
  remainingSeconds: number;
}

export function useUpcomingBreak() {
  const [upcomingBreak, setUpcomingBreak] = useState<UpcomingBreakInfo | null>(null);

  useEffect(() => {
    const handler = (e: CustomEvent<UpcomingBreakInfo | null>) => {
      setUpcomingBreak(e.detail);
    };
    window.addEventListener('update-upcoming-break', handler as EventListener);
    return () => window.removeEventListener('update-upcoming-break', handler as EventListener);
  }, []);

  const formatCountdown = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return h === '00' ? `${m}:${s}` : `${h}:${m}:${s}`;
  };

  return { upcomingBreak, formatCountdown };
}
