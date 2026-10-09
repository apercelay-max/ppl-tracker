# PPL Tracker — consignes pour Claude Code

Application web (PWA) de suivi de musculation, en français (programmes Push/Pull/Legs et autres).
React 18 + TypeScript + Vite, état dans un store Zustand, comptes et synchro via Supabase,
hébergée sur Vercel (https://ppl-tracker-puce.vercel.app).

Elle est développée à deux, par Antoine (adulte responsable des comptes GitHub, Vercel et Supabase) et
Léopold, **chacun sur son ordinateur, avec son propre Claude Code**. GitHub est le seul point de rendez-vous :
ce qui n'est pas poussé sur GitHub n'existe pas pour l'autre. Les notes et mémoires de Claude restent sur
chaque ordinateur : tout ce qui doit être partagé va dans ce fichier.

## Travailler à deux sans se marcher dessus

- **`main` est publié en production automatiquement** (Vercel) et n'est pas protégé : ne jamais y travailler
  ni y pousser directement.
- Début de session : `git switch main && git pull`, puis une branche par tâche (`feat/…`, `fix/…`, `chore/…`).
- Fin de tâche : commit, `git push -u origin <branche>`, puis une PR (`gh pr create` ou l'interface GitHub).
  Vercel construit une version d'essai de chaque PR : son check doit être vert et la version d'essai testée
  avant de fusionner. Check Vercel rouge = build cassé, ne pas fusionner.
- Ne fusionner que ses propres PR, une fois testées ; pour la PR de l'autre, lui demander.
- Petites PR, fusionnées vite, et `git pull` sur `main` avant d'ouvrir la PR. Les gros fichiers
  (`SettingsScreen.tsx`, `SessionScreen.tsx`, `HomeScreen.tsx`, `workoutStore.ts`) sont ceux où l'on se
  télescope : se dire sur quel écran on travaille.
- **Identité git obligatoire** (`git config user.name` et `user.email`, dans chaque copie du dépôt). Sans elle,
  git signe avec le nom de l'ordinateur et Vercel bloque le déploiement (« Deployment was blocked », déjà arrivé
  le 16 septembre 2026). Le dépôt est public : utiliser l'adresse « noreply » du compte GitHub plutôt qu'un
  e-mail personnel.
- Les utilisateurs ne sont pas des développeurs professionnels : expliquer en langage simple, définir un terme
  technique la première fois, et **demander avant** toute action publique ou irréversible (push, fusion,
  suppression de branche, migration Supabase).

## Sécurité et confidentialité (le dépôt est PUBLIC)

- Aucun secret (clé, token, mot de passe, `.env`) ni donnée personnelle (santé, e-mail, adresse) dans le code,
  les commentaires, les messages de commit ou les PR.
- Les clés se règlent directement dans Vercel ou Supabase, par l'adulte responsable du compte — **jamais via le
  chat**. `GEMINI_API_KEY` ne doit **jamais** être préfixée `VITE_` : Vite publierait la clé dans le navigateur.
- Supabase : pour les données partagées entre utilisateurs (binôme), les tables sont fermées (RLS activé) et
  tout passe par des fonctions SQL — ne pas assouplir. Les migrations (`supabase/migrations/`) s'exécutent à la
  main (SQL Editor ou `supabase db push`), les fonctions Edge avec `supabase functions deploy <nom>` : ne pas le
  faire sans l'accord de l'adulte responsable. La fonction `recovery-push-check`, appelée toutes les heures par
  `.github/workflows/`, n'est pas versionnée dans ce dépôt.

## Données des utilisateurs : ne rien casser

- L'état est enregistré dans le `localStorage` des téléphones (clé `ppl-tracker-store`) et synchronisé vers
  Supabase. Il n'y a pas de numéro de version : la fonction `merge` de `src/store/workoutStore.ts` donne leur
  valeur par défaut aux réglages ajoutés plus tard. **Tout nouveau champ persisté doit y être traité**, et un
  champ existant ne se renomme ni ne se supprime sans prévoir les données déjà stockées.
- L'historique est lié aux identifiants d'exercices et de séances : ne pas les renommer ni les réutiliser pour
  autre chose. Les anciennes séances restent accessibles via `src/data/legacyWorkouts.ts`.

## Commandes

- `npm install` (⚠ `xlsx` se télécharge depuis cdn.sheetjs.com), `npm run dev`, `npm run build`.
- `npm run build` ne vérifie pas les types : lancer aussi `npx tsc --noEmit` et ne pas ajouter d'erreur.
- Pas de tests automatiques : on vérifie en lançant l'appli. Sans `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
  (dans `.env.local`, jamais commité), l'appli fonctionne mais sans la partie « Compte ».

## Repères

- Pas de routeur : la navigation est un état `view` dans `src/App.tsx`. Un seul store : `src/store/workoutStore.ts`.
- Écrans dans `src/screens/`, composants dans `src/components/`, programmes et catalogue d'exercices dans `src/data/`.
- Nouveauté visible par l'utilisateur : ajouter une entrée **en tête** de `CHANGELOG` (`src/data/changelog.ts`)
  avec un `id` jamais utilisé. Si deux PR ajoutent chacune une entrée, garder les deux.
- Coach IA : `api/coach.ts` (fonction serverless Vercel, Gemini, avec modèles de secours).
- Textes de l'interface et commentaires en français ; les commentaires expliquent le *pourquoi*.

## App iOS (branche `app-store`)

- L'appli web est emballée dans une coque iOS par **Capacitor** (dossier `ios/`) : `npm run ios:sync` construit le
  web et le copie dans le projet, `npm run ios:open` ouvre Xcode. Xcode est nécessaire (Mac uniquement).
- Widgets (`ios/App/PPLWidget/`), séance en direct sur l’écran verrouillé et la Dynamic Island (Live Activity : exercice, série, repos, volume, durée, cœur) et liens
  `ppltracker://…` : le web envoie un résumé JSON aux widgets via `src/lib/widgetSync.ts` et le plugin natif
  `ios/App/App/WidgetBridgePlugin.swift`, par l'App Group `group.com.ppltracker.app`. Tout champ ajouté au résumé
  doit l'être **en optionnel** dans `PPLWidget/Shared.swift`.
- iOS 16.2 minimum. L'identifiant `com.ppltracker.app` et l'App Group sont **provisoires** : à valider avec l'adulte
  responsable du compte Apple Developer avant toute publication. Aucun certificat ni clé dans le dépôt.
- Ajouter un fichier Swift ou une cible : le déclarer dans `App.xcodeproj` (via Xcode, ou le gem Ruby `xcodeproj`).
- Abonnements « PPL Pro » : achats intégrés Apple (StoreKit 2), code dans `ios/App/App/SubscriptionsPlugin.swift`,
  `src/lib/subscriptions.ts`, `src/screens/PaywallScreen.tsx`, `src/components/ProPromptSheet.tsx`. Essai gratuit 7 jours,
  prix normal 14,99 €/mois (et 149,99 €/an, à confirmer), prix de lancement −50 % (7,49 €/mois, 74,99 €/an) pour les 50 premiers (voir `LAUNCH_OFFER`).
  Pour tester sans compte Apple : lancer l'appli **depuis Xcode (▶)** : `ios/App/PPLTracker.storekit` simule la boutique.
  Les produits réels se créent dans App Store Connect (par l'adulte responsable) avec les mêmes identifiants.
- Interdit par Apple, ne pas faire : offrir un avantage (Pro gratuit…) en échange d'un avis (règle 5.6.1).
- Raccourcis Siri (`ios/App/App/SiriShortcuts.swift`, App Intents en français) : lisent le même résumé que les widgets ;
  « Démarrer ma séance » laisse un lien dans l'App Group, lu par `consumePendingLink` (`src/lib/widgetSync.ts`).
- Apple Watch (`ios/App/PPLWatch/`, SwiftUI) : le téléphone envoie l'état par WatchConnectivity (`PhoneWatchLink.swift`,
  `syncWatch` dans `widgetSync.ts`), la montre renvoie des commandes (valider la série, passer le repos) que
  `src/lib/watchBridge.ts` route vers l'écran de séance : mêmes fonctions que les boutons du téléphone. **Jamais testée sur
  une vraie montre** (pas de simulateur watchOS installé sur le Mac de Léopold) : à essayer avant publication.
- Compte : suppression depuis l'appli (`src/lib/account.ts`) et parrainage (`src/lib/referral.ts`) demandent la migration
  `supabase/migrations/20261008120000_compte_et_parrainage.sql`, à passer par l'adulte responsable. Fiche App Store : `docs/app-store.md`.
