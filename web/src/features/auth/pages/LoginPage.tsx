import { Link } from 'react-router-dom';
import { Cross, User, Pill, ShieldCheck } from 'lucide-react';
import LoginForm from '../components/LoginForm';
import SocialLoginButtons from '../components/SocialLoginButtons';

export default function LoginPage() {
  return (
    <div className="flex-1 bg-[#FAFAF9] px-6 py-12 lg:px-20 xl:px-32 overflow-y-auto">
      {/* Mobile logo */}
      <div className="lg:hidden flex items-center gap-3 mb-10">
        <div className="size-8 bg-[#2D5A40] flex items-center justify-center flex-shrink-0">
          <Cross size={18} className="text-white" strokeWidth={2.5} />
        </div>
        <h1 className="logo-font text-2xl text-[#2D5A40] tracking-tighter">Sanjeevani</h1>
      </div>

      <div className="max-w-md w-full mx-auto">

        {/* Secure portal badge */}
        <div className="flex items-center gap-2 mb-7">
          <ShieldCheck size={13} className="text-[#2D5A40]" />
          <span className="text-xs font-bold tracking-widest text-[#2D5A40] uppercase">
            Secure Portal Access
          </span>
        </div>

        {/* Heading */}
        <div className="mb-7">
          <h2 className="text-4xl font-bold text-[#1C1917] leading-[1.15]">
            Welcome<br />Back.
          </h2>
          <p className="text-stone-500 mt-3 text-sm leading-relaxed">
            Sign in to access your healthcare portal. Your role is automatically
            detected from your credentials.
          </p>
        </div>

        {/* Role access cards */}
        <div className="grid grid-cols-2 border border-stone-200 mb-8">
          <div className="flex items-center gap-3 p-3.5 border-r border-stone-200 bg-white group">
            <div className="size-8 border border-stone-200 bg-[#FAFAF9] flex items-center justify-center flex-shrink-0 group-hover:bg-[#2D5A40] group-hover:border-[#2D5A40] transition-colors">
              <User size={14} className="text-[#2D5A40] group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1C1917]">Patient</p>
              <p className="text-[11px] text-stone-400 leading-tight">Personal health access</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3.5 bg-white group">
            <div className="size-8 border border-stone-200 bg-[#FAFAF9] flex items-center justify-center flex-shrink-0 group-hover:bg-[#FF6B35] group-hover:border-[#FF6B35] transition-colors">
              <Pill size={14} className="text-[#FF6B35] group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1C1917]">Pharmacy</p>
              <p className="text-[11px] text-stone-400 leading-tight">Verified partner access</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <LoginForm />

        {/* Social */}
        <SocialLoginButtons />

        {/* Sign up */}
        <div className="mt-8 pt-6 border-t border-stone-200 flex items-center justify-between">
          <p className="text-sm text-stone-500">New to Sanjeevani?</p>
          <Link
            to="/signup"
            className="text-sm font-bold text-[#FF6B35] hover:underline underline-offset-2"
          >
            Create an account →
          </Link>
        </div>

      </div>
    </div>
  );
}
