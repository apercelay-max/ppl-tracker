import { useState, useEffect } from 'react';

const format = (ms: number): string => {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

// `pausedAt` : horodatage du début de la pause en cours (voir pauseSession
// dans le store). Tant qu'il est renseigné, le chrono affiche la valeur figée
// à cet instant au lieu de continuer à courir.
export const useSessionChrono = (startTime: number, pausedAt?: number | null) => {
  const [elapsed, setElapsed] = useState(() => (pausedAt ?? Date.now()) - startTime);

  useEffect(() => {
    setElapsed((pausedAt ?? Date.now()) - startTime);
    if (pausedAt != null) return; // en pause : rien à rafraîchir
    const id = setInterval(() => setElapsed(Date.now() - startTime), 1000);
    return () => clearInterval(id);
  }, [startTime, pausedAt]);

  return { elapsed, formatted: format(elapsed) };
};
