// ─── Coach IA (côté client) ───────────────────────────────────────────────
//
// Fait le pont entre l'appli et la fonction serverless /api/coach : construit
// le digest (utils/coachDigest.ts), l'envoie, et range la réponse.
//
// Le moteur de règles local (utils/coach.ts) n'est PAS remplacé : il reste la
// source du conseil de charge pendant la séance, qui doit s'afficher
// instantanément et sans réseau. L'IA sert au bilan de fond, qui a le droit
// de prendre trois secondes.

import { buildCoachDigest } from './coachDigest';
import type {
  CoachAiBrief, CoachAiRequest, CoachAiResponse, CoachDigest, CoachDigestInput,
} from './coachDigest';

export const COACH_AI_ENDPOINT = '/api/coach';

// ─── Clé d'API saisie dans l'appli ────────────────────────────────────────
//
// Volontairement rangée à part du store zustand : le store est persisté ET
// synchronisé vers Supabase, une clé d'API n'a rien à faire dans un blob qui
// part sur un serveur. Ici elle ne quitte jamais le téléphone, sauf vers
// /api/coach au moment d'un appel.
//
// À savoir : elle est stockée en clair dans le localStorage du navigateur.
// C'est acceptable pour SA clé sur SON téléphone (c'est le même niveau de
// protection que les mots de passe enregistrés par le navigateur), mais ce
// n'est pas un coffre-fort. En cas de doute, on la supprime ici et on en
// recrée une sur AI Studio.
const KEY_STORAGE = 'ppl-gemini-key';
const BRIEF_STORAGE = 'ppl-coach-ai-brief';

export const readStoredApiKey = (): string => {
  try {
    return localStorage.getItem(KEY_STORAGE) ?? '';
  } catch {
    return '';
  }
};

export const writeStoredApiKey = (key: string): void => {
  try {
    const clean = key.trim();
    if (clean) localStorage.setItem(KEY_STORAGE, clean);
    else localStorage.removeItem(KEY_STORAGE);
  } catch {
    // Navigation privée ou stockage plein : on n'a pas de quoi prévenir
    // utilement ici, l'appel suivant dira simplement que la clé manque.
  }
};

/** Masque une clé pour l'affichage : « AIza…7x4K ». */
export const maskApiKey = (key: string): string => {
  const clean = key.trim();
  if (clean.length < 12) return '••••';
  return `${clean.slice(0, 4)}…${clean.slice(-4)}`;
};

// ─── Bilan mis en cache ───────────────────────────────────────────────────
//
// Un bilan coûte un appel réseau et quelques secondes : on le garde et on ne
// le régénère qu'à la demande, ou quand une nouvelle séance est enregistrée.
// Sans ça, chaque ouverture de l'écran relancerait un appel — et le quota
// gratuit se vide pour rien.

export interface CachedBrief {
  brief: CoachAiBrief;
  /** Horodatage de génération. */
  at: number;
  model: string;
  /** Nombre de séances de l'historique au moment du bilan : sert à repérer
   *  qu'il est périmé sans avoir à comparer tout le digest. */
  sessions: number;
}

export const readCachedBrief = (): CachedBrief | null => {
  try {
    const raw = localStorage.getItem(BRIEF_STORAGE);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedBrief;
    return parsed?.brief?.resume ? parsed : null;
  } catch {
    return null;
  }
};

export const writeCachedBrief = (cached: CachedBrief | null): void => {
  try {
    if (cached) localStorage.setItem(BRIEF_STORAGE, JSON.stringify(cached));
    else localStorage.removeItem(BRIEF_STORAGE);
  } catch {
    // Idem : un cache qui ne s'écrit pas fait juste un appel de plus.
  }
};

// ─── Appel ────────────────────────────────────────────────────────────────

/** Construit le digest à partir des données du store. Séparé de l'appel pour
 *  pouvoir afficher sa taille sans rien envoyer. */
export const digestFromStore = (input: CoachDigestInput): CoachDigest => buildCoachDigest(input);

const networkError = (message: string): CoachAiResponse => ({ ok: false, code: 'RESEAU', message });

export const requestCoachAi = async (request: CoachAiRequest): Promise<CoachAiResponse> => {
  let response: Response;
  try {
    response = await fetch(COACH_AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  } catch {
    return networkError('Pas de réseau. Le bilan IA a besoin d’une connexion — le coach local, lui, marche toujours.');
  }

  // `npm run dev` (Vite) ne sert pas le dossier api/ : il renvoie l'index HTML
  // de l'appli avec un code 200. Sans ce test, on tomberait sur une erreur de
  // parsing JSON incompréhensible au lieu d'une explication.
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return networkError(
      'La fonction /api/coach n’a pas répondu. En local, elle n’existe qu’avec « vercel dev » ; en ligne, vérifie que le déploiement est bien passé.'
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return networkError('Réponse illisible du serveur.');
  }

  const parsed = payload as CoachAiResponse;
  if (!parsed || typeof parsed !== 'object' || !('ok' in parsed)) {
    return networkError('Réponse inattendue du serveur.');
  }
  return parsed;
};
