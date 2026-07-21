import React from 'react';

// Écran affiché une seule fois, au tout premier lancement (voir App.tsx et
// store/workoutStore.ts → hasCompletedOnboarding/simplicityMode). Demande à
// Léo s'il préfère personnaliser un maximum de trucs, ou garder ça simple —
// la réponse détermine si SettingsScreen affiche tous les réglages ou
// seulement les essentiels (voir SettingsScreen.tsx → simplicityMode). Le
// choix reste modifiable à tout moment depuis Réglages → Apparence →
// "Réglages avancés", donc pas de stress à se tromper ici.
interface OnboardingModalProps {
onChoose: (choice: 'perso' | 'simple') => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onChoose }) => {
return (
<div style={overlay}>
<div style={card} className="fade-in">
<div style={badge}><span style={{ fontSize: 34 }}>👋</span></div>
<h2 style={title}>Une dernière question</h2>
<p style={subtitle}>
Tu es plutôt du genre à aimer personnaliser un maximum de trucs (couleurs, icônes, animations...),
ou à préférer que ce soit simple direct, sans réglages en trop ?
</p>
<div style={choiceCol}>
<button onClick={() => onChoose('perso')} style={choiceBtnPerso}>
<span style={{ fontSize: 22 }}>🎨</span>
<span style={{ flex: 1, textAlign: 'left' }}>
<span style={choiceLabelLight}>J'aime personnaliser</span>
<span style={choiceDescLight}>Tous les réglages restent visibles, comme aujourd'hui.</span>
</span>
</button>
<button onClick={() => onChoose('simple')} style={choiceBtnSimple}>
<span style={{ fontSize: 22 }}>✨</span>
<span style={{ flex: 1, textAlign: 'left' }}>
<span style={choiceLabelDark}>Je préfère simple</span>
<span style={choiceDescDark}>Seuls les réglages essentiels sont affichés.</span>
</span>
</button>
</div>
<p style={footnote}>Tu pourras changer d'avis à tout moment dans Réglages → Apparence.</p>
</div>
</div>
);
};

const overlay: React.CSSProperties = {
position: 'fixed', inset: 0, zIndex: 300,
background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
display: 'flex', alignItems: 'center', justifyContent: 'center',
padding: '24px 20px',
};
const card: React.CSSProperties = {
width: '100%', maxWidth: 380,
background: 'var(--bg-surface)', border: '1px solid var(--border)',
borderRadius: 24, padding: '28px 22px 22px',
boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
textAlign: 'center',
};
const badge: React.CSSProperties = {
width: 68, height: 68, borderRadius: 20,
background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
display: 'flex', alignItems: 'center', justifyContent: 'center',
margin: '0 auto 16px',
};
const title: React.CSSProperties = {
color: 'var(--text-primary)', fontSize: 20, fontWeight: 800,
letterSpacing: -0.3, marginBottom: 10,
};
const subtitle: React.CSSProperties = {
color: 'var(--text-muted)', fontSize: 13, lineHeight: '19px', marginBottom: 22,
};
const choiceCol: React.CSSProperties = {
display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16,
};
const choiceBtnBase: React.CSSProperties = {
display: 'flex', alignItems: 'center', gap: 12,
borderRadius: 16, padding: '14px 16px', cursor: 'pointer',
border: '1px solid var(--border-strong)', textAlign: 'left',
};
const choiceBtnPerso: React.CSSProperties = {
...choiceBtnBase,
background: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))',
border: '1px solid transparent',
};
const choiceBtnSimple: React.CSSProperties = {
...choiceBtnBase,
background: 'var(--bg-elevated)',
};
const choiceLabelLight: React.CSSProperties = {
display: 'block', color: '#fff', fontSize: 15, fontWeight: 800,
};
const choiceDescLight: React.CSSProperties = {
display: 'block', color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 2, lineHeight: '15px',
};
const choiceLabelDark: React.CSSProperties = {
display: 'block', color: 'var(--text-primary)', fontSize: 15, fontWeight: 800,
};
const choiceDescDark: React.CSSProperties = {
display: 'block', color: 'var(--text-dim)', fontSize: 11, marginTop: 2, lineHeight: '15px',
};
const footnote: React.CSSProperties = {
color: 'var(--text-dim)', fontSize: 11, lineHeight: '15px',
};
