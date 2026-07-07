import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { useWorkoutStore } from '../store/workoutStore';
import { fetchRemoteData, pushRemoteData, getLocalSnapshot, applyRemoteSnapshot } from '../lib/sync';

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
const PUSH_DEBOUNCE_MS = 2500;

export function useCloudSync() {
  const { user } = useAuth();
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [conflict, setConflict] = useState<SyncConflict | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const handledUserId = useRef<string | null>(null);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Résolution initiale : dès qu'un utilisateur est détecté (connexion ou
  // session déjà active au chargement), on regarde ce qu'il y a dans le
  // cloud pour décider quoi faire.
  useEffect(() => {
    if (!user) {
      handledUserId.current = null;
      setStatus('idle');
      setConflict(null);
      return;
    }
    if (handledUserId.current === user.id) return;
    handledUserId.current = user.id;

    const alreadyResolved = localStorage.getItem(RESOLVED_KEY) === user.id;
    const userId = user.id;

    (async () => {
      setStatus('checking');
      const remote = await fetchRemoteData(userId);

      if (!remote) {
        // Rien dans le cloud pour ce compte → première synchro, on y
        // envoie les données de cet appareil.
        const ok = await pushRemoteData(userId, getLocalSnapshot());
        localStorage.setItem(RESOLVED_KEY, userId);
        setStatus(ok ? 'synced' : 'error');
        if (ok) setLastSyncedAt(Date.now());
        return;
      }

      if (alreadyResolved) {
        // Déjà résolu sur cet appareil pour ce compte lors d'une session
        // précédente → cet appareil pousse simplement son état actuel.
        const ok = await pushRemoteData(userId, getLocalSnapshot());
        setStatus(ok ? 'synced' : 'error');
        if (ok) setLastSyncedAt(Date.now());
        return;
      }

      // Des données existent déjà dans le cloud et ce n'est pas encore
      // résolu ici → on laisse l'utilisateur choisir plutôt que d'écraser
      // silencieusement l'un ou l'autre.
      setConflict({ remoteUpdatedAt: remote.updated_at });
      setStatus('conflict');
    })();
  }, [user]);

  const resolveUseCloud = useCallback(async () => {
    if (!user) return;
    setStatus('checking');
    const remote = await fetchRemoteData(user.id);
    if (remote) applyRemoteSnapshot(remote.data);
    localStorage.setItem(RESOLVED_KEY, user.id);
    setConflict(null);
    setStatus('synced');
    setLastSyncedAt(Date.now());
  }, [user]);

  const resolveUseDevice = useCallback(async () => {
    if (!user) return;
    setStatus('syncing');
    const ok = await pushRemoteData(user.id, getLocalSnapshot());
    localStorage.setItem(RESOLVED_KEY, user.id);
    setConflict(null);
    setStatus(ok ? 'synced' : 'error');
    if (ok) setLastSyncedAt(Date.now());
  }, [user]);

  // Une fois résolu, chaque changement du store déclenche un envoi vers
  // le cloud (avec un léger débounce pour ne pas spammer l'API à chaque
  // frappe pendant une saisie de série).
  useEffect(() => {
    if (!user || conflict) return;
    const userId = user.id;
    const unsubscribe = useWorkoutStore.subscribe(() => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
      pushTimer.current = setTimeout(() => {
        setStatus('syncing');
        pushRemoteData(userId, getLocalSnapshot()).then((ok) => {
          setStatus(ok ? 'synced' : 'error');
          if (ok) setLastSyncedAt(Date.now());
        });
      }, PUSH_DEBOUNCE_MS);
    });
    return () => {
      unsubscribe();
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [user, conflict]);

  return { status, conflict, resolveUseCloud, resolveUseDevice, lastSyncedAt };
}
