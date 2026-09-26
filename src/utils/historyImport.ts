import type { ExerciseProgress, HistoryEntry, SetEntry, WorkoutDay, Exercise } from '../data/types';
import type { Program } from '../data/programs';
import type { WeightUnit } from './weight';
import { computeTonnage } from './training';

// ─── Import de l'HISTORIQUE depuis Strong, Hevy, Fitbod (et notre CSV) ─────
// Différent de importParser.ts, qui lit un PROGRAMME : ici on relit des
// séances déjà faites (poids, reps, dates) pour qu'un nouvel utilisateur
// arrive avec ses courbes et ses records plutôt qu'avec un écran vide.
//
// Chaque séance importée pointe vers un jour d'un programme perso
// « Historique importé · <source> » : l'historique de l'app est indexé par
// dayId, il lui faut donc un jour à afficher. Les identifiants sont
// déterministes → réimporter le même fichier n'ajoute rien en double.

export type HistorySource = 'strong' | 'hevy' | 'fitbod' | 'ppl';

export const SOURCE_LABEL: Record<HistorySource, string> = {
  strong: 'Strong',
  hevy: 'Hevy',
  fitbod: 'Fitbod',
  ppl: 'PPL Tracker',
};

export interface HistoryImportResult {
  source: HistorySource;
  program: Program;
  entries: HistoryEntry[];
  setsImported: number;
  warmupsSkipped: number;
  /** Faux quand le fichier ne dit pas lui-même l'unité (Strong) : l'appelant doit la confirmer. */
  unitKnown: boolean;
  unit: WeightUnit;
  firstDate: number;
  lastDate: number;
  warnings: string[];
}

// ── CSV ──────────────────────────────────────────────────────────────────
// Vrai lecteur CSV (guillemets, virgules et retours à la ligne dans les
// notes) : les notes de séance de Strong et Hevy en contiennent souvent.
const splitCsv = (text: string): string[][] => {
  const clean = text.replace(/^﻿/, '');
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? '';
  const count = (ch: string) => firstLine.split(ch).length - 1;
  const delim = count(';') > count(',') ? ';' : count('\t') > count(',') ? '\t' : ',';

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (quoted) {
      if (c === '"') {
        if (clean[i + 1] === '"') { cell += '"'; i++; } else quoted = false;
      } else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === delim) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && clean[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((v) => v.trim() !== '')) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((v) => v.trim() !== '')) rows.push(row);
  return rows;
};

const norm = (h: string) => h.toLowerCase().replace(/[^a-z]/g, '');

export const detectHistorySource = (text: string): HistorySource | null => {
  const header = (splitCsv(text.slice(0, 4000))[0] ?? []).map(norm);
  const has = (...cols: string[]) => cols.every((c) => header.includes(c));
  if (has('workoutname', 'exercisename', 'setorder')) return 'strong'; // couvre aussi notre export
  if (has('exercisetitle', 'starttime') && (header.includes('weightkg') || header.includes('weightlbs'))) return 'hevy';
  if (has('date', 'exercise', 'reps') && header.some((h) => h.startsWith('weight'))) return 'fitbod';
  return null;
};

// ── Petits utilitaires ────────────────────────────────────────────────────
const slugify = (s: string): string =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'x';

const MONTHS: Record<string, number> = {
  jan: 0, janv: 0, feb: 1, fev: 1, febr: 1, mar: 2, mars: 2, apr: 3, avr: 3, avril: 3,
  may: 4, mai: 4, jun: 5, juin: 5, jul: 6, juil: 6, aug: 7, aou: 7, aout: 7,
  sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
};

/** « 2023-05-14 18:32:11 », « 14 May 2023, 18:32 », « 2023-05-14 18:32:11 +0000 »… */
const parseDate = (raw: string): number | null => {
  const s = raw.trim();
  if (!s) return null;
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?\s*(Z|[+-]\d{2}:?\d{2})?$/);
  if (m) {
    if (m[7]) {
      const tz = m[7] === 'Z' ? 'Z' : m[7].replace(/^([+-]\d{2})(\d{2})$/, '$1:$2');
      const t = Date.parse(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] ?? '00'}${tz}`);
      return isNaN(t) ? null : t;
    }
    return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] ?? 0)).getTime();
  }
  m = s.match(/^(\d{1,2})\s+([A-Za-zéûÉ.]+)\s+(\d{4}),?\s+(\d{1,2}):(\d{2})/);
  if (m) {
    const mon = MONTHS[m[2].toLowerCase().normalize('NFD').replace(/[̀-ͯ.]/g, '')];
    if (mon !== undefined) return new Date(+m[3], mon, +m[1], +m[4], +m[5]).getTime();
  }
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3], 12, 0).getTime();
  const t = Date.parse(s);
  return isNaN(t) ? null : t;
};

/** « 1h 5m », « 45m », « 58m 12s », « 1:05:00 » → ms. */
const parseDuration = (raw: string): number => {
  const s = raw.trim().toLowerCase();
  if (!s) return 0;
  const clock = s.match(/^(\d+):(\d{2}):(\d{2})$/);
  if (clock) return (+clock[1] * 3600 + +clock[2] * 60 + +clock[3]) * 1000;
  const h = s.match(/(\d+(?:[.,]\d+)?)\s*h/);
  const m = s.match(/(\d+(?:[.,]\d+)?)\s*m(?!s)/);
  const sec = s.match(/(\d+(?:[.,]\d+)?)\s*s/);
  const num = (x: RegExpMatchArray | null) => (x ? parseFloat(x[1].replace(',', '.')) : 0);
  return Math.round((num(h) * 3600 + num(m) * 60 + num(sec)) * 1000);
};

const num = (raw: string | undefined): number | null => {
  if (raw === undefined) return null;
  const t = raw.trim().replace(',', '.');
  if (t === '') return null;
  const n = parseFloat(t);
  return isNaN(n) ? null : n;
};

const LB_TO_KG = 0.45359237;
const round1 = (n: number) => Math.round(n * 10) / 10;

// ── Représentation commune, avant de fabriquer le programme ──────────────
interface RawSet { weightKg: number | null; reps: number | null; seconds: number | null }
interface RawSession {
  key: string;
  name: string;
  date: number;
  durationMs: number;
  note?: string;
  exercises: Map<string, RawSet[]>; // nom → séries, dans l'ordre
}

const colIndex = (header: string[], ...names: string[]) => {
  const normalized = header.map(norm);
  for (const n of names) {
    const i = normalized.indexOf(n);
    if (i !== -1) return i;
  }
  return -1;
};

// ── Lecteurs par source ───────────────────────────────────────────────────
interface Parsed {
  sessions: RawSession[];
  warmupsSkipped: number;
  unitKnown: boolean;
  fileUnit: WeightUnit | null; // unité lue dans le fichier, si elle y figure
  warnings: string[];
}

const readStrong = (rows: string[][]): Parsed => {
  const header = rows[0];
  const cDate = colIndex(header, 'date');
  const cName = colIndex(header, 'workoutname');
  const cDur = colIndex(header, 'duration');
  const cEx = colIndex(header, 'exercisename');
  const cOrder = colIndex(header, 'setorder');
  const cW = colIndex(header, 'weight', 'weightkg');
  const cR = colIndex(header, 'reps');
  const cSec = colIndex(header, 'seconds');
  const cWNote = colIndex(header, 'workoutnotes');
  const cUnit = colIndex(header, 'unit'); // présent dans NOTRE export : lève l'ambiguïté
  const sessions = new Map<string, RawSession>();
  let warmups = 0;
  let unitSeen: WeightUnit | null = null;
  const warnings: string[] = [];
  let badDates = 0;

  for (const r of rows.slice(1)) {
    const order = (r[cOrder] ?? '').trim();
    if (/rest/i.test(order)) continue; // lignes « Rest Timer »
    if (/^w/i.test(order)) { warmups++; continue; }
    const date = parseDate(r[cDate] ?? '');
    const exName = (r[cEx] ?? '').trim();
    if (!exName) continue;
    if (date === null) { badDates++; continue; }
    const name = (r[cName] ?? '').trim() || 'Séance';
    const key = `${r[cDate]}|${name}`;
    let s = sessions.get(key);
    if (!s) {
      s = { key, name, date, durationMs: cDur !== -1 ? parseDuration(r[cDur] ?? '') : 0, note: cWNote !== -1 ? (r[cWNote] ?? '').trim() || undefined : undefined, exercises: new Map() };
      sessions.set(key, s);
    }
    const unitCell = cUnit !== -1 ? (r[cUnit] ?? '').trim().toLowerCase() : '';
    if (unitCell) unitSeen = unitCell.startsWith('lb') ? 'lbs' : 'kg';
    const w = num(r[cW]);
    const isLb = unitCell.startsWith('lb');
    (s.exercises.get(exName) ?? s.exercises.set(exName, []).get(exName)!).push({
      weightKg: w === null ? null : isLb ? round1(w * LB_TO_KG) : w, // converti à la lecture si le fichier le dit
      reps: num(r[cR]),
      seconds: cSec !== -1 ? num(r[cSec]) : null,
    });
  }
  if (badDates) warnings.push(`${badDates} ligne(s) sans date lisible ignorée(s).`);
  return { sessions: [...sessions.values()], warmupsSkipped: warmups, unitKnown: unitSeen !== null, fileUnit: unitSeen, warnings };
};

const readHevy = (rows: string[][]): Parsed => {
  const header = rows[0];
  const cTitle = colIndex(header, 'title');
  const cStart = colIndex(header, 'starttime');
  const cEnd = colIndex(header, 'endtime');
  const cDesc = colIndex(header, 'description');
  const cEx = colIndex(header, 'exercisetitle');
  const cType = colIndex(header, 'settype');
  const cKg = colIndex(header, 'weightkg');
  const cLb = colIndex(header, 'weightlbs');
  const cR = colIndex(header, 'reps');
  const cSec = colIndex(header, 'durationseconds');
  const sessions = new Map<string, RawSession>();
  let warmups = 0;
  let badDates = 0;

  for (const r of rows.slice(1)) {
    if (/warm/i.test(r[cType] ?? '')) { warmups++; continue; }
    const exName = (r[cEx] ?? '').trim();
    if (!exName) continue;
    const date = parseDate(r[cStart] ?? '');
    if (date === null) { badDates++; continue; }
    const name = (r[cTitle] ?? '').trim() || 'Séance';
    const key = `${r[cStart]}|${name}`;
    let s = sessions.get(key);
    if (!s) {
      const end = cEnd !== -1 ? parseDate(r[cEnd] ?? '') : null;
      s = { key, name, date, durationMs: end !== null && end > date ? end - date : 0, note: cDesc !== -1 ? (r[cDesc] ?? '').trim() || undefined : undefined, exercises: new Map() };
      sessions.set(key, s);
    }
    const kg = cKg !== -1 ? num(r[cKg]) : null;
    const lb = cLb !== -1 ? num(r[cLb]) : null;
    (s.exercises.get(exName) ?? s.exercises.set(exName, []).get(exName)!).push({
      weightKg: kg !== null ? kg : lb !== null ? round1(lb * LB_TO_KG) : null,
      reps: num(r[cR]),
      seconds: cSec !== -1 ? num(r[cSec]) : null,
    });
  }
  return {
    sessions: [...sessions.values()],
    warmupsSkipped: warmups,
    unitKnown: true,
    fileUnit: cKg === -1 && cLb !== -1 ? 'lbs' : 'kg',
    warnings: badDates ? [`${badDates} ligne(s) sans date lisible ignorée(s).`] : [],
  };
};

const readFitbod = (rows: string[][]): Parsed => {
  const header = rows[0];
  const cDate = colIndex(header, 'date');
  const cEx = colIndex(header, 'exercise');
  const cR = colIndex(header, 'reps');
  const cW = header.findIndex((h) => norm(h).startsWith('weight'));
  const isLb = /lb/i.test(header[cW] ?? '');
  const cSec = header.findIndex((h) => norm(h).startsWith('duration'));
  const cWarm = colIndex(header, 'iswarmup');
  const sessions = new Map<string, RawSession>();
  let warmups = 0;
  let badDates = 0;

  for (const r of rows.slice(1)) {
    if (/^(true|1|yes)$/i.test((r[cWarm] ?? '').trim())) { warmups++; continue; }
    const exName = (r[cEx] ?? '').trim();
    if (!exName) continue;
    const date = parseDate(r[cDate] ?? '');
    if (date === null) { badDates++; continue; }
    // Fitbod n'a pas de notion de séance : une journée d'entraînement = une séance.
    const d = new Date(date);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    let s = sessions.get(key);
    if (!s) {
      s = { key, name: 'Séance Fitbod', date, durationMs: 0, exercises: new Map() };
      sessions.set(key, s);
    }
    if (date < s.date) s.date = date;
    const w = num(r[cW]);
    (s.exercises.get(exName) ?? s.exercises.set(exName, []).get(exName)!).push({
      weightKg: w === null ? null : isLb ? round1(w * LB_TO_KG) : w,
      reps: num(r[cR]),
      seconds: cSec !== -1 ? num(r[cSec]) : null,
    });
  }
  return {
    sessions: [...sessions.values()],
    warmupsSkipped: warmups,
    unitKnown: true,
    fileUnit: isLb ? 'lbs' : 'kg',
    warnings: badDates ? [`${badDates} ligne(s) sans date lisible ignorée(s).`] : [],
  };
};

// ── Fabrication du programme + des entrées d'historique ──────────────────
const NEUTRAL_ACCENTS = ['#7c6fcd', '#e03030', '#e8a020', '#2563eb', '#16a34a', '#ea580c', '#d946ef', '#0891b2'];

const toSetEntry = (s: RawSet): SetEntry | null => {
  const reps = s.reps && s.reps > 0 ? String(Math.round(s.reps)) : null;
  const seconds = s.seconds && s.seconds > 0 ? `${Math.round(s.seconds)} s` : null;
  if (!reps && !seconds) return null; // série vide ou cardio pur : rien à afficher
  const w = s.weightKg;
  return {
    weight: w && w > 0 ? String(w) : 'PDC',
    reps: reps ?? (seconds as string),
    completed: true,
  };
};

export const buildHistoryImport = (
  text: string,
  options: { assumedUnit: WeightUnit },
): HistoryImportResult | { error: string } => {
  const source = detectHistorySource(text);
  if (!source) return { error: 'Format non reconnu (attendu : export CSV de Strong, Hevy, Fitbod ou PPL Tracker).' };
  const rows = splitCsv(text);
  if (rows.length < 2) return { error: 'Le fichier est vide.' };

  const parsed = source === 'hevy' ? readHevy(rows) : source === 'fitbod' ? readFitbod(rows) : readStrong(rows);
  if (parsed.sessions.length === 0) return { error: 'Aucune séance lisible dans ce fichier.' };

  // Strong ne précise pas l'unité : on prend celle confirmée par l'appelant.
  // Les poids étant déjà convertis en kg à la lecture quand le fichier le
  // dit, il ne reste à convertir que le cas « unité supposée = lbs ».
  const unit: WeightUnit = parsed.fileUnit ?? options.assumedUnit;
  const convert = !parsed.unitKnown && options.assumedUnit === 'lbs';

  const programId = `import-${source}`;
  const workoutsById = new Map<string, WorkoutDay>();
  const entries: HistoryEntry[] = [];
  let setsImported = 0;

  const sorted = [...parsed.sessions].sort((a, b) => b.date - a.date);
  for (const s of sorted) {
    const dayId = `${programId}-${slugify(s.name)}`;
    const progress: ExerciseProgress = {};
    for (const [exName, rawSets] of s.exercises) {
      const exId = `${dayId}-${slugify(exName)}`;
      const sets = rawSets
        .map((r) => (convert && r.weightKg !== null ? { ...r, weightKg: round1(r.weightKg * LB_TO_KG) } : r))
        .map(toSetEntry)
        .filter((x): x is SetEntry => x !== null);
      if (sets.length === 0) continue;
      progress[exId] = sets;
      setsImported += sets.length;

      // Le jour du programme grossit avec les séances : nb de séries max vu, reps les plus fréquentes.
      let day = workoutsById.get(dayId);
      if (!day) {
        const idx = workoutsById.size;
        day = { id: dayId, dayNumber: idx + 1, name: s.name, focus: `Importé de ${SOURCE_LABEL[source]}`, muscleGroups: '', estimatedDuration: '', exercises: [] };
        workoutsById.set(dayId, day);
      }
      let ex = day.exercises.find((e) => e.id === exId);
      if (!ex) {
        ex = { id: exId, name: exName, muscleGroup: 'AUTRE', sets: sets.length, targetReps: sets[0].reps, restSeconds: 90, restMode: 'normal', isSuperset: false, notes: `Importé de ${SOURCE_LABEL[source]}.` } satisfies Exercise;
        day.exercises.push(ex);
      } else {
        ex.sets = Math.max(ex.sets, sets.length);
      }
    }
    if (Object.keys(progress).length === 0) continue;
    entries.push({
      id: `${programId}-${s.date}-${slugify(s.name)}`,
      dayId,
      date: s.date,
      exerciseProgress: progress,
      durationMs: s.durationMs,
      tonnage: computeTonnage(progress),
      note: s.note,
    });
  }
  if (entries.length === 0) return { error: 'Aucune série exploitable (poids/répétitions) dans ce fichier.' };

  const workouts = [...workoutsById.values()];
  const dayAccents: Record<string, string> = {};
  const dayTypeLabels: Record<string, string> = {};
  workouts.forEach((w, i) => {
    w.estimatedDuration = '';
    dayAccents[w.id] = NEUTRAL_ACCENTS[i % NEUTRAL_ACCENTS.length];
    dayTypeLabels[w.id] = w.name.slice(0, 3).toUpperCase();
  });
  const program: Program = {
    id: programId,
    name: `Historique importé · ${SOURCE_LABEL[source]}`,
    focusLabel: `Historique importé de ${SOURCE_LABEL[source]}`,
    shortDescription: `${entries.length} séance(s) reprises de ${SOURCE_LABEL[source]}. Sert de support à ton historique ; ce n'est pas un programme à suivre.`,
    source: `Import automatique d'un export CSV ${SOURCE_LABEL[source]}.`,
    isCustom: true,
    workouts,
    dayAccents,
    dayTypeLabels,
  };

  return {
    source,
    program,
    entries,
    setsImported,
    warmupsSkipped: parsed.warmupsSkipped,
    unitKnown: parsed.unitKnown,
    unit,
    firstDate: entries[entries.length - 1].date,
    lastDate: entries[0].date,
    warnings: parsed.warnings,
  };
};
