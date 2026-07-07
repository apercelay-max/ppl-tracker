import { WorkoutDay, Exercise } from '../data/types';
import { Program } from '../data/programs';

// ─── Import "intelligent" local — sans appel à une API IA externe ─────────
// Analyse un fichier de n'importe quel format texte (JSON, CSV, texte
// libre) et essaie d'en extraire un programme (jours + exercices). C'est
// un parseur à base de règles, pas une vraie IA : il fait de son mieux et
// remonte des avertissements honnêtes sur ce qu'il n'a pas compris plutôt
// que d'inventer des données. Une vraie sauvegarde PPL Tracker (JSON avec
// une clé "state") est détectée à part et laissée à la restauration
// classique dans SettingsScreen.tsx.

export interface ImportResult {
  program: Program | null;
  warnings: string[];
  isBackupFile: boolean;
  daysDetected: number;
  exercisesDetected: number;
}

const NEUTRAL_ACCENTS = ['#7c6fcd', '#e03030', '#e8a020', '#2563eb', '#16a34a', '#ea580c', '#d946ef', '#0891b2'];

const MUSCLE_KEYWORDS: { pattern: RegExp; group: string }[] = [
  { pattern: /dos|pull|tirage|rowing|row|traction|pulldown|lat/i, group: 'DOS' },
  { pattern: /pec|push|d[ée]velopp[ée]|pompe|dip|bench|chest/i, group: 'PECS' },
  { pattern: /[ée]paule|shoulder|militaire|overhead|[ée]l[ée]vation|press militaire/i, group: 'ÉPAULES' },
  { pattern: /triceps|extension.*(triceps|corde|poulie haute)/i, group: 'TRICEPS' },
  { pattern: /biceps|curl/i, group: 'BICEPS' },
  { pattern: /quad|squat|presse.*cuisse|leg press|fente|lunge/i, group: 'QUADRICEPS' },
  { pattern: /ischio|soulev[ée]|deadlift|rdl|leg curl|fessier|hip thrust|glute/i, group: 'ISCHIOS & FESSIERS' },
  { pattern: /mollet|calf/i, group: 'MOLLETS' },
  { pattern: /abdo|crunch|gainage|planche|plank|core/i, group: 'ABDOS' },
  { pattern: /avant-?bras|forearm/i, group: 'AVANT-BRAS' },
];

const guessMuscleGroup = (exerciseName: string): string => {
  for (const { pattern, group } of MUSCLE_KEYWORDS) {
    if (pattern.test(exerciseName)) return group;
  }
  return 'AUTRE';
};

const slugify = (s: string): string =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'jour';

const makeExercise = (idBase: string, index: number, name: string, sets: number, reps: string, restSeconds: number): Exercise => ({
  id: `${idBase}-ex${index}`,
  name: name.trim(),
  muscleGroup: guessMuscleGroup(name),
  sets, targetReps: reps, restSeconds,
  restMode: 'normal', isSuperset: false,
  notes: 'Importé automatiquement — vérifie les séries/répétitions/temps de repos.',
});

const buildProgramFromDays = (
  programId: string,
  programName: string,
  source: string,
  daysRaw: { name: string; exercises: { name: string; sets?: number; reps?: string; restSeconds?: number }[] }[],
): Program => {
  const workouts: WorkoutDay[] = daysRaw.map((d, di) => {
    const dayId = `${programId}-${slugify(d.name)}-${di}`;
    return {
      id: dayId,
      dayNumber: di + 1,
      name: d.name || `Jour ${di + 1}`,
      focus: 'Séance importée',
      muscleGroups: Array.from(new Set(d.exercises.map((e) => guessMuscleGroup(e.name)))).join(' / '),
      estimatedDuration: `≈ ${Math.max(20, d.exercises.length * 8)} min`,
      exercises: d.exercises.map((e, ei) =>
        makeExercise(dayId, ei, e.name, e.sets ?? 3, e.reps ?? '10-12', e.restSeconds ?? 90)
      ),
    };
  });
  const dayAccents: Record<string, string> = {};
  const dayTypeLabels: Record<string, string> = {};
  workouts.forEach((w, i) => {
    dayAccents[w.id] = NEUTRAL_ACCENTS[i % NEUTRAL_ACCENTS.length];
    dayTypeLabels[w.id] = `J${i + 1}`;
  });
  return {
    id: programId,
    name: programName,
    focusLabel: `${programName} · Importé`,
    shortDescription: `${workouts.length} séance${workouts.length > 1 ? 's' : ''} importée${workouts.length > 1 ? 's' : ''} depuis un fichier.`,
    source,
    isCustom: true,
    workouts,
    dayAccents,
    dayTypeLabels,
  };
};

// ── Détection de colonnes par en-tête (partagée CSV + Excel) ────────────
const findColInHeader = (header: string[], ...names: string[]): number =>
  header.findIndex((h) => names.some((n) => h.includes(n)));

// Transforme un tableau de lignes (en-tête + données) en jours/exercices.
// Si une colonne "jour/séance" existe dans l'en-tête, on regroupe par
// cette colonne ; sinon toutes les lignes vont dans `fallbackDayName`
// (utilisé pour l'Excel : chaque feuille = un jour par défaut).
const rowsToDays = (
  header: string[],
  rows: string[][],
  fallbackDayName: string,
): { name: string; exercises: { name: string; sets?: number; reps?: string; restSeconds?: number }[] }[] | null => {
  const colDay = findColInHeader(header, 'jour', 'séance', 'seance', 'day');
  const colEx = findColInHeader(header, 'exercice', 'exercise', 'nom');
  const colSets = findColInHeader(header, 'série', 'serie', 'set');
  const colReps = findColInHeader(header, 'rep');
  const colRest = findColInHeader(header, 'repos', 'rest');
  if (colEx === -1) return null;

  const dayMap = new Map<string, { name: string; exercises: { name: string; sets?: number; reps?: string; restSeconds?: number }[] }>();
  for (const cells of rows) {
    const exName = cells[colEx];
    if (!exName) continue;
    const dayName = colDay !== -1 && cells[colDay] ? cells[colDay] : fallbackDayName;
    const sets = colSets !== -1 ? parseInt(cells[colSets], 10) : undefined;
    const reps = colReps !== -1 ? cells[colReps] : undefined;
    const restRaw = colRest !== -1 ? parseInt(cells[colRest], 10) : undefined;
    if (!dayMap.has(dayName)) dayMap.set(dayName, { name: dayName, exercises: [] });
    dayMap.get(dayName)!.exercises.push({
      name: exName,
      sets: Number.isFinite(sets) ? sets : undefined,
      reps: reps || undefined,
      restSeconds: Number.isFinite(restRaw) ? restRaw : undefined,
    });
  }
  return Array.from(dayMap.values());
};

// ── CSV ─────────────────────────────────────────────────────────────────
const parseCsv = (content: string, programId: string, programName: string): ImportResult => {
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    return { program: null, warnings: ['Le fichier CSV semble vide ou incomplet.'], isBackupFile: false, daysDetected: 0, exercisesDetected: 0 };
  }
  const splitRow = (line: string) => line.split(/[,;\t]/).map((c) => c.trim());
  const header = splitRow(lines[0]).map((h) => h.toLowerCase());
  const colEx = findColInHeader(header, 'exercice', 'exercise', 'nom');

  const warnings: string[] = [];
  if (colEx === -1) {
    warnings.push('Aucune colonne "exercice" reconnue dans l\'en-tête — import annulé.');
    return { program: null, warnings, isBackupFile: false, daysDetected: 0, exercisesDetected: 0 };
  }

  const colSets = findColInHeader(header, 'série', 'serie', 'set');
  const colReps = findColInHeader(header, 'rep');
  const dataRows = lines.slice(1).map(splitRow);
  const daysRaw = rowsToDays(header, dataRows, 'Jour 1') ?? [];

  const daysRawNonEmpty = daysRaw.filter((d) => d.exercises.length > 0);
  if (daysRawNonEmpty.length === 0) {
    return { program: null, warnings: [...warnings, 'Aucun exercice exploitable trouvé.'], isBackupFile: false, daysDetected: 0, exercisesDetected: 0 };
  }
  const program = buildProgramFromDays(programId, programName, 'Importé depuis un fichier CSV.', daysRawNonEmpty);
  const exCount = daysRawNonEmpty.reduce((sum, d) => sum + d.exercises.length, 0);
  if (colSets === -1) warnings.push('Pas de colonne "séries" trouvée — 3 séries appliquées par défaut.');
  if (colReps === -1) warnings.push('Pas de colonne "reps" trouvée — "10-12" appliqué par défaut.');
  return { program, warnings, isBackupFile: false, daysDetected: daysRawNonEmpty.length, exercisesDetected: exCount };
};

// ── Excel (.xlsx / .xls) ─────────────────────────────────────────────────
// Utilise la librairie SheetJS ("xlsx"), importée dynamiquement pour ne
// pas alourdir le chargement initial de l'appli. Chaque feuille du
// classeur est traitée comme un jour d'entraînement (le nom de la feuille
// devient le nom du jour), sauf si une colonne "jour/séance" est présente
// dans l'en-tête de la feuille — auquel cas on regroupe par cette colonne,
// comme pour un CSV.
export const parseExcelWorkbook = async (file: File): Promise<ImportResult> => {
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'Programme importé';
  const programId = `custom-${slugify(baseName)}-${Date.now()}`;
  const warnings: string[] = [];

  let XLSX: any;
  try {
    XLSX = await import('xlsx');
  } catch (_e) {
    return {
      program: null,
      warnings: ["Le lecteur de fichiers Excel n'a pas pu être chargé. Vérifie ta connexion et réessaie, ou exporte ton fichier en CSV depuis Excel et réimporte-le."],
      isBackupFile: false, daysDetected: 0, exercisesDetected: 0,
    };
  }

  let workbook: any;
  try {
    const buffer = await file.arrayBuffer();
    workbook = XLSX.read(buffer, { type: 'array' });
  } catch (_e) {
    return {
      program: null,
      warnings: ["Ce fichier n'a pas pu être lu comme un classeur Excel valide."],
      isBackupFile: false, daysDetected: 0, exercisesDetected: 0,
    };
  }

  const allDays: { name: string; exercises: { name: string; sets?: number; reps?: string; restSeconds?: number }[] }[] = [];
  let sheetsSkipped = 0;

  for (const sheetName of workbook.SheetNames as string[]) {
    const ws = workbook.Sheets[sheetName];
    const rawRows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
    const nonEmptyRows = rawRows
      .map((r) => r.map((c) => String(c ?? '').trim()))
      .filter((r) => r.some((c) => c !== ''));
    if (nonEmptyRows.length < 2) { sheetsSkipped++; continue; }
    const header = nonEmptyRows[0].map((h) => h.toLowerCase());
    const dataRows = nonEmptyRows.slice(1);
    const days = rowsToDays(header, dataRows, sheetName);
    if (!days) { sheetsSkipped++; continue; }
    allDays.push(...days.filter((d) => d.exercises.length > 0));
  }

  if (sheetsSkipped > 0) {
    warnings.push(`${sheetsSkipped} feuille(s) ignorée(s) — pas de colonne "exercice" reconnue dans l'en-tête.`);
  }

  if (allDays.length === 0) {
    return {
      program: null,
      warnings: [
        'Aucun exercice reconnu dans ce fichier Excel.',
        'Il faut une ligne d\'en-tête avec une colonne "exercice" (et si possible "jour", "séries", "reps", "repos").',
        ...warnings,
      ],
      isBackupFile: false, daysDetected: 0, exercisesDetected: 0,
    };
  }

  const program = buildProgramFromDays(programId, baseName, 'Importé depuis un fichier Excel.', allDays);
  const exCount = allDays.reduce((sum, d) => sum + d.exercises.length, 0);
  return { program, warnings, isBackupFile: false, daysDetected: allDays.length, exercisesDetected: exCount };
};

// ── Texte libre ─────────────────────────────────────────────────────────
const DAY_HEADER_RE = /^(?:jour|séance|seance|day|semaine)\s*\d*\s*[:\-–]?\s*(.*)$/i;
// "Nom 4x8 80kg", "Nom: 4x8", "Nom 4 x 8-12", "Nom - 3 séries de 10"
const EXO_LINE_RE = /^(.+?)[\s:\-–]+(\d+)\s*x\s*([\d\-–]+)(?:\s*[@àa]?\s*([\d.,]+)\s*kg)?/i;
const EXO_LINE_RE_ALT = /^(.+?)[\s:\-–]+(\d+)\s*s[ée]ries?\s*(?:de|x)?\s*([\d\-–]+)/i;

const parsePlainText = (content: string, programId: string, programName: string): ImportResult => {
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const days: { name: string; exercises: { name: string; sets?: number; reps?: string }[] }[] = [];
  const warnings: string[] = [];
  let skipped = 0;

  for (const line of lines) {
    const dayMatch = line.match(DAY_HEADER_RE);
    const looksLikeExercise = EXO_LINE_RE.test(line) || EXO_LINE_RE_ALT.test(line);
    if (dayMatch && !looksLikeExercise) {
      const label = dayMatch[1]?.trim();
      days.push({ name: label || `Jour ${days.length + 1}`, exercises: [] });
      continue;
    }
    let m = line.match(EXO_LINE_RE);
    if (m) {
      if (days.length === 0) days.push({ name: 'Jour 1', exercises: [] });
      days[days.length - 1].exercises.push({ name: m[1], sets: parseInt(m[2], 10), reps: m[3] });
      continue;
    }
    m = line.match(EXO_LINE_RE_ALT);
    if (m) {
      if (days.length === 0) days.push({ name: 'Jour 1', exercises: [] });
      days[days.length - 1].exercises.push({ name: m[1], sets: parseInt(m[2], 10), reps: m[3] });
      continue;
    }
    // Ligne sans motif reconnu et pas un titre de jour probable (trop
    // longue pour être un titre) → un nouveau jour "sans exercices
    // détaillés" si elle est courte et qu'on n'a pas encore de jour ouvert
    // avec des exercices, sinon on l'ignore silencieusement (avertissement
    // groupé plus bas).
    if (line.length <= 40 && (days.length === 0 || days[days.length - 1].exercises.length > 0)) {
      days.push({ name: line, exercises: [] });
    } else {
      skipped++;
    }
  }

  // Retire les jours restés sans aucun exercice détecté (probablement du
  // texte qui n'était pas un vrai titre de séance).
  const cleanDays = days.filter((d) => d.exercises.length > 0);
  if (skipped > 0) warnings.push(`${skipped} ligne(s) non reconnue(s), ignorée(s).`);
  const emptyDays = days.length - cleanDays.length;
  if (emptyDays > 0) warnings.push(`${emptyDays} ligne(s) qui ressemblaient à un titre de jour mais sans exercice reconnu derrière ont été ignorées.`);

  if (cleanDays.length === 0) {
    return {
      program: null,
      warnings: [
        'Aucun exercice reconnu dans ce texte.',
        'Format attendu par ligne : "Nom de l\'exercice 4x8" ou "Nom de l\'exercice: 3 séries de 10".',
        ...warnings,
      ],
      isBackupFile: false, daysDetected: 0, exercisesDetected: 0,
    };
  }

  const program = buildProgramFromDays(programId, programName, 'Importé depuis un fichier texte (analyse par mots-clés, pas une vraie IA).', cleanDays);
  const exCount = cleanDays.reduce((sum, d) => sum + d.exercises.length, 0);
  return { program, warnings, isBackupFile: false, daysDetected: cleanDays.length, exercisesDetected: exCount };
};

// ── JSON générique (pas une sauvegarde PPL Tracker) ─────────────────────
const parseGenericJson = (parsed: unknown, programId: string, programName: string): ImportResult => {
  const warnings: string[] = [];
  let daysRaw: { name: string; exercises: { name: string; sets?: number; reps?: string }[] }[] = [];

  const asDaysArray = (arr: unknown[]) => arr.map((d: any, i: number) => ({
    name: d?.name ?? d?.day ?? d?.jour ?? `Jour ${i + 1}`,
    exercises: Array.isArray(d?.exercises ?? d?.exercices)
      ? (d.exercises ?? d.exercices).map((e: any) => ({
          name: String(e?.name ?? e?.nom ?? e?.exercise ?? 'Exercice'),
          sets: Number(e?.sets ?? e?.series ?? e?.séries) || undefined,
          reps: e?.reps ?? e?.repetitions ?? e?.targetReps ?? undefined,
        }))
      : [],
  }));

  if (Array.isArray(parsed)) {
    daysRaw = asDaysArray(parsed);
  } else if (parsed && typeof parsed === 'object') {
    const obj = parsed as any;
    const arr = obj.days ?? obj.jours ?? obj.workouts ?? obj.seances ?? obj.séances;
    if (Array.isArray(arr)) daysRaw = asDaysArray(arr);
  }

  daysRaw = daysRaw.filter((d) => d.exercises.length > 0);
  if (daysRaw.length === 0) {
    return {
      program: null,
      warnings: ['Structure JSON non reconnue — attendu un tableau de jours avec une liste d\'exercices.'],
      isBackupFile: false, daysDetected: 0, exercisesDetected: 0,
    };
  }
  const program = buildProgramFromDays(programId, programName, 'Importé depuis un fichier JSON.', daysRaw);
  const exCount = daysRaw.reduce((sum, d) => sum + d.exercises.length, 0);
  return { program, warnings, isBackupFile: false, daysDetected: daysRaw.length, exercisesDetected: exCount };
};

// ─── Point d'entrée (JSON / CSV / texte libre) ──────────────────────────
// Pour l'Excel (.xlsx/.xls), voir `parseExcelWorkbook` ci-dessus — c'est
// une fonction séparée car elle est asynchrone (lecture binaire du
// fichier), contrairement à celle-ci qui reçoit déjà le texte du fichier.
export const parseImportedFile = (filename: string, content: string): ImportResult => {
  const baseName = filename.replace(/\.[^.]+$/, '') || 'Programme importé';
  const programId = `custom-${slugify(baseName)}-${Date.now()}`;

  // 1) Sauvegarde PPL Tracker (JSON avec clé "state") → géré à part par
  //    l'appelant (restauration complète, pas un programme).
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object' && 'state' in parsed) {
      return { program: null, warnings: [], isBackupFile: true, daysDetected: 0, exercisesDetected: 0 };
    }
    // 2) JSON générique
    return parseGenericJson(parsed, programId, baseName);
  } catch (_) {
    // Pas du JSON valide → CSV ou texte libre
  }

  const isCsv = filename.toLowerCase().endsWith('.csv') || /^[^\n]*,[^\n]*,[^\n]*/.test(content.split(/\r?\n/)[0] ?? '');
  if (isCsv) return parseCsv(content, programId, baseName);
  return parsePlainText(content, programId, baseName);
};
