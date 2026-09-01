import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Suivi GPS d'une sortie à pied (marche ou course).
 *
 * Contrairement au Bluetooth, la géolocalisation EXISTE sur Safari iPhone :
 * c'est donc le seul capteur de l'app qui fonctionne sur le téléphone de Léo.
 * On mesure ici une vraie distance et une vraie allure, au lieu de l'estimation
 * durée × kcal/h utilisée jusqu'à présent.
 */

export type GpsStatus = 'idle' | 'requesting' | 'tracking' | 'denied' | 'unsupported';

export interface GpsReading {
  /** Distance parcourue depuis le départ, en km. */
  distanceKm: number;
  /** Vitesse instantanée en km/h, lissée sur les derniers points. */
  speedKmh: number | null;
  /** Allure en secondes par km — la façon dont on lit une course. */
  paceSecPerKm: number | null;
  /** Précision du dernier point, en mètres. Au-delà de 25 m on n'accumule pas. */
  accuracyM: number | null;
  points: number;
}

const EMPTY: GpsReading = { distanceKm: 0, speedKmh: null, paceSecPerKm: null, accuracyM: null, points: 0 };

/** Distance entre deux positions, en mètres (formule de haversine). */
const distanceM = (aLat: number, aLon: number, bLat: number, bLon: number): number => {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

interface Fix { lat: number; lon: number; t: number }

export const useGpsTrack = () => {
  const [reading, setReading] = useState<GpsReading>(EMPTY);
  const [status, setStatus] = useState<GpsStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const watchRef = useRef<number | null>(null);
  const lastRef = useRef<Fix | null>(null);
  const totalRef = useRef(0);
  // Les dernières vitesses, pour lisser : un point GPS isolé peut faire
  // afficher 40 km/h à pied, ce qui n'aide personne.
  const speedsRef = useRef<number[]>([]);
  const pausedRef = useRef(false);

  const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;
  useEffect(() => { if (!isSupported) setStatus('unsupported'); }, [isSupported]);

  const handleFix = useCallback((pos: GeolocationPosition) => {
    const { latitude, longitude, accuracy } = pos.coords;
    const t = pos.timestamp;
    setReading((r) => ({ ...r, accuracyM: Math.round(accuracy) }));

    // Un point imprécis (intérieur, tunnel, démarrage du GPS) ajouterait des
    // dizaines de mètres de distance imaginaire : on le garde comme référence
    // mais on ne compte pas la distance.
    const usable = accuracy <= 25 && !pausedRef.current;
    const prev = lastRef.current;
    lastRef.current = { lat: latitude, lon: longitude, t };
    if (!prev || !usable) return;

    const d = distanceM(prev.lat, prev.lon, latitude, longitude);
    const dt = (t - prev.t) / 1000;
    if (dt <= 0) return;
    const speed = (d / dt) * 3.6; // km/h
    // Au-delà de 30 km/h à pied, c'est un saut GPS, pas un sprint.
    if (speed > 30) return;
    // En dessous de 2 m entre deux points, c'est du bruit sur place.
    if (d < 2) return;

    totalRef.current += d;
    speedsRef.current = [...speedsRef.current.slice(-4), speed];
    const avg = speedsRef.current.reduce((a, b) => a + b, 0) / speedsRef.current.length;

    setReading((r) => ({
      ...r,
      distanceKm: Math.round((totalRef.current / 1000) * 100) / 100,
      speedKmh: Math.round(avg * 10) / 10,
      paceSecPerKm: avg > 0.5 ? Math.round(3600 / avg) : null,
      points: r.points + 1,
    }));
  }, []);

  const start = useCallback(() => {
    if (!isSupported) { setStatus('unsupported'); return; }
    setStatus('requesting');
    setError(null);
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => { setStatus('tracking'); handleFix(pos); },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus('denied');
          setError("Autorisation de position refusée. Le chrono fonctionne quand même.");
        } else {
          setError(err.message || 'Position indisponible');
        }
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    );
  }, [isSupported, handleFix]);

  const stop = useCallback(() => {
    if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
    setStatus(isSupported ? 'idle' : 'unsupported');
  }, [isSupported]);

  /** Pendant une pause, on garde le GPS actif mais on n'accumule plus la distance. */
  const setPaused = useCallback((paused: boolean) => {
    pausedRef.current = paused;
    // Au redémarrage, on repart du point courant : sinon la ligne droite entre
    // le point de pause et celui de reprise serait comptée comme parcourue.
    if (!paused) lastRef.current = null;
  }, []);

  const reset = useCallback(() => {
    totalRef.current = 0;
    speedsRef.current = [];
    lastRef.current = null;
    pausedRef.current = false;
    setReading(EMPTY);
  }, []);

  useEffect(() => () => { if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current); }, []);

  return { reading, status, error, isSupported, start, stop, setPaused, reset };
};
