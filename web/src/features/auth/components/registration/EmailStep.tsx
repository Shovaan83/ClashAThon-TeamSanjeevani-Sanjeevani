import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowRight, Loader2 } from 'lucide-react';
import { emailStepSchema, type EmailStepData } from '@/features/auth/schemas/registerSchema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RoleSwitcher, { type Role } from '../RoleSwitcher';
import { api } from '@/lib/api';
import type { UserRole } from '@/store/useAuthStore';

interface EmailStepProps {
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
  onSubmit: (email: string) => void;
}

export default function EmailStep({ role, onRoleChange, onSubmit }: EmailStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<EmailStepData>({ resolver: zodResolver(emailStepSchema) });

  async function submit({ email }: EmailStepData) {
    try {
      await api.sendOtp(email);
      onSubmit(email);
    } catch (err) {
      setError('email', {
        message: err instanceof Error ? err.message : 'Failed to send OTP. Please try again.',
      });
    }
  }

  return (
    <div>
      <RoleSwitcher onRoleChange={(r: Role) => onRoleChange(r as UserRole)} />
      <form onSubmit={handleSubmit(submit)} noValidate>
        <div className="mb-5">
          <Label htmlFor="email" className="mb-1.5">
            Email Address
          </Label>
          <div className="relative">
            <Mail
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              className="pl-10"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-[#FF6B35]">{errors.email.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Sending OTP…
            </>
          ) : (
            <>
              Continue
              <ArrowRight size={16} />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
