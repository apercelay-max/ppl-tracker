import type { HistoryEntry, WorkoutDay } from '../data/types';
import { getWorkout } from '../data/workouts';
import { formatWeightForDisplay, isPerformedSet, type WeightUnit } from './weight';

// Mode « Tableur » : chaque séance du programme présentée comme une feuille Excel — une ligne par
// série, un bloc de colonnes (poids + reps) par fois où la séance a été faite. Rien n'est saisi ici :
// tout est lu dans l'historique, donc la grille se remplit toute seule quand on termine une séance.

export interface TableurCell {
  weight: string;
  reps: string;
  /** Nom du mouvement réellement fait si l'exercice a été remplacé pendant la séance. */
  swappedFor?: string;
}

export interface TableurRow {
  exerciseId: string;
  exerciseName: string;
  /** Vrai sur la première série d'un exercice : le nom n'est écrit qu'une fois. */
  firstOfExercise: boolean;
  setNumber: number;
  target: string;
  /** Une cellule par colonne de séance, null = série non faite. */
  cells: (TableurCell | null)[];
}

export interface TableurSheet {
  dayId: string;
  name: string;
  /** Séances faites, de la plus ancienne à la plus récente. */
  sessions: { id: string; date: number }[];
  rows: TableurRow[];
}

/** Séances présentes dans l'historique ou dans la liste donnée, sans doublon, dans l'ordre d'arrivée. */
export const tableurDayIds = (programDayIds: string[], history: HistoryEntry[]): string[] => {
  const ids = [...programDayIds];
  for (const e of history) if (!ids.includes(e.dayId)) ids.push(e.dayId);
  return ids;
};

export const buildTableurSheet = (dayId: string, history: HistoryEntry[], unit: WeightUnit): TableurSheet => {
  const workout: WorkoutDay | undefined = getWorkout(dayId);
  const entries = history.filter((e) => e.dayId === dayId).sort((a, b) => a.date - b.date);

  // Les exercices du programme d'abord, puis ceux qui n'existent plus dans la séance mais qui figurent
  // dans d'anciennes entrées (séance modifiée depuis) : on ne cache pas des séries réellement faites.
  const known = workout?.exercises ?? [];
  const knownIds = new Set(known.map((x) => x.id));
  const orphanIds: string[] = [];
  for (const e of entries) {
    for (const exId of Object.keys(e.exerciseProgress)) {
      if (!knownIds.has(exId) && !orphanIds.includes(exId)) orphanIds.push(exId);
    }
  }

  const rows: TableurRow[] = [];
  const addExercise = (exerciseId: string, name: string, plannedSets: number, target: string) => {
    const logged = entries.map((e) => e.exerciseProgress[exerciseId] ?? []);
    const count = Math.max(plannedSets, ...logged.map((l) => l.length));
    for (let i = 0; i < count; i++) {
      rows.push({
        exerciseId,
        exerciseName: name,
        firstOfExercise: i === 0,
        setNumber: i + 1,
        target,
        cells: entries.map((e, col) => {
          const s = logged[col][i];
          if (!s || !isPerformedSet(s)) return null;
          const swapped = e.exerciseNameOverrides?.[exerciseId];
          return {
            weight: formatWeightForDisplay(s.weight, unit),
            reps: s.reps,
            ...(swapped && swapped !== name ? { swappedFor: swapped } : {}),
          };
        }),
      });
    }
  };
  for (const x of known) addExercise(x.id, x.name, x.sets, x.targetReps);
  for (const id of orphanIds) addExercise(id, id, 0, '');

  return { dayId, name: workout?.name ?? dayId, sessions: entries.map((e) => ({ id: e.id, date: e.date })), rows };
};

export const formatTableurDate = (ts: number): string =>
  new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });

const INVALID_SHEET_CHARS = /[:\\/?*[\]]/g;

/** Un onglet par séance, même disposition que dans l'écran : à ouvrir dans Excel, Numbers ou Sheets. */
export const buildTableurWorkbook = async (
  dayIds: string[],
  history: HistoryEntry[],
  unit: WeightUnit,
): Promise<Blob> => {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  const used = new Set<string>();

  for (const dayId of dayIds) {
    const sheet = buildTableurSheet(dayId, history, unit);
    if (sheet.sessions.length === 0) continue;

    const group: (string | number)[] = ['', '', ''];
    const head: (string | number)[] = ['Exercice', 'Série', 'Reps cibles'];
    const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [];
    sheet.sessions.forEach((s, i) => {
      const c = 3 + i * 2;
      group.push(formatTableurDate(s.date), '');
      head.push(`Poids (${unit})`, 'Reps');
      merges.push({ s: { r: 0, c }, e: { r: 0, c: c + 1 } });
    });

    const aoa: (string | number)[][] = [group, head];
    for (const r of sheet.rows) {
      const line: (string | number)[] = [r.firstOfExercise ? r.exerciseName : '', r.setNumber, r.target];
      for (const cell of r.cells) {
        const w = cell ? parseFloat(cell.weight.replace(',', '.')) : NaN;
        // Un nombre reste un nombre dans la feuille (sommes, graphiques) ; « PDC » reste du texte.
        line.push(cell ? (isNaN(w) || String(w) !== cell.weight.trim() ? cell.weight : w) : '');
        const n = cell ? parseInt(cell.reps, 10) : NaN;
        line.push(cell ? (isNaN(n) || String(n) !== cell.reps.trim() ? cell.reps : n) : '');
      }
      aoa.push(line);
    }

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!merges'] = merges;
    ws['!cols'] = [{ wch: 38 }, { wch: 7 }, { wch: 24 }, ...sheet.sessions.flatMap(() => [{ wch: 11 }, { wch: 7 }])];
    ws['!freeze'] = { xSplit: 3, ySplit: 2 };

    let title = sheet.name.replace(INVALID_SHEET_CHARS, ' ').trim().slice(0, 31) || 'Séance';
    for (let n = 2; used.has(title.toLowerCase()); n++) title = `${title.slice(0, 28)} ${n}`;
    used.add(title.toLowerCase());
    XLSX.utils.book_append_sheet(wb, ws, title);
  }

  const bytes = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  return new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};
