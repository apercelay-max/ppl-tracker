import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { getProgram } from '../data/programs';
import { getWorkout } from '../data/workouts';
import { weightUnitLabel } from '../utils/weight';
import { buildTableurSheet, buildTableurWorkbook, formatTableurDate, tableurDayIds } from '../utils/tableur';
import { EmptyState } from '../components/EmptyState';
import { IconArrowLeft, IconDownload, IconTable } from '../components/Icons';
import { useScreenClass } from '../hooks/useScreenClass';

interface TableurScreenProps { onBack: () => void; }

// Mode « Tableur » (menu Plus) : les séances en grille façon Excel, remplie toute seule à partir de
// l'historique. Lecture seule : on saisit toujours dans l'écran de séance.
export const TableurScreen: React.FC<TableurScreenProps> = ({ onBack }) => {
  const screenClass = useScreenClass();
  const history = useWorkoutStore((s) => s.history);
  const weightUnit = useWorkoutStore((s) => s.weightUnit);
  const activeProgramId = useWorkoutStore((s) => s.activeProgramId);
  const customPrograms = useWorkoutStore((s) => s.customPrograms);

  const dayIds = useMemo(
    () => tableurDayIds(getProgram(activeProgramId, customPrograms).workouts.map((w) => w.id), history),
    [activeProgramId, customPrograms, history],
  );
  const [selected, setSelected] = useState<string | null>(null);
  const dayId = selected && dayIds.includes(selected) ? selected : dayIds[0];
  const sheet = useMemo(() => (dayId ? buildTableurSheet(dayId, history, weightUnit) : null), [dayId, history, weightUnit]);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // La colonne la plus récente est à droite : on y arrive directement, sans faire défiler.
  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = gridRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [dayId, sheet?.sessions.length]);

  const exportXlsx = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const blob = await buildTableurWorkbook(dayIds, history, weightUnit);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ppl-tracker-tableur-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Libérer l'URL tout de suite peut annuler le téléchargement (Safari) : on attend un peu.
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch {
      setMsg('L’export a échoué. Réessaie.');
    }
    setBusy(false);
  };

  const unit = weightUnitLabel(weightUnit);

  return (
    <div className={screenClass} style={container}>
      <div style={scroll}>
        <div style={headerRow}>
          <button onClick={onBack} className="glass-icon" style={backBtn} aria-label="Retour"><IconArrowLeft size={17} /></button>
          <div>
            <h1 style={title}>Tableur</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>Tes séances en grille, remplie toute seule</p>
          </div>
        </div>

        {history.length === 0 || !sheet ? (
          <EmptyState icon={<IconTable size={20} />} text="Rien à afficher pour le moment. Termine une séance : elle apparaîtra ici, série par série." />
        ) : (
          <>
            <div style={chips}>
              {dayIds.map((id) => (
                <button key={id} onClick={() => setSelected(id)} style={{ ...chip, ...(id === dayId ? chipActive : {}) }}>
                  {getWorkout(id)?.name ?? id}
                </button>
              ))}
            </div>

            {sheet.sessions.length === 0 ? (
              <p style={hint}>Cette séance n’a pas encore été faite. Sa colonne apparaîtra ici dès la première fois.</p>
            ) : (
              <div ref={gridRef} style={gridWrap}>
                <table style={table}>
                  <thead>
                    <tr>
                      <th style={{ ...th, ...stickyExo }} rowSpan={2}>Exercice</th>
                      <th style={{ ...th, ...stickySet }} rowSpan={2}>Série</th>
                      <th style={{ ...th, minWidth: 54 }} rowSpan={2}>Cibles</th>
                      {sheet.sessions.map((s) => (
                        <th key={s.id} style={{ ...th, ...groupTh }} colSpan={2}>{formatTableurDate(s.date)}</th>
                      ))}
                    </tr>
                    <tr>
                      {sheet.sessions.map((s) => (
                        <React.Fragment key={s.id}>
                          <th style={{ ...th, ...subTh }}>{unit}</th>
                          <th style={{ ...th, ...subTh }}>reps</th>
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sheet.rows.map((r) => (
                      <tr key={`${r.exerciseId}-${r.setNumber}`} style={r.firstOfExercise ? exoStart : undefined}>
                        <td style={{ ...td, ...stickyExo, fontWeight: 700, color: 'var(--text-primary)' }} title={r.exerciseName}>{r.firstOfExercise ? r.exerciseName : ''}</td>
                        <td style={{ ...td, ...stickySet, textAlign: 'center', color: 'var(--text-muted)' }}>{r.setNumber}</td>
                        <td style={{ ...td, textAlign: 'center', color: 'var(--text-muted)' }} title={r.target}>{r.target.split(' · ')[0]}</td>
                        {r.cells.map((c, i) => (
                          <React.Fragment key={sheet.sessions[i].id}>
                            <td style={{ ...td, ...numTd }} title={c?.swappedFor ? `Remplacé par : ${c.swappedFor}` : undefined}>
                              {c ? `${c.weight}${c.swappedFor ? ' *' : ''}` : ''}
                            </td>
                            <td style={{ ...td, ...numTd, borderRight: '1px solid var(--border-mid)' }}>{c?.reps ?? ''}</td>
                          </React.Fragment>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p style={hint}>Une colonne par séance faite, la plus récente à droite. * : exercice remplacé ce jour-là.</p>

            <button disabled={busy} onClick={() => void exportXlsx()} style={exportBtn}>
              <IconDownload size={16} />
              {busy ? 'Préparation…' : 'Exporter en Excel (.xlsx)'}
            </button>
            {msg && <p style={{ color: '#f5a623', fontSize: 11.5, marginTop: 8 }}>{msg}</p>}
          </>
        )}
      </div>
    </div>
  );
};

const container: React.CSSProperties = { height: '100dvh', overflowY: 'auto' };
const scroll: React.CSSProperties = { maxWidth: 480, margin: '0 auto', padding: '0 16px 112px' };
const headerRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 14,
  paddingTop: 'max(24px, env(safe-area-inset-top))', paddingBottom: 18,
  borderBottom: '1px solid var(--border-subtle)', marginBottom: 18,
};
const backBtn: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 12, background: 'var(--bg-elevated)',
  border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 18, flexShrink: 0,
};
const title: React.CSSProperties = { color: 'var(--text-primary)', fontSize: 20, fontWeight: 800 };
const chips: React.CSSProperties = { display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12 };
const chip: React.CSSProperties = {
  flexShrink: 0, padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
  background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-mid)',
};
const chipActive: React.CSSProperties = { color: 'var(--text-primary)', border: '1px solid var(--brand-1)' };
const gridWrap: React.CSSProperties = {
  overflow: 'auto', maxHeight: '62dvh', borderRadius: 12, border: '1px solid var(--border-mid)', background: 'var(--bg-elevated)',
};
const table: React.CSSProperties = { borderCollapse: 'separate', borderSpacing: 0, fontSize: 12, width: 'max-content', minWidth: '100%' };
const th: React.CSSProperties = {
  position: 'sticky', top: 0, zIndex: 2, background: 'var(--bg-elevated)', color: 'var(--text-muted)',
  fontSize: 10.5, fontWeight: 700, padding: '7px 8px', borderBottom: '1px solid var(--border-mid)', whiteSpace: 'nowrap',
};
const groupTh: React.CSSProperties = { color: 'var(--text-primary)', borderRight: '1px solid var(--border-mid)' };
const subTh: React.CSSProperties = { top: 29, fontWeight: 600 };
const td: React.CSSProperties = { padding: '6px 8px', borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap', background: 'var(--bg-elevated)' };
const numTd: React.CSSProperties = { textAlign: 'center', minWidth: 42, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' };
// Largeur fixe : la colonne « Série » se colle à 130 px du bord, juste derrière celle-ci.
const stickyExo: React.CSSProperties = { position: 'sticky', left: 0, zIndex: 3, width: 130, minWidth: 130, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis' };
const stickySet: React.CSSProperties = { position: 'sticky', left: 130, zIndex: 3 };
const exoStart: React.CSSProperties = { boxShadow: 'inset 0 1px 0 var(--border-mid)' };
const hint: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 11.5, lineHeight: '16px', margin: '10px 0 16px' };
const exportBtn: React.CSSProperties = {
  width: '100%', padding: 12, borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', color: 'var(--text-muted)', fontSize: 13, fontWeight: 700,
};
