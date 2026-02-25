import { useState } from 'react';
import type { UserRole } from '@/store/useAuthStore';

export type RegistrationStep = 1 | 2 | 3;

interface RegistrationFlowState {
  step: RegistrationStep;
  role: UserRole;
  email: string;
  otpVerified: boolean;
}

export function useRegistrationFlow() {
  const [state, setState] = useState<RegistrationFlowState>({
    step: 1,
    role: 'patient',
    email: '',
    otpVerified: false,
  });

  const setRole = (role: UserRole) => setState((s) => ({ ...s, role }));

  const submitEmail = (email: string) => {
    setState((s) => ({ ...s, email, step: 2 }));
  };

  const backToEmail = () => {
    setState((s) => ({ ...s, step: 1, otpVerified: false }));
  };

  const confirmOtp = () => {
    setState((s) => ({ ...s, otpVerified: true, step: 3 }));
  };

  return {
    step: state.step,
    role: state.role,
    email: state.email,
    otpVerified: state.otpVerified,
    setRole,
    submitEmail,
    backToEmail,
    confirmOtp,
  };
}
