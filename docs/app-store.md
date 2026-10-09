# Fiche App Store — PPL Tracker

À copier dans App Store Connect (par l'adulte responsable du compte Apple Developer).
Aucune clé ni donnée personnelle dans ce fichier : le dépôt est public.

## Avant de soumettre (à faire par une personne, pas par le code)

- [ ] Compte Apple Developer (99 $/an) au nom de l'adulte responsable.
- [ ] Valider l'identifiant de l'appli `com.ppltracker.app` et l'App Group `group.com.ppltracker.app`
      (les changer ensuite est pénible : le décider avant la première soumission).
- [ ] Appliquer la migration `supabase/migrations/20261008120000_compte_et_parrainage.sql`
      (suppression de compte + parrainage). Sans elle, ces boutons répondent « pas encore disponible » : **Apple teste la suppression de
      compte, il ne faut pas soumettre avant**. Le SQL a été vérifié par `supabase/tests/compte_et_parrainage.test.mjs` (25 vérifications,
      voir l'en-tête du fichier pour le lancer), mais pas sur le vrai projet Supabase : refaire l'essai après l'avoir passé (créer un compte de test, le supprimer).
- [ ] Fusionner la branche dans `main` pour que `/confidentialite.html` et `/support.html` soient en ligne
      (Apple vérifie ces deux adresses).
- [ ] Compléter dans `public/confidentialite.html` le nom de l'éditeur et une adresse de contact
      (aujourd'hui : la page de suivi GitHub). Une adresse e-mail dédiée vaut mieux qu'un e-mail personnel.
- [ ] Créer dans App Store Connect un groupe d'abonnement « PPL Plus et Pro » avec deux abonnements mensuels, mêmes identifiants que dans le code :
      `com.ppltracker.app.pro.monthly` (14,99 €, niveau 1 = le plus haut) et `com.ppltracker.app.plus.monthly` (4,99 €, niveau 2),
      essai gratuit 7 jours sur les deux. Prix de lancement −50 % (7,49 € et 2,49 €) : voir `LAUNCH_OFFER` dans `src/lib/subscriptions.ts`.
- [ ] Captures d'écran iPhone (6,9" et 6,5") : accueil, séance en cours, Dynamic Island, widgets, stats.
- [ ] Questionnaire « Confidentialité des données » : reprendre `ios/App/App/PrivacyInfo.xcprivacy`
      (e-mail, prénom, données de forme et de santé, identifiant : liés au compte, jamais pour du suivi publicitaire).
- [ ] TestFlight : 2 à 3 semaines avec 10 à 20 personnes avant la sortie.

## Textes

**Nom** : PPL Tracker
**Sous-titre** (30 car.) : Musculation, simple et suivie
**Texte promotionnel** (170 car.) : Ton programme, ton repos, tes progrès. Widgets, séance en direct et Siri avec PPL Plus ; coach IA illimité et stats avancées avec PPL Pro.

**Description**

PPL Tracker t'accompagne à chaque séance de musculation : programme Push / Pull / Legs et autres, charges et répétitions, minuteur de repos, historique et progression.

• Un programme adapté à ton objectif, ton niveau et ton temps (quiz de départ).
• Le suivi de chaque série, avec tes charges de la dernière fois sous les yeux.
• Un minuteur de repos qui ne t'oublie pas, même téléphone verrouillé.
• Tes records, ton volume soulevé, ta récupération muscle par muscle, ton poids de corps.
• Un coach qui te dit quoi améliorer, sans jargon (le coach IA est facultatif et demande ton accord).
• Binôme : suis la régularité d'un ami, sans jamais voir le détail de ses séances.
• Fonctionne hors ligne, dans les salles où le réseau est mauvais. Pas de publicité.

PPL Plus (4,99 €/mois, 7 jours gratuits) : widgets, séance en direct dans la Dynamic Island et sur l'écran verrouillé, Siri et Raccourcis, récupération musculaire, 15 coachs IA par mois.
PPL Pro (14,99 €/mois, 7 jours gratuits) : tout PPL Plus, avec le coach IA illimité, le programme adapté par l'IA, l'analyse de séance et le planificateur de semaine par l'IA, les rapports à partager, l'export Excel complet, la sauvegarde chiffrée, des thèmes exclusifs, les stats avancées et les grands widgets.

L'abonnement se renouvelle automatiquement sauf annulation au moins 24 h avant la fin de la période. Gestion et résiliation dans les réglages de ton compte Apple.

Conditions : https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
Confidentialité : https://ppl-tracker-puce.vercel.app/confidentialite.html

**Mots-clés** (100 car., séparés par des virgules) :
musculation,entraînement,séance,programme,push pull legs,PPL,fitness,repos,chrono,muscu,haltères,suivi

**Catégorie** : Santé et remise en forme (secondaire : Sports)
**Classification d'âge** : 12+ (conseils de forme ; pas de contenu sensible). Le questionnaire d'Apple décide.
**URL d'assistance** : https://ppl-tracker-puce.vercel.app/support.html
**URL de confidentialité** : https://ppl-tracker-puce.vercel.app/confidentialite.html

## Notes pour l'équipe de validation d'Apple

- Le compte est facultatif : toute l'appli fonctionne sans se connecter. Aucun identifiant de test n'est nécessaire.
- Pour tester les abonnements : Réglages → carte « PPL Plus et PPL Pro ». Plus : widgets, séance en direct, Siri, récupération.
  Pro : en plus, les stats avancées, le programme adapté par l'IA et le coach IA illimité.
- Suppression du compte : Réglages → Données & compte → Supprimer mon compte (visible une fois connecté).
- Le coach IA envoie un résumé d'entraînement à Google Gemini après accord explicite de l'utilisateur
  (fenêtre d'accord au premier usage ; retirable dans Réglages → Données & compte).
- Le parrainage offre un mois de PPL Pro au parrain. Ce n'est pas un achat intégré et ne dépend d'aucun avis.
- Aucune demande d'avis n'offre de contrepartie (règle 5.6.1).

## Ce qui est volontairement absent

- « Se connecter avec Apple » : l'appli ne propose que e-mail + mot de passe, pas de connexion Google ou Facebook,
  donc ce n'est pas obligatoire. À ajouter dès qu'une connexion tierce arrive.
- iPad : l'appli est réglée sur iPhone uniquement (pas de captures iPad à fournir).
