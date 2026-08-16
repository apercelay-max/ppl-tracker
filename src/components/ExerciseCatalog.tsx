import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useWorkoutStore } from '../store/workoutStore';
import { getAllPrograms, type Program } from '../data/programs';
import { addCatalogExerciseToWorkout } from '../utils/workoutGenerator';
import { replaceCustomProgram } from './ProgrammesPanel';
import {
  EXERCISE_CATALOG, EXERCISE_IMG_BASE, CATALOG_GROUPS, CATALOG_EQUIPMENT,
  getGuide, type CatalogExercise, type Equipment,
} from '../data/exercisesCatalog';

/**
 * Catalogue d'exercices : liste filtrable + fiche détaillée.
 *
 * Les favoris vivent dans localStorage plutôt que dans le store Zustand :
 * c'est une préférence purement locale, il n'y a rien à synchroniser dans le
 * cloud et ça évite de toucher à workoutStore.ts (et donc à la synchro).
 */

const FAVS_KEY = 'ppl-catalog-favoris';

const readFavs = (): string[] => {
  try {
    const raw = localStorage.getItem(FAVS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return []; // localStorage indisponible (navigation privée) : pas de favoris, pas de crash
  }
};

const writeFavs = (ids: string[]) => {
  try { localStorage.setItem(FAVS_KEY, JSON.stringify(ids)); } catch { /* ignoré */ }
};

/** Recherche insensible à la casse ET aux accents (taper "developpe" trouve "Développé"). */
const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const imgUrl = (ex: CatalogExercise) => (ex.img ? `${EXERCISE_IMG_BASE}/${ex.img}` : null);

type TypeFilter = 'Tous' | 'Polyarticulaire' | 'Isolation';
type LevelFilter = 'Tous' | 'Débutant' | 'Intermédiaire' | 'Avancé';

export const ExerciseCatalog: React.FC = () => {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [type, setType] = useState<TypeFilter>('Tous');
  const [level, setLevel] = useState<LevelFilter>('Tous');
  const [essentialsOnly, setEssentialsOnly] = useState(false);
  const [favsOnly, setFavsOnly] = useState(false);
  const [favs, setFavs] = useState<string[]>(readFavs);
  const [openEx, setOpenEx] = useState<CatalogExercise | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const toggleFav = (id: string) => {
    setFavs((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      writeFavs(next);
      return next;
    });
  };

  const q = normalize(query.trim());

  const results = useMemo(() => EXERCISE_CATALOG.filter((ex) => {
    if (group && ex.group !== group) return false;
    if (equipment && ex.equipment !== equipment) return false;
    if (type !== 'Tous' && ex.type !== type) return false;
    if (level !== 'Tous' && ex.level !== level) return false;
    if (essentialsOnly && !ex.essential) return false;
    if (favsOnly && !favs.includes(ex.id)) return false;
    if (q === '') return true;
    // On cherche dans le nom FR, le nom EN et les muscles ciblés
    const haystack = normalize([ex.name, ex.nameEn, ...ex.primary, ...ex.secondary].join(' '));
    return haystack.includes(q);
  }), [group, equipment, type, level, essentialsOnly, favsOnly, favs, q]);

  const byGroup = useMemo(() => CATALOG_GROUPS
    .map((g) => ({ group: g, items: results.filter((ex) => ex.group === g) }))
    .filter((s) => s.items.length > 0), [results]);

  const activeFilters =
    (group ? 1 : 0) + (equipment ? 1 : 0) + (type !== 'Tous' ? 1 : 0) +
    (level !== 'Tous' ? 1 : 0) + (essentialsOnly ? 1 : 0) + (favsOnly ? 1 : 0);

  const resetFilters = () => {
    setGroup(null); setEquipment(null); setType('Tous');
    setLevel('Tous'); setEssentialsOnly(false); setFavsOnly(false);
  };

  return (
    <div>
      <div style={searchWrap}>
        <span style={{ fontSize: 14, opacity: 0.7 }}>🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Exercice, muscle, matériel..."
          style={searchInput}
        />
        {query !== '' && (
          <button onClick={() => setQuery('')} style={clearBtn} aria-label="Effacer">✕</button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <button
          onClick={() => setShowFilters((v) => !v)}
          style={{ ...pill, ...(activeFilters > 0 ? pillActive : {}), flex: 1 }}
        >
          Filtres{activeFilters > 0 ? ` (${activeFilters})` : ''} {showFilters ? '▴' : '▾'}
        </button>
        <button
          onClick={() => setEssentialsOnly((v) => !v)}
          style={{ ...pill, ...(essentialsOnly ? pillActive : {}) }}
        >
          ★ Essentiels
        </button>
        <button
          onClick={() => setFavsOnly((v) => !v)}
          style={{ ...pill, ...(favsOnly ? pillActive : {}) }}
        >
          ♥ {favs.length}
        </button>
      </div>

      {showFilters && (
        <div style={filterPanel}>
          <FilterRow label="Groupe musculaire">
            <Chip label="Tous" active={group === null} onClick={() => setGroup(null)} />
            {CATALOG_GROUPS.map((g) => (
              <Chip key={g} label={g} active={group === g} onClick={() => setGroup(group === g ? null : g)} />
            ))}
          </FilterRow>
          <FilterRow label="Matériel">
            <Chip label="Tout" active={equipment === null} onClick={() => setEquipment(null)} />
            {CATALOG_EQUIPMENT.map((eq) => (
              <Chip key={eq} label={eq} active={equipment === eq} onClick={() => setEquipment(equipment === eq ? null : eq)} />
            ))}
          </FilterRow>
          <FilterRow label="Type">
            {(['Tous', 'Polyarticulaire', 'Isolation'] as TypeFilter[]).map((t) => (
              <Chip key={t} label={t} active={type === t} onClick={() => setType(t)} />
            ))}
          </FilterRow>
          <FilterRow label="Niveau">
            {(['Tous', 'Débutant', 'Intermédiaire', 'Avancé'] as LevelFilter[]).map((l) => (
              <Chip key={l} label={l} active={level === l} onClick={() => setLevel(l)} />
            ))}
          </FilterRow>
          {activeFilters > 0 && (
            <button onClick={resetFilters} style={resetBtn}>Réinitialiser les filtres</button>
          )}
        </div>
      )}

      <p style={countLabel}>
        {results.length} exercice{results.length > 1 ? 's' : ''}
      </p>

      {results.length === 0 && (
        <p style={emptyText}>
          Aucun exercice ne correspond. Essaie d'enlever un filtre ou de simplifier ta recherche.
        </p>
      )}

      {byGroup.map(({ group: g, items }) => (
        <div key={g} style={{ marginBottom: 18 }}>
          <p style={sectionLabel}>{g} · {items.length}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((ex) => (
              <ExerciseRow
                key={ex.id}
                ex={ex}
                isFav={favs.includes(ex.id)}
                onToggleFav={() => toggleFav(ex.id)}
                onOpen={() => setOpenEx(ex)}
              />
            ))}
          </div>
        </div>
      ))}

      {openEx && (
        <ExerciseSheet
          ex={openEx}
          isFav={favs.includes(openEx.id)}
          onToggleFav={() => toggleFav(openEx.id)}
          onClose={() => setOpenEx(null)}
        />
      )}
    </div>
  );
};

// ─── Ligne de la liste ───────────────────────────────────────────────────────

const ExerciseRow: React.FC<{
  ex: CatalogExercise; isFav: boolean; onToggleFav: () => void; onOpen: () => void;
}> = ({ ex, isFav, onToggleFav, onOpen }) => {
  const url = imgUrl(ex);
  return (
    <div style={card}>
      <button onClick={onOpen} style={rowBtn}>
        <div style={thumb}>
          {url
            ? <img src={url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 18, opacity: 0.4 }}>🏋️</span>}
        </div>
        <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
          <p style={rowTitle}>
            {ex.essential && <span style={{ color: 'var(--brand-1)' }}>★ </span>}
            {ex.name}
          </p>
          <p style={rowSub}>
            {ex.equipment} · {ex.type === 'Polyarticulaire' ? 'Poly.' : 'Isolation'} · {ex.level}
          </p>
        </div>
      </button>
      <button
        onClick={onToggleFav}
        style={{ ...favBtn, color: isFav ? 'var(--brand-1)' : 'var(--text-dim)' }}
        aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      >
        {isFav ? '♥' : '♡'}
      </button>
    </div>
  );
};

// ─── Fiche détaillée (feuille plein écran) ───────────────────────────────────

const ExerciseSheet: React.FC<{
  ex: CatalogExercise; isFav: boolean; onToggleFav: () => void; onClose: () => void;
}> = ({ ex, isFav, onToggleFav, onClose }) => {
  const guide = getGuide(ex);
  const url = imgUrl(ex);
  const [adding, setAdding] = useState(false);
  // Portail vers <body> : l'écran est rendu dans un conteneur animé (classes de
  // transition d'App.tsx) dont le `transform` crée un contexte d'empilement.
  // Sans portail, la fiche resterait piégée SOUS la barre de navigation, quel
  // que soit son z-index.
  return createPortal(
    <div style={sheetOverlay} onClick={onClose}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={sheetHeader}>
          <button onClick={onClose} style={backBtn} aria-label="Fermer">←</button>
          <p style={{ flex: 1, color: 'var(--text-primary)', fontSize: 16, fontWeight: 800 }}>{ex.name}</p>
          <button
            onClick={onToggleFav}
            style={{ ...favBtn, fontSize: 20, color: isFav ? 'var(--brand-1)' : 'var(--text-dim)' }}
            aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            {isFav ? '♥' : '♡'}
          </button>
        </div>

        <div style={sheetBody}>
          {url && (
            <img src={url} alt={ex.name} style={heroImg} />
          )}

          <p style={{ color: 'var(--text-dim)', fontSize: 11.5, marginBottom: 12 }}>{ex.nameEn}</p>

          <div style={badgeRow}>
            <Badge>{ex.equipment}</Badge>
            <Badge>{ex.type}</Badge>
            <Badge>{ex.pattern}</Badge>
            <Badge>{ex.level}</Badge>
          </div>

          <button onClick={() => setAdding(true)} style={addBtn}>
            + Ajouter cet exercice à une séance
          </button>

          {adding && <AddToWorkout ex={ex} onDone={() => setAdding(false)} />}

          <Section title="Muscles ciblés">
            <p style={bodyText}>
              <b style={{ color: 'var(--text-secondary)' }}>Principaux :</b> {ex.primary.join(', ') || '—'}
            </p>
            {ex.secondary.length > 0 && (
              <p style={{ ...bodyText, marginTop: 4 }}>
                <b style={{ color: 'var(--text-secondary)' }}>Secondaires :</b> {ex.secondary.join(', ')}
              </p>
            )}
          </Section>

          <Section title="Exécution">
            <ol style={{ paddingLeft: 18, margin: 0 }}>
              {guide.steps.map((s, i) => (
                <li key={i} style={{ ...bodyText, marginBottom: 6 }}>{s}</li>
              ))}
            </ol>
          </Section>

          <Section title="Conseils">
            {guide.tips.map((s, i) => (
              <p key={i} style={{ ...bodyText, marginBottom: 5 }}>• {s}</p>
            ))}
          </Section>

          <Section title="Erreurs courantes">
            {guide.mistakes.map((s, i) => (
              <p key={i} style={{ ...bodyText, marginBottom: 5 }}>⚠️ {s}</p>
            ))}
          </Section>

          <p style={sourceNote}>
            Photos et données de base : free-exercise-db (domaine public).
            Ces explications sont des repères généraux, pas un avis médical — en cas de
            douleur, arrête et fais-toi conseiller sur place.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Ajouter un exercice à une séance existante ──────────────────────────────

/**
 * Ajoute un exercice du catalogue à une séance.
 *
 * Les programmes intégrés (Strict V11, PPL Débutant…) sont écrits en dur dans le
 * code : impossible de les modifier. On propose donc d'en faire une copie
 * modifiable, qui devient un programme importé comme les autres. Les identifiants
 * d'exercice ne changent pas, donc les records suivent dans la copie.
 */
const AddToWorkout: React.FC<{ ex: CatalogExercise; onDone: () => void }> = ({ ex, onDone }) => {
  const customPrograms = useWorkoutStore((s) => s.customPrograms);
  const activeProgramId = useWorkoutStore((s) => s.activeProgramId);
  const addCustomProgram = useWorkoutStore((s) => s.addCustomProgram);
  const setActiveProgram = useWorkoutStore((s) => s.setActiveProgram);
  const [programId, setProgramId] = useState(activeProgramId);
  const [done, setDone] = useState<string | null>(null);

  const programs = getAllPrograms(customPrograms);
  const program = programs.find((p) => p.id === programId) ?? programs[0];
  const editable = program?.isCustom === true;

  if (!program) return null;

  const duplicate = (): Program => {
    const stamp = Date.now();
    return {
      ...program,
      id: `copie-${program.id}-${stamp}`,
      name: `${program.name} (ma version)`,
      isCustom: true,
      source: `Copie modifiable de « ${program.name} », créée depuis le catalogue d'exercices.`,
      // Nouveaux identifiants de séance, sinon ils entreraient en conflit avec
      // ceux du programme d'origine (deux séances ne peuvent pas partager un id).
      workouts: program.workouts.map((w, i) => ({ ...w, id: `${'copie'}-${stamp}-${i + 1}` })),
      dayAccents: Object.fromEntries(
        program.workouts.map((w, i) => [`copie-${stamp}-${i + 1}`, program.dayAccents[w.id] ?? '#7c6fcd'])
      ),
      dayTypeLabels: Object.fromEntries(
        program.workouts.map((w, i) => [`copie-${stamp}-${i + 1}`, program.dayTypeLabels[w.id] ?? w.name.toUpperCase()])
      ),
    };
  };

  const handleAdd = (dayId: string, dayName: string) => {
    if (editable) {
      replaceCustomProgram(addCatalogExerciseToWorkout(program, dayId, ex));
      setDone(`Ajouté à « ${dayName} ».`);
      return;
    }
    // Programme intégré : on duplique, on ajoute dans la copie, on l'active.
    const copy = duplicate();
    const index = program.workouts.findIndex((w) => w.id === dayId);
    const copyDayId = copy.workouts[index].id;
    addCustomProgram(addCatalogExerciseToWorkout(copy, copyDayId, ex));
    setActiveProgram(copy.id);
    setDone(`Copie « ${copy.name} » créée et activée, avec l'exercice ajouté à « ${dayName} ».`);
  };

  if (done) {
    return (
      <div style={addPanel}>
        <p style={{ ...bodyText, marginBottom: 10 }}>{done}</p>
        <button onClick={onDone} style={addPanelBtn}>Fermer</button>
      </div>
    );
  }

  return (
    <div style={addPanel}>
      <p style={sectionLabel}>Programme</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {programs.map((p) => (
          <button
            key={p.id}
            onClick={() => setProgramId(p.id)}
            style={{ ...chip, ...(p.id === programId ? chipActive : {}) }}
          >
            {p.name}
          </button>
        ))}
      </div>

      {!editable && (
        <p style={{ ...bodyText, fontSize: 11.5, marginBottom: 10 }}>
          « {program.name} » est un programme intégré, il ne peut pas être modifié directement.
          Choisir une séance en créera une copie modifiable, qui deviendra ton programme actif.
        </p>
      )}

      <p style={sectionLabel}>Ajouter à quelle séance ?</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {program.workouts.map((w) => (
          <button key={w.id} onClick={() => handleAdd(w.id, w.name)} style={dayPickBtn}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{w.name}</span>
            <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>{w.exercises.length} exos</span>
          </button>
        ))}
      </div>

      <button onClick={onDone} style={{ ...addPanelBtn, marginTop: 10 }}>Annuler</button>
    </div>
  );
};

// ─── Petits composants ───────────────────────────────────────────────────────

const FilterRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 12 }}>
    <p style={sectionLabel}>{label}</p>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{children}</div>
  </div>
);

const Chip: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ ...chip, ...(active ? chipActive : {}) }}>{label}</button>
);

const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={badge}>{children}</span>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 18 }}>
    <p style={sectionLabel}>{title}</p>
    {children}
  </div>
);

// ─── Styles ──────────────────────────────────────────────────────────────────

const searchWrap: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)',
  border: '1px solid var(--border-mid)', borderRadius: 12, padding: '10px 14px', marginBottom: 10,
};
const searchInput: React.CSSProperties = {
  flex: 1, background: 'transparent', border: 'none', outline: 'none',
  color: 'var(--text-primary)', fontSize: 14, minWidth: 0,
};
const clearBtn: React.CSSProperties = {
  color: 'var(--text-dim)', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: 4,
};
const pill: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
  background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-mid)',
};
const pillActive: React.CSSProperties = {
  background: 'var(--brand-1)', color: '#fff', border: '1px solid transparent',
};
const filterPanel: React.CSSProperties = {
  background: 'var(--bg-card)', border: '1px solid var(--border-mid)',
  borderRadius: 14, padding: 14, marginBottom: 12,
};
const chip: React.CSSProperties = {
  padding: '6px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
  background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-mid)',
};
const chipActive: React.CSSProperties = {
  background: 'var(--brand-1)', color: '#fff', border: '1px solid transparent',
};
const resetBtn: React.CSSProperties = {
  width: '100%', padding: '9px 0', borderRadius: 10, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
  background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-mid)',
};
const countLabel: React.CSSProperties = {
  color: 'var(--text-dim)', fontSize: 11.5, marginBottom: 12,
};
const emptyText: React.CSSProperties = {
  color: 'var(--text-dim)', fontSize: 13, textAlign: 'center', marginTop: 24, lineHeight: '19px',
};
const sectionLabel: React.CSSProperties = {
  color: 'var(--text-dim)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 8,
};
const card: React.CSSProperties = {
  display: 'flex', alignItems: 'center', background: 'var(--bg-card)', borderRadius: 14,
  border: '1px solid var(--border-mid)', overflow: 'hidden',
};
const rowBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0,
  padding: '10px 4px 10px 10px', cursor: 'pointer', background: 'none', border: 'none',
};
const thumb: React.CSSProperties = {
  width: 52, height: 52, borderRadius: 10, flexShrink: 0, overflow: 'hidden',
  background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const rowTitle: React.CSSProperties = {
  color: 'var(--text-secondary)', fontSize: 13.5, fontWeight: 700, lineHeight: '18px',
};
const rowSub: React.CSSProperties = {
  color: 'var(--text-dim)', fontSize: 11, marginTop: 2,
};
const favBtn: React.CSSProperties = {
  fontSize: 17, background: 'none', border: 'none', cursor: 'pointer', padding: '10px 12px', flexShrink: 0,
};
const sheetOverlay: React.CSSProperties = {
  // z-index au-dessus de la NavBar flottante (z 50), sinon la barre du bas
  // reste posée par-dessus la fiche et on peut cliquer dedans par erreur.
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
const sheetBody: React.CSSProperties = {
  flex: 1, overflowY: 'auto', padding: '16px 16px 120px',
};
const backBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 12, background: 'var(--bg-elevated)',
  border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 17, flexShrink: 0, cursor: 'pointer',
};
const heroImg: React.CSSProperties = {
  width: '100%', borderRadius: 14, marginBottom: 12,
  border: '1px solid var(--border-mid)', background: 'var(--bg-elevated)',
};
const badgeRow: React.CSSProperties = {
  display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18,
};
const badge: React.CSSProperties = {
  padding: '5px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
  background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-mid)',
};
const bodyText: React.CSSProperties = {
  color: 'var(--text-muted)', fontSize: 13, lineHeight: '19px',
};
const addBtn: React.CSSProperties = {
  width: '100%', padding: '11px 0', borderRadius: 10, fontSize: 12.5, fontWeight: 700,
  cursor: 'pointer', background: 'var(--brand-1)', color: '#fff', border: 'none', marginBottom: 18,
};
const addPanel: React.CSSProperties = {
  background: 'var(--bg-card)', border: '1px solid var(--border-mid)',
  borderRadius: 12, padding: 12, marginBottom: 18, marginTop: -8,
};
const addPanelBtn: React.CSSProperties = {
  width: '100%', padding: '9px 0', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
  background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-mid)',
};
const dayPickBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
  padding: '10px 12px', borderRadius: 10, cursor: 'pointer', fontSize: 12.5,
  background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)',
};
const sourceNote: React.CSSProperties = {
  color: 'var(--text-dim)', fontSize: 10.5, lineHeight: '15px', marginTop: 8,
  paddingTop: 12, borderTop: '1px solid var(--border-subtle)',
};
