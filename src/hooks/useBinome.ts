// ─── Binôme — état partagé et envoi des séances ────────────────────────────
//
// DEUX HOOKS, DEUX RÔLES :
//
//   - `useBinomeSync()` est monté UNE fois, dans App. Il charge l'état du
//     binôme, le rafraîchit quand l'app revient au premier plan, et envoie
//     chaque séance terminée. Comme le coach vocal, il n'est branché sur aucun
//     bouton : il OBSERVE l'historique et réagit quand une entrée apparaît.
//     finishSession n'a donc rien à savoir du binôme.
//
//   - `useBinome()` est appelé par les écrans (accueil, réglages) qui veulent
//     AFFICHER l'état. Il lit un mini-store Zustand non persisté : les deux
//     écrans voient exactement le même état sans contexte React, et un
//     rafraîchissement déclenché depuis les réglages met l'accueil à jour.
//
// POURQUOI UN STORE SÉPARÉ DU STORE PRINCIPAL : l'état du binôme appartient au
// serveur. Le mettre dans workoutStore le ferait persister dans localStorage
// et synchroniser dans app_data — on afficherait au démarrage l'anneau du
// partenaire d'il y a trois jours comme s'il était à jour.

import { useCallback, useEffect, useRef } from 'react';
import { create } from 'zustand';
import { useAuth } from './useAuth';
import { useWorkoutStore } from '../store/workoutStore';
import { getWorkout } from '../data/workouts';
import { fetchBinomeState, isBinomeAvailable, logSession, type BinomeState } from '../lib/binome';

interface BinomeStore {
  state: BinomeState | null;
  loading: boolean;
  error: string | null;
  set: (patch: Partial<Omit<BinomeStore, 'set'>>) => void;
}

const useBinomeStore = create<BinomeStore>((set) => ({
  state: null,
  loading: false,
  error: null,
  set: (patch) => set(patch),
}));

/** Recharge l'état depuis le serveur. Exporté pour les écrans qui viennent de
 *  modifier le binôme (accepter, quitter) et doivent voir le résultat. */
export const refreshBinome = async (): Promise<void> => {
  if (!isBinomeAvailable()) return;
  const { set } = useBinomeStore.getState();
  set({ loading: true });
  const r = await fetchBinomeState();
  if (r.ok) set({ state: r.data, loading: false, error: null });
  else set({ loading: false, error: r.message });
};

export const useBinome = () => {
  const state = useBinomeStore((s) => s.state);
  const loading = useBinomeStore((s) => s.loading);
  const error = useBinomeStore((s) => s.error);
  return { state, loading, error, refresh: refreshBinome, available: isBinomeAvailable() };
};

// ─── Invitation reçue ──────────────────────────────────────────────────────
//
// Le code lu dans l'URL est rangé en sessionStorage, pas en localStorage : une
// invitation n'a pas à survivre à la fermeture de l'onglet. Et on le garde le
// temps qu'il faut pour se connecter ou créer un compte, ce qui peut prendre
// plusieurs écrans.

const PENDING_INVITE_KEY = 'ppl-binome-invite';

export const getPendingInvite = (): string | null => {
  try { return sessionStorage.getItem(PENDING_INVITE_KEY); } catch { return null; }
};
export const setPendingInvite = (code: string): void => {
  try { sessionStorage.setItem(PENDING_INVITE_KEY, code); } catch { /* navigation privée */ }
};
export const clearPendingInvite = (): void => {
  try { sessionStorage.removeItem(PENDING_INVITE_KEY); } catch { /* rien à faire */ }
};

// ─── Séances déjà envoyées ─────────────────────────────────────────────────
//
// Par utilisateur : deux comptes sur le même téléphone ne partagent pas cette
// liste. Le serveur déduplique aussi (unique user_id + session_key) — cette
// liste locale évite surtout de renvoyer 50 appels à chaque ouverture.

const LOGGED_CAP = 200;
const loggedKey = (userId: string) => `ppl-binome-logged:${userId}`;

const readLogged = (userId: string): Set<string> => {
  try { return new Set(JSON.parse(localStorage.getItem(loggedKey(userId)) ?? '[]') as string[]); }
  catch { return new Set(); }
};
const writeLogged = (userId: string, ids: Set<string>): void => {
  try { localStorage.setItem(loggedKey(userId), JSON.stringify([...ids].slice(-LOGGED_CAP))); }
  catch { /* stockage plein : le serveur dédupliquera */ }
};

/** Même fenêtre que binome_log_session côté serveur : au-delà, il refuse. */
const SHARE_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
/** Pas plus d'un rafraîchissement au retour au premier plan toutes les 30 s. */
const FOCUS_THROTTLE_MS = 30_000;

export const useBinomeSync = (): void => {
  const { user } = useAuth();
  const history = useWorkoutStore((s) => s.history);
  const enBinome = useBinomeStore((s) => s.state?.connecte === true && s.state.en_binome === true);

  const sending = useRef(false);
  const lastFocusRefresh = useRef(0);

  // ── Chargement, et remise à zéro à la déconnexion ──
  useEffect(() => {
    if (!user) {
      useBinomeStore.getState().set({ state: null, error: null, loading: false });
      return;
    }
    void refreshBinome();
  }, [user?.id]);

  // ── Retour au premier plan : l'anneau du partenaire a pu bouger ──
  useEffect(() => {
    if (!user) return;
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastFocusRefresh.current < FOCUS_THROTTLE_MS) return;
      lastFocusRefresh.current = now;
      void refreshBinome();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [user?.id]);

  // ── Envoi des séances ──
  const sendPending = useCallback(async (userId: string) => {
    if (sending.current) return;
    sending.current = true;
    try {
      const logged = readLogged(userId);
      const cutoff = Date.now() - SHARE_WINDOW_MS;
      // Du plus ancien au plus récent : si l'envoi s'interrompt, ce qui reste
      // à envoyer est la fin de la liste, pas des trous au milieu.
      const pending = history
        .filter((e) => e.date >= cutoff && !logged.has(e.id))
        .sort((a, b) => a.date - b.date);

      let added = false;
      for (const entry of pending) {
        const r = await logSession({
          id: entry.id,
          date: entry.date,
          durationMs: entry.durationMs,
          tonnage: entry.tonnage,
          dayName: getWorkout(entry.dayId)?.name ?? 'Séance',
        });
        // Erreur réseau : on s'arrête, on réessaiera au prochain déclencheur.
        // On ne marque PAS la séance comme envoyée, sinon elle serait perdue.
        if (!r.ok) break;
        logged.add(entry.id);
        if (r.data) added = true;
      }
      writeLogged(userId, logged);
      if (added) await refreshBinome();
    } finally {
      sending.current = false;
    }
  }, [history]);

  // Déclenché quand une séance s'ajoute à l'historique, et à l'entrée en
  // binôme — ce qui remplit les anneaux dès l'association avec les séances des
  // 7 derniers jours au lieu de les laisser vides jusqu'à la prochaine.
  useEffect(() => {
    if (!user || !enBinome) return;
    void sendPending(user.id);
  }, [user?.id, enBinome, history.length, history[0]?.id, sendPending]);
};
