import axios, { type AxiosError } from 'axios';
import type { PharmacyProfileData } from '@/features/auth/schemas/registerSchema';
import type { UserRole } from '@/store/useAuthStore';

// ─── Axios instance ───────────────────────────────────────────────────────────

export const WS_BASE_URL = 'ws://127.0.0.1:8000';

export const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: { 'Content-Type': 'application/json' },
});

// ─── Helpers to read/write persisted auth state ──────────────────────────────

function getStoredTokens(): { access: string | null; refresh: string | null } {
  try {
    const stored = localStorage.getItem('sanjeevani-auth');
    if (stored) {
      const parsed = JSON.parse(stored) as { state?: { token?: string; refreshToken?: string } };
      return {
        access: parsed?.state?.token ?? null,
        refresh: parsed?.state?.refreshToken ?? null,
      };
    }
  } catch {
    // ignore parse errors
  }
  return { access: null, refresh: null };
}

// Attach stored JWT access token on every request
apiClient.interceptors.request.use((config) => {
  const { access } = getStoredTokens();
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

// Handle 401 responses: try to refresh the token once, then log out
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const { refresh } = getStoredTokens();

      // No refresh token — force logout
      if (!refresh) {
        const { useAuthStore } = await import('@/store/useAuthStore');
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue the request until the refresh completes
        return new Promise((resolve) => {
          refreshSubscribers.push((newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      isRefreshing = true;
      try {
        const res = await apiClient.post<{ access: string }>('/token/refresh/', { refresh });
        const newAccessToken = res.data.access;

        // Persist the new access token in the store
        const { useAuthStore } = await import('@/store/useAuthStore');
        useAuthStore.getState().setAccessToken(newAccessToken);

        onRefreshed(newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch {
        // Refresh failed — log the user out
        const { useAuthStore } = await import('@/store/useAuthStore');
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// ─── Error helper ─────────────────────────────────────────────────────────────

/** Extracts a readable message from a Django backend error response or Axios error. */
function extractError(err: unknown, fallback: string): string {
  const axiosErr = err as AxiosError<{ error?: string; message?: string }>;
  if (axiosErr.response?.data) {
    const data = axiosErr.response.data;
    return data.error ?? data.message ?? fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

// ─── Role mapping ─────────────────────────────────────────────────────────────

export function mapBackendRole(role: string): UserRole {
  return role === 'CUSTOMER' ? 'patient' :role==='ADMIN'? 'ADMIN': 'pharmacy';
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BackendUser {
  id: number;
  email: string;
  name: string;
  phone_number: string;
  role: string;
}

export interface AuthResponse {
  data: {
    user: BackendUser;
    tokens: { access: string; refresh: string };
  };
  message: string;
}

export interface RegisterPharmacyResponse {
  message: string;
  data: {
    user: {
      id: number;
      email: string;
      name: string;
      phone_number: string;
      role: string;
    };
    lat: number;
    lng: number;
  };
}

// ─── API methods ─────────────────────────────────────────────────────────────

export const api = {
  /**
   * Step 1 – sends OTP to the provided email.
   * POST /send-otp
   */
  async sendOtp(email: string): Promise<void> {
    try {
      await apiClient.post('/send-otp', { email });
    } catch (err) {
      throw new Error(extractError(err, 'Failed to send OTP. Please try again.'));
    }
  },

  /**
   * Step 2 – verifies OTP. Throws if invalid.
   * POST /verify-otp
   */
  async verifyOtp(email: string, otp: string): Promise<void> {
    try {
      await apiClient.post('/verify-otp', { email, otp });
    } catch (err) {
      throw new Error(extractError(err, 'Invalid OTP. Please try again.'));
    }
  },

  /**
   * Step 3 – registers a pharmacy account.
   * POST /register-pharmacy/
   * Transforms the frontend form data into the nested backend shape.
   */
  async registerPharmacy(
    email: string,
    data: PharmacyProfileData
  ): Promise<RegisterPharmacyResponse> {
    // Strip all non-digit characters from phone to satisfy the backend's 10-digit rule
    const phone_number = data.phone.replace(/\D/g, '');

    const payload = {
      user: {
        email,
        password: data.password,
        name: data.pharmacyName,
        phone_number,
      },
      lat: data.location.lat,
      lng: data.location.lng,
    };

    try {
      const res = await apiClient.post<{ status: string; message: string; data: RegisterPharmacyResponse['data'] }>(
        '/register-pharmacy/',
        payload
      );
      return { message: res.data.message, data: res.data.data };
    } catch (err) {
      throw new Error(extractError(err, 'Registration failed. Please try again.'));
    }
  },

  /**
   * Unified login – returns JWT tokens + user data with role.
   * POST /login
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const res = await apiClient.post<AuthResponse>('/login', { email, password });
      return res.data;
    } catch (err) {
      throw new Error(extractError(err, 'Login failed. Please check your credentials.'));
    }
  },

  /**
   * Register a customer account (after OTP verification).
   * POST /customer/register/
   */
  async registerCustomer(data: {
    email: string;
    name: string;
    phone_number: string;
    password: string;
    confirm_password: string;
  }): Promise<AuthResponse> {
    try {
      const res = await apiClient.post<AuthResponse>('/customer/register/', data);
      return res.data;
    } catch (err) {
      throw new Error(extractError(err, 'Registration failed. Please try again.'));
    }
  },

  /**
   * Create a medicine request (patient broadcasts prescription to nearby pharmacies).
   * POST /medicine/request/
   */
  async createMedicineRequest(formData: FormData) {
    try {
      const res = await apiClient.post('/medicine/request/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } catch (err) {
      throw new Error(extractError(err, 'Failed to broadcast request. Please try again.'));
    }
  },

  /**
   * Pharmacy responds to a medicine request (accept/reject/substitute).
   * POST /medicine/response/
   */
  async respondToMedicineRequest(data: {
    request_id: string | number;
    response_type: 'ACCEPTED' | 'REJECTED' | 'SUBSTITUTE';
    text_message?: string;
    substitute_name?: string;
    substitute_price?: number;
  }) {
    try {
      const res = await apiClient.post('/medicine/response/', data);
      return res.data;
    } catch (err) {
      throw new Error(extractError(err, 'Failed to send response. Please try again.'));
    }
  },

  /**
   * Patient selects a specific pharmacy offer to fulfil their request.
   * POST /medicine/select/
   */
  async selectPharmacy(responseId: number) {
    try {
      const res = await apiClient.post('/medicine/select/', { response_id: responseId });
      return res.data;
    } catch (err) {
      throw new Error(extractError(err, 'Failed to select pharmacy. Please try again.'));
    }
  },

  /**
   * Get medicine requests (role-aware: pharmacy sees nearby pending, customer sees own).
   * GET /medicine/request/
   */
  async getMedicineRequests() {
    try {
      const res = await apiClient.get('/medicine/request/');
      return res.data;
    } catch (err) {
      throw new Error(extractError(err, 'Failed to fetch requests.'));
    }
  },

  /**
   * Get customer's medicine request history.
   * GET /customer/requests/
   */
  async getCustomerRequests() {
    try {
      const res = await apiClient.get('/customer/requests/');
      return res.data;
    } catch (err) {
      throw new Error(extractError(err, 'Failed to fetch request history.'));
    }
  },

  async logoutUser(refreshToken: string): Promise<void> {
  try {
    await apiClient.post('/logout', {
      refresh: refreshToken,
    });
  } catch (err) {
    console.warn('Backend logout failed, clearing session anyway.');
  }
},


// ─── Admin APIs ───────────────────────────────────────────────────────────────

/**
 * Get all pharmacy documents/KYC requests (admin only)
 * GET /admin/api/pharmacy-documents/
 * Supports pagination: ?page=1&page_size=10&status=PENDING
 */
async getPharmacyDocuments(params?: { page?: number; page_size?: number; status?: string }) {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    if (params?.status) queryParams.append('status', params.status);
    
    const queryString = queryParams.toString();
    const url = `/admin/api/pharmacy-documents/${queryString ? '?' + queryString : ''}`;
    const res = await apiClient.get(url);
    return res.data;
  } catch (err) {
    throw new Error(extractError(err, 'Failed to fetch pharmacy documents.'));
  }
},

/**
 * Get all pharmacies (admin only)
 * GET /admin/api/pharmacies/
 * Supports pagination: ?page=1&page_size=10&status=PENDING&search=query
 */
async getPharmacies(params?: { page?: number; page_size?: number; status?: string; search?: string }) {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    
    const url = `/admin/api/pharmacies/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const res = await apiClient.get(url);
    return res.data;
  } catch (err) {
    throw new Error(extractError(err, 'Failed to fetch pharmacies.'));
  }
},

/**
 * Get pharmacy detail (admin only)
 * GET /admin/api/pharmacy/:id/
 */
async getPharmacyDetail(id: number) {
  try {
    const res = await apiClient.get(`/admin/api/pharmacy/${id}/`);
    return res.data;
  } catch (err) {
    throw new Error(extractError(err, 'Failed to fetch pharmacy detail.'));
  }
},

/**
 * Approve or reject pharmacy KYC (admin only)
 * POST /admin/api/pharmacy/:id/kyc/
 */
async kycAction(pharmacyId: number, action: 'APPROVE' | 'REJECT', message?: string) {
  try {
    const res = await apiClient.post(`/admin/api/pharmacy/${pharmacyId}/kyc/`, {
      action,
      message: message || '',
    });
    return res.data;
  } catch (err) {
    throw new Error(extractError(err, `Failed to ${action.toLowerCase()} pharmacy.`));
  }
},

/**
 * Get all users (admin only)
 * GET /admin/api/users/
 * Supports ?page=1&role=CUSTOMER&search=query
 */
async getUsers(params?: { page?: number; page_size?: number; role?: string; search?: string }) {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    if (params?.role) queryParams.append('role', params.role);
    if (params?.search) queryParams.append('search', params.search);
    const url = `/admin/api/users/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const res = await apiClient.get(url);
    return res.data;
  } catch (err) {
    throw new Error(extractError(err, 'Failed to fetch users.'));
  }
},

/**
 * Get analytics summary for authenticated pharmacy.
 * GET /api/fomo/analytics/
 */
async getAnalyticsSummary() {
  const res = await apiClient.get('/api/fomo/analytics/');
  return res.data;
},

/**
 * Get weekly FOMO trend for authenticated pharmacy.
 * GET /api/fomo/weekly/
 */
async getWeeklyFomoTrend() {
  const res = await apiClient.get('/api/fomo/weekly/');
  return res.data;
},

/**
 * Get top missed medicines for authenticated pharmacy.
 * GET /api/fomo/top-missed/
 */
async getTopMissedMedicines() {
  const res = await apiClient.get('/api/fomo/top-missed/');
  return res.data;
},

/**
 * Get FOMO Ledger data for the authenticated pharmacy.
 * GET /api/fomo/
 */
async getFomoLedger() {
  const res = await apiClient.get('/api/fomo/');
  return res.data;
},
};




