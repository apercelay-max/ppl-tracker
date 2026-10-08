import React, { useEffect, useState } from 'react';
import { Browser } from '@capacitor/browser';
import { IconArrowLeft } from '../components/Icons';
import { useScreenClass } from '../hooks/useScreenClass';
import {
  LAUNCH_OFFER, PRODUCT_MONTHLY, PRODUCT_YEARLY, PRO_BENEFITS,
  buy, freeTrialLabel, loadProducts, manageSubscription, periodLabel, restorePurchases,
  bonusUntilNow, subscriptionsAvailable, useIsPro, useSubscriptionStore,
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
  const isPro = useIsPro();
  useReferralStore((s) => s.state?.bonusUntil); // re-rend quand le mois offert change
  const bonusUntil = bonusUntilNow();
  const [selected, setSelected] = useState(PRODUCT_YEARLY);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => { if (products.length === 0) void loadProducts(); }, [products.length]);

  const selectedProduct = products.find((p) => p.id === selected) ?? products[0];
  const trial = freeTrialLabel(selectedProduct);

  const handleBuy = async () => {
    if (!selectedProduct) return;
    setNotice(null);
    const outcome = await buy(selectedProduct.id);
    if (outcome === 'success') setNotice('Bienvenue dans PPL Pro !');
    else if (outcome === 'pending') setNotice('Achat en attente de validation. PPL Pro s\'activera dès qu\'il sera approuvé.');
  };

  const handleRestore = async () => {
    setNotice(null);
    const n = await restorePurchases();
    setNotice(n > 0 ? 'Abonnement retrouvé : PPL Pro est actif.' : 'Aucun abonnement à restaurer sur ce compte Apple.');
  };

  const open = (url: string) => { void Browser.open({ url }); };

  if (!subscriptionsAvailable()) {
    return (
      <div className={screenClass} style={container}>
        <div style={scroll}>
          <div style={headerRow}>
            <button onClick={onBack} style={backBtn} aria-label="Retour"><IconArrowLeft size={18} /></button>
            <h1 style={title}>PPL Pro</h1>
          </div>
          <p style={muted}>Les abonnements sont disponibles dans l'appli iPhone.</p>
        </div>
      </div>
    );
  }

  const current = entitlements[0];

  return (
    <div className={screenClass} style={container}>
      <div style={scroll}>
        <div style={headerRow}>
          <button onClick={onBack} style={backBtn} aria-label="Retour"><IconArrowLeft size={18} /></button>
          <div>
            <h1 style={title}>PPL Pro</h1>
            <p style={{ ...muted, margin: 0 }}>{isPro ? 'Tu es abonné' : 'Passe au niveau supérieur'}</p>
          </div>
        </div>

        {bonusUntil && !isPro && (
          <div style={{ ...card, borderColor: 'var(--brand-1)', marginBottom: 16 }}>
            <p style={benefitTitle}>🎁 PPL Pro offert jusqu'au {dateLabel(bonusUntil)}</p>
            <p style={benefitText}>Grâce à tes parrainages. Tu peux t'abonner dès maintenant ou à la fin de ce mois offert.</p>
          </div>
        )}

        {LAUNCH_OFFER.active && !isPro && (
          <div style={launchBanner}>
            <strong>Prix de lancement −50 %</strong>
            <span style={{ fontSize: 12, opacity: 0.9 }}>
              Pour les {LAUNCH_OFFER.places} premiers abonnés, et le prix reste le même tant que tu restes abonné.
            </span>
          </div>
        )}

        <div style={card}>
          {PRO_BENEFITS.map((b) => (
            <div key={b.title} style={benefitRow}>
              <span style={{ fontSize: 22 }}>{b.icon}</span>
              <div>
                <p style={benefitTitle}>{b.title}</p>
                <p style={benefitText}>{b.text}</p>
              </div>
            </div>
          ))}
        </div>

        {isPro && current ? (
          <div style={card}>
            <p style={benefitTitle}>{current.isTrial ? 'Essai gratuit en cours' : 'Abonnement actif'}</p>
            {current.expirationDate && (
              <p style={benefitText}>
                {current.willRenew === false ? 'Se termine le ' : 'Prochain renouvellement le '}{dateLabel(current.expirationDate)}.
              </p>
            )}
            <button onClick={() => void manageSubscription()} style={secondaryBtn}>Gérer mon abonnement</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
              {[PRODUCT_YEARLY, PRODUCT_MONTHLY].map((id) => {
                const p = products.find((x) => x.id === id);
                if (!p) return null;
                const active = selected === id;
                const regular = LAUNCH_OFFER.active ? LAUNCH_OFFER.regularPrice[id] : undefined;
                const per = p.period ? ` / ${periodLabel(p.period)}` : '';
                return (
                  <button key={id} onClick={() => setSelected(id)} style={{ ...planBtn, borderColor: active ? 'var(--brand-1)' : 'var(--border)', background: active ? 'var(--bg-elevated)' : 'transparent' }}>
                    <div style={{ textAlign: 'left' }}>
                      <p style={benefitTitle}>
                        {id === PRODUCT_YEARLY ? 'Annuel' : 'Mensuel'}
                        {id === PRODUCT_YEARLY && <span style={bestTag}>Le plus avantageux</span>}
                      </p>
                      {freeTrialLabel(p) && <p style={benefitText}>{freeTrialLabel(p)} gratuits, puis</p>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {regular && <p style={{ ...benefitText, textDecoration: 'line-through', margin: 0 }}>{regular}</p>}
                      <p style={{ ...benefitTitle, margin: 0 }}>{p.displayPrice}{per}</p>
                    </div>
                  </button>
                );
              })}
              {products.length === 0 && <p style={muted}>{error ?? 'Chargement des offres…'}</p>}
            </div>

            <button onClick={() => void handleBuy()} disabled={busy || !selectedProduct} style={{ ...primaryBtn, opacity: busy || !selectedProduct ? 0.6 : 1 }}>
              {busy ? 'Un instant…' : trial ? `Essayer ${trial} gratuitement` : 'S\'abonner'}
            </button>
          </>
        )}

        {error && products.length > 0 && <p style={{ ...muted, color: 'var(--danger, #f55)' }}>{error}</p>}
        {notice && <p style={{ ...muted, color: 'var(--text-primary)' }}>{notice}</p>}

        <button onClick={() => void handleRestore()} disabled={busy} style={linkBtn}>Restaurer mes achats</button>

        {/* Mentions obligatoires d'Apple sur un abonnement qui se renouvelle tout seul. */}
        <p style={legal}>
          {trial && !isPro ? `L'essai gratuit dure ${trial}, puis l'abonnement démarre au prix indiqué. ` : ''}
          Le paiement est débité sur ton compte Apple à la confirmation de l'achat. L'abonnement se renouvelle
          automatiquement, sauf annulation au moins 24 h avant la fin de la période en cours. Tu le gères ou
          l'annules à tout moment dans les réglages de ton compte Apple.
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
