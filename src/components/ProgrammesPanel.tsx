import React, { useMemo, useState } from 'react';
import { ExerciseSheet, findCatalogExercise, readFavs, writeFavs } from './ExerciseCatalog';
import { EXERCISE_IMG_BASE } from '../data/exercisesCatalog';
import type { Exercise } from '../data/types';
import { useWorkoutStore } from '../store/workoutStore';
import { getAllPrograms, type Program } from '../data/programs';
import { CATALOG_GROUPS, CATALOG_EQUIPMENT, type Equipment } from '../data/exercisesCatalog';
import {
  generateProgram, weeklySetsByGroup, DEFAULT_PREFS,
  type GeneratorPrefs, type Goal, type SplitKind, type Level,
} from '../utils/workoutGenerator';

/**
 * Catalogue de programmes + générateur.
 *
 * Un programme généré est enregistré comme programme importé (customPrograms) :
 * c'est le mécanisme qui existe déjà pour les programmes venus d'un fichier, et
 * il rend la séance immédiatement lançable, comptée dans l'historique et dans le
 * tonnage — sans rien changer au store.
 */


type Mode = 'liste' | 'generateur';

export const ProgrammesPanel: React.FC = () => {
  const customPrograms = useWorkoutStore((s) => s.customPrograms);
  const activeProgramId = useWorkoutStore((s) => s.activeProgramId);
  const setActiveProgram = useWorkoutStore((s) => s.setActiveProgram);
  const addCustomProgram = useWorkoutStore((s) => s.addCustomProgram);
  const removeCustomProgram = useWorkoutStore((s) => s.removeCustomProgram);

  const [mode, setMode] = useState<Mode>('liste');
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const programs = useMemo(() => getAllPrograms(customPrograms), [customPrograms]);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const handleSave = (program: Program) => {
    addCustomProgram(program);
    setActiveProgram(program.id);
    setMode('liste');
    setOpenId(program.id);
    flash(`« ${program.name} » enregistré et activé.`);
  };

  return (
    <div>
      <div style={tabRow}>
        <button onClick={() => setMode('liste')} style={{ ...pill, ...(mode === 'liste' ? pillActive : {}), flex: 1 }}>
          Mes programmes ({programs.length})
        </button>
        <button onClick={() => setMode('generateur')} style={{ ...pill, ...(mode === 'generateur' ? pillActive : {}), flex: 1 }}>
          ⚡ Générer
        </button>
      </div>

      {toast && <div style={toastBox}>{toast}</div>}

      {mode === 'generateur' ? (
        <GeneratorForm onSave={handleSave} onCancel={() => setMode('liste')} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {programs.map((p) => (
            <ProgramCard
              key={p.id}
              program={p}
              isActive={p.id === activeProgramId}
              isOpen={openId === p.id}
              onToggle={() => setOpenId(openId === p.id ? null : p.id)}
              onActivate={() => { setActiveProgram(p.id); flash(`« ${p.name} » est maintenant ton programme actif.`); }}
              onDelete={p.isCustom ? () => { removeCustomProgram(p.id); flash(`« ${p.name} » supprimé.`); } : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Carte programme ─────────────────────────────────────────────────────────

const ProgramCard: React.FC<{
  program: Program; isActive: boolean; isOpen: boolean;
  onToggle: () => void; onActivate: () => void; onDelete?: () => void;
}> = ({ program, isActive, isOpen, onToggle, onActivate, onDelete }) => {
  const volume = useMemo(() => weeklySetsByGroup(program), [program]);
  const totalExercises = program.workouts.reduce((n, w) => n + w.exercises.length, 0);

  return (
    <div style={{ ...card, ...(isActive ? cardActive : {}) }}>
      <button onClick={onToggle} style={cardHead}>
        <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
          <p style={cardTitle}>
            {program.name}
            {isActive && <span style={activeBadge}>ACTIF</span>}
          </p>
          <p style={cardSub}>
            {program.workouts.length} séance{program.workouts.length > 1 ? 's' : ''} · {totalExercises} exercices
          </p>
        </div>
        <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>{isOpen ? '▴' : '▾'}</span>
      </button>

      {isOpen && (
        <div style={{ padding: '0 14px 14px' }}>
          <p style={{ ...bodyText, marginBottom: 12 }}>{program.shortDescription}</p>

          <p style={sectionLabel}>Volume hebdomadaire (séries)</p>
          <div style={{ marginBottom: 14 }}>
            {volume.map(({ group, sets }) => (
              <div key={group} style={volRow}>
                <span style={volLabel}>{group}</span>
                <div style={volTrack}>
                  <div style={{ ...volFill, width: `${Math.min(100, (sets / (volume[0]?.sets || 1)) * 100)}%` }} />
                </div>
                <span style={volValue}>{sets}</span>
              </div>
            ))}
          </div>

          <p style={sectionLabel}>Séances</p>
          {program.workouts.map((w) => (
            <div key={w.id} style={dayBox}>
              <p style={dayTitle}>
                {w.name} <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>· {w.estimatedDuration}</span>
              </p>
              {w.exercises.map((ex) => (
                <ProgramExerciseLine key={ex.id} ex={ex} />
              ))}
              {w.exercises.length === 0 && <p style={exLine}>(aucun exercice)</p>}
            </div>
          ))}

          <p style={sourceNote}>{program.source}</p>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {!isActive && (
              <button onClick={onActivate} style={{ ...actionBtn, ...actionPrimary }}>Activer ce programme</button>
            )}
            {onDelete && (
              <button onClick={onDelete} style={{ ...actionBtn, color: '#e05252' }}>Supprimer</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Formulaire du générateur ────────────────────────────────────────────────

const GeneratorForm: React.FC<{ onSave: (p: Program) => void; onCancel: () => void }> = ({ onSave, onCancel }) => {
  const [prefs, setPrefs] = useState<GeneratorPrefs>({ ...DEFAULT_PREFS });
  const [preview, setPreview] = useState<ReturnType<typeof generateProgram> | null>(null);
  const [name, setName] = useState('');

  const set = <K extends keyof GeneratorPrefs>(key: K, value: GeneratorPrefs[K]) =>
    setPrefs((p) => ({ ...p, [key]: value }));

  const toggleIn = (list: string[], value: string) =>
    list.includes(value) ? list.filter((x) => x !== value) : [...list, value];

  // La graine change à chaque génération : "Régénérer" propose d'autres
  // exercices avec exactement les mêmes préférences.
  const run = () => {
    const seed = Math.floor(Math.random() * 1_000_000) + 1;
    setPreview(generateProgram({ ...prefs, seed }, name));
  };

  return (
    <div>
      <div style={filterPanel}>
        <Row label="Séances par semaine">
          {[2, 3, 4, 5, 6].map((d) => (
            <Chip key={d} label={`${d}`} active={prefs.daysPerWeek === d} onClick={() => set('daysPerWeek', d)} />
          ))}
        </Row>

        <Row label="Découpage">
          {([
            ['auto', 'Automatique'], ['fullbody', 'Full body'],
            ['upper-lower', 'Upper / Lower'], ['ppl', 'Push / Pull / Legs'],
          ] as [SplitKind, string][]).map(([v, l]) => (
            <Chip key={v} label={l} active={prefs.split === v} onClick={() => set('split', v)} />
          ))}
        </Row>

        <Row label="Durée d'une séance">
          {[30, 45, 60, 75, 90].map((m) => (
            <Chip key={m} label={`${m} min`} active={prefs.sessionMinutes === m} onClick={() => set('sessionMinutes', m)} />
          ))}
        </Row>

        <Row label="Objectif">
          {([['force', 'Force'], ['hypertrophie', 'Hypertrophie'], ['endurance', 'Endurance']] as [Goal, string][]).map(([v, l]) => (
            <Chip key={v} label={l} active={prefs.goal === v} onClick={() => set('goal', v)} />
          ))}
        </Row>

        <Row label="Niveau">
          {(['Débutant', 'Intermédiaire', 'Avancé'] as Level[]).map((l) => (
            <Chip key={l} label={l} active={prefs.level === l} onClick={() => set('level', l)} />
          ))}
        </Row>

        <Row label="Matériel disponible (rien de coché = tout)">
          {CATALOG_EQUIPMENT.map((eq) => (
            <Chip
              key={eq}
              label={eq}
              active={prefs.equipment.includes(eq)}
              onClick={() => set('equipment', toggleIn(prefs.equipment, eq) as Equipment[])}
            />
          ))}
        </Row>
        <p style={hint}>
          Le poids du corps reste toujours disponible, même si tu ne le coches pas.
        </p>

        <Row label="Muscles à prioriser">
          {CATALOG_GROUPS.map((g) => (
            <Chip
              key={g}
              label={g}
              active={prefs.priorityGroups.includes(g)}
              onClick={() => set('priorityGroups', toggleIn(prefs.priorityGroups, g))}
            />
          ))}
        </Row>

        <p style={sectionLabel}>Nom du programme (facultatif)</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ex : Ma prise de masse"
          style={textInput}
        />

        <button onClick={run} style={{ ...actionBtn, ...actionPrimary, width: '100%', marginTop: 12 }}>
          {preview ? 'Régénérer' : 'Générer le programme'}
        </button>
      </div>

      {preview && (
        <div style={{ marginTop: 4 }}>
          <p style={sectionLabel}>Aperçu — {preview.program.name}</p>

          {preview.warnings.map((w, i) => (
            <p key={i} style={warnBox}>⚠️ {w}</p>
          ))}

          {preview.program.workouts.map((w) => (
            <div key={w.id} style={dayBox}>
              <p style={dayTitle}>
                {w.name} <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>· {w.estimatedDuration}</span>
              </p>
              {w.exercises.map((ex) => (
                <ProgramExerciseLine key={ex.id} ex={ex} />
              ))}
            </div>
          ))}

          <p style={sourceNote}>{preview.program.source}</p>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={() => onSave(preview.program)} style={{ ...actionBtn, ...actionPrimary, flex: 1 }}>
              Enregistrer et activer
            </button>
            <button onClick={onCancel} style={actionBtn}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Petits composants ───────────────────────────────────────────────────────

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 12 }}>
    <p style={sectionLabel}>{label}</p>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{children}</div>
  </div>
);

const Chip: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ ...chip, ...(active ? chipActive : {}) }}>{label}</button>
);

// ─── Styles ──────────────────────────────────────────────────────────────────

const tabRow: React.CSSProperties = { display: 'flex', gap: 6, marginBottom: 12 };
const pill: React.CSSProperties = {
  padding: '9px 12px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
  background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-mid)',
};
const pillActive: React.CSSProperties = { background: 'var(--brand-1)', color: '#fff', border: '1px solid transparent' };
const filterPanel: React.CSSProperties = {
  background: 'var(--bg-card)', border: '1px solid var(--border-mid)',
  borderRadius: 14, padding: 14, marginBottom: 14,
};
const chip: React.CSSProperties = {
  padding: '6px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
  background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-mid)',
};
const chipActive: React.CSSProperties = { background: 'var(--brand-1)', color: '#fff', border: '1px solid transparent' };
const card: React.CSSProperties = {
  background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-mid)', overflow: 'hidden',
};
const cardActive: React.CSSProperties = { border: '1px solid var(--brand-1)' };
const cardHead: React.CSSProperties = {
  display: 'flex', alignItems: 'center', width: '100%', padding: '12px 14px',
  cursor: 'pointer', background: 'none', border: 'none',
};
const cardTitle: React.CSSProperties = {
  color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
};
const cardSub: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 11, marginTop: 2 };
const activeBadge: React.CSSProperties = {
  fontSize: 9, fontWeight: 800, letterSpacing: 1, padding: '2px 6px',
  borderRadius: 6, background: 'var(--brand-1)', color: '#fff',
};
const sectionLabel: React.CSSProperties = {
  color: 'var(--text-dim)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 8,
};
const bodyText: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 12.5, lineHeight: '18px' };
const dayBox: React.CSSProperties = {
  background: 'var(--bg-elevated)', borderRadius: 10, padding: '10px 12px', marginBottom: 8,
};
const dayTitle: React.CSSProperties = {
  color: 'var(--text-secondary)', fontSize: 12.5, fontWeight: 700, marginBottom: 6,
};
const exLine: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 11.5, lineHeight: '18px' };
const volRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 };
const volLabel: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 10.5, width: 116, flexShrink: 0 };
const volTrack: React.CSSProperties = {
  flex: 1, height: 6, borderRadius: 3, background: 'var(--bg-elevated)', overflow: 'hidden',
};
const volFill: React.CSSProperties = { height: '100%', background: 'var(--brand-1)', borderRadius: 3 };
const volValue: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 10.5, width: 20, textAlign: 'right' };
const sourceNote: React.CSSProperties = {
  color: 'var(--text-dim)', fontSize: 10.5, lineHeight: '15px', marginTop: 10,
  paddingTop: 10, borderTop: '1px solid var(--border-subtle)',
};
const actionBtn: React.CSSProperties = {
  padding: '10px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
  background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-mid)',
};
const actionPrimary: React.CSSProperties = {
  background: 'var(--brand-1)', color: '#fff', border: '1px solid transparent',
};
const textInput: React.CSSProperties = {
  width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)',
  borderRadius: 10, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 13, outline: 'none',
};
const hint: React.CSSProperties = {
  color: 'var(--text-dim)', fontSize: 10.5, lineHeight: '15px', marginTop: -6, marginBottom: 12,
};
const warnBox: React.CSSProperties = {
  color: 'var(--text-muted)', fontSize: 11.5, lineHeight: '17px', background: 'var(--bg-elevated)',
  border: '1px solid var(--border-mid)', borderRadius: 10, padding: '9px 11px', marginBottom: 8,
};
const toastBox: React.CSSProperties = {
  background: 'var(--bg-elevated)', border: '1px solid var(--brand-1)', borderRadius: 10,
  padding: '9px 12px', color: 'var(--text-secondary)', fontSize: 12, marginBottom: 12,
};

/**
 * Ligne d'exercice dans le détail d'un programme : même présentation que le
 * catalogue (photo + nom), et au clic la fiche complète (muscles, exécution,
 * conseils, erreurs courantes).
 *
 * La fiche s'affiche via un portail vers <body> (voir ExerciseSheet), donc
 * chaque ligne peut gérer son ouverture toute seule sans faire remonter l'état.
 *
 * Certains exercices des anciens programmes n'ont pas d'équivalent dans le
 * catalogue : la ligne reste alors affichée, simplement sans photo ni fiche.
 */
const ProgramExerciseLine: React.FC<{ ex: Exercise }> = ({ ex }) => {
  const [open, setOpen] = useState(false);
  const [favs, setFavs] = useState<string[]>(readFavs);
  const cat = findCatalogExercise(ex.id, ex.name);

  const toggleFav = () => {
    if (!cat) return;
    setFavs((prev) => {
      const next = prev.includes(cat.id) ? prev.filter((x) => x !== cat.id) : [...prev, cat.id];
      writeFavs(next);
      return next;
    });
  };

  return (
    <>
      <button
        onClick={() => cat && setOpen(true)}
        style={{ ...exRowBtn, cursor: cat ? 'pointer' : 'default' }}
      >
        <span style={exThumb}>
          {cat?.img
            ? <img src={`${EXERCISE_IMG_BASE}/${cat.img}`} alt="" loading="lazy"
                   style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 13, opacity: 0.4 }}>🏋️</span>}
        </span>
        <span style={exRowText}>
          <span style={{ color: 'var(--text-dim)' }}>{ex.sets}×{ex.targetReps}</span> {ex.name}
        </span>
        {cat && <span style={{ color: 'var(--text-dim)', fontSize: 13, flexShrink: 0 }}>›</span>}
      </button>
      {open && cat && (
        <ExerciseSheet
          ex={cat}
          isFav={favs.includes(cat.id)}
          onToggleFav={toggleFav}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
};

const exRowBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 9, width: '100%',
  padding: '5px 4px', background: 'none', border: 'none', textAlign: 'left',
};
const exThumb: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 8, flexShrink: 0, overflow: 'hidden',
  background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const exRowText: React.CSSProperties = {
  flex: 1, minWidth: 0, color: 'var(--text-muted)', fontSize: 12.5, lineHeight: '17px',
};
