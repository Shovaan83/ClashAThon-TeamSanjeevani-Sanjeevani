import { create } from 'zustand';

export interface IncomingRequest {
  id: string;
  patientName: string;
  patientId: string;
  location: string;
  prescriptionImageUrl?: string;
  medicines: string[];
  additionalMedicinesCount?: number;
  isUrgent: boolean;
  doctorNote?: string;
  timestamp: number;
}

interface RequestState {
  activeRequest: IncomingRequest | null;
  isModalOpen: boolean;
  // Actions
  showRequest: (request: IncomingRequest) => void;
  acceptRequest: () => void;
  declineRequest: () => void;
  dismissModal: () => void;
}

export const useRequestStore = create<RequestState>()((set, get) => ({
  activeRequest: null,
  isModalOpen: false,

  showRequest: (request) => {
    set({ activeRequest: request, isModalOpen: true });
  },

  acceptRequest: () => {
    const { activeRequest } = get();
    if (activeRequest) {
      console.log('[RequestStore] Accepted request:', activeRequest.id);
      // TODO (Day 3): Send WebSocket acknowledgement + POST to API
    }
    set({ isModalOpen: false, activeRequest: null });
  },

  declineRequest: () => {
    const { activeRequest } = get();
    if (activeRequest) {
      console.log('[RequestStore] Declined request:', activeRequest.id);
      // TODO (Day 3): Send WebSocket decline + notify doctor via API
    }
    set({ isModalOpen: false, activeRequest: null });
  },

  dismissModal: () => {
    set({ isModalOpen: false, activeRequest: null });
  },
}));
