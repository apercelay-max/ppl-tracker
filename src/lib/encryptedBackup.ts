// Sauvegarde chiffrée : le contenu de l'appli est chiffré sur le téléphone avec un mot de passe que
// SEULE la personne connaît (AES-256-GCM, clé dérivée par PBKDF2 avec 250 000 tours et un sel
// aléatoire). Le fichier est illisible sans le mot de passe, et nous ne pouvons pas le récupérer :
// le dire clairement à l'utilisateur, c'est la contrepartie du chiffrement.
const FORMAT = 'ppl-tracker-chiffre';
const ITERATIONS = 250_000;

const toB64 = (bytes: Uint8Array): string => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
const fromB64 = (b64: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

const deriveKey = async (password: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> => {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
  );
};

export const MIN_PASSWORD = 8;

/** Chiffre le texte de la sauvegarde ; renvoie le contenu du fichier à enregistrer. */
export const encryptBackup = async (plain: string, password: string): Promise<string> => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plain)));
  return JSON.stringify({ format: FORMAT, version: 1, iterations: ITERATIONS, salt: toB64(salt), iv: toB64(iv), data: toB64(data) });
};

export const isEncryptedBackup = (text: string): boolean => {
  try { return (JSON.parse(text) as { format?: string }).format === FORMAT; } catch { return false; }
};

/** Déchiffre ; renvoie null si le mot de passe est faux ou le fichier abîmé (AES-GCM détecte les deux). */
export const decryptBackup = async (fileText: string, password: string): Promise<string | null> => {
  try {
    const f = JSON.parse(fileText) as { format: string; salt: string; iv: string; data: string; iterations?: number };
    if (f.format !== FORMAT) return null;
    const key = await deriveKey(password, fromB64(f.salt));
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(f.iv) }, key, fromB64(f.data));
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
};
