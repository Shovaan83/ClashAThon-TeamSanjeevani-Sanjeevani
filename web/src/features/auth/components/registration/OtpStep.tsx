import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Loader2, ChevronLeft, RotateCcw } from 'lucide-react';
import { otpStepSchema, type OtpStepData } from '@/features/auth/schemas/registerSchema';
import { Button } from '@/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { api } from '@/lib/api';

const RESEND_COOLDOWN = 60;

interface OtpStepProps {
  email: string;
  onBack: () => void;
  onVerified: () => void;
}

export default function OtpStep({ email, onBack, onVerified }: OtpStepProps) {
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);
  const [apiError, setApiError] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<OtpStepData>({ resolver: zodResolver(otpStepSchema) });

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  const handleResend = useCallback(async () => {
    setResending(true);
    setApiError('');
    try {
      await api.sendOtp(email);
      setCountdown(RESEND_COOLDOWN);
      reset();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  }, [email, reset]);

  async function submit({ otp }: OtpStepData) {
    setApiError('');
    try {
      await api.verifyOtp(email, otp);
      onVerified();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Verification failed.');
    }
  }

  return (
    <div>
      <div className="mb-8 p-4 border border-stone-200 bg-white">
        <p className="text-sm text-stone-500">We've sent a 6-digit code to</p>
        <p className="font-semibold text-[#1C1917] mt-0.5">{email}</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-2 flex items-center gap-1 text-xs text-[#FF6B35] hover:underline font-semibold"
        >
          <ChevronLeft size={13} />
          Change email
        </button>
      </div>

      <form onSubmit={handleSubmit(submit)} noValidate>
        <div className="mb-6">
          <label className="block text-sm font-semibold text-[#1C1917] mb-3">
            Enter 6-digit OTP
          </label>
          <Controller
            name="otp"
            control={control}
            render={({ field }) => (
              <InputOTP maxLength={6} value={field.value ?? ''} onChange={field.onChange}>
                <InputOTPGroup className="gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            )}
          />
          {(errors.otp ?? apiError) && (
            <p className="mt-2 text-xs text-[#FF6B35]">
              {errors.otp?.message ?? apiError}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 mb-6 text-sm">
          {countdown > 0 ? (
            <span className="text-stone-500">
              Resend OTP in <span className="font-semibold text-[#1C1917]">{countdown}s</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="flex items-center gap-1.5 text-[#FF6B35] font-semibold hover:underline disabled:opacity-50"
            >
              {resending ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
              Resend OTP
            </button>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Verifying…
            </>
          ) : (
            <>
              Verify & Continue
              <ArrowRight size={16} />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
