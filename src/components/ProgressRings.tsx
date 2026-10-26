import React, { useCallback, useEffect, useState } from 'react';
import type { CardioEntry, HistoryEntry } from '../data/types';
import type { UiStyle } from '../store/workoutStore';
import { getMuscleRecoverySummary } from '../utils/training';
import { weeklyLoads } from '../utils/trainingStatus';
import { loadRingFill } from '../utils/ringsLoad';

interface ProgressRingsProps {
  history: HistoryEntry[];
  cardioHistory: CardioEntry[];
  weeklySessionGoal: number;
  variant: UiStyle;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// Rayons des trois anneaux (du plus grand au plus petit) dans un viewBox de 140.
// L'épaisseur, les couleurs, le halo et la courbe de mouvement viennent du CSS
// (.pr--<style>), pour que les 4 styles de l'appli partagent le même dessin.
const RINGS = [
  { key: 'seances', r: 60 },
  { key: 'repos', r: 46 },
  { key: 'charge', r: 32 },
] as const;
type RingKey = (typeof RINGS)[number]['key'];

// Durées en ms : lues par le CSS (variables) ET par les compteurs, pour que
// les chiffres finissent en même temps que les arcs. La courbe d'accélération
// reste dans le CSS, propre à chaque style.
const TIMING: Record<UiStyle, { dur: number; stagger: number }> = {
  nouveau: { dur: 1300, stagger: 160 },
  classique: { dur: 1500, stagger: 200 },
  sport: { dur: 700, stagger: 90 },
  epure: { dur: 1600, stagger: 220 },
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Chiffre qui compte de 0 à `to` ; `run` le fait repartir de zéro. */
const CountUp: React.FC<{ to: number; run: number; delay: number; dur: number }> = ({ to, run, delay, dur }) => {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion()) { setN(to); return; }
    setN(0);
    let raf = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const t = clamp01((now - start) / dur);
      // easeOutCubic : le compteur ralentit en arrivant, sans dépasser la cible.
      setN(to * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, run, delay, dur]);
  return <>{Math.round(n)}</>;
};

export const ProgressRings: React.FC<ProgressRingsProps> = ({ history, cardioHistory, weeklySessionGoal, variant }) => {
  const timing = TIMING[variant] ?? TIMING.nouveau;

  // `ready` : les arcs partent de 0 puis se remplissent (sans ça la transition
  // CSS ne se joue pas, l'anneau apparaît déjà plein). Deux frames d'attente :
  // une seule peut arriver avant le premier affichage. `run` change à chaque
  // relecture pour recréer le dessin à zéro (sinon les arcs se videraient en
  // reculant avant de se remplir).
  const [ready, setReady] = useState(false);
  const [run, setRun] = useState(0);
  const play = useCallback(() => {
    setReady(false);
    let second = 0;
    const first = requestAnimationFrame(() => { second = requestAnimationFrame(() => setReady(true)); });
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); };
  }, []);
  useEffect(() => play(), [play]);
  const replay = () => { setRun((r) => r + 1); play(); };

  // Même fenêtre glissante de 7 jours que le compteur « Semaine » de l'accueil.
  const sessions = history.filter((e) => Date.now() - e.date < 7 * 86400000).length;
  const { averagePct } = getMuscleRecoverySummary(history);
  const [thisWeekLoad, ...pastLoads] = weeklyLoads(history, cardioHistory, 5);
  const loadFill = loadRingFill(thisWeekLoad, pastLoads);

  const values: Record<RingKey, number | null> = {
    seances: clamp01(sessions / Math.max(1, weeklySessionGoal)),
    repos: clamp01(averagePct),
    charge: loadFill,
  };
  const summary = [
    `Séances ${sessions} sur ${weeklySessionGoal}`,
    `Repos ${Math.round(averagePct * 100)} %`,
    `Charge ${loadFill === null ? 'inconnue' : `${Math.round(loadFill * 100)} %`}`,
  ].join(', ');

  const rootStyle = { '--pr-dur': `${timing.dur}ms`, '--pr-stagger': `${timing.stagger}ms` } as React.CSSProperties;
  const labels: Record<RingKey, string> = { seances: 'Séances', repos: 'Repos', charge: 'Charge' };

  return (
    <section
      className={`glass-card pr pr--${variant}`}
      style={rootStyle}
      aria-label="Ta semaine en anneaux"
      title="Toucher pour rejouer l'animation"
      tabIndex={0}
      onClick={replay}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); replay(); } }}
    >
      <svg key={run} className="pr-svg" viewBox="0 0 140 140" role="img" aria-label={summary}>
        {RINGS.map(({ key, r }, i) => {
          const v = values[key];
          const full = v !== null && v >= 1;
          return (
            <g key={key} className={`pr-ring pr-${key}${full ? ' is-full' : ''}`} style={{ '--i': i } as React.CSSProperties}>
              <circle className="pr-track" cx="70" cy="70" r={r} fill="none" pathLength={100} />
              {v !== null && (
                <>
                  <circle
                    className="pr-arc" cx="70" cy="70" r={r} fill="none" pathLength={100}
                    strokeDasharray={`${ready ? Math.round(v * 100) : 0} 100`}
                    transform="rotate(-90 70 70)"
                  />
                  {/* Point lumineux au bout de l'arc : il tourne avec la même courbe que le trait. */}
                  {v > 0.01 && v < 1 && (
                    <g className="pr-head" style={{ '--a': `${ready ? v * 360 : 0}deg` } as React.CSSProperties}>
                      <circle cx="70" cy={70 - r} r="2.4" />
                    </g>
                  )}
                </>
              )}
            </g>
          );
        })}
      </svg>
      <ul className="pr-legend" aria-hidden="true">
        {RINGS.map(({ key }, i) => {
          const v = values[key];
          const delay = i * timing.stagger;
          return (
            <li key={key} className={`pr-${key}${v !== null && v >= 1 ? ' is-full' : ''}`} style={{ '--i': i } as React.CSSProperties}>
              <i />
              <span>{labels[key]}</span>
              <b>
                {key === 'seances' && <><CountUp to={sessions} run={run} delay={delay} dur={timing.dur} /> / {weeklySessionGoal}</>}
                {key === 'repos' && <><CountUp to={Math.round(averagePct * 100)} run={run} delay={delay} dur={timing.dur} /> %</>}
                {key === 'charge' && (loadFill === null ? '—' : <><CountUp to={Math.round(loadFill * 100)} run={run} delay={delay} dur={timing.dur} /> %</>)}
              </b>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
