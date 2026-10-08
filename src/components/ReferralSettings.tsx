import React, { useEffect, useState } from 'react';
import { Share } from '@capacitor/share';
import {
  claimReferralCode, formatReferralCode, isReferralAvailable, normalizeReferralCode, refreshReferral,
  referralLink, referralShareText, useReferralStore,
} from '../lib/referral';

// ─── Réglages → Données & compte → Parrainage ──────────────────────────────
// Mon code à partager, le nombre de personnes qui ont rejoint grâce à moi, mon mois
// offert, et un champ pour saisir le code de celui qui m'a invité.
// Le mois offert n'est pas un achat : c'est un cadeau de notre part, qui ne
// s'obtient pas contre un avis et ne passe pas par Apple.

interface Props { signedIn: boolean; onOpenAccount: () => void }

type Status = { text: string; tone: 'ok' | 'error' } | null;

const dateLabel = (ms: number) => new Date(ms).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

export const ReferralSettings: React.FC<Props> = ({ signedIn, onOpenAccount }) => {
  const state = useReferralStore((s) => s.state);
  const loading = useReferralStore((s) => s.loading);
  const error = useReferralStore((s) => s.error);
  const [entered, setEntered] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => { if (signedIn) void refreshReferral(); }, [signedIn]);

  if (!isReferralAvailable()) return null;

  const share = async () => {
    if (!state) return;
    try {
      // Feuille de partage iOS : Messages, WhatsApp, etc. Annuler n'est pas une erreur.
      await Share.share({ title: 'PPL Tracker', text: referralShareText(state.code), dialogTitle: 'Inviter un ami' });
    } catch {
      try {
        await navigator.clipboard.writeText(referralShareText(state.code));
        setStatus({ text: 'Message copié.', tone: 'ok' });
      } catch {
        setStatus({ text: 'Partage impossible ici — recopie le code ci-dessus.', tone: 'error' });
      }
    }
  };

  const useCode = async () => {
    const code = normalizeReferralCode(entered);
    if (!code) { setStatus({ text: 'Le code fait 8 caractères (chiffres 0-9 et lettres A-F).', tone: 'error' }); return; }
    setBusy(true);
    setStatus(null);
    const r = await claimReferralCode(code);
    setBusy(false);
    if (!r.ok) { setStatus({ text: r.message, tone: 'error' }); return; }
    setEntered('');
    await refreshReferral();
    setStatus({ text: 'Code enregistré, merci ! Ton parrain gagne 1 mois de PPL Pro.', tone: 'ok' });
  };

  const bonusActive = state?.bonusUntil != null && state.bonusUntil > Date.now();

  return (
    <div style={wrap}>
      <p style={subLabel}>PARRAINAGE</p>
      <p style={help}>
        Invite un ami : quand il crée son compte avec ton code, tu gagnes 1 mois de PPL Pro offert
        (jusqu'à 6 mois).
      </p>

      {!signedIn ? (
        <button onClick={onOpenAccount} style={secondaryBtn}>Se connecter pour avoir mon code</button>
      ) : loading && !state ? (
        <p style={help}>Chargement…</p>
      ) : error && !state ? (
        <p style={errorText}>{error}</p>
      ) : state ? (
        <>
          <div style={card}>
            <p style={cardSub}>TON CODE</p>
            <p style={codeText}>{formatReferralCode(state.code)}</p>
            <p style={linkText}>{referralLink(state.code)}</p>
            <p style={line}>
              {state.filleuls === 0
                ? 'Personne n’a encore utilisé ton code.'
                : `${state.filleuls} ${state.filleuls > 1 ? 'amis ont rejoint' : 'ami a rejoint'} PPL Tracker grâce à toi.`}
            </p>
            {bonusActive && state.bonusUntil && (
              <p style={{ ...line, color: '#4CAF50', fontWeight: 700 }}>PPL Pro offert jusqu’au {dateLabel(state.bonusUntil)}.</p>
            )}
          </div>
          <button onClick={() => void share()} style={primaryBtn}>Inviter un ami</button>

          {!state.aUnParrain && (
            <>
              <label style={fieldLabel}>TU AS UN CODE DE PARRAIN ?</label>
              <input
                value={entered}
                onChange={(e) => setEntered(e.target.value)}
                placeholder="Ex. 3F9A-0C21"
                style={input}
                autoCapitalize="characters"
                autoCorrect="off"
              />
              <button disabled={busy || entered.trim() === ''} onClick={() => void useCode()} style={{ ...secondaryBtn, opacity: busy || entered.trim() === '' ? 0.5 : 1 }}>
                {busy ? 'Un instant…' : 'Valider le code'}
              </button>
              <p style={help}>Possible seulement dans les 7 jours qui suivent la création de ton compte.</p>
            </>
          )}
        </>
      ) : null}
      {status && <p style={status.tone === 'error' ? errorText : okText}>{status.text}</p>}
    </div>
  );
};

const wrap: React.CSSProperties = { marginTop: 20 };
const subLabel: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 8 };
const help: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 11, lineHeight: '16px', marginBottom: 12 };
const fieldLabel: React.CSSProperties = { display: 'block', color: 'var(--text-dim)', fontSize: 9.5, fontWeight: 700, letterSpacing: 1.3, marginBottom: 6, marginTop: 6 };
const input: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '11px 12px', borderRadius: 12, marginBottom: 12,
  background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)', fontSize: 14,
};
const card: React.CSSProperties = { background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 14, padding: '12px 14px', marginBottom: 12 };
const cardSub: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 10, fontWeight: 700, letterSpacing: 1.3, margin: 0 };
const line: React.CSSProperties = { color: 'var(--text-secondary)', fontSize: 12.5, marginTop: 6, fontVariantNumeric: 'tabular-nums' };
const codeText: React.CSSProperties = { color: 'var(--text-primary)', fontSize: 22, fontWeight: 800, letterSpacing: 2, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', marginTop: 4, userSelect: 'all' };
const linkText: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 11, marginTop: 4, wordBreak: 'break-all', userSelect: 'all' };
const primaryBtn: React.CSSProperties = { width: '100%', padding: 13, borderRadius: 14, cursor: 'pointer', border: 'none', marginBottom: 12, background: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))', color: '#fff', fontSize: 14, fontWeight: 800 };
const secondaryBtn: React.CSSProperties = { width: '100%', padding: 12, borderRadius: 14, cursor: 'pointer', marginBottom: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', color: 'var(--text-muted)', fontSize: 13, fontWeight: 700 };
const errorText: React.CSSProperties = { color: '#f5a623', fontSize: 11.5, lineHeight: '16px', marginTop: 4, marginBottom: 8 };
const okText: React.CSSProperties = { color: '#4CAF50', fontSize: 11.5, lineHeight: '16px', marginTop: 4, marginBottom: 8 };
