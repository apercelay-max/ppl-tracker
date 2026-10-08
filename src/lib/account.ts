import { supabase } from './supabaseClient';

// Suppression du compte depuis l'appli (exigée par Apple, règle 5.1.1(v)).
// La fonction SQL delete_my_account() — supabase/migrations/20261008120000_… —
// efface les données du cloud puis le compte. Les données du téléphone restent
// sur le téléphone : l'écran de confirmation le dit.
export type DeleteResult = { ok: true } | { ok: false; message: string };

export const deleteMyAccount = async (): Promise<DeleteResult> => {
  if (!supabase) return { ok: false, message: 'Les comptes ne sont pas disponibles pour le moment.' };
  try {
    const { error } = await supabase.rpc('delete_my_account');
    if (error) {
      if (/could not find the function|schema cache|does not exist/i.test(error.message)) {
        return { ok: false, message: 'La suppression n’est pas encore disponible sur ce serveur. Écris-nous via la page Support et on supprime ton compte à la main.' };
      }
      return { ok: false, message: 'La suppression a échoué. Vérifie ta connexion et réessaie.' };
    }
    // Le compte n'existe plus : on referme aussi la session locale.
    await supabase.auth.signOut();
    return { ok: true };
  } catch {
    return { ok: false, message: 'La suppression a échoué. Vérifie ta connexion et réessaie.' };
  }
};
