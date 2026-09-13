// ─── Coach vocal — le moteur de parole ─────────────────────────────────────
//
// POURQUOI CETTE FONCTIONNALITÉ EXISTE : à la salle, les mains sont prises et
// l'écran est le pire endroit où regarder entre deux séries. L'appli sait déjà
// valider une série en secouant le téléphone (hooks/useShakeToValidate.ts) ;
// il manquait le retour dans l'autre sens. Avec les deux, on peut faire une
// séance entière sans jamais sortir le téléphone de sa poche.
//
// CE MODULE NE DÉCIDE RIEN. Il ne sait pas ce qu'est une série ni un superset :
// il reçoit une phrase déjà écrite et la dit. Ce qu'il faut dire et quand est
// dans hooks/useVoiceCoach.ts ; comment le formuler est plus bas dans ce
// fichier (section « Phrases »). Cette séparation existe pour qu'on puisse
// relire les tournures sans toucher au moteur.
//
// AUCUN COÛT, AUCUN RÉSEAU : `speechSynthesis` est dans le navigateur. Pas de
// clé d'API, pas d'appel serveur, et ça marche dans une salle en sous-sol.
//
// Documentation de référence :
//  - https://developer.mozilla.org/docs/Web/API/SpeechSynthesis
//  - https://developer.mozilla.org/docs/Web/API/SpeechSynthesisUtterance

const synth = (): SpeechSynthesis | null =>
  typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;

export const isVoiceSupported = (): boolean => synth() !== null;

// ─── Déverrouillage iOS ────────────────────────────────────────────────────
//
// Safari refuse de parler tant que l'utilisateur n'a pas interagi avec la page.
// Un premier `speak()` déclenché par du code (démarrage de séance côté store,
// fin de minuteur...) est silencieusement ignoré, ET met la file d'attente dans
// un état où les suivants le sont aussi. D'où ce déverrouillage : au tout
// premier contact de l'utilisateur avec l'écran, on prononce une chaîne vide à
// volume nul. Ça ne s'entend pas, et ça débloque tout le reste de la session.

let primed = false;

export const primeVoice = (): void => {
  const s = synth();
  if (!s || primed) return;
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    s.speak(u);
    primed = true;
  } catch {
    /* navigateur sans synthèse vocale : on continue sans voix */
  }
};

/** Branche le déverrouillage sur le premier contact, puis se retire. */
export const installVoicePrimer = (): void => {
  if (!isVoiceSupported() || primed) return;
  const once = () => {
    primeVoice();
    window.removeEventListener('pointerdown', once);
    window.removeEventListener('keydown', once);
  };
  window.addEventListener('pointerdown', once, { once: true });
  window.addEventListener('keydown', once, { once: true });
};

// ─── Choix de la voix ──────────────────────────────────────────────────────
//
// getVoices() est vide au premier appel sur Chrome : la liste arrive de façon
// asynchrone via `voiceschanged`. On ne la met donc pas en cache définitivement
// et on retente tant qu'on n'a rien trouvé.

let cachedVoice: SpeechSynthesisVoice | null = null;

const pickVoice = (): SpeechSynthesisVoice | null => {
  const s = synth();
  if (!s) return null;
  if (cachedVoice) return cachedVoice;

  const voices = s.getVoices();
  if (voices.length === 0) return null;

  // Une voix française d'abord ; à défaut, la voix par défaut du système.
  // On ne force aucun nom de voix précis : elles diffèrent d'un appareil à
  // l'autre et coder « Amélie » en dur donnerait du muet sur Android.
  cachedVoice =
    voices.find((v) => v.lang === 'fr-FR' && v.localService) ??
    voices.find((v) => v.lang === 'fr-FR') ??
    voices.find((v) => v.lang.startsWith('fr')) ??
    null;

  return cachedVoice;
};

if (isVoiceSupported()) {
  try {
    synth()!.addEventListener('voiceschanged', () => { cachedVoice = null; });
  } catch {
    /* certains navigateurs n'exposent pas l'évènement : pickVoice retentera */
  }
}

// ─── Parler ────────────────────────────────────────────────────────────────

export interface SpeakOptions {
  /**
   * `urgent` coupe ce qui est en cours. À réserver aux annonces qui perdent
   * tout leur sens si elles arrivent en retard : la fin du repos, le décompte.
   * Une phrase de contexte (« Développé couché, 4 séries ») ne doit jamais
   * couper une annonce de série déjà commencée.
   */
  urgent?: boolean;
  /** Vitesse de parole. 1 = normal. À la salle, 1,05-1,15 passe mieux. */
  rate?: number;
}

export const speak = (text: string, opts: SpeakOptions = {}): void => {
  const s = synth();
  if (!s || !text) return;

  try {
    if (opts.urgent) s.cancel();

    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'fr-FR';
    u.rate = Math.min(2, Math.max(0.5, opts.rate ?? 1.05));
    u.pitch = 1;
    const v = pickVoice();
    if (v) u.voice = v;
    s.speak(u);
  } catch {
    /* une phrase perdue ne doit jamais interrompre la séance */
  }
};

/** Coupe tout. Appelé quand on quitte la séance ou qu'on éteint le coach. */
export const stopVoice = (): void => {
  const s = synth();
  if (!s) return;
  try { s.cancel(); } catch { /* rien à faire */ }
};

// ─── Phrases ───────────────────────────────────────────────────────────────
//
// Tout ce qui suit est de la mise en mots. Deux règles tenues partout :
//
//   1. On dit un CHIFFRE UTILE ou on se tait. « Série 2 sur 4 » aide ;
//      « vous avez sélectionné l'exercice suivant » est du bruit qu'on finit
//      par couper au bout de trois séances.
//   2. On parle comme quelqu'un qui est là, pas comme un standard
//      téléphonique. « C'est parti », pas « Démarrage de la session ».

/** « 82.5 » → « 82,5 kilos » · « PDC » → « poids du corps ». La synthèse lit
 *  mal un point décimal en français : on le remplace par une virgule. */
export const sayWeight = (raw: string | undefined, unitLabel: string): string => {
  const w = (raw ?? '').trim();
  if (!w) return '';
  if (/^(pdc|bw|poids du corps)$/i.test(w)) return 'poids du corps';

  const n = w.replace(',', '.');
  if (!Number.isFinite(Number(n))) return w;

  const spoken = n.replace('.', ' virgule ').replace(/\s+/g, ' ').trim();
  return `${spoken} ${unitLabel}`;
};

/** « 6-10 » → « 6 à 10 » · « AMRAP » → « au maximum » · « 45 s » → « 45 secondes ». */
export const sayReps = (target: string | undefined): string => {
  const t = (target ?? '').trim();
  if (!t) return '';
  if (/^amrap$/i.test(t)) return 'au maximum';
  if (/^max\s*sec/i.test(t)) return 'le plus longtemps possible';

  const secondes = t.match(/^(\d+)\s*s$/i);
  if (secondes) return `${secondes[1]} secondes`;

  const parJambe = t.match(/^(\d+)\s*\/\s*jambe$/i);
  if (parJambe) return `${parJambe[1]} par jambe`;

  const fourchette = t.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (fourchette) return `${fourchette[1]} à ${fourchette[2]}`;

  return t;
};

/** « 125 » → « 2 minutes 5 » · « 120 » → « 2 minutes » · « 45 » → « 45 secondes ». */
export const sayDuration = (seconds: number): string => {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s} seconde${s > 1 ? 's' : ''}`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  const mins = `${m} minute${m > 1 ? 's' : ''}`;
  return r === 0 ? mins : `${mins} ${r}`;
};

/**
 * Nom d'exercice prêt à être prononcé.
 *
 * Les noms du catalogue portent des précisions écrites qui se lisent très mal :
 * « Développé couché (barre) » devient « développé couché parenthèse barre ».
 * On retire les parenthèses en gardant leur contenu, et on coupe les suffixes
 * de côté qui n'apportent rien à l'oral.
 */
export const sayExerciseName = (name: string): string =>
  name
    .replace(/\((.*?)\)/g, ' $1 ')
    .replace(/\s*[-–]\s*(gauche|droite|unilatéral)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
