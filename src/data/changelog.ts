// Nouveautés affichées au démarrage (voir components/WhatsNewSheet.tsx).
//
// Pour annoncer une nouveauté : ajouter une entrée EN TÊTE de la liste, avec
// un `id` jamais utilisé. L'écran s'ouvre une seule fois par appareil pour
// toutes les entrées arrivées depuis la dernière visite ; un tout nouvel
// utilisateur (quiz de démarrage pas encore fait) ne voit rien.

export interface ChangelogEntry {
  /** Identifiant unique et stable, ex. « 2026-09-26 ». */
  id: string;
  title: string;
  items: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    id: '2026-11-21-cinq-onglets',
    title: 'Une barre plus simple : 5 onglets',
    items: [
      'La barre du bas passe de 12 onglets à 5 : Accueil, Séances, Progrès, Coach et Profil. Chaque onglet s’ouvre sur ce que tu veux voir en premier (ta séance du jour, tes séances passées, tes stats…).',
      'Touche l’onglet déjà ouvert pour voir la liste de ses rubriques : par exemple Progrès → Stats, Exercices, Poids, Objectifs. Réglages est dans Profil.',
    ],
  },
  {
    id: '2026-11-20-barre-du-haut',
    title: 'Une barre d’onglets en haut',
    items: [
      'Nouveau choix dans Réglages → Barre de menus → Position : garder la capsule en bas, ou passer à une barre fine en haut de l’écran.',
      'Deux présentations : « Ruban » (touche « Onglets : » et la liste défile sur une ligne) ou « Sommaire » (un panneau qui descend, en deux colonnes). Une icône au trait fin par onglet, écriture très légère.',
    ],
  },
  {
    id: '2026-11-20-defilement-3d',
    title: 'Un défilement en profondeur',
    items: [
      'Sur l’accueil, la carte qui arrive tout en bas de l’écran s’éloigne vers le fond, puis se redresse à plat en remontant. Elle reste collée à la carte du dessus.',
      'Deux styles au choix dans Réglages → Style de l’interface : « Recul » (la carte rapetisse et pâlit en s’éloignant) et « Balançoire » (le haut avance pendant que le bas s’enfonce). Tu peux aussi le désactiver.',
    ],
  },
  {
    id: '2026-11-15-accueil-ipad',
    title: 'Un accueil pensé pour l’iPad',
    items: [
      'Sur iPad, la séance du jour passe en grand avec son programme : tu vois les exercices, les séries et les répétitions avant même de commencer.',
      'À côté, tes anneaux de la semaine et la récupération muscle par muscle ; en dessous, toutes tes autres cartes sur plusieurs colonnes.',
      'En paysage comme en portrait, et dans les cinq styles (Nouveau, Points, Sport, Épuré, Classique). Sur téléphone, rien ne change.',
    ],
  },
  {
    id: '2026-11-14-strict-v5-3',
    title: 'Programme Strict V5.3 : prise de masse',
    items: [
      'Le programme Strict passe en V5.3, Phase 3 : un cycle de 6 semaines (5 de progression + 1 de décharge) du 3 novembre au 14 décembre. Le compteur de semaines repart de 1 et se recale sur la date du jour.',
      'Les jambes reviennent : échauffement du genou, puis fessiers et mollets en priorité, avec un travail du quadriceps en douceur à charge fixe.',
      'Le dos change d’exercices : tractions prise large en tête, et un tirage vertical barre large (en version 12-15 au Pull A, en version lourde au Pull B).',
      'Les curls passent en supination stricte (3 séries), le curl inversé est mis de côté, et la barre droite en pronation remplace la corde au face pull et à l’extension triceps. Tes anciennes séances restent dans l’historique.',
    ],
  },
  {
    id: '2026-11-09-anneaux',
    title: 'Ta semaine en anneaux',
    items: [
      'Sur l’accueil, trois anneaux résument ta semaine : tes séances, ta récupération et ta charge. Ils se remplissent au démarrage, et toucher la carte rejoue l’animation.',
      'L’anneau de charge est plein quand ta semaine est bien dosée par rapport à d’habitude, et il se vide si tu en fais trop peu ou beaucoup trop.',
    ],
  },
  {
    id: '2026-11-09-points',
    title: 'Nouveau style : Points',
    items: [
      'Un cinquième style, identique aux autres pour la présentation, où les titres, les gros chiffres et la barre du bas sont dessinés en petits points lumineux.',
      'Dans Réglages, choisis la densité (minimaliste ou ultra complet), la taille des points et leur animation. Les points du texte restent posés pendant la séance pour ne jamais gêner la lecture.',
      'Le repos devient un anneau de points qui s’allument, les barres de progression sont en points et les icônes de la barre du bas gardent seulement leur contour.',
    ],
  },
  {
    id: '2026-10-26-mouvement-3',
    title: 'Séance plus vivante',
    items: [
      'Le titre de la séance glisse de l’accueil vers l’écran d’aperçu quand tu la touches.',
      'Le chrono de la séance se retourne comme un tableau de gare, et le bilan de fin de séance se pose chiffre après chiffre.',
      'Quand tu valides par secousse, le bord de l’écran s’éclaire et le téléphone vibre à l’écran. Un exercice terminé se tasse d’un cran, le questionnaire de départ et la jauge de charge bougent aussi.',
    ],
  },
  {
    id: '2026-10-26-mouvement-2',
    title: 'Encore plus de vie',
    items: [
      'Repos : les 3 dernières secondes pulsent en rouge, puis « GO » claque avec une onde.',
      'Nouveau record : la médaille tourne sur elle-même, avec un reflet et des étincelles.',
      'Les courbes se dessinent, les barres montent, le calendrier s’allume en vague et la pesée a son cadran.',
      'Sous le poids d’une barre, les disques se chargent comme en vrai. Supprimer une pesée ou une séance de cardio se fait en douceur, et le coach écrit sa réponse mot à mot.',
    ],
  },
  {
    id: '2026-10-26-mouvement',
    title: 'Une appli qui bouge mieux',
    items: [
      'Les boutons réagissent au toucher : ils s’enfoncent légèrement quand tu appuies dessus.',
      'Les écrans, les listes et les fenêtres apparaissent en douceur, avec le même rythme partout.',
      'Chaque style a son caractère : Sport pro est plus sec, Épuré plus calme. Rien ne bouge si tu as réglé « réduire les animations » sur ton téléphone.',
    ],
  },
  {
    id: '2026-10-26',
    title: 'Séance sur iPad : nouveaux gestes',
    items: [
      'Les stats s’ouvrent en glissant vers le bas depuis tout en haut de l’écran, la liste des exercices en glissant vers le haut depuis tout en bas. Au milieu, le glissement vertical fait seulement défiler la carte.',
      'Nouveau : glisse depuis le coin haut-gauche vers le milieu pour ouvrir une barre latérale avec toutes les stats de la séance. Touche à côté, « Fermer » ou glisse-la vers la gauche pour la refermer.',
      'La vue iPad ne bascule plus vers l’ancienne liste en pleine séance, même si l’iPad zoome ou si le clavier apparaît.',
    ],
  },
  {
    id: '2026-10-25',
    title: 'Séance sur iPad',
    items: [
      'Sur iPad en paysage, la série en cours est au centre, avec l’exercice précédent et le suivant en cartes inclinées derrière.',
      'Glisse à gauche ou à droite pour changer d’exercice, vers le bas pour les stats, vers le haut pour voir tous les exercices.',
      'La barre du bas disparaît : durée et poids soulevé sont sous la carte « précédent », pause et stop sous la carte « suivant ».',
    ],
  },
  {
    id: '2026-10-12',
    title: 'Mode Tableur',
    items: [
      'Nouveau : « Tableur », dans le menu Plus. Tes séances en grille façon Excel, une colonne par séance faite.',
      'Elle se remplit toute seule : termine une séance et elle apparaît, série par série.',
      'Export Excel (.xlsx) de la grille, un onglet par séance.',
    ],
  },
  {
    id: '2026-10-08',
    title: 'Programme Strict V4.3',
    items: [
      'Le programme passe en V4.3 : la sèche court jusqu’au 21/10, avec les semaines 12 et 13.',
      'Deltoïde latéral en tête : élévations latérales ajoutées au Pull A, 5 séries au Push A, poulie basse au Push B.',
      'Push B : élévations frontales et pompes prise large retirées, triceps en prise pronation.',
      'Progression à un cran à la fois : la charge ne monte que si toutes les séries atteignent leurs reps.',
    ],
  },
  {
    id: '2026-09-26',
    title: 'Coach, statut et sauvegardes',
    items: [
      'Statut d’entraînement façon Garmin dans le Dashboard : statut, charge aiguë, aptitude.',
      'Importe ton historique depuis Strong, Hevy ou Fitbod, et exporte-le en CSV.',
      'Copies de secours locales automatiques et rappel d’export.',
      'Le coach IA bascule tout seul sur un autre modèle quand Google est saturé.',
    ],
  },
  {
    id: '2026-09-24',
    title: 'Accueil et coach',
    items: [
      'Accueil : série de semaines, récap « Cette semaine » et invitation à former un binôme.',
      'Dès la 1re séance, le coach te dit quoi faire « La prochaine fois ».',
      'Série active : les reps sont préremplies avec ta dernière fois.',
    ],
  },
];
