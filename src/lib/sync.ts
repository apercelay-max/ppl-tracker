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
export const applyRemoteSnapshot = (data: Record<string, unknown>) => {
  useWorkoutStore.setState(data);
};

export const fetchRemoteData = async (userId: string): Promise<RemoteRow | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('app_data')
    .select('data, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.error('fetchRemoteData', error);
    return null;
  }
  return (data as RemoteRow | null) ?? null;
};

export const pushRemoteData = async (userId: string, data: Record<string, unknown>): Promise<boolean> => {
  if (!supabase) return false;
  const { error } = await supabase
    .from('app_data')
    .upsert({ user_id: userId, data, updated_at: new Date().toISOString() });
  if (error) {
    console.error('pushRemoteData', error);
    return false;
  }
  return true;
};
