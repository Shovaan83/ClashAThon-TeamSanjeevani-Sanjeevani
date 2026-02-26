import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRequestStore, type IncomingRequest } from '@/store/useRequestStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { usePatientOffersStore } from '@/store/usePatientOffersStore';
import { api, WS_BASE_URL } from '@/lib/api';

const PING_INTERVAL_MS = 15_000;   // keep-alive every 15 s (was 25 s)
const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 5_000;    // cap backoff at 5 s (was 30 s)

// Plays a two-tone alert beep via the Web Audio API (no file needed).
function playAlertBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const playTone = (freq: number, startAt: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.4, startAt);
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
      osc.start(startAt);
      osc.stop(startAt + duration);
    };

    // Two rising tones: 880 Hz → 1100 Hz
    playTone(880, ctx.currentTime, 0.18);
    playTone(1100, ctx.currentTime + 0.2, 0.18);

    // Close context after playback to free resources
    setTimeout(() => ctx.close(), 600);
  } catch {
    // Audio API unavailable — fail silently
  }
}

// ─── Pharmacy WebSocket ──────────────────────────────────────────────────────

export interface PharmacyWsCallbacks {
  onNewRequest?: (request: IncomingRequest) => void;
  onRequestTaken?: (requestId: string) => void;
}

export function usePharmacyWebSocket(callbacks?: PharmacyWsCallbacks) {
  const token = useAuthStore((s) => s.token);
  const { addPendingRequest, removePendingRequest, showRequest } = useRequestStore();
  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const unmounted = useRef(false);
  const [connected, setConnected] = useState(false);

  // Keep callbacks in a ref so they never invalidate the connect function
  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

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

      // Sync any pending requests that arrived while the socket was down.
      // Uses the same deduplication in addPendingRequest so no duplicates appear.
      api.getMedicineRequests().then((res) => {
        const store = useRequestStore.getState();
        const notifStore = useNotificationStore.getState();
        const currentIds = new Set(store.pendingRequests.map((r) => r.id));
        for (const r of (res.requests ?? []) as Record<string, unknown>[]) {
          const id = String(r.id);
          if (currentIds.has(id)) continue;
          const req: IncomingRequest = {
            id,
            patientName: (r.patient_name as string) ?? 'Anonymous Patient',
            patientId: '',
            location: 'Nearby',
            prescriptionImageUrl: r.image as string | undefined,
            medicines: [],
            isUrgent: false,
            quantity: r.quantity as number | undefined,
            timestamp: new Date(r.created_at as string).getTime(),
          };
          playAlertBeep();
          store.addPendingRequest(req);
          store.showRequest(req);
          notifStore.addNotification({
            type: 'new_request',
            title: 'New Medicine Request (missed)',
            body: `${req.patientName} is looking for medicine nearby.`,
            requestId: id,
          });
        }
      }).catch(() => null); // fail silently — WS is the primary channel
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

          playAlertBeep();
          addPendingRequest(mapped);
          showRequest(mapped);
          callbacksRef.current?.onNewRequest?.(mapped);

          useNotificationStore.getState().addNotification({
            type: 'new_request',
            title: 'New Medicine Request',
            body: `${data.patient_name ?? 'A patient'} is looking for medicine — ${data.distance_km ?? '?'} km away.`,
            requestId: String(data.request_id),
          });
        }

        if (data.type === 'request_taken') {
          const id = String(data.request_id);
          removePendingRequest(id);
          callbacksRef.current?.onRequestTaken?.(id);

          useNotificationStore.getState().addNotification({
            type: 'request_taken',
            title: 'Request No Longer Available',
            body: 'This medicine request has been accepted by another pharmacy.',
            requestId: id,
          });
        }

        if (data.type === 'pharmacy_selected') {
          const id = String(data.request_id);
          removePendingRequest(id);

          useNotificationStore.getState().addNotification({
            type: 'patient_selected_you',
            title: '🎉 You were selected!',
            body: data.message ?? `${data.patient_name ?? 'A patient'} has chosen your pharmacy. Please prepare the medicine!`,
            requestId: id,
          });
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      clearInterval(pingRef.current);
      setConnected(false);
      // wsRef.current !== ws means this connection was intentionally replaced —
      // skip reconnect to avoid accumulating duplicate connections.
      if (unmounted.current || wsRef.current !== ws) return;

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
  }, [token, addPendingRequest, removePendingRequest, showRequest]);

  useEffect(() => {
    unmounted.current = false;
    connect();
    return () => {
      unmounted.current = true;
      clearInterval(pingRef.current);
      clearTimeout(reconnectTimer.current);
      // Null out the current ref first so onclose sees wsRef.current !== ws
      // and does not schedule a reconnect after the intentional close.
      const ws = wsRef.current;
      wsRef.current = null;
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [connect]);

  return { wsRef, connected };
}

// ─── Customer WebSocket ──────────────────────────────────────────────────────

export interface PharmacyResponseEvent {
  response_id: number;
  request_id: string;
  response_type: 'ACCEPTED' | 'REJECTED' | 'SUBSTITUTE';
  pharmacy_id: number;
  pharmacy_name: string;
  pharmacy_location: { lat: number; lng: number };
  message: string;
  audio_url: string | null;
  substitute_name: string | null;
  substitute_price: string | null;
  timestamp: string;
}

export function useCustomerWebSocket(
  onPharmacyResponse?: (event: PharmacyResponseEvent) => void,
) {
  const token = useAuthStore((s) => s.token);
  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const unmounted = useRef(false);

  // Keep callback in a ref so it never invalidates the connect function
  const onPharmacyResponseRef = useRef(onPharmacyResponse);
  useEffect(() => {
    onPharmacyResponseRef.current = onPharmacyResponse;
  });

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
          const payload: PharmacyResponseEvent = {
            response_id: data.response_id,
            request_id: String(data.request_id),
            response_type: data.response_type as 'ACCEPTED' | 'REJECTED' | 'SUBSTITUTE',
            pharmacy_id: data.pharmacy_id,
            pharmacy_name: data.pharmacy_name,
            pharmacy_location: data.pharmacy_location,
            message: data.message,
            audio_url: data.audio_url ?? null,
            substitute_name: data.substitute_name ?? null,
            substitute_price: data.substitute_price ?? null,
            timestamp: data.timestamp,
          };

          onPharmacyResponseRef.current?.(payload);

          // Push into the patient offers store so the selection panel updates
          usePatientOffersStore.getState().addOffer({
            responseId: data.response_id,
            requestId: String(data.request_id),
            pharmacyId: data.pharmacy_id,
            pharmacyName: data.pharmacy_name,
            pharmacyLocation: data.pharmacy_location,
            responseType: data.response_type as 'ACCEPTED' | 'SUBSTITUTE' | 'REJECTED',
            message: data.message ?? '',
            audioUrl: data.audio_url ?? null,
            substituteName: data.substitute_name ?? null,
            substitutePrice: data.substitute_price ?? null,
            timestamp: data.timestamp,
          });

          // Push into the notification bell so it appears in the modal
          const isAccepted = data.response_type === 'ACCEPTED';
          const isSubstitute = data.response_type === 'SUBSTITUTE';
          const pharmacyName: string = data.pharmacy_name ?? 'A pharmacy';

          let title: string;
          let body: string;
          if (isAccepted) {
            title = 'Medicine Request Accepted';
            body = `${pharmacyName} will fulfil your request. Head over to pick it up!`;
          } else if (isSubstitute) {
            const subName: string = data.substitute_name ?? 'a substitute';
            const subPrice: string | null = data.substitute_price ?? null;
            title = 'Substitute Medicine Offered';
            body = `${pharmacyName} offered ${subName}${subPrice ? ` for Rs. ${subPrice}` : ''}.`;
          } else {
            title = 'Request Declined';
            body = `${pharmacyName} declined your medicine request.`;
          }

          useNotificationStore.getState().addNotification({
            type: isAccepted
              ? 'pharmacy_accepted'
              : isSubstitute
              ? 'pharmacy_substitute'
              : 'pharmacy_rejected',
            title,
            body,
            audioUrl: data.audio_url ?? null,
            substituteName: data.substitute_name ?? null,
            substitutePrice: data.substitute_price ?? null,
            message: data.message ?? null,
            requestId: String(data.request_id),
          });
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      clearInterval(pingRef.current);
      // wsRef.current !== ws means this connection was intentionally replaced —
      // skip reconnect to avoid accumulating duplicate connections.
      if (unmounted.current || wsRef.current !== ws) return;

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
  }, [token]);

  useEffect(() => {
    unmounted.current = false;
    connect();
    return () => {
      unmounted.current = true;
      clearInterval(pingRef.current);
      clearTimeout(reconnectTimer.current);
      // Null out the current ref first so onclose sees wsRef.current !== ws
      // and does not schedule a reconnect after the intentional close.
      const ws = wsRef.current;
      wsRef.current = null;
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [connect]);

  return wsRef;
}
