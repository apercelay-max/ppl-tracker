import React, { useEffect, useRef, useState } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import {
  LAUNCH_OFFER, PRODUCT_PLUS, TIER_NAME, askForReview, freeTrialLabel, subscriptionsAvailable, usePaidTier, useSubscriptionStore,
} from '../lib/subscriptions';

// Propose PPL Pro de temps en temps, et demande un avis après une bonne séance.
//
// Règles pour ne jamais harceler (et rester dans ce qu'Apple accepte) :
//  - jamais pendant une séance : on n'apparaît que sur l'accueil ;
//  - jamais avant la 3e séance terminée : la personne doit d'abord connaître l'appli ;
//  - au plus une fois par semaine, puis une fois par mois après 5 apparitions ;
//  - jamais pour quelqu'un qui est déjà abonné ;
//  - la demande d'avis ne promet RIEN en échange (règle 5.6.1 de l'App Store : offrir
//    un avantage contre un avis fait refuser l'appli) et n'a jamais lieu le même jour.
// L'état est local à l'appareil (pas dans le store principal : pas synchronisé).
const KEY = 'ppl-pro-prompts';
const DAY = 86400000;
const MIN_SESSIONS_UPSELL = 3;
const MIN_SESSIONS_REVIEW = 5;

interface PromptState { upsellAt?: number; upsellCount?: number; reviewAt?: number }

const read = (): PromptState => {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as PromptState; } catch { return {}; }
};
const write = (s: PromptState) => {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* stockage indisponible : on ne propose juste plus rien */ }
};

interface ProPromptSheetProps {
  /** Vrai seulement sur l'accueil, hors écran de démarrage. */
  enabled: boolean;
  onOpenPro: () => void;
}

export const ProPromptSheet: React.FC<ProPromptSheetProps> = ({ enabled, onOpenPro }) => {
  const ready = useSubscriptionStore((s) => s.ready);
  const products = useSubscriptionStore((s) => s.products);
  const paid = usePaidTier();
  const isPro = paid !== 'free';
  const sessions = useWorkoutStore((s) => s.totalSessionsCompleted);
  const [open, setOpen] = useState(false);
  const decided = useRef(false);

  useEffect(() => {
    if (!enabled || !ready || !subscriptionsAvailable() || decided.current) return;
    const state = read();
    const now = Date.now();
    const upsellGap = (state.upsellCount ?? 0) >= 5 ? 30 * DAY : 7 * DAY;
    const upsellDue = !isPro && sessions >= MIN_SESSIONS_UPSELL && (!state.upsellAt || now - state.upsellAt >= upsellGap);
    const reviewDue = sessions >= MIN_SESSIONS_REVIEW && (!state.reviewAt || now - state.reviewAt >= 90 * DAY)
      && (!state.upsellAt || now - state.upsellAt >= DAY);
    if (!upsellDue && !reviewDue) return;
    decided.current = true; // une seule décision par lancement de l'appli
    // Petit délai : on laisse l'accueil s'afficher avant d'interrompre.
    const t = setTimeout(() => {
      if (upsellDue) {
        write({ ...state, upsellAt: now, upsellCount: (state.upsellCount ?? 0) + 1 });
        setOpen(true);
      } else {
        write({ ...state, reviewAt: now });
        void askForReview();
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [enabled, ready, isPro, sessions]);

  if (!open || !enabled) return null;

  const plus = products.find((p) => p.id === PRODUCT_PLUS);
  const trial = freeTrialLabel(plus);

  return (
    <div style={backdrop} onClick={() => setOpen(false)}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <p style={tag}>PPL PLUS · PPL PRO</p>
        <h2 style={heading}>{trial ? `Essaie ${TIER_NAME.plus} ${trial} gratuitement` : 'Passe à PPL Plus ou PPL Pro'}</h2>
        <p style={body}>
          Widgets, séance en direct sur l’écran verrouillé, Siri, et plus de coach IA. PPL Plus dès 4,99 €/mois, PPL Pro pour aller plus loin.
          {LAUNCH_OFFER.active && ` Prix de lancement −50 % pour les ${LAUNCH_OFFER.places} premiers abonnés de chaque formule.`}
        </p>
        <button style={primary} onClick={() => { setOpen(false); onOpenPro(); }}>Voir les formules</button>
        <button style={later} onClick={() => setOpen(false)}>Plus tard</button>
      </div>
    </div>
  );
};

const backdrop: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000,
  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
};
const sheet: React.CSSProperties = {
  width: '100%', maxWidth: 480, background: 'var(--bg-elevated)', borderTopLeftRadius: 24, borderTopRightRadius: 24,
  padding: '24px 20px max(24px, env(safe-area-inset-bottom))', border: '1px solid var(--border)',
};
const tag: React.CSSProperties = { color: 'var(--brand-1)', fontSize: 11, fontWeight: 800, letterSpacing: 1.5, margin: 0 };
const heading: React.CSSProperties = { color: 'var(--text-primary)', fontSize: 22, fontWeight: 800, margin: '6px 0 8px' };
const body: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 14, lineHeight: '20px', margin: '0 0 18px' };
const primary: React.CSSProperties = {
  width: '100%', padding: 15, borderRadius: 14, border: 'none', color: '#fff', fontSize: 16, fontWeight: 800,
  background: 'linear-gradient(135deg, #e03030, #9c27b0)',
};
const later: React.CSSProperties = {
  width: '100%', padding: 12, marginTop: 6, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14,
};
