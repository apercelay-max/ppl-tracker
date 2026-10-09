import type { BodyWeightEntry, CardioEntry, HistoryEntry } from '../data/types';
import { getWorkout } from '../data/workouts';

// Export avancé (PPL Pro) : un classeur Excel avec un onglet par sujet — séances, séries, records,
// poids de corps, cardio — prêt pour un tableur. Les poids sont en kg (unité de stockage).
// La bibliothèque Excel est chargée à la demande : elle pèse lourd et ne sert qu'ici.
const day = (t: number): string => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export interface AdvancedExportInput {
  history: HistoryEntry[];
  bodyWeightHistory: BodyWeightEntry[];
  cardioHistory: CardioEntry[];
}

export const buildAdvancedWorkbook = async ({ history, bodyWeightHistory, cardioHistory }: AdvancedExportInput): Promise<Blob> => {
  const XLSX = await import('xlsx');
  const chrono = [...history].sort((a, b) => a.date - b.date);

  const sessions: (string | number)[][] = [['Date', 'Séance', 'Durée (min)', 'Séries faites', 'Volume (kg)', 'RPE', 'Note']];
  const sets: (string | number)[][] = [['Date', 'Séance', 'Exercice', 'Série', 'Poids (kg)', 'Répétitions', 'Volume (kg)']];
  const best = new Map<string, { weight: number; reps: number; date: number }>();

  for (const e of chrono) {
    const workout = getWorkout(e.dayId);
    const name = workout?.name ?? e.dayId;
    let done = 0;
    let volume = 0;
    for (const [exId, list] of Object.entries(e.exerciseProgress)) {
      const exName = e.exerciseNameOverrides?.[exId] ?? workout?.exercises.find((x) => x.id === exId)?.name ?? exId;
      let order = 0;
      for (const s of list) {
        if (!s.completed || s.reps === '—') continue;
        order++;
        done++;
        const w = parseFloat(String(s.weight).replace(',', '.'));
        const r = parseInt(s.reps, 10);
        const vol = !isNaN(w) && !isNaN(r) ? Math.round(w * r * 10) / 10 : 0;
        volume += vol;
        sets.push([day(e.date), name, exName, order, isNaN(w) ? '' : w, isNaN(r) ? s.reps : r, vol]);
        if (!isNaN(w) && w > 0 && (best.get(exName)?.weight ?? 0) < w) best.set(exName, { weight: w, reps: isNaN(r) ? 0 : r, date: e.date });
      }
    }
    sessions.push([day(e.date), name, Math.round(e.durationMs / 60000), done, Math.round(e.tonnage ?? volume), e.rpe ?? '', e.note ?? '']);
  }

  const records: (string | number)[][] = [['Exercice', 'Record (kg)', 'Répétitions', 'Date']];
  [...best.entries()].sort((a, b) => a[0].localeCompare(b[0], 'fr')).forEach(([n, r]) => records.push([n, r.weight, r.reps, day(r.date)]));

  const body: (string | number)[][] = [['Date', 'Poids (kg)']];
  [...bodyWeightHistory].sort((a, b) => a.date - b.date).forEach((b) => body.push([day(b.date), b.weightKg]));

  const cardio: (string | number)[][] = [['Date', 'Activité', 'Durée (min)', 'Calories', 'RPE']];
  [...cardioHistory].sort((a, b) => a.date - b.date).forEach((c) => cardio.push([day(c.date), c.type, c.durationMin, Math.round(c.calories), c.rpe ?? '']));

  const wb = XLSX.utils.book_new();
  const add = (title: string, rows: (string | number)[][], widths: number[]) => {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = widths.map((wch) => ({ wch }));
    XLSX.utils.book_append_sheet(wb, ws, title);
  };
  add('Séances', sessions, [12, 22, 12, 13, 12, 6, 40]);
  add('Séries', sets, [12, 22, 34, 7, 11, 12, 12]);
  add('Records', records, [34, 12, 12, 12]);
  add('Poids de corps', body, [12, 12]);
  add('Cardio', cardio, [12, 14, 12, 10, 6]);

  const bytes = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  return new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};
