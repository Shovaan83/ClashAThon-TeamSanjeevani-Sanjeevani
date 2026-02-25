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

  showRequest: (request: IncomingRequest) => void;
  addPendingRequest: (request: IncomingRequest) => void;
  removePendingRequest: (requestId: string) => void;
  setPendingRequests: (requests: IncomingRequest[]) => void;
  acceptRequest: () => Promise<void>;
  declineRequest: () => Promise<void>;
  dismissModal: () => void;
}

export const useRequestStore = create<RequestState>()((set, get) => ({
  activeRequest: null,
  pendingRequests: [],
  isModalOpen: false,
  isResponding: false,

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

    set({ isResponding: true });
    try {
      await api.respondToMedicineRequest({
        request_id: activeRequest.id,
        response_type: 'ACCEPTED',
      });
      get().removePendingRequest(activeRequest.id);
    } catch (err) {
      console.error('[RequestStore] Accept failed:', err);
    } finally {
      set({ isModalOpen: false, activeRequest: null, isResponding: false });
    }
  },

  declineRequest: async () => {
    const { activeRequest } = get();
    if (!activeRequest) return;

    set({ isResponding: true });
    try {
      await api.respondToMedicineRequest({
        request_id: activeRequest.id,
        response_type: 'REJECTED',
      });
      get().removePendingRequest(activeRequest.id);
    } catch (err) {
      console.error('[RequestStore] Decline failed:', err);
    } finally {
      set({ isModalOpen: false, activeRequest: null, isResponding: false });
    }
  },

  dismissModal: () => {
    set({ isModalOpen: false, activeRequest: null });
  },
}));
