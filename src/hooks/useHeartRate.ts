import { useState, useRef, useCallback } from 'react';

export type HRStatus = 'idle' | 'connecting' | 'connected';

export const useHeartRate = () => {
  const [hr, setHr] = useState<number | null>(null);
  const [status, setStatus] = useState<HRStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const deviceRef = useRef<any>(null);

  // Web Bluetooth requires Chrome/Edge on desktop or Android — NOT iOS
  const isSupported = typeof navigator !== 'undefined' && 'bluetooth' in (navigator as any);

  const connect = useCallback(async () => {
    if (!isSupported) return;
    try {
      setStatus('connecting');
      setError(null);
      const nav = navigator as any;
      const device = await nav.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
      });
      deviceRef.current = device;
      device.addEventListener('gattserverdisconnected', () => {
        setStatus('idle');
        setHr(null);
      });
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('heart_rate');
      const char = await service.getCharacteristic('heart_rate_measurement');
      char.addEventListener('characteristicvaluechanged', (e: Event) => {
        const dv = (e.target as any).value as DataView;
        const flags = dv.getUint8(0);
        // Bit 0: 0 = HR uint8, 1 = HR uint16
        const heartRate = (flags & 0x1) === 0 ? dv.getUint8(1) : dv.getUint16(1, true);
        setHr(heartRate);
      });
      await char.startNotifications();
      setStatus('connected');
    } catch (err: any) {
      if (err?.name !== 'NotFoundError') {
        setError(err?.message ?? 'Erreur BLE');
      }
      setStatus('idle');
    }
  }, [isSupported]);

  const disconnect = useCallback(() => {
    try { deviceRef.current?.gatt?.disconnect(); } catch {}
    setStatus('idle');
    setHr(null);
  }, []);

  return { hr, status, error, connect, disconnect, isSupported };
};
