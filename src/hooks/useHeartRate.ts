import { useState, useCallback, useEffect } from 'react';

export type HRStatus = 'idle' | 'connecting' | 'connected';

// État partagé par TOUTES les instances du hook. La séance en monte deux, une par
// onglet (StatsPanel sur « Exercice », SessionStatsBig sur « Stats ») : avec un état
// propre à chaque instance, changer d'onglet « oubliait » la ceinture connectée (et
// la coupait, depuis le nettoyage au démontage).
interface HRState { hr: number | null; status: HRStatus; error: string | null }
let shared: HRState = { hr: null, status: 'idle', error: null };
let sharedDevice: any = null;
let subscribers = 0;
let idleDisconnectTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<(s: HRState) => void>();

const patch = (p: Partial<HRState>) => {
  shared = { ...shared, ...p };
  listeners.forEach((l) => l(shared));
};

const disconnectShared = () => {
  try { sharedDevice?.gatt?.disconnect(); } catch {}
  patch({ status: 'idle', hr: null });
};

const connectShared = async () => {
  if (shared.status !== 'idle') return;
  try {
    patch({ status: 'connecting', error: null });
    const nav = navigator as any;
    const device = await nav.bluetooth.requestDevice({
      filters: [{ services: ['heart_rate'] }],
    });
    sharedDevice = device;
    device.addEventListener('gattserverdisconnected', () => {
      if (sharedDevice === device) patch({ status: 'idle', hr: null });
    });
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService('heart_rate');
    const char = await service.getCharacteristic('heart_rate_measurement');
    char.addEventListener('characteristicvaluechanged', (e: Event) => {
      const dv = (e.target as any).value as DataView;
      const flags = dv.getUint8(0);
      // Bit 0: 0 = HR uint8, 1 = HR uint16
      const heartRate = (flags & 0x1) === 0 ? dv.getUint8(1) : dv.getUint16(1, true);
      patch({ hr: heartRate });
    });
    await char.startNotifications();
    patch({ status: 'connected' });
  } catch (err: any) {
    patch({ status: 'idle', error: err?.name !== 'NotFoundError' ? (err?.message ?? 'Erreur BLE') : shared.error });
  }
};

export const useHeartRate = () => {
  const [snap, setSnap] = useState<HRState>(shared);

  // Web Bluetooth requires Chrome/Edge on desktop or Android — NOT iOS
  const isSupported = typeof navigator !== 'undefined' && 'bluetooth' in (navigator as any);

  const connect = useCallback(async () => {
    if (!isSupported) return;
    await connectShared();
  }, [isSupported]);

  const disconnect = useCallback(() => { disconnectShared(); }, []);

  useEffect(() => {
    if (idleDisconnectTimer) { clearTimeout(idleDisconnectTimer); idleDisconnectTimer = null; }
    subscribers++;
    listeners.add(setSnap);
    setSnap(shared);
    return () => {
      listeners.delete(setSnap);
      subscribers--;
      // Quitter l'écran sans passer par « Terminer » laissait la ceinture connectée
      // (batterie, et impossible de la reconnecter ensuite). Le délai laisse passer un
      // simple changement d'onglet : l'ancien écran se démonte juste avant que le
      // nouveau ne se monte.
      if (subscribers === 0) {
        idleDisconnectTimer = setTimeout(() => {
          idleDisconnectTimer = null;
          if (subscribers === 0) disconnectShared();
        }, 2500);
      }
    };
  }, []);

  return { hr: snap.hr, status: snap.status, error: snap.error, connect, disconnect, isSupported };
};
