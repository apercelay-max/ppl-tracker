import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ExerciseSheet, findCatalogExercise, readFavs, writeFavs } from './ExerciseCatalog';
import { EXERCISE_IMG_BASE } from '../data/exercisesCatalog';
import type { Exercise } from '../data/types';
import { useWorkoutStore } from '../store/workoutStore';
import { getAllPrograms, type Program } from '../data/programs';
import { CATALOG_GROUPS, CATALOG_EQUIPMENT, type Equipment } from '../data/exercisesCatalog';
import { normalize } from '../utils/catalogMatch';
import { getProgramBodyIntensity } from '../utils/training';
import { BodyDiagram } from './BodyDiagram';
import { IconActivity, IconClose, IconDumbbell, IconFlame, IconHome, IconSearch, IconTarget, IconTrophy, IconZap } from './Icons';
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
  const [query, setQuery] = useState('');

  const programs = useMemo(() => getAllPrograms(customPrograms), [customPrograms]);

  const q = normalize(query.trim());
  const filteredPrograms = useMemo(() => programs.filter((p) => {
    if (q === '') return true;
    const haystack = normalize([p.name, p.focusLabel, p.shortDescription].join(' '));
    return haystack.includes(q);
  }), [programs, q]);

  const openProgram = programs.find((p) => p.id === openId) ?? null;

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
        <div>
          <div style={searchWrap}>
            <IconSearch size={15} color="var(--text-dim)" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Chercher un programme..."
              style={searchInput}
            />
            {query !== '' && (
              <button onClick={() => setQuery('')} style={clearBtn} aria-label="Effacer"><IconClose size={14} /></button>
            )}
          </div>

          {filteredPrograms.length === 0 && (
            <p style={emptyText}>Aucun programme ne correspond à ta recherche.</p>
          )}

          <div style={grid}>
            {filteredPrograms.map((p) => (
              <ProgramTile
                key={p.id}
                program={p}
                isActive={p.id === activeProgramId}
                onOpen={() => setOpenId(p.id)}
              />
            ))}
          </div>
        </div>
      )}

      {openProgram && (
        <ProgramSheet
          program={openProgram}
          isActive={openProgram.id === activeProgramId}
          onClose={() => setOpenId(null)}
          onActivate={() => {
            setActiveProgram(openProgram.id);
            flash(`« ${openProgram.name} » est maintenant ton programme actif.`);
          }}
          onDelete={openProgram.isCustom ? () => {
            removeCustomProgram(openProgram.id);
            setOpenId(null);
            flash(`« ${openProgram.name} » supprimé.`);
          } : undefined}
        />
      )}
    </div>
  );
};

// ─── Représentation visuelle d'un programme (icône + dégradé) ───────────────
//
// Il n'existe pas de banque de photos par programme (ce sont des trames
// générées, pas des produits éditoriaux avec shooting dédié) : la "vignette"
// est donc une icône + un dégradé tirés des couleurs déjà attribuées aux
// séances du programme (dayAccents), pour rester reconnaissable et cohérent
// avec le reste de l'appli sans dépendre d'un assets externe.
const programIcon = (p: Program): React.FC<{ size?: number; color?: string }> => {
  const id = p.id;
  const name = p.name.toLowerCase();
  if (id.includes('maison') || id.includes('halteres-maison')) return IconHome;
  if (id.includes('poignet')) return IconActivity;
  if (id.includes('perte-de-poids')) return IconFlame;
  if (id.includes('bro-split')) return IconTrophy;
  if (id.includes('force') || name.includes('force')) return IconZap;
  if (id.includes('debutant')) return IconTarget;
  return IconDumbbell;
};

const programGradient = (p: Program): string => {
  const colors = Array.from(new Set(Object.values(p.dayAccents))).filter(Boolean);
  const a = colors[0] ?? '#7c6fcd';
  const b = colors[colors.length - 1] ?? a;
  return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
};

// ─── Vignette carrée du catalogue ────────────────────────────────────────────

const ProgramTile: React.FC<{ program: Program; isActive: boolean; onOpen: () => void }> = ({ program, isActive, onOpen }) => {
  const Icon = programIcon(program);
  return (
    <button onClick={onOpen} style={{ ...tile, ...(isActive ? tileActive : {}) }}>
      <div style={{ ...tileThumb, background: programGradient(program) }}>
        <Icon size={30} color="rgba(255,255,255,0.95)" />
        {isActive && <span style={tileActiveBadge}>ACTIF</span>}
      </div>
      <div style={tileBody}>
        <p style={tileTitle}>{program.name}</p>
        <p style={tileSub}>
          {program.workouts.length} séance{program.workouts.length > 1 ? 's' : ''}
        </p>
      </div>
    </button>
  );
};

// ─── Fiche détaillée (feuille plein écran, même pattern que ExerciseSheet) ──

const ProgramSheet: React.FC<{
  program: Program; isActive: boolean;
  onClose: () => void; onActivate: () => void; onDelete?: () => void;
}> = ({ program, isActive, onClose, onActivate, onDelete }) => {
  const volume = useMemo(() => weeklySetsByGroup(program), [program]);
  const totalExercises = program.workouts.reduce((n, w) => n + w.exercises.length, 0);
  const intensity = useMemo(() => getProgramBodyIntensity(program.workouts), [program]);
  const Icon = programIcon(program);

  return createPortal(
    <div style={sheetOverlay} onClick={onClose}>
      <div className="solid-surfaces" style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={sheetHeader}>
          <button onClick={onClose} style={backBtn} aria-label="Fermer">←</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              {program.name}
              {isActive && <span style={activeBadge}>ACTIF</span>}
            </p>
            <p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 2 }}>
              {program.workouts.length} séance{program.workouts.length > 1 ? 's' : ''} · {totalExercises} exercices
            </p>
          </div>
        </div>

        <div style={sheetBody}>
          <div style={{ ...heroThumb, background: programGradient(program) }}>
            <Icon size={44} color="rgba(255,255,255,0.95)" />
          </div>

          <p style={{ ...bodyText, marginBottom: 16 }}>{program.shortDescription}</p>

          <p style={sectionLabel}>Muscles sollicités</p>
          <div style={diagramBox}>
            <BodyDiagram intensity={intensity} />
          </div>

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

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            {!isActive && (
              <button onClick={onActivate} style={{ ...actionBtn, ...actionPrimary, flex: 1 }}>Activer ce programme</button>
            )}
            {onDelete && (
              <button onClick={onDelete} style={{ ...actionBtn, color: '#e05252' }}>Supprimer</button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
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
const activeBadge: React.CSSProperties = {
  fontSize: 9, fontWeight: 800, letterSpacing: 1, padding: '2px 6px',
  borderRadius: 6, background: 'var(--brand-1)', color: '#fff',
};

// ─── Recherche ────────────────────────────────────────────────────────────
const searchWrap: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)',
  border: '1px solid var(--border-mid)', borderRadius: 12, padding: '10px 14px', marginBottom: 12,
};
const searchInput: React.CSSProperties = {
  flex: 1, background: 'transparent', border: 'none', outline: 'none',
  color: 'var(--text-primary)', fontSize: 14, minWidth: 0,
};
const clearBtn: React.CSSProperties = {
  color: 'var(--text-dim)', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: 4,
};
const emptyText: React.CSSProperties = {
  color: 'var(--text-dim)', fontSize: 13, textAlign: 'center', marginTop: 24, lineHeight: '19px',
};

// ─── Grille de vignettes ────────────────────────────────────────────────────
const grid: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
};
const tile: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', textAlign: 'left', padding: 0,
  background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-mid)',
  overflow: 'hidden', cursor: 'pointer',
};
const tileActive: React.CSSProperties = { border: '1px solid var(--brand-1)' };
const tileThumb: React.CSSProperties = {
  position: 'relative', height: 84, display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const tileActiveBadge: React.CSSProperties = {
  position: 'absolute', top: 8, right: 8, fontSize: 8.5, fontWeight: 800, letterSpacing: 0.8,
  padding: '3px 6px', borderRadius: 6, background: 'rgba(0,0,0,0.35)', color: '#fff',
  backdropFilter: 'blur(2px)',
};
const tileBody: React.CSSProperties = { padding: '9px 10px 11px' };
const tileTitle: React.CSSProperties = {
  color: 'var(--text-secondary)', fontSize: 12.5, fontWeight: 700, lineHeight: '16px',
};
const tileSub: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 10.5, marginTop: 3 };

// ─── Feuille détaillée ───────────────────────────────────────────────────────
const sheetOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200,
  display: 'flex', justifyContent: 'center',
};
const sheet: React.CSSProperties = {
  width: '100%', maxWidth: 480, background: 'var(--bg-base)',
  display: 'flex', flexDirection: 'column', height: '100dvh',
};
const sheetHeader: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px 12px',
  paddingTop: 'max(20px, env(safe-area-inset-top))',
  borderBottom: '1px solid var(--border-subtle)', flexShrink: 0,
};
const sheetBody: React.CSSProperties = { flex: 1, overflowY: 'auto', padding: '16px 16px 120px' };
const backBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 12, background: 'var(--bg-elevated)',
  border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 17, flexShrink: 0, cursor: 'pointer',
};
const heroThumb: React.CSSProperties = {
  height: 110, borderRadius: 14, marginBottom: 16, border: '1px solid var(--border-mid)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const diagramBox: React.CSSProperties = {
  background: 'var(--bg-card)', border: '1px solid var(--border-mid)',
  borderRadius: 14, padding: '14px 10px', marginBottom: 16,
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
            : <span style={{ display: 'inline-flex', opacity: 0.4 }}><IconDumbbell size={13} /></span>}
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
