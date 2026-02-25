import { create } from 'zustand';
import { api } from '@/lib/api';

export interface IncomingRequest {
  id: string;
  patientName: string;
  patientId: string;
  location: string;
  patientLocation?: { lat: number; lng: number };
  prescriptionImageUrl?: string;
  medicines: string[];
  additionalMedicinesCount?: number;
  isUrgent: boolean;
  doctorNote?: string;
  distanceKm?: number;
  quantity?: number;
  timestamp: number;
}

interface RequestState {
  activeRequest: IncomingRequest | null;
  pendingRequests: IncomingRequest[];
  isModalOpen: boolean;
  isResponding: boolean;
  responseError: string | null;
  voiceMode: boolean;
  isVikalpaOpen: boolean;

  showRequest: (request: IncomingRequest) => void;
  addPendingRequest: (request: IncomingRequest) => void;
  removePendingRequest: (requestId: string) => void;
  setPendingRequests: (requests: IncomingRequest[]) => void;
  acceptRequest: () => Promise<void>;
  declineRequest: () => Promise<void>;
  dismissModal: () => void;
  toggleVoiceMode: () => void;
  openVikalpa: () => void;
  closeVikalpa: () => void;
  offerSubstitute: (name: string, price: number, note?: string) => Promise<void>;
}

const VOICE_MODE_KEY = 'sanjeevani_voice_mode';

export const useRequestStore = create<RequestState>()((set, get) => ({
  activeRequest: null,
  pendingRequests: [],
  isModalOpen: false,
  isResponding: false,
  responseError: null,
  voiceMode: localStorage.getItem(VOICE_MODE_KEY) === 'true',
  isVikalpaOpen: false,

  showRequest: (request) => {
    set({ activeRequest: request, isModalOpen: true });
  },

  addPendingRequest: (request) => {
    set((state) => {
      const exists = state.pendingRequests.some((r) => r.id === request.id);
      if (exists) return state;
      return { pendingRequests: [request, ...state.pendingRequests] };
    });
  },

  removePendingRequest: (requestId) => {
    set((state) => ({
      pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId),
    }));
  },

  setPendingRequests: (requests) => {
    set({ pendingRequests: requests });
  },

  acceptRequest: async () => {
    const { activeRequest } = get();
    if (!activeRequest) return;

    set({ isResponding: true, responseError: null });
    try {
      await api.respondToMedicineRequest({
        request_id: activeRequest.id,
        response_type: 'ACCEPTED',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to accept request.';
      console.error('[RequestStore] Accept failed:', err);
      // Still remove from pending — if the backend rejected it, the request
      // is no longer actionable (e.g. already taken by another pharmacy).
      set({ responseError: msg });
    } finally {
      get().removePendingRequest(activeRequest.id);
      set({ isModalOpen: false, activeRequest: null, isResponding: false });
    }
  },

  declineRequest: async () => {
    const { activeRequest } = get();
    if (!activeRequest) return;

    set({ isResponding: true, responseError: null });
    try {
      await api.respondToMedicineRequest({
        request_id: activeRequest.id,
        response_type: 'REJECTED',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to decline request.';
      console.error('[RequestStore] Decline failed:', err);
      set({ responseError: msg });
    } finally {
      get().removePendingRequest(activeRequest.id);
      set({ isModalOpen: false, activeRequest: null, isResponding: false });
    }
  },

  dismissModal: () => {
    set({ isModalOpen: false, activeRequest: null });
  },

  toggleVoiceMode: () => {
    const next = !get().voiceMode;
    localStorage.setItem(VOICE_MODE_KEY, String(next));
    set({ voiceMode: next });
  },

  openVikalpa: () => set({ isVikalpaOpen: true }),

  closeVikalpa: () => set({ isVikalpaOpen: false }),

  offerSubstitute: async (name: string, price: number, note?: string) => {
    const { activeRequest } = get();
    if (!activeRequest) return;

    set({ isResponding: true, responseError: null });
    try {
      await api.respondToMedicineRequest({
        request_id: activeRequest.id,
        response_type: 'SUBSTITUTE',
        substitute_name: name,
        substitute_price: price,
        text_message: note,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send substitute offer.';
      console.error('[RequestStore] Substitute offer failed:', err);
      set({ responseError: msg });
    } finally {
      get().removePendingRequest(activeRequest.id);
      set({ isModalOpen: false, activeRequest: null, isResponding: false, isVikalpaOpen: false });
    }
  },
}));
