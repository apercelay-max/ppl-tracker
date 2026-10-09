import type { HistoryEntry } from '../data/types';
import { getWorkout } from '../data/workouts';
import { isPerformedSet } from './weight';

// Rapport d'une période (semaine ou mois) : tout est calculé depuis l'historique, rien n'est inventé.
export type ReportPeriod = 'week' | 'month';

export interface Report {
  period: ReportPeriod;
  title: string;
  rangeLabel: string;
  sessions: number;
  minutes: number;
  tonnageKg: number;
  sets: number;
  /** Une case par jour de la période : nombre de séances ce jour-là. */
  days: number[];
  top: { name: string; volumeKg: number }[];
  records: { name: string; weightKg: number }[];
  /** Variation du volume par rapport à la période précédente, ou null s'il n'y a rien à comparer. */
  volumePctVsPrevious: number | null;
}

const startOfDay = (t: number): number => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const addDays = (t: number, n: number): number => { const d = new Date(t); d.setDate(d.getDate() + n); return d.getTime(); };
const fmt = (t: number) => new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

const exerciseVolumes = (entries: HistoryEntry[]): Map<string, { name: string; volume: number; max: number }> => {
  const map = new Map<string, { name: string; volume: number; max: number }>();
  for (const e of entries) {
    const workout = getWorkout(e.dayId);
    for (const [exId, sets] of Object.entries(e.exerciseProgress)) {
      const name = e.exerciseNameOverrides?.[exId] ?? workout?.exercises.find((x) => x.id === exId)?.name ?? exId;
      const cur = map.get(exId) ?? { name, volume: 0, max: 0 };
      for (const s of sets) {
        if (!isPerformedSet(s)) continue;
        const w = parseFloat(String(s.weight).replace(',', '.'));
        const r = parseInt(s.reps, 10);
        if (isNaN(w)) continue;
        if (!isNaN(r)) cur.volume += w * r;
        if (w > cur.max) cur.max = w;
      }
      map.set(exId, cur);
    }
  }
  return map;
};

export const buildReport = (history: HistoryEntry[], period: ReportPeriod, now = Date.now()): Report => {
  const today = startOfDay(now);
  // Semaine : les 7 derniers jours (aujourd'hui compris), comme le compteur de l'accueil. Mois : les 30 derniers jours.
  const length = period === 'week' ? 7 : 30;
  const from = addDays(today, -(length - 1));
  const to = addDays(today, 1);
  const prevFrom = addDays(from, -length);

  const inRange = history.filter((e) => e.date >= from && e.date < to);
  const before = history.filter((e) => e.date >= prevFrom && e.date < from);
  const older = history.filter((e) => e.date < from);

  const days = Array.from({ length }, (_, i) => {
    const a = addDays(from, i);
    const b = addDays(a, 1);
    return inRange.filter((e) => e.date >= a && e.date < b).length;
  });

  const vols = exerciseVolumes(inRange);
  const olderVols = exerciseVolumes(older);
  const tonnage = (list: HistoryEntry[]) => [...exerciseVolumes(list).values()].reduce((t, v) => t + v.volume, 0);
  const tonnageKg = Math.round(tonnage(inRange));
  const prevTonnage = tonnage(before);

  let sets = 0;
  for (const e of inRange) for (const list of Object.values(e.exerciseProgress)) sets += list.filter(isPerformedSet).length;

  // Un record n'existe que s'il y avait déjà un point de comparaison avant la période.
  const records = [...vols.entries()]
    .filter(([id, v]) => (olderVols.get(id)?.max ?? 0) > 0 && v.max > (olderVols.get(id)?.max ?? 0))
    .map(([, v]) => ({ name: v.name, weightKg: v.max }))
    .sort((a, b) => b.weightKg - a.weightKg)
    .slice(0, 4);

  return {
    period,
    title: period === 'week' ? 'Ma semaine' : 'Mon mois',
    rangeLabel: `${fmt(from)} – ${fmt(today)}`,
    sessions: inRange.length,
    minutes: Math.round(inRange.reduce((t, e) => t + e.durationMs, 0) / 60000),
    tonnageKg,
    sets,
    days,
    top: [...vols.values()].filter((v) => v.volume > 0).sort((a, b) => b.volume - a.volume).slice(0, 3).map((v) => ({ name: v.name, volumeKg: Math.round(v.volume) })),
    records,
    volumePctVsPrevious: prevTonnage > 0 && tonnageKg > 0 ? Math.round(((tonnageKg - prevTonnage) / prevTonnage) * 100) : null,
  };
};
