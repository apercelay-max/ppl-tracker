import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface AuthState {
  user: User | null;
  loading: boolean;
}

// Petit hook local (pas dans le store Zustand principal) : la session
// Supabase a déjà son propre mécanisme de persistance (localStorage géré
// par la librairie elle-même), pas besoin de la dupliquer dans
// ppl-tracker-store. `loading` reste vrai tant qu'on n'a pas fini de
// vérifier s'il existe déjà une session active au chargement de la page.
export const useAuth = (): AuthState => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
};
