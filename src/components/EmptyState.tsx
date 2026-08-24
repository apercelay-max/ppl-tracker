import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  text: string;
}

// État vide réutilisable : icône discrète + texte, pour remplacer les
// blocs "pas encore de données" purement textuels de l'historique et
// des objectifs.
export const EmptyState: React.FC<EmptyStateProps> = ({ icon, text }) => (
  <div style={wrapper}>
    <div style={iconWrap}>{icon}</div>
    <p style={textStyle}>{text}</p>
  </div>
);

const wrapper: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  gap: 10, padding: '20px 16px',
};
const iconWrap: React.CSSProperties = {
  width: 44, height: 44, borderRadius: '50%',
  background: 'var(--bg-red-input)', color: 'var(--text-dim)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const textStyle: React.CSSProperties = {
  color: 'var(--text-muted)', fontSize: 13, lineHeight: '18px', textAlign: 'center', maxWidth: 260,
};
