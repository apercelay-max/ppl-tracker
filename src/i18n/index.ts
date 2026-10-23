import { create } from 'zustand';
import { en } from './en';

// Traduction « français comme clé » : dans le code on écrit le texte français
// tel quel, `t('Réglages')`, et chaque autre langue est un dictionnaire
// français → langue (voir en.ts). Avantages : le français reste la source de
// vérité, un texte pas encore traduit s'affiche simplement en français (rien ne
// casse), et ajouter une langue ne demande de toucher qu'un nouveau fichier.

export type Lang = 'fr' | 'en';
/** `auto` = suivre la langue du téléphone. */
export type LangPref = 'auto' | Lang;

export const LANGUAGES: { id: Lang; label: string }[] = [
  { id: 'fr', label: 'Français' },
  { id: 'en', label: 'English' },
];

const DICTIONARIES: Record<Lang, Record<string, string>> = { fr: {}, en };

// Clé à part du store principal : la langue est un réglage de l'appareil (un
// téléphone en anglais, un autre en français) et ne doit pas être écrasée par
// la synchro cloud ni toucher à la fonction `merge` du store.
const STORAGE_KEY = 'ppl-tracker-lang';

function readPref(): LangPref {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'fr' || v === 'en' || v === 'auto') return v;
  } catch { /* stockage indisponible (navigation privée...) : on reste sur le français */ }
  // Aucun choix enregistré = installation d'avant les langues (ou nouvelle
  // installation qui n'a pas encore répondu au quiz) : français, comme toujours.
  // Un nouvel utilisateur choisit sa langue à la 1re question du quiz ; seul le
  // choix « Auto » des Réglages suit la langue du téléphone.
  return 'fr';
}

export function deviceLang(): Lang {
  const l = (typeof navigator !== 'undefined' ? navigator.language : 'fr') || 'fr';
  // Langue pas encore traduite → anglais, plus largement compris que le français.
  return l.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

function resolve(pref: LangPref): Lang {
  return pref === 'auto' ? deviceLang() : pref;
}

interface LangState {
  pref: LangPref;
  lang: Lang;
  setPref: (pref: LangPref) => void;
}

function applyToDocument(lang: Lang) {
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
}

const initialPref = readPref();
const initialLang = resolve(initialPref);
applyToDocument(initialLang);

export const useLangStore = create<LangState>((set) => ({
  pref: initialPref,
  lang: initialLang,
  setPref: (pref) => {
    try { localStorage.setItem(STORAGE_KEY, pref); } catch { /* idem */ }
    const lang = resolve(pref);
    applyToDocument(lang);
    set({ pref, lang });
  },
}));

/** Langue courante, utilisable hors composant (utilitaires, formatage). */
export const getLang = (): Lang => useLangStore.getState().lang;

/** À appeler dans un composant pour qu'il se redessine quand la langue change. */
export const useLang = (): Lang => useLangStore((s) => s.lang);

/**
 * Traduit un texte français. `vars` remplace les `{nom}` du texte, dans la
 * traduction comme dans le texte d'origine : t('{n} séances', { n: 3 }).
 */
export function t(fr: string, vars?: Record<string, string | number>): string {
  const out = DICTIONARIES[getLang()][fr] ?? fr;
  return vars ? out.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : out;
}

/**
 * Code de langue pour toLocaleDateString / toLocaleString (dates, séparateurs
 * de milliers). En anglais, on garde la région du téléphone (en-US, en-GB...)
 * pour respecter l'ordre jour/mois habituel, avec en-GB par défaut.
 */
export function dateLocale(): string {
  if (getLang() === 'fr') return 'fr-FR';
  const l = typeof navigator !== 'undefined' ? navigator.language : '';
  return /^en(-|$)/i.test(l) ? l : 'en-GB';
}
