import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

// Enregistre un fichier que l'utilisateur a demandé (sauvegarde JSON, CSV, image).
// Navigateur : téléchargement classique. Appli iPhone : un lien « télécharger » ne fait rien
// dans la vue web de l'appli, on écrit donc le fichier puis on ouvre la feuille de partage d'iOS
// (Enregistrer dans Fichiers, AirDrop, Messages…).
const toBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.readAsDataURL(blob);
  });

export type SaveResult = 'saved' | 'cancelled' | 'failed';

export const saveFile = async (filename: string, blob: Blob): Promise<SaveResult> => {
  if (Capacitor.isNativePlatform()) {
    try {
      const written = await Filesystem.writeFile({ path: filename, data: await toBase64(blob), directory: Directory.Cache });
      await Share.share({ title: filename, url: written.uri, dialogTitle: 'Enregistrer ou envoyer' });
      return 'saved';
    } catch (err) {
      // Fermer la feuille de partage sans rien choisir n'est pas une erreur.
      return err instanceof Error && /cancel/i.test(err.message) ? 'cancelled' : 'failed';
    }
  }
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Libérer l'URL tout de suite peut annuler le téléchargement (Safari) : on attend un peu.
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return 'saved';
  } catch {
    return 'failed';
  }
};
