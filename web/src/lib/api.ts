import type { PatientProfileData, PharmacyProfileData } from '@/features/auth/schemas/registerSchema';
import type { UserRole } from '@/store/useAuthStore';

// Simulated network delay
const delay = (ms = 800) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SendOtpPayload {
  email: string;
  role: UserRole;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface RegisterPatientPayload extends PatientProfileData {
  email: string;
  role: 'patient';
}

export interface RegisterPharmacyPayload extends PharmacyProfileData {
  email: string;
  role: 'pharmacy';
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    isVerified: boolean;
  };
}

// ─── Mock API ─────────────────────────────────────────────────────────────────
// MOCK: Replace each function body with a real Axios call when the backend is ready.
// The correct OTP for any email in mock mode is: 123456

export const api = {
  /**
   * Step 1 → sends OTP to the provided email.
   * POST /auth/send-otp
   */
  async sendOtp(payload: SendOtpPayload): Promise<void> {
    await delay();
    console.log('[MOCK] sendOtp →', payload);
    // Real: await axios.post('/auth/send-otp', payload);
  },

  /**
   * Step 2 → verifies OTP. Throws if invalid.
   * POST /auth/verify-otp
   */
  async verifyOtp(payload: VerifyOtpPayload): Promise<void> {
    await delay();
    console.log('[MOCK] verifyOtp →', payload);
    if (payload.otp !== '123456') {
      throw new Error('Invalid OTP. Please try again.');
    }
    // Real: await axios.post('/auth/verify-otp', payload);
  },

  /**
   * Step 3 → registers the user and returns auth token + user.
   * POST /auth/register
   */
  async register(
    payload: RegisterPatientPayload | RegisterPharmacyPayload
  ): Promise<AuthResponse> {
    await delay();
    console.log('[MOCK] register →', payload);
    const name =
      payload.role === 'pharmacy'
        ? (payload as RegisterPharmacyPayload).pharmacyName
        : (payload as RegisterPatientPayload).name;
    return {
      token: 'mock-jwt-token-' + Math.random().toString(36).slice(2),
      user: {
        id: 'mock-' + Math.random().toString(36).slice(2),
        name,
        email: payload.email,
        role: payload.role,
        isVerified: true,
      },
    };
  },
};
