import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { useWorkoutStore } from '../store/workoutStore';
import { saveBackup } from '../lib/localBackups';
import { fetchRemoteData, pushRemoteData, getLocalSnapshot, applyRemoteSnapshot } from '../lib/sync';
import type { RemoteRow } from '../lib/sync';

export type SyncStatus = 'idle' | 'checking' | 'conflict' | 'syncing' | 'synced' | 'error';

export interface SyncConflict {
  remoteUpdatedAt: string;
}

// Clé locale (jamais synchronisée) qui retient, par utilisateur, si on a
// déjà résolu le choix "cloud vs cet appareil" une première fois. Sans
// ça, l'appli redemanderait à chaque connexion même après un premier
// choix — et si elle était synchronisée, un autre appareil "hériterait"
// à tort d'un choix qui ne le concerne pas.
const RESOLVED_KEY = 'ppl-tracker-sync-resolved-user';
// Clé locale (jamais synchronisée) : date `updated_at` du cloud telle que cet
// appareil l'a vue à sa dernière synchro réussie (lecture appliquée ou envoi).
// Au démarrage, si le cloud a une autre date, une autre séance y a été
// enregistrée depuis : pousser nos données l'écraserait.
const SEEN_KEY = 'ppl-tracker-sync-seen-updated-at';
const PUSH_DEBOUNCE_MS = 2500;
/** Nouvelle lecture du cloud après un échec (réseau coupé au démarrage). */
const READ_RETRY_MS = 30_000;

const readSeen = (userId: string): string | null => {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { userId?: string; at?: string };
    return parsed.userId === userId && typeof parsed.at === 'string' ? parsed.at : null;
  } catch { return null; }
};

const writeSeen = (userId: string, at: string) => {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify({ userId, at })); } catch { /* stockage indisponible */ }
};

/** Le cloud a-t-il changé depuis notre dernière synchro ? On compare les instants
 *  (Supabase et notre horloge n'écrivent pas la date avec le même format) et on
 *  teste « différent » plutôt que « plus récent » : l'horloge d'un autre appareil
 *  peut être en retard. Sans date mémorisée (appareil resté sur l'ancienne
 *  version), on ne sait pas : par prudence on considère que le cloud a changé. */
const cloudChangedSince = (remoteUpdatedAt: string, seen: string | null): boolean => {
  if (!seen) return true;
  const remote = Date.parse(remoteUpdatedAt);
  const last = Date.parse(seen);
  if (Number.isNaN(remote) || Number.isNaN(last)) return true;
  return remote !== last;
};

export function useCloudSync() {
  const { user } = useAuth();
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [conflict, setConflict] = useState<SyncConflict | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  // Vrai seulement après une lecture du cloud réussie (ou un choix explicite
  // de l'utilisateur) pour CETTE session de l'appli — voir l'effet d'envoi
  // plus bas, qui s'en sert pour ne jamais pousser sans avoir d'abord vu
  // l'état réel du cloud.
  const [readOk, setReadOk] = useState(false);
  const handledUserId = useRef<string | null>(null);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readRetryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [readRetry, setReadRetry] = useState(0);

  // Résolution initiale : dès qu'un utilisateur est détecté (connexion ou
  // session déjà active au chargement), on regarde ce qu'il y a dans le
  // cloud pour décider quoi faire.
  useEffect(() => {
    if (!user) {
      handledUserId.current = null;
      setStatus('idle');
      setConflict(null);
      setReadOk(false);
      return;
    }
    if (handledUserId.current === user.id) return;
    handledUserId.current = user.id;

    const alreadyResolved = localStorage.getItem(RESOLVED_KEY) === user.id;
    const userId = user.id;

    (async () => {
      setStatus('checking');
      let remote: RemoteRow | null;
      try {
        remote = await fetchRemoteData(userId);
      } catch {
        // Lecture impossible ≠ cloud vide : on n'envoie RIEN (ça écraserait le
        // cloud avec les données de cet appareil) et on réessaie plus tard.
        // readOk reste à false : sans ça, un appareil déjà résolu lors d'une
        // session précédente (RESOLVED_KEY posé) aurait quand même laissé
        // l'effet d'envoi plus bas pousser au premier changement du store,
        // sans avoir vu l'état actuel du cloud pendant CETTE session.
        handledUserId.current = null;
        setStatus('error');
        setReadOk(false);
        if (readRetryTimer.current) clearTimeout(readRetryTimer.current);
        readRetryTimer.current = setTimeout(() => setReadRetry((n) => n + 1), READ_RETRY_MS);
        return;
      }
      setReadOk(true);

      if (!remote) {
        // Rien dans le cloud pour ce compte → première synchro, on y
        // envoie les données de cet appareil.
        const pushedAt = await pushRemoteData(userId, getLocalSnapshot());
        localStorage.setItem(RESOLVED_KEY, userId);
        if (pushedAt) { writeSeen(userId, pushedAt); setLastSyncedAt(Date.now()); }
        setStatus(pushedAt ? 'synced' : 'error');
        return;
      }

      if (alreadyResolved && !cloudChangedSince(remote.updated_at, readSeen(userId))) {
        // Déjà résolu sur cet appareil ET le cloud n'a pas bougé depuis notre
        // dernière synchro → cet appareil pousse simplement son état actuel.
        const pushedAt = await pushRemoteData(userId, getLocalSnapshot());
        if (pushedAt) { writeSeen(userId, pushedAt); setLastSyncedAt(Date.now()); }
        setStatus(pushedAt ? 'synced' : 'error');
        return;
      }

      // Des données existent déjà dans le cloud et soit ce n'est pas encore
      // résolu ici, soit le cloud a été modifié ailleurs pendant que cet
      // appareil était fermé → on laisse l'utilisateur choisir plutôt que
      // d'écraser silencieusement l'un ou l'autre.
      setConflict({ remoteUpdatedAt: remote.updated_at });
      setStatus('conflict');
    })();
  }, [user, readRetry]);

  // Pas de nouvelle lecture programmée une fois le hook démonté.
  useEffect(() => () => {
    if (readRetryTimer.current) clearTimeout(readRetryTimer.current);
  }, []);

  const resolveUseCloud = useCallback(async () => {
    if (!user) return;
    setStatus('checking');
    let remote: RemoteRow | null;
    try {
      remote = await fetchRemoteData(user.id);
    } catch {
      // Le cloud n'a pas pu être lu : le choix reste ouvert (rien n'est marqué
      // comme résolu, sinon le prochain envoi écraserait le cloud sans l'avoir chargé).
      setStatus('error');
      return;
    }
    if (remote) {
      // Les données de cet appareil vont être remplacées : on en garde une copie.
      await saveBackup('safety', 'Avant remplacement par les données du cloud');
      applyRemoteSnapshot(remote.data);
      writeSeen(user.id, remote.updated_at);
    }
    localStorage.setItem(RESOLVED_KEY, user.id);
    setReadOk(true);
    setConflict(null);
    setStatus('synced');
    setLastSyncedAt(Date.now());
  }, [user]);

  const resolveUseDevice = useCallback(async () => {
    if (!user) return;
    setStatus('syncing');
    const pushedAt = await pushRemoteData(user.id, getLocalSnapshot());
    if (pushedAt) writeSeen(user.id, pushedAt);
    localStorage.setItem(RESOLVED_KEY, user.id);
    // Choix explicite de l'utilisateur ("garder cet appareil") : il vaut
    // comme lecture confirmée, même sans nouvelle lecture du cloud.
    setReadOk(true);
    setConflict(null);
    setStatus(pushedAt ? 'synced' : 'error');
    if (pushedAt) setLastSyncedAt(Date.now());
  }, [user]);

  // Une fois résolu, chaque changement du store déclenche un envoi vers
  // le cloud (avec un léger débounce pour ne pas spammer l'API à chaque
  // frappe pendant une saisie de série).
  useEffect(() => {
    if (!user || conflict || !readOk) return;
    const userId = user.id;
    const unsubscribe = useWorkoutStore.subscribe(() => {
      // Tant que le choix cloud / appareil n'est pas fait (ou que la première
      // lecture a échoué), on n'envoie rien : ce serait écraser le cloud.
      try { if (localStorage.getItem(RESOLVED_KEY) !== userId) return; } catch { return; }
      if (pushTimer.current) clearTimeout(pushTimer.current);
      pushTimer.current = setTimeout(() => {
        setStatus('syncing');
        pushRemoteData(userId, getLocalSnapshot()).then((pushedAt) => {
          if (pushedAt) { writeSeen(userId, pushedAt); setLastSyncedAt(Date.now()); }
          setStatus(pushedAt ? 'synced' : 'error');
        });
      }, PUSH_DEBOUNCE_MS);
    });
    return () => {
      unsubscribe();
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [user, conflict, readOk]);

  return { status, conflict, resolveUseCloud, resolveUseDevice, lastSyncedAt };
}
