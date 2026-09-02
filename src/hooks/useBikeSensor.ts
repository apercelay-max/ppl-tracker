import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Lecture des données d'un vélo d'appartement en Bluetooth Low Energy.
 *
 * Trois profils standards sont gérés, du plus riche au plus pauvre :
 *  - FTMS (Fitness Machine Service, 0x1826) → vitesse, cadence, distance,
 *    puissance, calories, FC, temps. C'est ce que diffusent la plupart des
 *    vélos connectés récents.
 *  - Cycling Power (0x1818) → puissance, et cadence déduite des tours de
 *    pédalier.
 *  - CSC (0x1816) → cadence seule, typique d'un petit capteur à clipser.
 *
 * Ni Echelon ni Peloton ne publient d'API : on ne passe donc PAS par leur
 * application, on lit directement le vélo. Les vélos qui exposent FTMS
 * fonctionnent tels quels ; ceux qui utilisent un protocole maison
 * demanderaient un décodage spécifique, modèle par modèle.
 */

export type BikeStatus = 'idle' | 'connecting' | 'connected' | 'unsupported';

export interface BikeReading {
  /** Puissance instantanée en watts. */
  power: number | null;
  /** Cadence en tours par minute. */
  cadence: number | null;
  /** Vitesse instantanée en km/h. */
  speed: number | null;
  /** Distance totale annoncée par le vélo, en km. */
  distanceKm: number | null;
  /** Calories annoncées par le vélo (rarement fiables, mais si elles sont là...). */
  calories: number | null;
  /** Fréquence cardiaque, quand c'est le vélo qui la relaie. */
  hr: number | null;
  /** Niveau de résistance, quand le vélo le publie. */
  resistance: number | null;
}

const EMPTY: BikeReading = {
  power: null, cadence: null, speed: null,
  distanceKm: null, calories: null, hr: null, resistance: null,
};

const FTMS = 'fitness_machine';
const INDOOR_BIKE_DATA = 0x2ad2;
const CYCLING_POWER = 'cycling_power';
const CPM = 0x2a63;
const CSC = 'cycling_speed_and_cadence';
const CSC_MEASUREMENT = 0x2a5b;

/**
 * Décodage de la trame « Indoor Bike Data » (FTMS).
 * Les champs sont optionnels et se suivent dans un ordre fixe : on avance dans
 * le buffer bit de drapeau par bit de drapeau. Se tromper d'un octet décale
 * tout ce qui suit, d'où les commentaires de position.
 */
const parseIndoorBikeData = (dv: DataView): Partial<BikeReading> => {
  const flags = dv.getUint16(0, true);
  let i = 2;
  const out: Partial<BikeReading> = {};

  // Bit 0 à 0 = la vitesse instantanée est présente (drapeau « More Data »
  // inversé — c'est bien la spec qui est à l'envers ici, pas une faute).
  if ((flags & 0x0001) === 0) { out.speed = dv.getUint16(i, true) / 100; i += 2; }
  if (flags & 0x0002) { i += 2; }                                   // vitesse moyenne
  if (flags & 0x0004) { out.cadence = dv.getUint16(i, true) / 2; i += 2; }
  if (flags & 0x0008) { i += 2; }                                   // cadence moyenne
  if (flags & 0x0010) {                                             // distance totale, uint24
    out.distanceKm = (dv.getUint8(i) | (dv.getUint8(i + 1) << 8) | (dv.getUint8(i + 2) << 16)) / 1000;
    i += 3;
  }
  if (flags & 0x0020) { out.resistance = dv.getInt16(i, true); i += 2; }
  if (flags & 0x0040) { out.power = dv.getInt16(i, true); i += 2; }
  if (flags & 0x0080) { i += 2; }                                   // puissance moyenne
  if (flags & 0x0100) {                                             // énergie dépensée
    out.calories = dv.getUint16(i, true);
    i += 5;                                                         // total + par heure + par minute
  }
  if (flags & 0x0200) { out.hr = dv.getUint8(i); i += 1; }
  return out;
};

export const useBikeSensor = () => {
  const [reading, setReading] = useState<BikeReading>(EMPTY);
  const [status, setStatus] = useState<BikeStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const deviceRef = useRef<any>(null);
  // Dernier relevé de pédalier, pour déduire la cadence quand le vélo ne
  // publie que des compteurs cumulés (Cycling Power / CSC).
  const crankRef = useRef<{ revs: number; time: number } | null>(null);

  const isSupported = typeof navigator !== 'undefined' && 'bluetooth' in (navigator as any);

  useEffect(() => { if (!isSupported) setStatus('unsupported'); }, [isSupported]);

  /** Cadence déduite de deux relevés successifs du pédalier. */
  const cadenceFromCrank = (revs: number, time1024: number): number | null => {
    const prev = crankRef.current;
    crankRef.current = { revs, time: time1024 };
    if (!prev) return null;
    // Les deux compteurs bouclent à 65536 : on repasse par le modulo plutôt
    // que d'obtenir une cadence absurde une fois par rotation du compteur.
    const dRevs = (revs - prev.revs + 65536) % 65536;
    const dTime = (time1024 - prev.time + 65536) % 65536;
    if (dTime === 0) return null;
    const rpm = (dRevs * 60) / (dTime / 1024);
    return rpm > 0 && rpm < 250 ? Math.round(rpm) : null;
  };

  const connect = useCallback(async () => {
    if (!isSupported) { setStatus('unsupported'); return; }
    const nav = navigator as any;
    try {
      setStatus('connecting');
      setError(null);
      const device = await nav.bluetooth.requestDevice({
        filters: [{ services: [FTMS] }, { services: [CYCLING_POWER] }, { services: [CSC] }],
        optionalServices: [FTMS, CYCLING_POWER, CSC, 'heart_rate'],
      });
      deviceRef.current = device;
      setDeviceName(device.name ?? 'Vélo');
      device.addEventListener('gattserverdisconnected', () => {
        setStatus('idle');
        setReading(EMPTY);
        crankRef.current = null;
      });

      const server = await device.gatt.connect();
      let hooked = false;

      // 1. FTMS — le plus complet
      try {
        const svc = await server.getPrimaryService(FTMS);
        const ch = await svc.getCharacteristic(INDOOR_BIKE_DATA);
        ch.addEventListener('characteristicvaluechanged', (e: Event) => {
          const dv = (e.target as any).value as DataView;
          try {
            const patch = parseIndoorBikeData(dv);
            setReading((r) => ({ ...r, ...patch }));
          } catch { /* trame incomplète : on ignore celle-ci */ }
        });
        await ch.startNotifications();
        hooked = true;
      } catch { /* pas de FTMS sur ce vélo */ }

      // 2. Cycling Power — puissance + cadence
      if (!hooked) {
        try {
          const svc = await server.getPrimaryService(CYCLING_POWER);
          const ch = await svc.getCharacteristic(CPM);
          ch.addEventListener('characteristicvaluechanged', (e: Event) => {
            const dv = (e.target as any).value as DataView;
            try {
              const flags = dv.getUint16(0, true);
              const power = dv.getInt16(2, true);
              let i = 4;
              if (flags & 0x0001) i += 1;          // Pedal Power Balance
              if (flags & 0x0004) i += 2;          // Accumulated Torque
              if (flags & 0x0010) i += 6;          // Wheel Revolution Data
              let cadence: number | null = null;
              if (flags & 0x0020) {                // Crank Revolution Data
                cadence = cadenceFromCrank(dv.getUint16(i, true), dv.getUint16(i + 2, true));
              }
              setReading((r) => ({ ...r, power, cadence: cadence ?? r.cadence }));
            } catch { /* trame incomplète */ }
          });
          await ch.startNotifications();
          hooked = true;
        } catch { /* pas de service puissance */ }
      }

      // 3. CSC — cadence seule
      if (!hooked) {
        try {
          const svc = await server.getPrimaryService(CSC);
          const ch = await svc.getCharacteristic(CSC_MEASUREMENT);
          ch.addEventListener('characteristicvaluechanged', (e: Event) => {
            const dv = (e.target as any).value as DataView;
            try {
              const flags = dv.getUint8(0);
              let i = 1;
              if (flags & 0x01) i += 6;            // Wheel Revolution Data
              if (flags & 0x02) {
                const cadence = cadenceFromCrank(dv.getUint16(i, true), dv.getUint16(i + 2, true));
                setReading((r) => ({ ...r, cadence: cadence ?? r.cadence }));
              }
            } catch { /* trame incomplète */ }
          });
          await ch.startNotifications();
          hooked = true;
        } catch { /* pas de CSC */ }
      }

      if (!hooked) {
        setError("Ce vélo est connecté mais ne diffuse aucun des profils standards (FTMS, puissance, cadence).");
        setStatus('idle');
        try { device.gatt.disconnect(); } catch { /* déjà déconnecté */ }
        return;
      }
      setStatus('connected');
    } catch (err: any) {
      // NotFoundError = Léo a simplement fermé la fenêtre de choix.
      if (err?.name !== 'NotFoundError') setError(err?.message ?? 'Erreur Bluetooth');
      setStatus('idle');
    }
  }, [isSupported]);

  const disconnect = useCallback(() => {
    try { deviceRef.current?.gatt?.disconnect(); } catch { /* déjà déconnecté */ }
    setStatus(isSupported ? 'idle' : 'unsupported');
    setReading(EMPTY);
    crankRef.current = null;
    setDeviceName(null);
  }, [isSupported]);

  // Si on quitte l'écran (retour, navigation) sans passer par "Terminer",
  // la connexion GATT et ses écouteurs ne doivent pas rester ouverts.
  useEffect(() => () => { try { deviceRef.current?.gatt?.disconnect(); } catch { /* déjà déconnecté */ } }, []);

  return { reading, status, error, deviceName, connect, disconnect, isSupported };
};
