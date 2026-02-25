import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Phone, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { patientProfileSchema, type PatientProfileData } from '@/features/auth/schemas/registerSchema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PatientProfileStepProps {
  email: string;
}

export default function PatientProfileStep({ email: _email }: PatientProfileStepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [apiError, setApiError] = useState('');
  // Patient registration backend endpoint not yet available
  const _login = useAuthStore((s) => s.login);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PatientProfileData>({ resolver: zodResolver(patientProfileSchema) });

  async function submit(_data: PatientProfileData) {
    setApiError('');
    setApiError('Patient registration is not yet available. Please check back soon.');
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-5">
      {/* Password */}
      <div>
        <Label htmlFor="password" className="mb-1.5">Password</Label>
        <div className="relative">
          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            autoComplete="new-password"
            className="pl-10 pr-10"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-xs text-[#FF6B35]">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <Label htmlFor="confirmPassword" className="mb-1.5">Confirm Password</Label>
        <div className="relative">
          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <Input
            id="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            className="pl-10 pr-10"
            {...register('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            tabIndex={-1}
          >
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-[#FF6B35]">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* Full Name */}
      <div>
        <Label htmlFor="name" className="mb-1.5">Full Name</Label>
        <div className="relative">
          <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <Input
            id="name"
            type="text"
            placeholder="Your full name"
            autoComplete="name"
            className="pl-10"
            {...register('name')}
          />
        </div>
        {errors.name && (
          <p className="mt-1 text-xs text-[#FF6B35]">{errors.name.message}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <Label htmlFor="phone" className="mb-1.5">Phone Number</Label>
        <div className="relative">
          <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <Input
            id="phone"
            type="tel"
            placeholder="+1 234 567 8900"
            autoComplete="tel"
            className="pl-10"
            {...register('phone')}
          />
        </div>
        {errors.phone && (
          <p className="mt-1 text-xs text-[#FF6B35]">{errors.phone.message}</p>
        )}
      </div>

      {apiError && (
        <p className="text-sm text-[#FF6B35] border border-[#FF6B35]/30 bg-[#FF6B35]/5 p-3">
          {apiError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Creating account…
          </>
        ) : (
          <>
            Complete Registration
            <ArrowRight size={16} />
          </>
        )}
      </Button>
    </form>
  );
}
