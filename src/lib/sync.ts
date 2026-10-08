import { supabase } from './supabaseClient';
import { useWorkoutStore } from '../store/workoutStore';

export interface RemoteRow {
  data: Record<string, unknown>;
  updated_at: string;
}

// Zustand/persist connaît déjà la liste exacte des champs à sauvegarder
// (voir `partialize` dans workoutStore.ts) — on la réutilise telle quelle
// via l'API publique `persist.getOptions()` plutôt que de la dupliquer ici
// (sinon un champ ajouté plus tard à `partialize` serait oublié côté sync).
export const getLocalSnapshot = (): Record<string, unknown> => {
  const persistApi = (useWorkoutStore as unknown as {
    persist: { getOptions: () => { partialize?: (state: unknown) => unknown } };
  }).persist;
  const state = useWorkoutStore.getState();
  const options = persistApi.getOptions();
  const snapshot = options.partialize ? options.partialize(state) : state;
  return snapshot as Record<string, unknown>;
};

// Applique un instantané reçu du cloud sur le store local. `setState` en
// mode non destructif fusionne les clés fournies avec l'état existant —
// les fonctions (actions) et les clés absentes du snapshot restent
// intactes, seules les données synchronisées sont remplacées.
//
// Le snapshot passe d'abord par le `merge` du store, comme un chargement depuis
// le stockage local : un cloud écrit par une version plus ancienne n'a pas les
// clés ajoutées depuis (salles, barre de menus…) et un setState brut les
// laissait undefined (crash à l'affichage), sans compter que le registre des
// séances importées (getWorkout) n'était pas rafraîchi.
export const applyRemoteSnapshot = (data: Record<string, unknown>) => {
  if (!data || typeof data !== 'object') return;
  const persistApi = (useWorkoutStore as unknown as {
    persist: { getOptions: () => { merge?: (persisted: unknown, current: unknown) => unknown } };
  }).persist;
  const { merge } = persistApi.getOptions();
  const next = merge ? (merge(data, useWorkoutStore.getState()) as Record<string, unknown>) : data;
  useWorkoutStore.setState(next);
};

/** Lit la ligne du cloud. `null` = aucune donnée pour ce compte (cas normal d'une
 *  première synchro). Une lecture qui ÉCHOUE (réseau, session expirée) LÈVE : la
 *  traiter comme « rien dans le cloud » ferait pousser les données de cet
 *  appareil par-dessus celles du cloud. */
export const fetchRemoteData = async (userId: string): Promise<RemoteRow | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('app_data')
    .select('data, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.error('fetchRemoteData', error);
    throw new Error('remote-read-failed');
  }
  return (data as RemoteRow | null) ?? null;
};

export const pushRemoteData = async (userId: string, data: Record<string, unknown>): Promise<boolean> => {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('app_data')
      .upsert({ user_id: userId, data, updated_at: new Date().toISOString() });
    if (error) {
      console.error('pushRemoteData', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('pushRemoteData', err);
    return false;
  }
};
