import type { HistoryEntry } from '../data/types';
import { getWorkout } from '../data/workouts';

// Export CSV de l'historique, au format de Strong (colonnes identiques) : les
// autres apps (Hevy, Strong, tableurs) savent le lire, et PPL Tracker aussi —
// c'est ce qui permet de repartir vers un nouvel appareil ou de partir sans
// perdre ses séances. Une colonne « Unit » en plus lève l'ambiguïté kg/lbs.
// Les poids sont toujours écrits en kg (unité de stockage interne).

const HEADER = ['Date', 'Workout Name', 'Duration', 'Exercise Name', 'Set Order', 'Weight', 'Reps', 'Distance', 'Seconds', 'Notes', 'Workout Notes', 'RPE', 'Unit'];

const cell = (v: string | number): string => {
  const s = String(v);
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const pad = (n: number) => String(n).padStart(2, '0');
const fmtDate = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};
const fmtDuration = (ms: number) => {
  const min = Math.round(ms / 60000);
  return min >= 60 ? `${Math.floor(min / 60)}h ${min % 60}m` : `${min}m`;
};

export const historyToCsv = (history: HistoryEntry[]): string => {
  const lines = [HEADER.join(',')];
  const chronological = [...history].sort((a, b) => a.date - b.date);
  for (const entry of chronological) {
    const workout = getWorkout(entry.dayId);
    const sessionName = workout?.name ?? entry.dayId;
    for (const [exId, sets] of Object.entries(entry.exerciseProgress)) {
      const exName = entry.exerciseNameOverrides?.[exId] ?? workout?.exercises.find((e) => e.id === exId)?.name ?? exId;
      let order = 0;
      for (const s of sets) {
        if (!s.completed) continue;
        order++;
        const timed = /\ss?$|sec/i.test(s.reps) && !/^\d+$/.test(s.reps);
        const secs = timed ? parseInt(s.reps, 10) : 0;
        const weight = parseFloat(s.weight.replace(',', '.'));
        lines.push([
          fmtDate(entry.date), sessionName, fmtDuration(entry.durationMs), exName, order,
          isNaN(weight) ? 0 : weight,
          timed ? 0 : parseInt(s.reps, 10) || 0,
          0, isNaN(secs) ? 0 : secs, '',
          order === 1 ? entry.note ?? '' : '',
          entry.rpe ?? '', 'kg',
        ].map(cell).join(','));
      }
    }
  }
  return lines.join('\n');
};
