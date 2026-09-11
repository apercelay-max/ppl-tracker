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
import type { CoachPatchOp, CoachProgramView, PatchChange } from './coachPatch';

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
const CHAT_STORAGE = 'ppl-coach-chat';

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

// ─── Conversation ─────────────────────────────────────────────────────────
//
// C'est Google qui garde l'historique de l'échange (`previous_interaction_id`)
// et l'appli qui garde les messages pour pouvoir les réafficher. On ne
// réexpédie donc ni les anciens messages ni le digest à chaque tour : le
// deuxième message d'une conversation coûte quelques dizaines de jetons au
// lieu de plus de mille.
//
// Conséquence à connaître : l'identifiant peut expirer côté Google. Dans ce
// cas la fonction répond CONVERSATION_PERDUE, et `sendChatMessage` repart
// tout seul sur une conversation neuve avec le digest — l'utilisateur ne voit
// qu'une réponse qui arrive normalement.

/** Proposition de modification attachée à un message du coach, DÉJÀ passée
 *  par `validateProposal` : `changes` est calculé à partir du programme réel,
 *  `rejets` dit ce qui a été écarté. Rien n'est appliqué avant que
 *  l'utilisateur appuie sur « Appliquer » — d'où le statut, gardé avec la
 *  conversation pour qu'un message déjà traité ne redemande pas une décision. */
export interface ChatProposal {
  titre: string;
  raison: string;
  changes: PatchChange[];
  ops: CoachPatchOp[];
  rejets: string[];
  statut: 'en-attente' | 'appliquee' | 'refusee';
}

export interface ChatMessage {
  role: 'moi' | 'coach';
  text: string;
  at: number;
  proposition?: ChatProposal;
}

export interface ChatState {
  messages: ChatMessage[];
  /** Dernier échange connu de Google. Absent = la prochaine question démarre
   *  une conversation neuve. */
  interactionId?: string;
}

/** Au-delà, on oublie les plus vieux messages : c'est de l'affichage, et le
 *  contexte réel vit chez Google, pas dans cette liste. */
const CHAT_MAX_MESSAGES = 60;

const EMPTY_CHAT: ChatState = { messages: [] };

export const readChat = (): ChatState => {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE);
    if (!raw) return EMPTY_CHAT;
    const parsed = JSON.parse(raw) as ChatState;
    return Array.isArray(parsed?.messages) ? parsed : EMPTY_CHAT;
  } catch {
    return EMPTY_CHAT;
  }
};

export const writeChat = (state: ChatState): void => {
  try {
    const trimmed: ChatState = {
      ...state,
      messages: state.messages.slice(-CHAT_MAX_MESSAGES),
    };
    localStorage.setItem(CHAT_STORAGE, JSON.stringify(trimmed));
  } catch {
    // Pas de stockage : la conversation reste à l'écran, elle ne survivra
    // juste pas à un rechargement.
  }
};

export const clearChat = (): void => {
  try {
    localStorage.removeItem(CHAT_STORAGE);
  } catch {
    // Rien à faire de plus.
  }
};

interface SendChatOptions {
  digest: CoachDigest;
  question: string;
  previousInteractionId?: string;
  apiKey?: string;
  /** Programme actuel : joint uniquement quand la conversation démarre, sinon
   *  on le renverrait à chaque message pour rien. Sans lui, le coach ne peut
   *  proposer aucune modification (il n'a pas les identifiants réels). */
  program?: CoachProgramView;
  /** Index du catalogue (`buildCatalogIndex`), premier tour seulement : sans
   *  lui le coach ne peut pas désigner un exercice existant. */
  catalog?: string[];
}

/** Envoie un message de la conversation. Repart d'une conversation neuve, une
 *  seule fois, si Google a oublié l'échange précédent. */
export const sendChatMessage = async (options: SendChatOptions): Promise<CoachAiResponse> => {
  const { digest, question, previousInteractionId, apiKey, program, catalog } = options;

  const first = await requestCoachAi({
    mode: 'chat', digest, question, previousInteractionId, apiKey,
    // Premier tour seulement.
    program: previousInteractionId ? undefined : program,
    catalog: previousInteractionId ? undefined : catalog,
  });

  if (!first.ok && first.code === 'CONVERSATION_PERDUE') {
    // Conversation neuve : le programme repart avec, sinon le coach perdrait
    // la capacité de proposer des modifications au milieu d'une discussion.
    return requestCoachAi({ mode: 'chat', digest, question, apiKey, program, catalog });
  }
  return first;
};
