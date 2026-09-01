import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { useBikeSensor } from '../hooks/useBikeSensor';
import { useHeartRate } from '../hooks/useHeartRate';
import type { CardioStats } from '../data/types';
import { IconArrowLeft, IconBike, IconCheck } from '../components/Icons';
import { GlassIcon } from '../components/GlassIcon';

interface BikeScreenProps { onBack: () => void; }

const fmtChrono = (ms: number): string => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

/** Accumulateur de moyennes : une somme et un compteur, rien de plus. */
interface Acc { sum: number; n: number; max: number }
const push = (a: Acc, v: number): Acc => ({ sum: a.sum + v, n: a.n + 1, max: Math.max(a.max, v) });
const avg = (a: Acc): number | undefined => (a.n ? Math.round(a.sum / a.n) : undefined);
const EMPTY_ACC: Acc = { sum: 0, n: 0, max: 0 };

export const BikeScreen: React.FC<BikeScreenProps> = ({ onBack }) => {
  const addCardioEntry = useWorkoutStore((s) => s.addCardioEntry);
  const kcalPerHour = useWorkoutStore((s) => s.cardioKcalPerHour.velo);
  const hapticsEnabled = useWorkoutStore((s) => s.hapticsEnabled);

  const bike = useBikeSensor();
  const heart = useHeartRate();

  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [saved, setSaved] = useState(false);

  // Moyennes cumulées pendant la séance. Dans une ref plutôt qu'un state :
  // elles changent à chaque trame BLE (plusieurs fois par seconde) et n'ont
  // pas besoin de redessiner l'écran — seul le chrono le fait, une fois/s.
  const acc = useRef({ power: EMPTY_ACC, cadence: EMPTY_ACC, speed: EMPTY_ACC, hr: EMPTY_ACC });
  const distanceRef = useRef<number | null>(null);
  const bikeCaloriesRef = useRef<number | null>(null);

  const running = startedAt !== null && pausedAt === null;

  // Chrono
  useEffect(() => {
    if (startedAt === null) return;
    const tick = () => setElapsed((pausedAt ?? Date.now()) - startedAt);
    tick();
    if (pausedAt !== null) return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt, pausedAt]);

  // Accumulation des relevés, uniquement quand ça tourne : une pause ne doit
  // pas faire chuter la puissance moyenne avec une série de zéros.
  const r = bike.reading;
  useEffect(() => {
    if (!running) return;
    const a = acc.current;
    if (r.power != null && r.power > 0) a.power = push(a.power, r.power);
    if (r.cadence != null && r.cadence > 0) a.cadence = push(a.cadence, r.cadence);
    if (r.speed != null && r.speed > 0) a.speed = push(a.speed, r.speed);
    if (r.distanceKm != null) distanceRef.current = r.distanceKm;
    if (r.calories != null && r.calories > 0) bikeCaloriesRef.current = r.calories;
  }, [running, r.power, r.cadence, r.speed, r.distanceKm, r.calories]);

  const hr = heart.hr ?? r.hr;
  useEffect(() => {
    if (!running || hr == null || hr <= 0) return;
    acc.current.hr = push(acc.current.hr, hr);
  }, [running, hr]);

  const durationMin = Math.max(1, Math.round(elapsed / 60000));
  const estCalories = bikeCaloriesRef.current ?? Math.round((kcalPerHour / 60) * (elapsed / 60000));

  const start = () => {
    setStartedAt(Date.now());
    setPausedAt(null);
    setSaved(false);
    acc.current = { power: EMPTY_ACC, cadence: EMPTY_ACC, speed: EMPTY_ACC, hr: EMPTY_ACC };
    distanceRef.current = null;
    bikeCaloriesRef.current = null;
    if (hapticsEnabled && navigator.vibrate) navigator.vibrate(20);
  };

  const togglePause = () => {
    if (startedAt === null) return;
    if (pausedAt !== null) {
      // Même principe que la pause de séance : on décale le départ de la durée
      // de la pause, le chrono repart donc d'où il s'était arrêté.
      setStartedAt(startedAt + (Date.now() - pausedAt));
      setPausedAt(null);
    } else {
      setPausedAt(Date.now());
    }
  };

  const finish = () => {
    if (startedAt === null) return;
    if (elapsed < 60000) {
      const ok = window.confirm('Moins d\'une minute — enregistrer quand même cette sortie ?');
      if (!ok) return;
    }
    const a = acc.current;
    const stats: CardioStats = {
      avgPower: avg(a.power),
      maxPower: a.power.max || undefined,
      avgCadence: avg(a.cadence),
      maxCadence: a.cadence.max || undefined,
      avgSpeed: avg(a.speed),
      distanceKm: distanceRef.current ?? undefined,
      avgHr: avg(a.hr),
      maxHr: a.hr.max || undefined,
      source: bike.status === 'connected' ? 'bluetooth' : 'manuel',
      deviceName: bike.deviceName ?? undefined,
    };
    addCardioEntry('velo', durationMin, undefined, stats, bikeCaloriesRef.current ?? undefined);
    setSaved(true);
    bike.disconnect();
    heart.disconnect();
    onBack();
  };

  const connectLabel = useMemo(() => {
    if (bike.status === 'connected') return bike.deviceName ?? 'Vélo connecté';
    if (bike.status === 'connecting') return 'Connexion…';
    if (bike.status === 'unsupported') return 'Bluetooth indisponible';
    return 'Connecter le vélo';
  }, [bike.status, bike.deviceName]);

  return (
    <div className="screen-ambient" style={container}>
      <div style={scroll}>

        <div style={headerRow}>
          <button onClick={onBack} className="glass-icon" style={backBtn} aria-label="Retour"><IconArrowLeft size={17} /></button>
          <GlassIcon size={38} accent><IconBike size={19} /></GlassIcon>
          <div>
            <h1 style={title}>Mode vélo</h1>
            <p style={subtitle}>
              {startedAt === null ? 'Prêt à partir' : running ? 'En cours' : 'En pause'}
            </p>
          </div>
        </div>

        {/* ── Connexions ── */}
        <div className="glass-card" style={card}>
          <p style={cardLabel}>Capteurs</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              onClick={bike.status === 'connected' ? bike.disconnect : bike.connect}
              disabled={bike.status === 'unsupported' || bike.status === 'connecting'}
              style={{
                ...connectBtn,
                borderColor: bike.status === 'connected' ? 'rgba(63,178,122,0.5)' : 'var(--border-strong)',
                color: bike.status === 'connected' ? '#3fb27a' : 'var(--text-secondary)',
                opacity: bike.status === 'unsupported' ? 0.5 : 1,
              }}
            >
              {connectLabel}
            </button>
            <button
              onClick={heart.status === 'connected' ? heart.disconnect : heart.connect}
              disabled={!heart.isSupported || heart.status === 'connecting'}
              style={{
                ...connectBtn,
                flex: '0 0 auto',
                width: 92,
                borderColor: heart.status === 'connected' ? 'rgba(224,48,48,0.5)' : 'var(--border-strong)',
                color: heart.status === 'connected' ? 'var(--brand-1)' : 'var(--text-secondary)',
                opacity: heart.isSupported ? 1 : 0.5,
              }}
            >
              {heart.status === 'connected' ? (<><span style={{ display: 'inline-flex', verticalAlign: '-2px', marginRight: 4 }}><IconCheck size={12} /></span>Ceinture</>) : 'Ceinture'}
            </button>
          </div>

          {bike.status === 'unsupported' && (
            <p style={note}>
              Safari sur iPhone ne donne pas accès au Bluetooth aux sites web. Le chrono et
              l'enregistrement fonctionnent quand même — seules les mesures du vélo manquent.
              Sur Chrome (Android, Mac, PC), la connexion marche.
            </p>
          )}
          {bike.error && <p style={{ ...note, color: '#e08a30' }}>{bike.error}</p>}
        </div>

        {/* ── Chrono ── */}
        <div className="glass-card" style={{ ...card, textAlign: 'center' }}>
          <p style={cardLabel}>Durée</p>
          <p style={chrono} className="tabular">{fmtChrono(elapsed)}</p>
          <p style={{ ...note, marginTop: 2 }}>
            {estCalories} kcal
            {bikeCaloriesRef.current != null ? ' (mesurées par le vélo)' : ' (estimées)'}
          </p>
        </div>

        {/* ── Les chiffres ── */}
        <div style={statsGrid}>
          <Stat label="Puissance" value={r.power} unit="W" />
          <Stat label="Cadence" value={r.cadence} unit="rpm" />
          <Stat label="Vitesse" value={r.speed} unit="km/h" decimals={1} />
          <Stat label="Distance" value={r.distanceKm} unit="km" decimals={2} />
          <Stat label="Fréq. cardiaque" value={hr} unit="bpm" accent />
          <Stat label="Résistance" value={r.resistance} unit="" />
        </div>

        {startedAt !== null && (
          <div className="glass-card" style={card}>
            <p style={cardLabel}>Moyennes de la sortie</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <MiniStat label="Puiss. moy." value={avg(acc.current.power)} unit="W" />
              <MiniStat label="Cad. moy." value={avg(acc.current.cadence)} unit="rpm" />
              <MiniStat label="FC moy." value={avg(acc.current.hr)} unit="bpm" />
            </div>
          </div>
        )}

        {/* ── Commandes ── */}
        <div style={{ display: 'flex', gap: 10, marginTop: 4, marginBottom: 24 }}>
          {startedAt === null ? (
            <button onClick={start} style={primaryBtn}>Commencer la sortie</button>
          ) : (
            <>
              <button onClick={togglePause} style={{ ...primaryBtn, background: running ? 'linear-gradient(150deg,#34c06a,#1e8f4a)' : 'linear-gradient(150deg, var(--brand-1), var(--brand-2))' }}>
                {running ? 'Pause' : 'Reprendre'}
              </button>
              <button onClick={finish} style={stopBtn} aria-label="Terminer la sortie">Terminer</button>
            </>
          )}
        </div>

        {saved && <p style={note}>Sortie enregistrée dans le cardio.</p>}
      </div>
    </div>
  );
};

/** Une grande tuile de chiffre. Un tiret quand la donnée n'arrive pas. */
const Stat: React.FC<{ label: string; value: number | null | undefined; unit: string; decimals?: number; accent?: boolean }> =
({ label, value, unit, decimals = 0, accent }) => (
  <div className="glass-card" style={statTile}>
    <span style={statLabel}>{label}</span>
    <span style={{ ...statValue, color: accent && value != null ? 'var(--brand-1)' : 'var(--text-primary)' }} className="tabular">
      {value == null ? '—' : value.toFixed(decimals)}
    </span>
    <span style={statUnit}>{unit}</span>
  </div>
);

const MiniStat: React.FC<{ label: string; value?: number; unit: string }> = ({ label, value, unit }) => (
  <div className="glass-tile" style={miniTile}>
    <span style={{ color: 'var(--text-dim)', fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>{label}</span>
    <span style={{ color: 'var(--text-secondary)', fontSize: 15, fontWeight: 800, marginTop: 2 }} className="tabular">
      {value == null ? '—' : value}
    </span>
    <span style={{ color: 'var(--text-micro)', fontSize: 9 }}>{unit}</span>
  </div>
);

// ─── Styles ─────────────────────────────────────────────────────────────────

const container: React.CSSProperties = { height: '100dvh', overflowY: 'auto' };
const scroll: React.CSSProperties = { maxWidth: 480, margin: '0 auto', padding: '0 16px 96px' };
const headerRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12,
  paddingTop: 'max(24px, env(safe-area-inset-top))', paddingBottom: 18, marginBottom: 4,
};
const backBtn: React.CSSProperties = {
  // Fond et bordure viennent de .glass-icon (index.css) : ils changent selon
  // le thème, ce qu'un style inline ne sait pas faire.
  width: 36, height: 36, color: 'var(--text-muted)', cursor: 'pointer',
  flexShrink: 0,
};
const title: React.CSSProperties = { fontSize: 22, fontWeight: 800, letterSpacing: -0.4 };
const subtitle: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 12, marginTop: 2 };
const card: React.CSSProperties = { borderRadius: 26, padding: 18, marginBottom: 12 };
const cardLabel: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 11, fontWeight: 600 };
const note: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 11.5, lineHeight: '17px', marginTop: 10 };
const chrono: React.CSSProperties = { fontSize: 46, fontWeight: 800, letterSpacing: -2, marginTop: 4, lineHeight: 1 };
const connectBtn: React.CSSProperties = {
  flex: 1, borderRadius: 999, padding: '11px 12px', fontSize: 12.5, fontWeight: 700,
  border: '1px solid var(--border-strong)', background: 'var(--bg-elevated)', cursor: 'pointer',
};
const statsGrid: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12,
};
const statTile: React.CSSProperties = {
  borderRadius: 22, padding: '14px 8px', display: 'flex', flexDirection: 'column',
  alignItems: 'center', gap: 2,
};
const statLabel: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 9.5, fontWeight: 700, letterSpacing: 0.6, textAlign: 'center' };
const statValue: React.CSSProperties = { fontSize: 24, fontWeight: 800, letterSpacing: -1, marginTop: 3 };
const statUnit: React.CSSProperties = { color: 'var(--text-micro)', fontSize: 10, fontWeight: 600 };
const miniTile: React.CSSProperties = {
  flex: 1, borderRadius: 17, padding: '9px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center',
};
const primaryBtn: React.CSSProperties = {
  flex: 1, borderRadius: 999, padding: '15px 0', color: '#fff', fontSize: 15, fontWeight: 700,
  cursor: 'pointer', background: 'linear-gradient(150deg, var(--brand-1), var(--brand-2))',
  boxShadow: '0 10px 26px rgba(var(--brand-1-rgb),0.4)',
};
const stopBtn: React.CSSProperties = {
  flex: '0 0 auto', width: 120, borderRadius: 18, padding: '15px 0', color: '#fff',
  fontSize: 15, fontWeight: 700, cursor: 'pointer',
  background: 'linear-gradient(150deg,#e0453a,#b8231d)',
  boxShadow: '0 10px 24px rgba(224,69,58,0.4)',
};
