import React, { useEffect, useState } from 'react';
import { Browser } from '@capacitor/browser';
import { IconArrowLeft } from '../components/Icons';
import { useScreenClass } from '../hooks/useScreenClass';
import {
  LAUNCH_OFFER, TIER_NAME, TIER_PLANS, bonusUntilNow, buy, freeTrialLabel, loadProducts, manageSubscription,
  restorePurchases, subscriptionsAvailable, tierAtLeast, usePaidTier, useSubscriptionStore,
  type Tier,
} from '../lib/subscriptions';
import { useReferralStore } from '../lib/referral';

interface PaywallScreenProps { onBack: () => void; }

// Pages légales exigées par Apple sur tout écran d'abonnement. Les conditions sont
// le contrat standard d'Apple ; la politique de confidentialité est public/confidentialite.html
// (en ligne dès que la branche est fusionnée dans main).
const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
const PRIVACY_URL = 'https://ppl-tracker-puce.vercel.app/confidentialite.html';

const dateLabel = (ms: number) => new Date(ms).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

export const PaywallScreen: React.FC<PaywallScreenProps> = ({ onBack }) => {
  const screenClass = useScreenClass();
  const products = useSubscriptionStore((s) => s.products);
  const entitlements = useSubscriptionStore((s) => s.entitlements);
  const busy = useSubscriptionStore((s) => s.busy);
  const error = useSubscriptionStore((s) => s.error);
  const paid = usePaidTier();
  useReferralStore((s) => s.state?.bonusUntil); // re-rend quand le mois offert change
  const bonusUntil = bonusUntilNow();
  const [selected, setSelected] = useState<Exclude<Tier, 'free'>>('pro');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => { if (products.length === 0) void loadProducts(); }, [products.length]);

  const plan = TIER_PLANS.find((p) => p.tier === selected) ?? TIER_PLANS[1];
  const selectedProduct = products.find((p) => p.id === plan.productId);
  const trial = freeTrialLabel(selectedProduct);

  const handleBuy = async () => {
    if (!selectedProduct) return;
    setNotice(null);
    const outcome = await buy(selectedProduct.id);
    if (outcome === 'success') setNotice(`Bienvenue dans ${TIER_NAME[plan.tier]} !`);
    else if (outcome === 'pending') setNotice('Achat en attente de validation. L\'abonnement s\'activera dès qu\'il sera approuvé.');
  };

  const handleRestore = async () => {
    setNotice(null);
    const n = await restorePurchases();
    setNotice(n > 0 ? 'Abonnement retrouvé.' : 'Aucun abonnement à restaurer sur ce compte Apple.');
  };

  const open = (url: string) => { void Browser.open({ url }); };

  if (!subscriptionsAvailable()) {
    return (
      <div className={screenClass} style={container}>
        <div style={scroll}>
          <div style={headerRow}>
            <button onClick={onBack} style={backBtn} aria-label="Retour"><IconArrowLeft size={18} /></button>
            <h1 style={title}>PPL Plus et Pro</h1>
          </div>
          <p style={muted}>Les abonnements sont disponibles dans l'appli iPhone.</p>
        </div>
      </div>
    );
  }

  const current = entitlements[0];
  const isTopTier = paid === 'pro';
  // Une formule déjà active ne se rachète pas ; on peut seulement monter d'un niveau ici
  // (descendre ou résilier se fait chez Apple).
  const alreadyHas = tierAtLeast(paid, plan.tier);

  return (
    <div className={screenClass} style={container}>
      <div style={scroll}>
        <div style={headerRow}>
          <button onClick={onBack} style={backBtn} aria-label="Retour"><IconArrowLeft size={18} /></button>
          <div>
            <h1 style={title}>{paid === 'free' ? 'Passe au niveau supérieur' : TIER_NAME[paid]}</h1>
            <p style={{ ...muted, margin: 0 }}>{paid === 'free' ? 'Deux formules, au choix' : 'Tu es abonné'}</p>
          </div>
        </div>

        {bonusUntil && paid === 'free' && (
          <div style={{ ...card, borderColor: 'var(--brand-1)', marginBottom: 16 }}>
            <p style={benefitTitle}>🎁 PPL Plus offert jusqu'au {dateLabel(bonusUntil)}</p>
            <p style={benefitText}>Grâce à tes parrainages. Tu peux t'abonner dès maintenant ou à la fin de ce mois offert.</p>
          </div>
        )}

        {LAUNCH_OFFER.active && !isTopTier && (
          <div style={launchBanner}>
            <strong>Prix de lancement −50 %</strong>
            <span style={{ fontSize: 12, opacity: 0.9 }}>
              Pour les {LAUNCH_OFFER.places} premiers abonnés de chaque formule, et le prix reste le même tant que tu restes abonné.
            </span>
          </div>
        )}

        {paid !== 'free' && current && (
          <div style={card}>
            <p style={benefitTitle}>{current.isTrial ? 'Essai gratuit en cours' : 'Abonnement actif'} · {TIER_NAME[paid]}</p>
            {current.expirationDate && (
              <p style={benefitText}>
                {current.willRenew === false ? 'Se termine le ' : 'Prochain renouvellement le '}{dateLabel(current.expirationDate)}.
              </p>
            )}
            <button onClick={() => void manageSubscription()} style={secondaryBtn}>Gérer ou changer de formule</button>
          </div>
        )}

        {/* Les deux formules */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          {TIER_PLANS.map((p) => {
            const prod = products.find((x) => x.id === p.productId);
            const active = selected === p.tier;
            const regular = LAUNCH_OFFER.active ? LAUNCH_OFFER.regularPrice[p.productId] : undefined;
            const owned = tierAtLeast(paid, p.tier);
            return (
              <button key={p.tier} onClick={() => setSelected(p.tier)} style={{ ...planBtn, borderColor: active ? 'var(--brand-1)' : 'var(--border)', background: active ? 'var(--bg-elevated)' : 'transparent' }}>
                <div style={{ textAlign: 'left' }}>
                  <p style={benefitTitle}>
                    {TIER_NAME[p.tier]}
                    {p.tier === 'pro' && <span style={bestTag}>Le plus complet</span>}
                    {paid === p.tier && <span style={{ ...bestTag, background: '#4CAF50' }}>Ta formule</span>}
                  </p>
                  <p style={benefitText}>{p.tagline}</p>
                  {freeTrialLabel(prod) && !owned && <p style={benefitText}>{freeTrialLabel(prod)} gratuits, puis</p>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  {regular && <p style={{ ...benefitText, textDecoration: 'line-through', margin: 0 }}>{regular}</p>}
                  <p style={{ ...benefitTitle, margin: 0 }}>{prod ? `${prod.displayPrice} / mois` : '…'}</p>
                </div>
              </button>
            );
          })}
          {products.length === 0 && <p style={muted}>{error ?? 'Chargement des offres…'}</p>}
        </div>

        {/* Ce que contient la formule choisie */}
        <div style={card}>
          {plan.inherits && <p style={{ ...benefitTitle, fontSize: 13 }}>{plan.inherits}</p>}
          {plan.benefits.map((b) => (
            <div key={b.title} style={benefitRow}>
              <span style={{ fontSize: 22 }}>{b.icon}</span>
              <div>
                <p style={benefitTitle}>{b.title}</p>
                <p style={benefitText}>{b.text}</p>
              </div>
            </div>
          ))}
        </div>

        {!alreadyHas && (
          <button onClick={() => void handleBuy()} disabled={busy || !selectedProduct} style={{ ...primaryBtn, opacity: busy || !selectedProduct ? 0.6 : 1 }}>
            {busy ? 'Un instant…' : paid !== 'free' ? `Passer à ${TIER_NAME[plan.tier]}` : trial ? `Essayer ${trial} gratuitement` : `Choisir ${TIER_NAME[plan.tier]}`}
          </button>
        )}

        {error && products.length > 0 && <p style={{ ...muted, color: 'var(--danger, #f55)' }}>{error}</p>}
        {notice && <p style={{ ...muted, color: 'var(--text-primary)' }}>{notice}</p>}

        <button onClick={() => void handleRestore()} disabled={busy} style={linkBtn}>Restaurer mes achats</button>

        {/* Mentions obligatoires d'Apple sur un abonnement qui se renouvelle tout seul. */}
        <p style={legal}>
          {trial && paid === 'free' ? `L'essai gratuit dure ${trial}, puis l'abonnement démarre au prix indiqué. ` : ''}
          Le paiement est débité sur ton compte Apple à la confirmation de l'achat. L'abonnement se renouvelle
          automatiquement chaque mois, sauf annulation au moins 24 h avant la fin de la période en cours. Tu le
          gères, le changes ou l'annules à tout moment dans les réglages de ton compte Apple.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <button onClick={() => open(TERMS_URL)} style={linkBtn}>Conditions d'utilisation</button>
          <button onClick={() => open(PRIVACY_URL)} style={linkBtn}>Confidentialité</button>
        </div>
      </div>
    </div>
  );
};

const container: React.CSSProperties = { height: '100dvh', overflowY: 'auto' };
const scroll: React.CSSProperties = { maxWidth: 480, margin: '0 auto', padding: '0 16px 100px' };
const headerRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 14,
  paddingTop: 'max(24px, env(safe-area-inset-top))', paddingBottom: 18,
  borderBottom: '1px solid var(--border-subtle)', marginBottom: 18,
};
const backBtn: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 12, background: 'var(--bg-elevated)',
  border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 18, flexShrink: 0,
};
const title: React.CSSProperties = { color: 'var(--text-primary)', fontSize: 22, fontWeight: 800, margin: 0 };
const muted: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 13, lineHeight: '18px', margin: '8px 0' };
const card: React.CSSProperties = {
  background: 'var(--bg-card, var(--bg-elevated))', border: '1px solid var(--border)', borderRadius: 16,
  padding: 16, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 14,
};
const benefitRow: React.CSSProperties = { display: 'flex', gap: 12, alignItems: 'flex-start' };
const benefitTitle: React.CSSProperties = { color: 'var(--text-primary)', fontSize: 15, fontWeight: 700, margin: 0 };
const benefitText: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 12, lineHeight: '16px', margin: '2px 0 0' };
const launchBanner: React.CSSProperties = {
  background: 'linear-gradient(135deg, #e03030, #9c27b0)', color: '#fff', borderRadius: 14,
  padding: '12px 14px', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14,
};
const planBtn: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
  border: '2px solid var(--border)', borderRadius: 14, padding: '14px 16px', width: '100%',
};
const bestTag: React.CSSProperties = {
  marginLeft: 8, fontSize: 10, fontWeight: 800, background: 'var(--brand-1)', color: '#fff',
  borderRadius: 6, padding: '2px 6px', verticalAlign: 'middle',
};
const primaryBtn: React.CSSProperties = {
  width: '100%', padding: '16px', borderRadius: 14, border: 'none', color: '#fff', fontSize: 16, fontWeight: 800,
  background: 'linear-gradient(135deg, #e03030, #9c27b0)',
};
const secondaryBtn: React.CSSProperties = {
  width: '100%', padding: '14px', borderRadius: 12, border: '1px solid var(--border)', background: 'transparent',
  color: 'var(--text-primary)', fontSize: 14, fontWeight: 700,
};
const linkBtn: React.CSSProperties = {
  background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, textDecoration: 'underline',
  padding: '10px 4px', display: 'block', margin: '0 auto',
};
const legal: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 11, lineHeight: '15px', textAlign: 'center', margin: '8px 0' };
