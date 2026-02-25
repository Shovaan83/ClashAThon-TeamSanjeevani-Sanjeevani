import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRequestStore, type IncomingRequest } from '@/store/useRequestStore';
import { WS_BASE_URL } from '@/lib/api';

const PING_INTERVAL_MS = 25_000;
const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;

// ─── Pharmacy WebSocket ──────────────────────────────────────────────────────

export interface PharmacyWsCallbacks {
  onNewRequest?: (request: IncomingRequest) => void;
  onRequestTaken?: (requestId: string) => void;
}

export function usePharmacyWebSocket(callbacks?: PharmacyWsCallbacks) {
  const token = useAuthStore((s) => s.token);
  const { addPendingRequest, removePendingRequest, showRequest } = useRequestStore();
  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval>>();
  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const unmounted = useRef(false);
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    if (unmounted.current || !token) return;

    const ws = new WebSocket(`${WS_BASE_URL}/ws/pharmacy/?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttempt.current = 0;
      setConnected(true);
      pingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, PING_INTERVAL_MS);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'new_request') {
          const mapped: IncomingRequest = {
            id: String(data.request_id),
            patientName: data.patient_name ?? 'Anonymous Patient',
            patientId: data.patient_phone ?? '',
            location: `${data.distance_km ?? '?'} km away`,
            patientLocation: data.patient_location,
            prescriptionImageUrl: data.image_url,
            medicines: [],
            isUrgent: false,
            distanceKm: data.distance_km,
            quantity: data.quantity,
            timestamp: new Date(data.timestamp).getTime(),
          };

          addPendingRequest(mapped);
          showRequest(mapped);
          callbacks?.onNewRequest?.(mapped);
        }

        if (data.type === 'request_taken') {
          const id = String(data.request_id);
          removePendingRequest(id);
          callbacks?.onRequestTaken?.(id);
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      clearInterval(pingRef.current);
      setConnected(false);
      if (unmounted.current) return;

      const delay = Math.min(
        RECONNECT_BASE_MS * 2 ** reconnectAttempt.current,
        RECONNECT_MAX_MS,
      );
      reconnectAttempt.current += 1;
      reconnectTimer.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [token, addPendingRequest, removePendingRequest, showRequest, callbacks]);

  useEffect(() => {
    unmounted.current = false;
    connect();
    return () => {
      unmounted.current = true;
      clearInterval(pingRef.current);
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { wsRef, connected };
}

// ─── Customer WebSocket ──────────────────────────────────────────────────────

export interface PharmacyResponseEvent {
  request_id: string;
  response_type: 'ACCEPTED' | 'REJECTED';
  pharmacy_id: number;
  pharmacy_name: string;
  pharmacy_location: { lat: number; lng: number };
  message: string;
  audio_url: string | null;
  timestamp: string;
}

export function useCustomerWebSocket(
  onPharmacyResponse?: (event: PharmacyResponseEvent) => void,
) {
  const token = useAuthStore((s) => s.token);
  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval>>();
  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const unmounted = useRef(false);

  const connect = useCallback(() => {
    if (unmounted.current || !token) return;

    const ws = new WebSocket(`${WS_BASE_URL}/ws/customer/?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttempt.current = 0;
      pingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, PING_INTERVAL_MS);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'pharmacy_response') {
          onPharmacyResponse?.({
            request_id: String(data.request_id),
            response_type: data.response_type,
            pharmacy_id: data.pharmacy_id,
            pharmacy_name: data.pharmacy_name,
            pharmacy_location: data.pharmacy_location,
            message: data.message,
            audio_url: data.audio_url,
            timestamp: data.timestamp,
          });
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      clearInterval(pingRef.current);
      if (unmounted.current) return;

      const delay = Math.min(
        RECONNECT_BASE_MS * 2 ** reconnectAttempt.current,
        RECONNECT_MAX_MS,
      );
      reconnectAttempt.current += 1;
      reconnectTimer.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [token, onPharmacyResponse]);

  useEffect(() => {
    unmounted.current = false;
    connect();
    return () => {
      unmounted.current = true;
      clearInterval(pingRef.current);
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return wsRef;
}
