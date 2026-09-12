// ─── Référentiel des sources du coach ─────────────────────────────────────
//
// Chaque règle du coach vient d'une recommandation officielle, et ce fichier
// dit laquelle : organisme, date, numéro d'avis quand il y en a un, lien.
//
// Pourquoi en faire des DONNÉES et pas des commentaires : les sources étaient
// déjà citées dans `utils/coach.ts`, mais invisibles depuis l'appli. Ici on
// peut les afficher (écran Coach → SOURCES), et surtout les vérifier. C'est
// comme ça qu'on a trouvé une erreur d'attribution : l'avis ANSES
// 2014-SA-0008 porte sur les compléments alimentaires pour sportifs, pas sur
// l'activité physique — les repères de volume, eux, viennent de la saisine
// 2012-SA-0155 (février 2016).
//
// Règle de tenue de ce fichier : aucune ligne sans lien vérifiable, et on
// n'écrit ici que ce que la source dit vraiment. Si un chiffre n'est pas dans
// la source, il n'a rien à faire dans le coach.

export interface Source {
  id: string;
  organisme: string;
  titre: string;
  /** Date de publication ou de validation, telle qu'elle figure sur le document. */
  date: string;
  /** Numéro de saisine, de position statement, de DOI… quand il existe. */
  reference?: string;
  url: string;
  /** Ce que cette source établit, en une phrase. */
  dit: string;
  /** Accès libre, ou article payant qu'on ne peut que citer. */
  acces: 'libre' | 'payant';
}

export const SOURCES: Source[] = [
  {
    id: 'has-2025',
    organisme: 'HAS (Haute Autorité de Santé)',
    titre: 'Activité physique à des fins de santé chez l’enfant et l’adolescent',
    date: 'validé par le Collège le 16 octobre 2025',
    url: 'https://www.has-sante.fr/jcms/p_3741687/fr/activite-physique-ses-bienfaits-sur-la-sante-commencent-des-le-plus-jeune-age',
    dit: 'Guide français de référence pour l’activité physique des 5-17 ans, y compris le renforcement musculaire et le suivi médical.',
    acces: 'libre',
  },
  {
    id: 'oms-2020',
    organisme: 'OMS',
    titre: 'Lignes directrices sur l’activité physique et la sédentarité',
    date: '2020',
    url: 'https://www.who.int/fr/publications/b/55518',
    dit: 'Au moins 60 min par jour d’activité aérobie modérée à soutenue entre 5 et 17 ans, dont du renforcement musculaire et osseux au moins trois fois par semaine.',
    acces: 'libre',
  },
  {
    id: 'anses-2012-sa-0155',
    organisme: 'ANSES',
    titre: 'Actualisation des repères du PNNS — activité physique et sédentarité',
    date: 'février 2016',
    reference: 'saisine 2012-SA-0155',
    url: 'https://www.anses.fr/fr/system/files/NUT2012SA0155Ra.pdf',
    dit: 'Repères français d’activité physique et de sédentarité, déclinés par tranche d’âge.',
    acces: 'libre',
  },
  {
    id: 'anses-2014-sa-0008',
    organisme: 'ANSES',
    titre: 'Risques liés à la consommation de compléments alimentaires destinés aux sportifs',
    date: 'novembre 2016',
    reference: 'saisine 2014-SA-0008',
    url: 'https://www.anses.fr/fr/system/files/NUT2014SA0008Ra.pdf',
    dit: 'Effets indésirables cardiovasculaires et psychiatriques rapportés : aucun complément pour développer la masse musculaire n’est recommandé, a fortiori avant 18 ans.',
    acces: 'libre',
  },
  {
    id: 'nsca-lloyd-2014',
    organisme: 'NSCA et consensus international',
    titre: 'Position statement on youth resistance training: the 2014 International Consensus',
    date: '2014',
    reference: 'Lloyd et al., British Journal of Sports Medicine — PMID 24055781',
    url: 'https://pubmed.ncbi.nlm.nih.gov/24055781/',
    dit: 'Référence mondiale sur la musculation encadrée chez le jeune : bénéfices démontrés, volume et intensité à adapter, pas de test de force maximale.',
    acces: 'payant',
  },
  {
    id: 'milewski-2014',
    organisme: 'Milewski et al.',
    titre: 'Chronic lack of sleep is associated with increased sports injuries in adolescent athletes',
    date: '2014',
    reference: 'Journal of Pediatric Orthopaedics',
    url: 'https://pubmed.ncbi.nlm.nih.gov/25028798/',
    dit: 'Dormir moins de 8 h multiplie par environ 1,7 le risque de blessure chez l’adolescent sportif.',
    acces: 'payant',
  },
  {
    id: 'schoenfeld-aragon',
    organisme: 'Schoenfeld et Aragon',
    titre: 'Nutrient timing revisited — la « fenêtre anabolique »',
    date: '2013',
    reference: 'Journal of the International Society of Sports Nutrition',
    url: 'https://pubmed.ncbi.nlm.nih.gov/23360586/',
    dit: 'La fenêtre de 30 minutes après l’effort est un mythe : la sensibilité anabolique dure 24 à 48 h, un repas dans les 1 à 2 h suffit.',
    acces: 'libre',
  },
];

export const sourceById = (id: string): Source | undefined => SOURCES.find((s) => s.id === id);

// ─── Ce que dit le guide HAS 2025 sur le cas précis de cette appli ────────
//
// À afficher tel quel dans l'appli, sans l'adoucir. Le guide HAS d'octobre
// 2025 (section sur les particularités de l'enfant) est explicite sur deux
// points qui concernent directement quelqu'un qui fait de la musculation à
// 13 ans, seul. Ce n'est pas un avis de l'appli, c'est une citation de la
// source — et c'est justement pour ça qu'elle a sa place ici.

export interface Avertissement {
  titre: string;
  texte: string;
  sourceId: string;
}

export const AVERTISSEMENTS: Avertissement[] = [
  {
    titre: 'Le travail avec charges, et la supervision',
    texte:
      'Le guide HAS d’octobre 2025 indique que chez l’enfant, la prudence s’impose sur le renforcement '
      + 'musculaire faute de données suffisantes, que le travail avec charge doit être réservé pour '
      + 'l’essentiel à après la puberté, et toujours accompagné d’instructions et d’une supervision par un '
      + 'professionnel formé. Cette appli suit tes séances, elle ne remplace pas cette supervision.',
    sourceId: 'has-2025',
  },
  {
    titre: 'Produits et compléments',
    texte:
      'Le même guide signale que les adolescents qui font de la musculation sont particulièrement exposés '
      + 'à un entourage qui pousse à prendre des produits. L’ANSES a documenté des effets indésirables '
      + 'cardiovasculaires et psychiatriques des compléments pour sportifs. Le coach n’en proposera jamais.',
    sourceId: 'anses-2014-sa-0008',
  },
  {
    titre: 'Certificat médical',
    texte:
      'Pour une licence sportive, le certificat d’absence de contre-indication n’est plus obligatoire pour '
      + 'les mineurs depuis le décret du 7 mai 2021, sauf réponse positive au questionnaire de santé du '
      + 'sportif mineur ou discipline à contraintes particulières. Une douleur qui revient, elle, se discute '
      + 'avec un adulte et un médecin — pas avec une appli.',
    sourceId: 'has-2025',
  },
];

// ─── Quelle source derrière quelle règle du coach ─────────────────────────
//
// Sert à l'écran Coach (« d'où viennent ces conseils ») et de garde-fou pour
// moi : une règle qui n'a pas de source ici n'a rien à faire dans coach.ts.

export interface RegleSourcee {
  regle: string;
  sourceIds: string[];
}

export const REGLES_SOURCEES: RegleSourcee[] = [
  {
    regle: 'Renforcement musculaire au moins 3 fois par semaine, 60 min d’activité par jour',
    sourceIds: ['oms-2020', 'has-2025'],
  },
  {
    regle: 'Volume : 8 à 12 séries effectives par muscle et par semaine, plafond à 14 à cet âge',
    sourceIds: ['nsca-lloyd-2014', 'anses-2012-sa-0155'],
  },
  {
    regle: 'Jamais moins de 6 répétitions, jamais de test de force maximale réel',
    sourceIds: ['nsca-lloyd-2014', 'has-2025'],
  },
  {
    regle: 'Plancher de 120 s de repos sur les exercices polyarticulaires',
    sourceIds: ['nsca-lloyd-2014'],
  },
  {
    regle: 'Double progression plutôt que pourcentages du 1RM',
    sourceIds: ['nsca-lloyd-2014'],
  },
  {
    regle: 'Dormir 8 à 10 h : en dessous de 8 h, le risque de blessure est multiplié par 1,7',
    sourceIds: ['milewski-2014'],
  },
  {
    regle: 'Manger dans les 1 à 2 h après la séance, pas dans les 30 min',
    sourceIds: ['schoenfeld-aragon'],
  },
  {
    regle: 'Aucun complément alimentaire avant 18 ans',
    sourceIds: ['anses-2014-sa-0008', 'has-2025'],
  },
  {
    regle: 'Pas de déficit calorique pendant la croissance',
    sourceIds: ['anses-2012-sa-0155', 'has-2025'],
  },
];
