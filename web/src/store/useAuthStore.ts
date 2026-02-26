import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'patient' | 'pharmacy' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
}

export interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (accessToken: string, user: User, refreshToken?: string) => void;
  setAccessToken: (token: string) => void;
  logout: () => Promise<void>;
  setVerified: (status: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,

      login: (accessToken, user, refreshToken) =>
        set({ token: accessToken, refreshToken: refreshToken ?? null, user, isAuthenticated: true }),

      setAccessToken: (token) => set({ token }),

      logout: async () => {
  const { refreshToken } = useAuthStore.getState();

  if (refreshToken) {
    const { api } = await import('@/lib/api'); // adjust path if needed
    await api.logoutUser(refreshToken);
  }

  set({
    token: null,
    refreshToken: null,
    user: null,
    isAuthenticated: false,
  });
},

      setVerified: (status) =>
        set((state) => ({
          user: state.user ? { ...state.user, isVerified: status } : null,
        })),
    }),
    { name: 'sanjeevani-auth' }
  )
);
