import React, { useEffect, useState } from 'react';

// Clé du localStorage : la semaine (le lundi) pour laquelle on a déjà fêté l'objectif.
const CELEBRATED_KEY = 'ppl-goal-celebrated';

// Lundi de la semaine en cours, au format AAAA-MM-JJ.
const mondayKey = (): string => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

interface GoalNumberProps {
  value: number;
  /** L'objectif de séances de la semaine est atteint. */
  reached: boolean;
  style?: React.CSSProperties;
}

// Le chiffre « séances cette semaine ». Quand l'objectif est atteint, il gonfle et
// trois ondes vertes partent de lui. On ne le fête QU'UNE FOIS par semaine : sans
// ça, l'animation rejouerait à chaque ouverture de l'accueil, et finirait par
// agacer plutôt que récompenser. Sans stockage disponible, on ne fête pas : mieux
// vaut ne rien animer que de le faire à chaque fois.
export const GoalNumber: React.FC<GoalNumberProps> = ({ value, reached, style }) => {
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    if (!reached) return;
    const week = mondayKey();
    try {
      if (localStorage.getItem(CELEBRATED_KEY) === week) return;
      localStorage.setItem(CELEBRATED_KEY, week);
    } catch {
      return;
    }
    setCelebrate(true);
  }, [reached]);

  return (
    <b className={celebrate ? 'goal-pop' : undefined} style={{ position: 'relative', ...style }}>
      {value}
      {celebrate && <span className="goal-rip" aria-hidden="true"><i /><i /><i /></span>}
    </b>
  );
};
