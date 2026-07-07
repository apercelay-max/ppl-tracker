import { createClient } from '@supabase/supabase-js';

// Les identifiants Supabase (URL + clé publique "anon") ne sont jamais
// écrits en dur ici : ils viennent des variables d'environnement Vercel
// (Project Settings → Environment Variables), configurées directement par
// Léo/l'adulte responsable du compte Supabase — jamais transmises via le
// chat. Tant qu'elles ne sont pas définies, l'appli fonctionne normalement
// mais sans la partie "Compte" (voir isSupabaseConfigured, utilisé dans
// SettingsScreen.tsx pour afficher un message honnête à la place).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;
