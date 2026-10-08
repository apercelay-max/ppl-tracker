import React from 'react';
import { BadgeMedallion } from '../components/BadgeMedallion';
import { IconArrowLeft, IconTrophy, IconUser } from '../components/Icons';
import { GlassIcon } from '../components/GlassIcon';
import { useWorkoutStore } from '../store/workoutStore';
import { getAllExercises, getMaxWeightEver, computeTonnage, bucketByWeek, countPersonalRecords } from '../utils/training';
import { BADGE_CATEGORIES, computeBadgeProgress } from '../data/badges';
import { MESOCYCLE_WEEKS } from '../data/workouts';
import { useScreenClass } from '../hooks/useScreenClass';

interface ProfilScreenProps { onBack: () => void; }

const formatDate = (ts: number): string =>
  new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

export const ProfilScreen: React.FC<ProfilScreenProps> = ({ onBack }) => {
const screenClass = useScreenClass();
  const history = useWorkoutStore((s) => s.history);
  const weeklySessionGoal = useWorkoutStore((s) => s.weeklySessionGoal);
  const currentWeek = useWorkoutStore((s) => s.currentWeek);
  const badgesEnabled = useWorkoutStore((s) => s.badgesEnabled);
  const totalSessionsCompleted = useWorkoutStore((s) => s.totalSessionsCompleted);
  const totalCardioSessions = useWorkoutStore((s) => s.totalCardioSessions);
  const bestWeekStreak = useWorkoutStore((s) => s.bestWeekStreak);
  const bodyWeightHistory = useWorkoutStore((s) => s.bodyWeightHistory);
  const cardioHistory = useWorkoutStore((s) => s.cardioHistory);

  const totalSessions = history.length;
  const totalTonnage = history.reduce((sum, e) => sum + (e.tonnage ?? computeTonnage(e.exerciseProgress)), 0);
  const totalMinutes = Math.round(history.reduce((sum, e) => sum + e.durationMs, 0) / 60000);
  const totalHours = Math.floor(totalMinutes / 60);
  const remMinutes = totalMinutes % 60;

  const records = getAllExercises(history)
    .map((ex) => ({ ...ex, max: getMaxWeightEver(history, ex.id) }))
    .filter((r) => r.max > 0)
    .sort((a, b) => b.max - a.max);
  const topRecord = records[0];

  // Semaines d'affilée (semaine en cours incluse) où l'objectif hebdo a été
  // atteint — basé sur l'historique réel, pas inventé.
  const buckets = bucketByWeek(history, 52); // 52 et non 12 : palier de badge à 26 semaines
  let weekStreak = 0;
  for (let i = buckets.length - 1; i >= 0; i--) {
    if (buckets[i].sessionCount >= weeklySessionGoal) weekStreak++;
    // Même règle que la carte « Cette semaine » de l'accueil : la semaine en
    // cours ne casse pas la série tant qu'elle n'est pas terminée.
    else if (i !== buckets.length - 1) break;
  }
  const currentWeekReached = buckets[buckets.length - 1].sessionCount >= weeklySessionGoal;

  // history est du plus récent au plus ancien → la dernière position est la
  // toute première séance jamais enregistrée.
  const firstSession = history.length > 0 ? history[history.length - 1] : null;

  // Valeurs réelles associées à chaque catégorie de badge — voir data/badges.ts.
  const badgeValues: Record<string, number> = {
    sessions: totalSessionsCompleted,
    streak: bestWeekStreak,
    cardio: totalCardioSessions,
    bodyweight: bodyWeightHistory.length,
    records: countPersonalRecords(history),
    tonnage: totalTonnage,
    duration: totalHours,
    variety: getAllExercises(history).length,
    earlyBird: history.filter((e) => new Date(e.date).getHours() < 7).length,
    nightOwl: history.filter((e) => new Date(e.date).getHours() >= 21).length,
    weekend: history.filter((e) => [0, 6].includes(new Date(e.date).getDay())).length,
    cardioCalories: Math.round(cardioHistory.reduce((sum, e) => sum + e.calories, 0)),
    cardioVariety: new Set(cardioHistory.map((e) => e.type)).size,
    marathon: history.filter((e) => e.durationMs >= 75 * 60000).length,
    gyms: new Set(history.map((e) => e.gymId).filter(Boolean)).size,
    journal: history.filter((e) => e.note?.trim()).length,
  };

  return (
    <div className={screenClass} style={container}>
      <div style={scroll}>

        <div style={headerRow}>
          <button onClick={onBack} className="glass-icon" style={backBtn} aria-label="Retour"><IconArrowLeft size={17} /></button>
          <GlassIcon size={38} accent><IconUser size={19} /></GlassIcon>
          <div>
            <h1 style={title}>Profil</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>Ton résumé, basé sur ton historique</p>
          </div>
        </div>

        {totalSessions === 0 ? (
          <div style={card}>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: '18px', textAlign: 'center' }}>
              Pas encore de séance terminée — reviens ici après ton premier entraînement.
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <div style={statBlock}>
                <span style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 800 }}>{totalSessions}</span>
                <span style={statLabel}>SÉANCES</span>
              </div>
              <div style={statBlock}>
                <span style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 800 }}>{totalTonnage.toLocaleString('fr-FR')}</span>
                <span style={statLabel}>KG SOULEVÉS</span>
              </div>
              <div style={statBlock}>
                <span style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 800 }}>{totalHours}h{remMinutes.toString().padStart(2, '0')}</span>
                <span style={statLabel}>TEMPS TOTAL</span>
              </div>
            </div>

            <p style={sectionLabel}>SÉRIE EN COURS</p>
            <div style={card}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 16, fontWeight: 800 }}>
                {weekStreak} semaine{weekStreak > 1 ? 's' : ''} d'affilée
              </p>
              <p style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 3, lineHeight: '16px' }}>
                {weekStreak > 0
                  ? `Objectif de ${weeklySessionGoal} séance${weeklySessionGoal > 1 ? 's' : ''}/sem. atteint${currentWeekReached ? ' (semaine en cours incluse).' : ' (la semaine en cours n\'est pas encore comptée).'}`
                  : "Objectif hebdo pas encore atteint cette semaine."}
              </p>
            </div>

            <p style={sectionLabel}>RECORD ABSOLU</p>
            <div style={card}>
              {topRecord ? (
                <>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 16, fontWeight: 800 }}><span style={{ display: 'inline-flex', verticalAlign: '-3px', marginRight: 7 }}><IconTrophy size={16} /></span>{topRecord.name}</p>
                  <p style={{ color: 'var(--brand-1)', fontSize: 14, fontWeight: 700, marginTop: 3 }}>{topRecord.max} kg</p>
                </>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Aucun record chiffré pour l'instant.</p>
              )}
            </div>

            <p style={sectionLabel}>CYCLE</p>
            <div style={card}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700 }}>Semaine {currentWeek} / {MESOCYCLE_WEEKS}</p>
            </div>

            {firstSession && (
              <>
                <p style={sectionLabel}>MEMBRE DEPUIS</p>
                <div style={card}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700 }}>{formatDate(firstSession.date)}</p>
                  <p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 3 }}>Date de ta toute première séance enregistrée.</p>
                </div>
              </>
            )}

            {badgesEnabled && (
              <>
                <p style={{ ...sectionLabel, marginTop: 20 }}>BADGES</p>
                <div style={badgeGrid}>
                  {BADGE_CATEGORIES.map((cat) => {
                    const progress = computeBadgeProgress(cat, badgeValues[cat.id] ?? 0);
                    const unlocked = !!progress.currentTier;
                    return (
                      <div key={cat.id} style={badgeCell}>
                        <BadgeMedallion icon={cat.icon} motif={cat.motif} tierIndex={progress.currentTierIndex} size={56} />
                        <p style={{ color: unlocked ? 'var(--text-secondary)' : 'var(--text-dim)', fontSize: 11, fontWeight: 800, marginTop: 8, lineHeight: '14px' }}>
                          {unlocked ? progress.currentTier!.label : cat.title}
                        </p>
                        <p style={{ color: 'var(--text-dim)', fontSize: 10, marginTop: 2, lineHeight: '13px' }}>
                          {cat.unitLabel(progress.value)}
                        </p>
                        {progress.nextTier ? (
                          <div style={{ width: '100%', height: 4, borderRadius: 3, background: 'var(--bg-elevated)', overflow: 'hidden', marginTop: 6 }}>
                            <div style={{
                              height: '100%', borderRadius: 3, background: 'var(--brand-1)',
                              width: `${Math.round(progress.progressToNext * 100)}%`, transition: 'width 0.3s',
                            }} />
                          </div>
                        ) : unlocked ? (
                          <p style={{ color: 'var(--brand-1)', fontSize: 9, fontWeight: 700, marginTop: 4 }}>Tous les paliers atteints</p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
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
const sectionLabel: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 10, marginTop: 20 };
const card: React.CSSProperties = {
  background: 'var(--bg-card)', borderRadius: 14, padding: 16,
  border: '1px solid var(--border-mid)',
};
const badgeGrid: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
};
const badgeCell: React.CSSProperties = {
  background: 'var(--bg-card)', borderRadius: 14, padding: '14px 8px',
  border: '1px solid var(--border-mid)',
  display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
};
const statBlock: React.CSSProperties = {
  flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border)',
  borderRadius: 14, padding: '12px 4px',
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
};
const statLabel: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 8, fontWeight: 700, letterSpacing: 1, textAlign: 'center' };
