// ─── Copies de secours locales ──────────────────────────────────────────────
// Deux sortes de copies de l'état complet de l'app (le même JSON que
// « Exporter »), rangées dans IndexedDB — et non dans localStorage, dont le
// quota (~5 Mo) est déjà bien entamé par l'historique lui-même :
//   - 'safety' : prise juste AVANT une action qui écrase ou remanie les
//                données (restauration d'un fichier, remplacement par le
//                cloud, import d'historique) → permet de revenir en arrière ;
//   - 'auto'   : prise en douce au plus une fois par semaine.
// Elles protègent d'une fausse manœuvre, d'une synchro ou d'un import qui
// tourne mal — pas de la perte du téléphone (pour ça : Exporter, ou le cloud).

export type BackupKind = 'safety' | 'auto';

export interface BackupMeta {
  id: string;
  kind: BackupKind;
  reason: string;
  savedAt: number;
  sessions: number;
  bytes: number;
}

const STORE_KEY = 'ppl-tracker-store';
const LAST_AUTO_KEY = 'ppl-last-auto-backup-at';
const LAST_EXPORT_KEY = 'ppl-last-export-at';
const DB_NAME = 'ppl-tracker-backups';
const KEEP: Record<BackupKind, number> = { safety: 3, auto: 3 };
export const AUTO_BACKUP_EVERY_MS = 7 * 24 * 3600 * 1000;

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('indexedDB indisponible')); return; }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore('meta', { keyPath: 'id' });
      req.result.createObjectStore('raw', { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const done = (tx: IDBTransaction): Promise<void> =>
  new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });

const request = <T,>(r: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });

const countSessions = (raw: string): number => {
  try {
    const state = JSON.parse(raw)?.state;
    return Array.isArray(state?.history) ? state.history.length : 0;
  } catch { return 0; }
};

/** Range l'état actuel. Ne lève jamais : une copie ratée ne doit pas bloquer l'action qu'elle protège. */
export const saveBackup = async (kind: BackupKind, reason: string): Promise<BackupMeta | null> => {
  // Lu AVANT tout `await` : l'appelant modifie l'état juste après avoir lancé
  // cette fonction, et la copie doit refléter ce qui précède.
  let raw: string | null = null;
  try { raw = localStorage.getItem(STORE_KEY); } catch { return null; }
  if (!raw) return null;
  try {
    const now = Date.now();
    const meta: BackupMeta = { id: `${kind}-${now}`, kind, reason, savedAt: now, sessions: countSessions(raw), bytes: raw.length };
    const db = await openDb();
    const tx = db.transaction(['meta', 'raw'], 'readwrite');
    tx.objectStore('meta').put(meta);
    tx.objectStore('raw').put({ id: meta.id, raw });
    await done(tx);

    // On ne garde que les plus récentes de ce type.
    const all = (await request(db.transaction('meta').objectStore('meta').getAll())) as BackupMeta[];
    const old = all.filter((m) => m.kind === kind).sort((a, b) => b.savedAt - a.savedAt).slice(KEEP[kind]);
    if (old.length) {
      const tx2 = db.transaction(['meta', 'raw'], 'readwrite');
      for (const m of old) { tx2.objectStore('meta').delete(m.id); tx2.objectStore('raw').delete(m.id); }
      await done(tx2);
    }
    db.close();
    return meta;
  } catch (err) {
    console.warn('saveBackup', err);
    return null;
  }
};

export const listBackups = async (): Promise<BackupMeta[]> => {
  try {
    const db = await openDb();
    const all = (await request(db.transaction('meta').objectStore('meta').getAll())) as BackupMeta[];
    db.close();
    return all.sort((a, b) => b.savedAt - a.savedAt);
  } catch { return []; }
};

/**
 * Remet l'état d'une copie et recharge l'app. L'état d'AVANT la restauration
 * est lui-même copié d'abord : on peut donc toujours annuler une annulation.
 */
export const restoreBackup = async (id: string): Promise<boolean> => {
  try {
    const db = await openDb();
    const row = (await request(db.transaction('raw').objectStore('raw').get(id))) as { raw: string } | undefined;
    db.close();
    if (!row) return false;
    await saveBackup('safety', 'Avant retour à une copie de secours');
    localStorage.setItem(STORE_KEY, row.raw);
    window.location.reload();
    return true;
  } catch { return false; }
};

/** Copie automatique hebdomadaire, seulement s'il y a quelque chose à protéger. */
export const maybeAutoBackup = async (): Promise<void> => {
  try {
    const last = Number(localStorage.getItem(LAST_AUTO_KEY) ?? 0);
    if (Date.now() - last < AUTO_BACKUP_EVERY_MS) return;
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw || countSessions(raw) === 0) return;
    const meta = await saveBackup('auto', 'Copie automatique hebdomadaire');
    if (meta) localStorage.setItem(LAST_AUTO_KEY, String(meta.savedAt));
  } catch { /* stockage indisponible : tant pis, ce n'est qu'un filet */ }
};

export const markExported = (): void => {
  try { localStorage.setItem(LAST_EXPORT_KEY, String(Date.now())); } catch { /* idem */ }
};

export const getLastExportAt = (): number | null => {
  try {
    const v = Number(localStorage.getItem(LAST_EXPORT_KEY));
    return v > 0 ? v : null;
  } catch { return null; }
};
