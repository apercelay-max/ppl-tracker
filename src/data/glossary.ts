// Définitions en une ou deux phrases, pour les débutants. Affichées par
// <InfoTip term="…" /> (voir components/InfoTip.tsx).
export interface GlossaryEntry { title: string; text: string }

export const GLOSSARY: Record<string, GlossaryEntry> = {
  RIR: {
    title: 'RIR (répétitions en réserve)',
    text: 'Combien de répétitions tu aurais encore pu faire à la fin de ta série. « RIR 2 » = tu t\'arrêtes en gardant 2 répétitions en réserve. Plus le chiffre est bas, plus la série était dure.',
  },
  RPE: {
    title: 'RPE (effort ressenti)',
    text: 'Une note de 1 à 10 pour dire à quel point la séance ou la série était dure. 10 = tu ne pouvais plus rien faire de plus, 7 = difficile mais il t\'en restait 3 en réserve.',
  },
  '1RM': {
    title: '1RM (charge maximale)',
    text: 'Le poids le plus lourd que tu peux soulever une seule fois. L\'appli l\'estime à partir de tes séries : tu n\'as pas besoin de le tester.',
  },
  TONNAGE: {
    title: 'Tonnage',
    text: 'Le poids total soulevé : charge × répétitions, additionné sur toutes les séries. Utile pour voir si tu progresses d\'une semaine à l\'autre.',
  },
  CHARGE: {
    title: 'Charge d\'entraînement',
    text: 'Une estimation de la fatigue qu\'ont coûtée tes séances (durée × effort ressenti). « Charge aiguë » = cette semaine, comparée à ta moyenne des dernières semaines. Entre 0,8 et 1,3, tu es dans la bonne zone.',
  },
  APTITUDE: {
    title: 'Aptitude à l\'entraînement',
    text: 'Un score de forme calculé à partir de ta charge récente et de ta récupération. Haut = tu peux t\'entraîner normalement ; bas = mieux vaut lever le pied.',
  },
  DELOAD: {
    title: 'Semaine de décharge (deload)',
    text: 'Une semaine plus légère (moins de poids ou de séries) pour laisser le corps récupérer. C\'est normal et ça aide à progresser ensuite : ce n\'est pas une punition.',
  },
  SERIE: {
    title: 'Série et répétitions',
    text: 'Une répétition = un mouvement complet (ex. une flexion). Une série = un enchaînement de répétitions, suivi d\'un temps de repos.',
  },
};
