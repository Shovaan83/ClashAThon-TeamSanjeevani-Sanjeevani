import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { loginSchema, type LoginFormData } from '../schemas/registerSchema';
import { useAuthStore } from '../../../store/useAuthStore';
import { api, mapBackendRole } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginFormData) {
    setApiError('');
    try {
      const res = await api.login(data.email, data.password);
      const { user, tokens } = res.data;
      const role = mapBackendRole(user.role);

      login(tokens.access, {
        id: String(user.id),
        name: user.name,
        email: user.email,
        role,
        isVerified: true,
      }, tokens.refresh);

      navigate(role === 'patient' ? '/dashboard/patient' : '/dashboard/pharmacy');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Login failed.');
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>

      {/* Email */}
      <div>
        <Label htmlFor="login-email" className="mb-1.5">
          Email Address
        </Label>
        <div className="relative">
          <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          <Input
            id="login-email"
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            className="pl-10"
            {...register('email')}
          />
        </div>
        {errors.email && (
          <p className="mt-1.5 text-xs text-[#FF6B35]">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label htmlFor="login-password">Password</Label>
          <button
            type="button"
            className="text-xs text-stone-400 hover:text-[#2D5A40] font-medium transition-colors"
          >
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          <Input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="current-password"
            className="pl-10 pr-10"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1.5 text-xs text-[#FF6B35]">{errors.password.message}</p>
        )}
      </div>

      {apiError && (
        <p className="text-sm text-[#FF6B35] border border-[#FF6B35]/30 bg-[#FF6B35]/5 p-3">
          {apiError}
        </p>
      )}

      {/* Submit */}
      <Button type="submit" disabled={isSubmitting} size="lg" className="w-full mt-2">
        {isSubmitting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Signing In…
          </>
        ) : (
          <>
            Sign In
            <ArrowRight size={16} />
          </>
        )}
      </Button>

    </form>
  );
}
