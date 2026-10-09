import type { Report } from './report';
import { FALLBACK, FONT, cssVar, hexToRgba, roundRect } from './shareImage';
import { kgToLbs, weightUnitLabel, type WeightUnit } from './weight';

// Dessine le rapport en image à partager (1080 × 1350), aux couleurs de l'appli de la personne.
export const buildReportImage = async (r: Report, unit: WeightUnit): Promise<Blob> => {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas-unsupported');
  const conv = (kg: number) => Math.round(unit === 'lbs' ? kgToLbs(kg) : kg);
  const u = weightUnitLabel(unit);
  const n = (v: number) => v.toLocaleString('fr-FR');

  const brand1 = cssVar('--brand-1', FALLBACK.brand1);
  const brand2 = cssVar('--brand-2', FALLBACK.brand2);
  const bgBase = cssVar('--bg-base', FALLBACK.bgBase);
  const bgCard = cssVar('--bg-card', FALLBACK.bgCard);
  const border = cssVar('--border', FALLBACK.border);
  const textPrimary = cssVar('--text-primary', FALLBACK.textPrimary);
  const textMuted = cssVar('--text-muted', FALLBACK.textMuted);
  const textDim = cssVar('--text-dim', FALLBACK.textDim);

  ctx.fillStyle = bgBase;
  ctx.fillRect(0, 0, W, H);
  const glow1 = ctx.createRadialGradient(W * 0.5, H * 0.05, 40, W * 0.5, H * 0.05, W * 0.9);
  glow1.addColorStop(0, hexToRgba(brand1, 0.35));
  glow1.addColorStop(1, hexToRgba(brand1, 0));
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, W, Math.round(H * 0.6));
  const glow2 = ctx.createRadialGradient(W * 0.1, H * 0.97, 20, W * 0.1, H * 0.97, W * 0.7);
  glow2.addColorStop(0, hexToRgba(brand2, 0.28));
  glow2.addColorStop(1, hexToRgba(brand2, 0));
  ctx.fillStyle = glow2;
  ctx.fillRect(0, Math.round(H * 0.5), W, Math.round(H * 0.5));

  ctx.textAlign = 'center';
  ctx.fillStyle = textDim;
  ctx.font = '700 26px' + FONT;
  ctx.fillText('PPL TRACKER', W / 2, 90);
  ctx.font = '800 64px' + FONT;
  ctx.fillStyle = textPrimary;
  ctx.fillText(r.title, W / 2, 180, W - 120);
  ctx.font = '500 28px' + FONT;
  ctx.fillStyle = brand1;
  ctx.fillText(r.rangeLabel, W / 2, 226, W - 120);

  const cardW = 470, cardH = 170, gap = 30;
  const left = (W - (cardW * 2 + gap)) / 2;
  const top = 280;
  const stats = [
    { label: 'SÉANCES', value: String(r.sessions) },
    { label: 'DURÉE TOTALE', value: r.minutes >= 60 ? `${Math.floor(r.minutes / 60)} h ${String(r.minutes % 60).padStart(2, '0')}` : `${r.minutes} min` },
    { label: 'VOLUME SOULEVÉ', value: `${n(conv(r.tonnageKg))} ${u}` },
    { label: 'SÉRIES', value: String(r.sets) },
  ];
  stats.forEach((s, i) => {
    const x = left + (i % 2) * (cardW + gap);
    const y = top + Math.floor(i / 2) * (cardH + gap);
    roundRect(ctx, x, y, cardW, cardH, 24);
    ctx.fillStyle = bgCard; ctx.fill();
    ctx.strokeStyle = border; ctx.lineWidth = 2; ctx.stroke();
    ctx.textAlign = 'left';
    ctx.font = '700 20px' + FONT; ctx.fillStyle = textDim;
    ctx.fillText(s.label, x + 30, y + 46);
    ctx.font = '800 52px' + FONT; ctx.fillStyle = textPrimary;
    ctx.fillText(s.value, x + 30, y + 118, cardW - 60);
  });

  let y = top + cardH * 2 + gap + 40;
  if (r.volumePctVsPrevious !== null) {
    const pct = r.volumePctVsPrevious;
    ctx.textAlign = 'center';
    ctx.font = '700 30px' + FONT;
    ctx.fillStyle = pct >= 0 ? '#4CAF50' : '#f5a623';
    ctx.fillText(`${pct >= 0 ? '+' : '−'}${Math.abs(pct)} % de volume vs la période précédente`, W / 2, y + 10, W - 120);
    y += 50;
  }

  // Jours actifs : une barre par jour (7 pour la semaine, 30 pour le mois).
  const barsW = cardW * 2 + gap;
  roundRect(ctx, left, y, barsW, 150, 24);
  ctx.fillStyle = bgCard; ctx.fill(); ctx.strokeStyle = border; ctx.lineWidth = 2; ctx.stroke();
  ctx.textAlign = 'left';
  ctx.font = '700 20px' + FONT; ctx.fillStyle = textDim;
  ctx.fillText('JOURS ACTIFS', left + 30, y + 42);
  const slot = (barsW - 60) / r.days.length;
  r.days.forEach((c, i) => {
    ctx.fillStyle = c > 0 ? brand1 : hexToRgba(textDim, 0.25);
    roundRect(ctx, left + 30 + i * slot + slot * 0.12, y + 66, slot * 0.76, 56, 8);
    ctx.fill();
  });
  y += 150 + 30;

  const list = (title: string, rows: string[], color: string) => {
    if (rows.length === 0) return;
    const h = 76 + rows.length * 46;
    roundRect(ctx, left, y, barsW, h, 24);
    ctx.fillStyle = bgCard; ctx.fill(); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    ctx.textAlign = 'left';
    ctx.font = '700 20px' + FONT; ctx.fillStyle = color;
    ctx.fillText(title, left + 30, y + 44);
    ctx.font = '600 28px' + FONT; ctx.fillStyle = textPrimary;
    rows.forEach((t, i) => ctx.fillText(t, left + 30, y + 90 + i * 46, barsW - 60));
    y += h + 26;
  };
  list('EXERCICES LES PLUS TRAVAILLÉS', r.top.map((t) => `${t.name} · ${n(conv(t.volumeKg))} ${u}`), textMuted);
  list('RECORDS BATTUS', r.records.map((t) => `${t.name} · ${conv(t.weightKg)} ${u}`), '#FFD54F');

  ctx.textAlign = 'center';
  ctx.font = '500 22px' + FONT; ctx.fillStyle = textDim;
  ctx.fillText('Généré avec PPL Tracker', W / 2, H - 40);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob-failed'))), 'image/png', 0.95);
  });
};
