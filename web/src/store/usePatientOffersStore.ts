import { create } from 'zustand';

export interface PharmacyOffer {
  responseId: number;
  requestId: string;
  pharmacyId: number;
  pharmacyName: string;
  pharmacyLocation: { lat: number; lng: number };
  responseType: 'ACCEPTED' | 'SUBSTITUTE' | 'REJECTED';
  message: string;
  audioUrl: string | null;
  substituteName: string | null;
  substitutePrice: string | null;
  timestamp: string;
}

interface PatientOffersState {
  activeRequestId: string | null;
  offers: PharmacyOffer[];
  selecting: boolean;
  selectedPharmacyName: string | null;

  setActiveRequest: (requestId: string) => void;
  addOffer: (offer: PharmacyOffer) => void;
  clearOffers: () => void;
  setSelecting: (v: boolean) => void;
  setSelectedPharmacyName: (name: string | null) => void;
  reset: () => void;
}

export const usePatientOffersStore = create<PatientOffersState>()((set) => ({
  activeRequestId: null,
  offers: [],
  selecting: false,
  selectedPharmacyName: null,

  setActiveRequest: (requestId) =>
    set({ activeRequestId: requestId, offers: [], selectedPharmacyName: null }),

  addOffer: (offer) =>
    set((state) => {
      // Deduplicate by responseId
      if (state.offers.some((o) => o.responseId === offer.responseId)) return state;
      return { offers: [...state.offers, offer] };
    }),

  clearOffers: () => set({ offers: [] }),

  setSelecting: (v) => set({ selecting: v }),

  setSelectedPharmacyName: (name) => set({ selectedPharmacyName: name }),

  reset: () => set({ activeRequestId: null, offers: [], selecting: false, selectedPharmacyName: null }),
}));
