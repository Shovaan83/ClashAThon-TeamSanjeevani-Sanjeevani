import { create } from 'zustand';
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PharmacyDocument {
  id: number;
  pharmacy_id: number;
  pharmacy_name: string;
  email: string;
  phone_number: string;
  document_url: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Pharmacy {
  id: number;
  name: string;
  address: string;
  phone_number: string;
  lat: number;
  lng: number;
  email: string;
  user_name: string;
  profile_photo_url: string | null;
  document_url: string | null;
  document_status: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  created_at: string;
  updated_at: string;
}

export interface PaginationInfo {
  count: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
}

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  phone_number: string;
  role: 'ADMIN' | 'PHARMACY' | 'CUSTOMER';
  is_active: boolean;
  date_joined: string;
}

export interface AdminState {
  // Pharmacy Documents (KYC)
  documents: PharmacyDocument[];
  documentsLoading: boolean;
  documentsError: string | null;
  documentsPagination: PaginationInfo | null;
  
  // Pharmacies
  pharmacies: Pharmacy[];
  pharmaciesLoading: boolean;
  pharmaciesError: string | null;
  pharmaciesPagination: PaginationInfo | null;
  
  // Selected pharmacy detail
  selectedPharmacy: Pharmacy | null;
  selectedPharmacyLoading: boolean;
  
  // KYC action state
  kycActionLoading: number | null; // pharmacy_id being processed
  kycActionError: string | null;

  // Users
  users: AdminUser[];
  usersLoading: boolean;
  usersError: string | null;
  usersPagination: PaginationInfo | null;

  // Actions
  fetchPharmacyDocuments: (params?: { page?: number; page_size?: number; status?: string }) => Promise<void>;
  fetchPharmacies: (params?: { page?: number; page_size?: number; status?: string; search?: string }) => Promise<void>;
  fetchPharmacyDetail: (id: number) => Promise<void>;
  approvePharmacy: (pharmacyId: number) => Promise<void>;
  rejectPharmacy: (pharmacyId: number, message: string) => Promise<void>;
  fetchUsers: (params?: { page?: number; page_size?: number; role?: string; search?: string }) => Promise<void>;
  clearErrors: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAdminStore = create<AdminState>()((set, get) => ({
  // Initial state
  documents: [],
  documentsLoading: false,
  documentsError: null,
  documentsPagination: null,

  pharmacies: [],
  pharmaciesLoading: false,
  pharmaciesError: null,
  pharmaciesPagination: null,

  selectedPharmacy: null,
  selectedPharmacyLoading: false,

  kycActionLoading: null,
  kycActionError: null,

  users: [],
  usersLoading: false,
  usersError: null,
  usersPagination: null,

  // ─── Fetch Pharmacy Documents (KYC list) ─────────────────────────────────────
  fetchPharmacyDocuments: async (params = {}) => {
    set({ documentsLoading: true, documentsError: null });
    try {
      const response = await api.getPharmacyDocuments(params);
      set({
        documents: response.data.results,
        documentsPagination: response.data.pagination,
        documentsLoading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch documents';
      set({ documentsError: message, documentsLoading: false });
    }
  },

  // ─── Fetch Pharmacies ────────────────────────────────────────────────────────
  fetchPharmacies: async (params = {}) => {
    set({ pharmaciesLoading: true, pharmaciesError: null });
    try {
      const response = await api.getPharmacies(params);
      set({
        pharmacies: response.data.results,
        pharmaciesPagination: response.data.pagination,
        pharmaciesLoading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch pharmacies';
      set({ pharmaciesError: message, pharmaciesLoading: false });
    }
  },

  // ─── Fetch Pharmacy Detail ───────────────────────────────────────────────────
  fetchPharmacyDetail: async (id: number) => {
    set({ selectedPharmacyLoading: true });
    try {
      const response = await api.getPharmacyDetail(id);
      set({ selectedPharmacy: response.data, selectedPharmacyLoading: false });
    } catch (err) {
      console.error('Failed to fetch pharmacy detail:', err);
      set({ selectedPharmacy: null, selectedPharmacyLoading: false });
    }
  },

  // ─── Approve Pharmacy KYC ────────────────────────────────────────────────────
  approvePharmacy: async (pharmacyId: number) => {
    set({ kycActionLoading: pharmacyId, kycActionError: null });
    try {
      await api.kycAction(pharmacyId, 'APPROVE');
      // Refresh the documents list
      await get().fetchPharmacyDocuments();
      set({ kycActionLoading: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve pharmacy';
      set({ kycActionError: message, kycActionLoading: null });
    }
  },

  // ─── Reject Pharmacy KYC ─────────────────────────────────────────────────────
  rejectPharmacy: async (pharmacyId: number, message: string) => {
    set({ kycActionLoading: pharmacyId, kycActionError: null });
    try {
      await api.kycAction(pharmacyId, 'REJECT', message);
      // Refresh the documents list
      await get().fetchPharmacyDocuments();
      set({ kycActionLoading: null });
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Failed to reject pharmacy';
      set({ kycActionError: errMessage, kycActionLoading: null });
    }
  },

  // ─── Fetch Users ─────────────────────────────────────────────────────────────
  fetchUsers: async (params = {}) => {
    set({ usersLoading: true, usersError: null });
    try {
      const response = await api.getUsers(params);
      set({
        users: response.data.results,
        usersPagination: response.data.pagination,
        usersLoading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch users';
      set({ usersError: message, usersLoading: false });
    }
  },

  // ─── Clear Errors ────────────────────────────────────────────────────────────
  clearErrors: () => {
    set({ documentsError: null, pharmaciesError: null, kycActionError: null, usersError: null });
  },
}));
