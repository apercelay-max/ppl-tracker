import { useEffect, useRef } from 'react';

// ─── Valider une série en secouant le téléphone ────────────────────────────
// À la salle, les mains sont prises (magnésie, sangles, gants) et taper sur
// un écran entre deux séries est pénible. Une secousse franche du téléphone
// (dans la poche ou posé sur le banc) valide la série en cours.
//
// Deux garde-fous, parce qu'un faux positif fausserait une vraie séance :
//  - il faut DEUX pics d'accélération dans une même fenêtre courte (poser le
//    téléphone, racker une barre ou marcher ne produisent qu'un seul pic) ;
//  - un délai de garde après chaque déclenchement.
//
// iOS 13+ exige une autorisation explicite, demandée depuis un vrai geste
// utilisateur (le bouton des Réglages) — d'où `requestMotionPermission()`
// séparé du hook.

/** Accélération (hors gravité) au-delà de laquelle on parle de secousse. */
const PEAK_THRESHOLD = 13;
/** Fenêtre dans laquelle les deux pics doivent tomber. */
const DOUBLE_PEAK_WINDOW_MS = 700;
/** Temps mort après un déclenchement. */
const COOLDOWN_MS = 2500;

type MotionEventCtor = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<'granted' | 'denied' | 'default'>;
};

export const motionSensorSupported = (): boolean =>
  typeof window !== 'undefined' && typeof DeviceMotionEvent !== 'undefined';

/** iOS demande l'autorisation ; ailleurs il n'y a rien à demander. */
export const motionPermissionNeeded = (): boolean =>
  motionSensorSupported() && typeof (DeviceMotionEvent as MotionEventCtor).requestPermission === 'function';

/**
 * Demande l'accès au capteur de mouvement. À appeler DEPUIS un clic — sur
 * iOS, un appel hors geste utilisateur est refusé sans explication.
 */
export const requestMotionPermission = async (): Promise<boolean> => {
  if (!motionSensorSupported()) return false;
  const ctor = DeviceMotionEvent as MotionEventCtor;
  if (typeof ctor.requestPermission !== 'function') return true;
  try {
    const res = await ctor.requestPermission();
    return res === 'granted';
  } catch {
    return false;
  }
};

interface ShakeOptions {
  enabled: boolean;
  onShake: () => void;
}

export const useShakeToValidate = ({ enabled, onShake }: ShakeOptions): void => {
  // On garde le callback dans une ref : ça évite de désabonner/réabonner le
  // capteur à chaque rendu de l'écran de séance (qui re-crée la fonction).
  const onShakeRef = useRef(onShake);
  useEffect(() => { onShakeRef.current = onShake; }, [onShake]);

  useEffect(() => {
    if (!enabled || !motionSensorSupported()) return;

    let firstPeakAt = 0;
    let lastFireAt = 0;
    let inPeak = false;

    const handler = (e: DeviceMotionEvent) => {
      const acc = e.acceleration ?? e.accelerationIncludingGravity;
      if (!acc || acc.x == null || acc.y == null || acc.z == null) return;
      let magnitude = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
      // Sans capteur gyroscopique dédié, `acceleration` est absent et on
      // reçoit la gravité : on la retire grossièrement pour comparer les
      // deux cas au même seuil.
      if (!e.acceleration) magnitude = Math.abs(magnitude - 9.81);

      const now = Date.now();
      if (magnitude < PEAK_THRESHOLD) { inPeak = false; return; }
      if (inPeak) return;          // même pic, on ne le compte qu'une fois
      inPeak = true;

      if (now - lastFireAt < COOLDOWN_MS) return;
      if (firstPeakAt && now - firstPeakAt <= DOUBLE_PEAK_WINDOW_MS) {
        firstPeakAt = 0;
        lastFireAt = now;
        onShakeRef.current();
      } else {
        firstPeakAt = now;
      }
    };

    window.addEventListener('devicemotion', handler);
    return () => window.removeEventListener('devicemotion', handler);
  }, [enabled]);
};
