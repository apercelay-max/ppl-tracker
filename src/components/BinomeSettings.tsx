import React, { useEffect, useState } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { isNativeApp } from '../lib/appUrl';
import {
  acceptInvite, createInvite, formatCode, inviteLink, leaveBinome, previewInvite,
} from '../lib/binome';
import { clearPendingInvite, getPendingInvite, refreshBinome, useBinome } from '../hooks/useBinome';

// ─── Réglages → Données & compte → Binôme ──────────────────────────────────
// Tout ce qui MODIFIE le binôme se passe ici : créer son lien, accepter une
// invitation, quitter. L'accueil, lui, ne fait qu'afficher et relancer.
//
// Le binôme demande un compte : il relie deux personnes, pas deux téléphones.
// Tant que Supabase n'est pas configuré, la section « Compte » juste au-dessus
// l'explique déjà — on ne répète rien et on ne rend rien.

interface Props {
  signedIn: boolean;
  onOpenAccount: () => void;
}

const NAME_KEY = 'ppl-binome-name';
const readName = (): string => { try { return localStorage.getItem(NAME_KEY) ?? ''; } catch { return ''; } };
const saveName = (n: string) => { try { localStorage.setItem(NAME_KEY, n); } catch { /* rien */ } };

type Status = { text: string; tone: 'ok' | 'error' } | null;

export const BinomeSettings: React.FC<Props> = ({ signedIn, onOpenAccount }) => {
  const { state, loading, error, available } = useBinome();
  const weeklySessionGoal = useWorkoutStore((s) => s.weeklySessionGoal);

  // Prénom mémorisé sur l'appareil, jamais déduit de l'adresse e-mail : elle
  // contient souvent un nom de famille que l'utilisateur n'a pas choisi de
  // montrer à son binôme.
  const [name, setName] = useState(readName);
  const [goal, setGoal] = useState(weeklySessionGoal);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const [pendingCode, setPendingCode] = useState<string | null>(getPendingInvite);
  const [inviter, setInviter] = useState<string | null>(null);
  const [inviteChecked, setInviteChecked] = useState(false);

  // Qui invite ? On ne le demande qu'une fois connecté : le serveur l'exige.
  useEffect(() => {
    if (!signedIn || !pendingCode) return;
    let cancelled = false;
    previewInvite(pendingCode).then((r) => {
      if (cancelled) return;
      setInviteChecked(true);
      setInviter(r.ok && r.data ? r.data.inviteur : null);
    });
    return () => { cancelled = true; };
  }, [signedIn, pendingCode]);

  if (!available) return null;

  const nameOk = name.trim().length >= 1 && name.trim().length <= 40;

  const run = async (fn: () => Promise<Status>) => {
    setBusy(true);
    setStatus(null);
    const s = await fn();
    setBusy(false);
    setStatus(s);
  };

  const ignoreInvite = () => {
    clearPendingInvite();
    setPendingCode(null);
    setInviter(null);
  };

  // ── Rendu ────────────────────────────────────────────────────────────────

  const header = (
    <>
      <p style={subLabel}>BINÔME</p>
      <p style={help}>
        Associe-toi à une personne : vous voyez la régularité l'un de l'autre et vous pouvez vous
        relancer. Jamais le détail de vos séances — juste le nombre, et la date de la dernière.
      </p>
    </>
  );

  if (!signedIn) {
    return (
      <div style={wrap}>
        {header}
        {pendingCode && (
          <p style={highlight}>Tu as reçu une invitation. Connecte-toi pour l'accepter — elle t'attend.</p>
        )}
        <button onClick={onOpenAccount} style={secondaryBtn}>Se connecter pour utiliser le binôme</button>
      </div>
    );
  }

  if (error && !state) {
    return (
      <div style={wrap}>
        {header}
        <p style={errorText}>{error}</p>
        <button onClick={() => void refreshBinome()} style={secondaryBtn}>Réessayer</button>
      </div>
    );
  }

  if (!state || !state.connecte) {
    return <div style={wrap}>{header}<p style={help}>{loading ? 'Chargement…' : ''}</p></div>;
  }

  const nameAndGoal = (
    <>
      <label style={fieldLabel} htmlFor="binome-name">TON PRÉNOM, TEL QUE TON BINÔME LE VERRA</label>
      <input
        id="binome-name"
        value={name}
        maxLength={40}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ton prénom"
        style={input}
        autoComplete="given-name"
      />
      <p style={fieldLabel}>TON OBJECTIF PAR SEMAINE</p>
      <div style={stepper}>
        <button onClick={() => setGoal((g) => Math.max(1, g - 1))} style={stepBtn} aria-label="Une séance de moins">−</button>
        <span style={stepValue}>{goal} séance{goal > 1 ? 's' : ''}</span>
        <button onClick={() => setGoal((g) => Math.min(14, g + 1))} style={stepBtn} aria-label="Une séance de plus">+</button>
      </div>
    </>
  );

  // ── En binôme ──
  if (state.en_binome) {
    const p = state.partenaire;
    const depuis = new Date(state.depuis).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    return (
      <div style={wrap}>
        {header}
        <div style={card}>
          {p ? (
            <>
              <p style={cardTitle}>En binôme avec {p.nom}</p>
              <p style={cardSub}>Depuis le {depuis}</p>
              <p style={line}>Toi · {state.moi.semaine} / {state.moi.objectif} cette semaine</p>
              <p style={line}>{p.nom} · {p.semaine} / {p.objectif} cette semaine</p>
            </>
          ) : (
            <p style={cardTitle}>Ton binôme a supprimé son compte.</p>
          )}
        </div>

        <p style={help}>
          {isNativeApp()
            ? 'Les relances de ton binôme apparaissent sur ton accueil quand tu ouvres l’appli.'
            : 'Pour recevoir les relances même app fermée, active les notifications dans Réglages → Séance → Notifications.'}
        </p>

        {!confirmLeave ? (
          <button onClick={() => setConfirmLeave(true)} style={dangerGhostBtn}>Quitter le binôme</button>
        ) : (
          <div style={confirmBox}>
            <p style={{ ...help, marginBottom: 10, color: 'var(--text-secondary)' }}>
              Le binôme sera dissous pour vous deux, et l'activité partagée effacée. Ton historique
              personnel n'est pas touché.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirmLeave(false)} style={{ ...secondaryBtn, flex: 1, marginBottom: 0 }}>Annuler</button>
              <button
                disabled={busy}
                onClick={() => run(async () => {
                  const r = await leaveBinome();
                  setConfirmLeave(false);
                  if (!r.ok) return { text: r.message, tone: 'error' };
                  await refreshBinome();
                  return { text: 'Binôme dissous.', tone: 'ok' };
                })}
                style={{ ...dangerBtn, flex: 1 }}
              >
                {busy ? 'Un instant…' : 'Quitter'}
              </button>
            </div>
          </div>
        )}
        {status && <p style={status.tone === 'error' ? errorText : okText}>{status.text}</p>}
      </div>
    );
  }

  // ── Invitation reçue ──
  if (pendingCode) {
    return (
      <div style={wrap}>
        {header}
        {!inviteChecked ? (
          <p style={help}>Vérification de l'invitation…</p>
        ) : inviter ? (
          <>
            <p style={highlight}>{inviter} t'invite à être son binôme.</p>
            {nameAndGoal}
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <button onClick={ignoreInvite} style={{ ...secondaryBtn, flex: 1, marginBottom: 0 }}>Ignorer</button>
              <button
                disabled={busy || !nameOk}
                onClick={() => run(async () => {
                  saveName(name.trim());
                  const r = await acceptInvite(pendingCode, name.trim(), goal);
                  if (!r.ok) return { text: r.message, tone: 'error' };
                  clearPendingInvite();
                  setPendingCode(null);
                  await refreshBinome();
                  return { text: `Vous êtes binômes, ${r.data.partner_name} et toi.`, tone: 'ok' };
                })}
                style={{ ...primaryBtn, flex: 1, opacity: busy || !nameOk ? 0.5 : 1 }}
              >
                {busy ? 'Un instant…' : 'Accepter'}
              </button>
            </div>
          </>
        ) : (
          <>
            <p style={errorText}>
              Cette invitation n'est plus valable : déjà utilisée, expirée, ou c'est la tienne.
              Demande un nouveau lien.
            </p>
            <button onClick={ignoreInvite} style={secondaryBtn}>D'accord</button>
          </>
        )}
        {status && <p style={status.tone === 'error' ? errorText : okText}>{status.text}</p>}
      </div>
    );
  }

  // ── Pas encore en binôme : créer son lien ──
  const inv = state.invitation;
  const link = inv ? inviteLink(inv.code) : null;
  const expires = inv ? new Date(inv.expires_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : '';

  const share = async () => {
    if (!link) return;
    const text = `On s'entraîne en binôme sur PPL Tracker ? ${link}`;
    // Partage natif d'abord (feuille iOS/Android : Messages, WhatsApp…), puis
    // presse-papiers, puis rien : le lien reste affiché et sélectionnable.
    if (navigator.share) {
      try { await navigator.share({ title: 'PPL Tracker — binôme', text, url: link }); return; }
      catch { /* partage annulé : on ne dit rien */ return; }
    }
    try {
      await navigator.clipboard.writeText(link);
      setStatus({ text: 'Lien copié.', tone: 'ok' });
    } catch {
      setStatus({ text: 'Copie impossible ici — sélectionne le lien ci-dessus.', tone: 'error' });
    }
  };

  return (
    <div style={wrap}>
      {header}
      {!inv ? (
        <>
          {nameAndGoal}
          <button
            disabled={busy || !nameOk}
            onClick={() => run(async () => {
              saveName(name.trim());
              const r = await createInvite(name.trim(), goal);
              if (!r.ok) return { text: r.message, tone: 'error' };
              await refreshBinome();
              return null;
            })}
            style={{ ...primaryBtn, opacity: busy || !nameOk ? 0.5 : 1 }}
          >
            {busy ? 'Un instant…' : 'Créer mon lien d’invitation'}
          </button>
        </>
      ) : (
        <div style={card}>
          <p style={cardTitle}>Ton lien d'invitation</p>
          <p style={cardSub}>Valable jusqu'au {expires} · une seule personne peut l'utiliser</p>
          <p style={codeText}>{formatCode(inv.code)}</p>
          <p style={linkText}>{link}</p>
          <button onClick={share} style={{ ...primaryBtn, marginTop: 10, marginBottom: 0 }}>Envoyer le lien</button>
        </div>
      )}
      {status && <p style={status.tone === 'error' ? errorText : okText}>{status.text}</p>}
    </div>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────
// Mêmes jetons et mêmes proportions que les autres sections des Réglages.

const wrap: React.CSSProperties = { marginTop: 20 };
const subLabel: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 8 };
const help: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 11, lineHeight: '16px', marginBottom: 12 };
const highlight: React.CSSProperties = {
  color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, lineHeight: '18px', marginBottom: 12,
  padding: '10px 12px', borderRadius: 12, background: 'rgba(var(--brand-1-rgb),0.12)',
  border: '1px solid rgba(var(--brand-1-rgb),0.35)',
};
const fieldLabel: React.CSSProperties = { display: 'block', color: 'var(--text-dim)', fontSize: 9.5, fontWeight: 700, letterSpacing: 1.3, marginBottom: 6 };
const input: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '11px 12px', borderRadius: 12, marginBottom: 12,
  background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
  color: 'var(--text-primary)', fontSize: 14,
};
const stepper: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 };
const stepBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 10, cursor: 'pointer', fontSize: 18, fontWeight: 700,
  background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', color: 'var(--text-secondary)',
};
const stepValue: React.CSSProperties = { color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700, minWidth: 90, textAlign: 'center' };
const card: React.CSSProperties = {
  background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 14,
  padding: '12px 14px', marginBottom: 12,
};
const cardTitle: React.CSSProperties = { color: 'var(--text-primary)', fontSize: 14, fontWeight: 800 };
const cardSub: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 11, marginTop: 2, marginBottom: 8 };
const line: React.CSSProperties = { color: 'var(--text-secondary)', fontSize: 12.5, marginTop: 3, fontVariantNumeric: 'tabular-nums' };
const codeText: React.CSSProperties = {
  color: 'var(--text-primary)', fontSize: 20, fontWeight: 800, letterSpacing: 2,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', marginTop: 4,
};
const linkText: React.CSSProperties = {
  color: 'var(--text-dim)', fontSize: 11, marginTop: 4, wordBreak: 'break-all', userSelect: 'all',
};
const primaryBtn: React.CSSProperties = {
  width: '100%', padding: '13px', borderRadius: 14, cursor: 'pointer', border: 'none', marginBottom: 8,
  background: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))', color: '#fff', fontSize: 14, fontWeight: 800,
};
const secondaryBtn: React.CSSProperties = {
  width: '100%', padding: '12px', borderRadius: 14, cursor: 'pointer', marginBottom: 8,
  background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', color: 'var(--text-muted)', fontSize: 13, fontWeight: 700,
};
const dangerGhostBtn: React.CSSProperties = {
  ...secondaryBtn, color: '#e8695f', borderColor: 'rgba(232,105,95,0.35)',
};
const dangerBtn: React.CSSProperties = {
  padding: '12px', borderRadius: 14, cursor: 'pointer', border: 'none',
  background: '#c9392f', color: '#fff', fontSize: 13, fontWeight: 800,
};
const confirmBox: React.CSSProperties = {
  padding: 12, borderRadius: 14, marginBottom: 8,
  background: 'rgba(232,105,95,0.08)', border: '1px solid rgba(232,105,95,0.3)',
};
const errorText: React.CSSProperties = { color: '#f5a623', fontSize: 11.5, lineHeight: '16px', marginTop: 4, marginBottom: 8 };
const okText: React.CSSProperties = { color: '#4CAF50', fontSize: 11.5, lineHeight: '16px', marginTop: 4, marginBottom: 8 };
