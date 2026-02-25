import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'patient' | 'pharmacy';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setVerified: (status: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      login: (token, user) => set({ token, user, isAuthenticated: true }),

      logout: () => set({ token: null, user: null, isAuthenticated: false }),

      setVerified: (status) =>
        set((state) => ({
          user: state.user ? { ...state.user, isVerified: status } : null,
        })),
    }),
    { name: 'sanjeevani-auth' }
  )
);
