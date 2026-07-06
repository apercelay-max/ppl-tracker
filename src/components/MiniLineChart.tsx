import React from 'react';

export interface MiniLineChartPoint {
  date: number;
  value: number;
}

interface MiniLineChartProps {
  points: MiniLineChartPoint[];
  unit?: string;
  emptyMessage?: string;
}

const CHART_W = 300;
const CHART_H = 110;
const PAD_TOP = 10;
const PAD_BOTTOM = 18;
const AXIS_W = 28; // largeur réservée aux libellés de l'axe Y

// Petit graphique en ligne réutilisable (progression d'un exercice, poids du
// corps...) — même logique de tracé que le graphique de progression du
// Dashboard (voir ProgressionChart dans DashboardScreen.tsx), factorisée ici
// pour ne pas la dupliquer telle quelle dans chaque nouvel écran qui en a besoin.
export const MiniLineChart: React.FC<MiniLineChartProps> = ({
  points,
  unit = '',
  emptyMessage = 'Pas encore assez de données pour voir une courbe.',
}) => {
  if (points.length < 2) {
    return (
      <p style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
        {emptyMessage}
      </p>
    );
  }

  const values = points.map((p) => p.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const pad = (dataMax - dataMin) * 0.15 || dataMax * 0.1 || 1;
  const min = Math.max(0, dataMin - pad);
  const max = dataMax + pad;
  const range = max - min || 1;
  const plotX0 = AXIS_W;
  const plotW = CHART_W - AXIS_W - 8;
  const yFor = (v: number) => CHART_H - PAD_BOTTOM - ((v - min) / range) * (CHART_H - PAD_TOP - PAD_BOTTOM);
  const coords = points.map((p, i) => ({
    x: plotX0 + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW),
    y: yFor(p.value),
  }));
  const path = coords.map((c) => `${c.x},${c.y}`).join(' ');
  const last = points[points.length - 1];
  const first = points[0];
  const trendUp = last.value >= first.value;
  const lineColor = trendUp ? '#4CAF50' : '#f5a623';
  const midVal = (min + max) / 2;
  const dateFmt = (ts: number) => new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  return (
    <>
      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} style={{ width: '100%', height: 100, display: 'block' }}>
        {[max, midVal, min].map((v, i) => {
          const y = yFor(v);
          return (
            <g key={i}>
              <line x1={plotX0} y1={y} x2={CHART_W} y2={y} stroke="var(--border-subtle)" strokeWidth={1} />
              <text x={plotX0 - 4} y={y + 3} textAnchor="end" fontSize="8" fill="var(--text-dim)">{Math.round(v)}</text>
            </g>
          );
        })}
        <polyline points={path} fill="none" stroke={lineColor} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={i === coords.length - 1 ? 3.5 : 2} fill={lineColor} />
        ))}
        <text x={plotX0} y={CHART_H - 4} textAnchor="start" fontSize="8" fill="var(--text-dim)">{dateFmt(first.date)}</text>
        <text x={CHART_W} y={CHART_H - 4} textAnchor="end" fontSize="8" fill="var(--text-dim)">{dateFmt(last.date)}</text>
      </svg>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
        <span style={{ color: lineColor, fontSize: 11, fontWeight: 800 }}>{last.value}{unit ? ` ${unit}` : ''}</span>
      </div>
    </>
  );
};
