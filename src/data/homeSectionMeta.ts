import type { HomeSectionKey } from '../store/workoutStore';

export interface HomeSectionMetaEntry {
  label: string;
  desc: string;
  toggleable: boolean;
}

// Métadonnées d'affichage des blocs de l'accueil — partagées entre
// Réglages → Apparence (liste réordonnable classique) et l'accueil
// lui-même (mode édition + sélecteur "+ Ajouter un widget"), pour ne pas
// dupliquer les libellés à deux endroits qui pourraient diverger.
export const HOME_SECTION_META: Record<HomeSectionKey, HomeSectionMetaEntry> = {
  cycle: { label: 'Cycle en cours', desc: 'La carte semaine / RIR / objectif.', toggleable: true },
  seances: { label: 'Liste des séances', desc: 'Les séances du programme actif — toujours visible.', toggleable: false },
  nutrition: { label: 'Conseil nutrition', desc: 'Le rappel protéines/glucides après la séance.', toggleable: true },
  supersetRule: { label: 'Règle superset', desc: 'Le rappel sur le fonctionnement des supersets.', toggleable: true },
  muscleAlert: { label: 'Groupes musculaires', desc: 'Alerte les groupes pas travaillés depuis un moment.', toggleable: true },
  cardio: { label: 'Cardio', desc: 'Ajouter et suivre tes séances de vélo, marche, course...', toggleable: true },
  weeklyGoal: { label: 'Objectif hebdo', desc: "L'anneau de progression du nombre de séances cette semaine.", toggleable: true },
  nextSession: { label: 'Prochaine séance', desc: 'Le bandeau qui indique la prochaine séance du cycle.', toggleable: true },
  lastSession: { label: 'Séance précédente', desc: 'Le récap rapide de ta dernière séance terminée (durée, tonnage, séries).', toggleable: true },
  weeklyStats: { label: 'Stats de la semaine', desc: 'Tonnage de la semaine vs la semaine dernière, avec un mini graphique sur 4 semaines.', toggleable: true },
  bodyWeight: { label: 'Poids du corps', desc: 'Dernière pesée et tendance, basé sur ton suivi du poids.', toggleable: true },
  personalRecord: { label: 'Dernier record perso', desc: 'Le dernier PR chiffré que tu as battu.', toggleable: true },
  exerciseProgress: { label: 'Progression sur un exercice', desc: "Courbe de 1RM estimé sur l'exercice qui progresse le plus en ce moment.", toggleable: true },
  plateau: { label: 'Plateaux', desc: "Exercices dont le 1RM estimé ne bouge plus depuis plusieurs semaines.", toggleable: true },
};
