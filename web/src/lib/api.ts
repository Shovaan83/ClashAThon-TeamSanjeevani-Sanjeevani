import axios, { type AxiosError } from 'axios';
import type { PharmacyProfileData } from '@/features/auth/schemas/registerSchema';

// ─── Axios instance ───────────────────────────────────────────────────────────

export const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: { 'Content-Type': 'application/json' },
});

// Attach stored JWT token on every request
apiClient.interceptors.request.use((config) => {
  try {
    const stored = localStorage.getItem('sanjeevani-auth');
    if (stored) {
      const parsed = JSON.parse(stored) as { state?: { token?: string } };
      const token = parsed?.state?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {
    // ignore parse errors
  }
  return config;
});

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

// ─── Types ────────────────────────────────────────────────────────────────────

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
};
