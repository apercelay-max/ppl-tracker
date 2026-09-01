import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface AuthScreenProps {
  onBack: () => void;
}

type Mode = 'login' | 'signup' | 'forgot' | 'reset';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onBack }) => {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Supabase redirige vers cette page avec un lien de récupération après
  // clic sur l'email de "mot de passe oublié" ; il émet alors un événement
  // PASSWORD_RECOVERY (session valide mais mot de passe pas encore changé).
  useEffect(() => {
    if (!supabase) return;
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setErrorMsg(null);
        setInfoMsg(null);
        setMode('reset');
      }
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  const handleSubmit = async () => {
    if (!supabase) return;
    setErrorMsg(null);
    setInfoMsg(null);

    if (mode === 'forgot') {
      if (!email) { setErrorMsg('Email requis.'); return; }
      setLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) { setErrorMsg(error.message); return; }
        setInfoMsg('Email envoyé (si ce compte existe). Vérifie ta boîte de réception et clique sur le lien pour choisir un nouveau mot de passe.');
      } catch (e) {
        setErrorMsg("Une erreur inattendue s'est produite. Réessaie.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'reset') {
      if (password.length < 6) {
        setErrorMsg('Le mot de passe doit faire au moins 6 caractères.');
        return;
      }
      setLoading(true);
      try {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) { setErrorMsg(error.message); return; }
        setInfoMsg('Mot de passe mis à jour, tu es connecté.');
      } catch (e) {
        setErrorMsg("Une erreur inattendue s'est produite. Réessaie.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email || !password) {
      setErrorMsg('Email et mot de passe requis.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) { setErrorMsg(error.message); return; }
        if (data.session) {
          // Confirmation email désactivée sur ce projet Supabase → connecté
          // tout de suite. useAuth() détecte le changement et App.tsx
          // renverra automatiquement vers l'écran précédent.
          setInfoMsg('Compte créé, tu es connecté.');
        } else {
          setInfoMsg("Compte créé. Vérifie tes emails pour confirmer ton adresse avant de pouvoir te connecter.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setErrorMsg(error.message); return; }
      }
    } catch (e) {
      setErrorMsg("Une erreur inattendue s'est produite. Réessaie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen-ambient" style={container}>
      <div style={scroll}>
        <div style={headerRow}>
          <button onClick={onBack} className="glass-icon" style={backBtn} aria-label="Retour">←</button>
          <div>
            <h1 style={title}>Compte</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
              Pour synchroniser tes données entre appareils
            </p>
          </div>
        </div>

        {(mode === 'login' || mode === 'signup') && (
          <div style={segmentRow}>
            <button
              onClick={() => { setMode('login'); setErrorMsg(null); setInfoMsg(null); }}
              style={{
                ...segmentBtn,
                background: mode === 'login' ? 'var(--brand-1)' : 'var(--bg-elevated)',
                color: mode === 'login' ? '#fff' : 'var(--text-muted)',
              }}
            >
              Se connecter
            </button>
            <button
              onClick={() => { setMode('signup'); setErrorMsg(null); setInfoMsg(null); }}
              style={{
                ...segmentBtn,
                background: mode === 'signup' ? 'var(--brand-1)' : 'var(--bg-elevated)',
                color: mode === 'signup' ? '#fff' : 'var(--text-muted)',
              }}
            >
              Créer un compte
            </button>
          </div>
        )}

        <div style={card}>
          {mode !== 'reset' && (
            <>
              <label style={fieldLabel}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="toi@exemple.com"
                style={inputStyle}
                autoCapitalize="none"
                autoCorrect="off"
              />
            </>
          )}

          {mode !== 'forgot' && (
            <>
              <label style={{ ...fieldLabel, marginTop: 14 }}>
                {mode === 'reset' ? 'Nouveau mot de passe' : 'Mot de passe'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Au moins 6 caractères"
                style={inputStyle}
              />
            </>
          )}

          {mode === 'login' && (
            <button
              onClick={() => { setMode('forgot'); setErrorMsg(null); setInfoMsg(null); }}
              style={forgotLink}
            >
              Mot de passe oublié ?
            </button>
          )}

          {errorMsg && <p style={errorText}>{errorMsg}</p>}
          {infoMsg && <p style={infoText}>{infoMsg}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ ...submitBtn, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? '...' : mode === 'signup' ? 'Créer mon compte'
              : mode === 'forgot' ? 'Envoyer le lien'
              : mode === 'reset' ? 'Mettre à jour le mot de passe'
              : 'Se connecter'}
          </button>

          {mode === 'forgot' && (
            <button
              onClick={() => { setMode('login'); setErrorMsg(null); setInfoMsg(null); }}
              style={backLink}
            >
              ← Retour à la connexion
            </button>
          )}
        </div>

        <p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 16, lineHeight: '16px', textAlign: 'center' }}>
          Le compte sert uniquement à synchroniser tes séances/réglages entre appareils.
          Tout continue de fonctionner sans compte, en local sur ce téléphone.
        </p>
      </div>
    </div>
  );
};

const container: React.CSSProperties = { height: '100dvh', overflowY: 'auto' };
const scroll: React.CSSProperties = { maxWidth: 480, margin: '0 auto', padding: '0 16px 40px' };
const headerRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 14,
  paddingTop: 'max(24px, env(safe-area-inset-top))', paddingBottom: 18,
  borderBottom: '1px solid var(--border-subtle)', marginBottom: 20,
};
const backBtn: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 12, background: 'var(--bg-elevated)',
  border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 18, flexShrink: 0,
};
const title: React.CSSProperties = { color: 'var(--text-primary)', fontSize: 20, fontWeight: 800 };
const segmentRow: React.CSSProperties = { display: 'flex', gap: 8, marginBottom: 16 };
const segmentBtn: React.CSSProperties = {
  flex: 1, padding: '12px 4px', borderRadius: 14, cursor: 'pointer',
  fontSize: 13, fontWeight: 700, border: '1px solid var(--border-strong)',
  transition: 'background 0.2s, color 0.2s',
};
const card: React.CSSProperties = {
  background: 'var(--bg-card)', borderRadius: 16, padding: 18,
  border: '1px solid var(--border-mid)',
};
const fieldLabel: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 };
const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
  borderRadius: 10, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 14,
  fontFamily: 'inherit',
};
const forgotLink: React.CSSProperties = {
  display: 'block', marginTop: 10, fontSize: 12, color: 'var(--text-muted)',
  textAlign: 'right', textDecoration: 'underline', width: '100%',
};
const backLink: React.CSSProperties = {
  display: 'block', marginTop: 14, fontSize: 12, color: 'var(--text-muted)',
  textAlign: 'center', textDecoration: 'underline', width: '100%',
};
const errorText: React.CSSProperties = { color: '#e03030', fontSize: 12, marginTop: 12, lineHeight: '16px' };
const infoText: React.CSSProperties = { color: '#4CAF50', fontSize: 12, marginTop: 12, lineHeight: '16px' };
const submitBtn: React.CSSProperties = {
  width: '100%', marginTop: 18, padding: '13px 0', borderRadius: 12,
  background: 'var(--brand-1)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer',
};
