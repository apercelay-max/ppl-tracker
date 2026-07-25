import { WeightUnit, weightUnitLabel } from './weight';

export interface SessionRecapData {
  workoutName: string;
  dateLabel: string;
  durationMin: number;
  tonnageDisplay: number;
  weightUnit: WeightUnit;
  completedSets: number;
  totalSets: number;
  calories: number;
  tonnagePctVsPrevious?: number;
  prNames: string[];
}

const FALLBACK = {
  bgBase: '#131318',
  bgCard: '#25252f',
  border: '#363646',
  textPrimary: '#ffffff',
  textMuted: '#9797b0',
  textDim: '#6c6c88',
  brand1: '#e03030',
  brand2: '#9b27af',
};

const FONT = ' -apple-system, system-ui, sans-serif';

const cssVar = (name: string, fallback: string): string => {
  if (typeof document === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
};

const hexToRgba = (hex: string, alpha: number): string => {
  let h = hex.trim();
  if (h.charAt(0) === '#') h = h.slice(1);
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const num = parseInt(h, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
};

const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

export const buildSessionRecapImage = async (data: SessionRecapData): Promise<Blob> => {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas-unsupported');

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

  const glow1 = ctx.createRadialGradient(W * 0.5, H * 0.08, 40, W * 0.5, H * 0.08, W * 0.9);
  glow1.addColorStop(0, hexToRgba(brand1, 0.35));
  glow1.addColorStop(1, hexToRgba(brand1, 0));
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, W, Math.round(H * 0.6));

  const glow2 = ctx.createRadialGradient(W * 0.1, H * 0.95, 20, W * 0.1, H * 0.95, W * 0.7);
  glow2.addColorStop(0, hexToRgba(brand2, 0.28));
  glow2.addColorStop(1, hexToRgba(brand2, 0));
  ctx.fillStyle = glow2;
  ctx.fillRect(0, Math.round(H * 0.5), W, Math.round(H * 0.5));

  ctx.textAlign = 'center';
  ctx.fillStyle = textDim;
  ctx.font = '700 26px' + FONT;
  ctx.fillText('PPL TRACKER', W / 2, 96);

  const badgeY = 210;
  const badgeR = 64;
  const badgeGrad = ctx.createLinearGradient(W / 2 - badgeR, badgeY - badgeR, W / 2 + badgeR, badgeY + badgeR);
  badgeGrad.addColorStop(0, brand1);
  badgeGrad.addColorStop(1, brand2);
  ctx.beginPath();
  ctx.arc(W / 2, badgeY, badgeR, 0, Math.PI * 2);
  ctx.fillStyle = badgeGrad;
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(W / 2 - 26, badgeY + 2);
  ctx.lineTo(W / 2 - 8, badgeY + 22);
  ctx.lineTo(W / 2 + 30, badgeY - 24);
  ctx.stroke();

  ctx.font = '800 46px' + FONT;
  ctx.fillStyle = textPrimary;
  ctx.fillText('Seance terminee !', W / 2, badgeY + 130);

  ctx.font = '700 34px' + FONT;
  ctx.fillStyle = brand1;
  ctx.fillText(data.workoutName, W / 2, badgeY + 180);

  ctx.font = '400 24px' + FONT;
  ctx.fillStyle = textMuted;
  ctx.fillText(data.dateLabel, W / 2, badgeY + 218);

  const gridTop = badgeY + 270;
  const cardW = 470;
  const cardH = 190;
  const gap = 30;
  const gridLeft = (W - (cardW * 2 + gap)) / 2;

  const stats = [
    { label: 'DUREE', value: data.durationMin + ' min', color: '#4CAF50' },
    { label: 'TONNAGE', value: data.tonnageDisplay + ' ' + weightUnitLabel(data.weightUnit), color: textPrimary },
    { label: 'SERIES', value: data.completedSets + '/' + data.totalSets, color: textPrimary },
    { label: 'CALORIES', value: data.calories + ' kcal', color: '#ff9800' },
  ];

  stats.forEach((s, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = gridLeft + col * (cardW + gap);
    const y = gridTop + row * (cardH + gap);
    roundRect(ctx, x, y, cardW, cardH, 24);
    ctx.fillStyle = bgCard;
    ctx.fill();
    ctx.strokeStyle = border;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = '700 20px' + FONT;
    ctx.fillStyle = textDim;
    ctx.fillText(s.label, x + 30, y + 48);

    ctx.font = '800 54px' + FONT;
    ctx.fillStyle = s.color;
    ctx.fillText(s.value, x + 30, y + 122);
  });

  let cursorY = gridTop + cardH * 2 + gap + 46;

  if (data.tonnagePctVsPrevious !== undefined) {
    const pct = data.tonnagePctVsPrevious;
    const color = pct >= 0 ? '#4CAF50' : '#f5a623';
    roundRect(ctx, gridLeft, cursorY, cardW * 2 + gap, 110, 24);
    ctx.fillStyle = bgCard;
    ctx.fill();
    ctx.strokeStyle = border;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = '700 20px' + FONT;
    ctx.fillStyle = textDim;
    ctx.fillText('EVOLUTION DU TONNAGE', gridLeft + 30, cursorY + 42);

    ctx.font = '800 40px' + FONT;
    ctx.fillStyle = color;
    ctx.fillText((pct >= 0 ? '+' : '') + pct + '%', gridLeft + 30, cursorY + 88);

    cursorY += 110 + 30;
  }

  if (data.prNames.length > 0) {
    const shown = data.prNames.slice(0, 5);
    const prH = 76 + shown.length * 44;
    roundRect(ctx, gridLeft, cursorY, cardW * 2 + gap, prH, 24);
    ctx.fillStyle = bgCard;
    ctx.fill();
    ctx.strokeStyle = '#FFD54F';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = '700 20px' + FONT;
    ctx.fillStyle = '#FFD54F';
    ctx.fillText('NOUVEAUX RECORDS', gridLeft + 30, cursorY + 42);

    ctx.font = '600 26px' + FONT;
    ctx.fillStyle = textPrimary;
    shown.forEach((name, i) => {
      ctx.fillText(name, gridLeft + 30, cursorY + 82 + i * 44);
    });

    cursorY += prH + 30;
  }

  ctx.textAlign = 'center';
  ctx.font = '500 22px' + FONT;
  ctx.fillStyle = textDim;
  ctx.fillText('Genere avec PPL Tracker', W / 2, H - 40);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('toBlob-failed'));
    }, 'image/png', 0.95);
  });
};

export type ShareResult = 'shared' | 'downloaded' | 'failed';

export const shareOrDownloadRecapImage = async (
  blob: Blob,
  filename: string,
  shareTitle: string,
  shareText: string
): Promise<ShareResult> => {
  try {
    const file = new File([blob], filename, { type: 'image/png' });
    const nav = navigator as any;
    if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
      await nav.share({ files: [file], title: shareTitle, text: shareText });
      return 'shared';
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return 'shared';
  }
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return 'downloaded';
  } catch (err) {
    return 'failed';
  }
};
