import { type ReactNode } from 'react';
import { MapPin, Radio, Zap, Store, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { type UserRole } from '@/store/useAuthStore';
import AnimatedBeamBroadcast from './AnimatedBeamBroadcast';

interface HeroSectionProps {
  role: UserRole | null;
}

type HeroRole = 'patient' | 'pharmacy';

const COPY: Record<
  HeroRole,
  {
    tag: string;
    headline: ReactNode;
    sub: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string;
    secondaryHref: string;
  }
> = {
  patient: {
    tag: 'The Friction We Forget',
    headline: (
      <>
        Stop the search.{' '}
        <span className="text-[#FF6B35]">Start the finding.</span>
      </>
    ),
    sub: "Nepal's first reverse-marketplace for medicine. Broadcast your prescription to nearby pharmacies and get real-time availability in seconds — no more driving from shop to shop.",
    primaryLabel: 'Broadcast a Ping',
    primaryHref: '/broadcast',
    secondaryLabel: 'How it Works',
    secondaryHref: '#how-it-works',
  },
  pharmacy: {
    tag: 'Your Store, Amplified',
    headline: (
      <>
        Reach patients{' '}
        <span className="text-[#FF6B35]">before they walk away.</span>
      </>
    ),
    sub: 'Real-time medicine requests delivered directly to your counter. Accept with one tap, respond by voice, and never miss a sale again.',
    primaryLabel: 'View Incoming Pings',
    primaryHref: '/dashboard/pharmacy',
    secondaryLabel: 'Manage Store',
    secondaryHref: '/dashboard/pharmacy',
  },
};

export default function HeroSection({ role }: HeroSectionProps) {
  const resolvedRole: HeroRole =
    role === 'pharmacy' ? 'pharmacy' : 'patient';

  const copy = COPY[resolvedRole];

  return (
    <section className="relative bg-background-dark overflow-hidden">
      {/* Subtle grid texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-20 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left: Copy */}
          <div className="flex flex-col gap-7">
            {/* Logo + tag */}
            <div className="flex items-center gap-4">
              <img
                src="/logo.png"
                alt="Sanjeevani"
                className="h-14 w-14 rounded-full border border-stone-700 object-contain bg-[#1e2822]"
              />
              <div className="flex flex-col gap-1">
                <span className="text-white font-black text-xl tracking-tight logo-font">
                  SANJEEVANI
                </span>
                <div className="inline-flex items-center gap-2 text-[#FF6B35] text-xs font-bold uppercase tracking-widest">
                  <MapPin size={11} />
                  {copy.tag}
                </div>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-white text-5xl lg:text-6xl font-black leading-[1.08] tracking-tight">
              {copy.headline}
            </h1>

            {/* Sub-copy */}
            <p className="text-stone-400 text-lg leading-relaxed max-w-lg">
              {copy.sub}
            </p>

            {/* Stats row */}
            <div className="flex gap-6 border-t border-stone-700 pt-6">
              <div>
                <p className="text-3xl font-black text-white">42s</p>
                <p className="text-xs text-stone-500 font-bold uppercase tracking-widest mt-1">
                  Avg. Match Time
                </p>
              </div>
              <div className="w-px bg-stone-700" />
              <div>
                <p className="text-3xl font-black text-white">5km</p>
                <p className="text-xs text-stone-500 font-bold uppercase tracking-widest mt-1">
                  Broadcast Radius
                </p>
              </div>
              <div className="w-px bg-stone-700" />
              <div>
                <p className="text-3xl font-black text-[#FF6B35]">Live</p>
                <p className="text-xs text-stone-500 font-bold uppercase tracking-widest mt-1">
                  Real-time Pings
                </p>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <Link
                to={copy.primaryHref}
                className="inline-flex items-center gap-2 bg-[#FF6B35] text-white px-7 py-3.5 font-bold text-sm uppercase tracking-wide hover:brightness-110 transition-all"
              >
                {resolvedRole === 'pharmacy' ? (
                  <Zap size={16} />
                ) : (
                  <Radio size={16} />
                )}
                {copy.primaryLabel}
              </Link>

              <a
                href={copy.secondaryHref}
                className="inline-flex items-center gap-2 border border-stone-600 text-stone-300 px-7 py-3.5 font-bold text-sm uppercase tracking-wide hover:border-stone-400 hover:text-white transition-all"
              >
                {resolvedRole === 'pharmacy' && <Store size={14} />}
                {copy.secondaryLabel}
                <ArrowRight size={14} />
              </a>
            </div>
          </div>

          {/* Right: Animated Beam Broadcast Visualization */}
          <div className="flex flex-col gap-4">
            <div className="border border-stone-700 bg-[#1a2420]/80 p-1 rounded-sm">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-stone-700">
                <div className="h-2 w-2 rounded-full bg-[#FF6B35] animate-pulse" />
                <span className="text-xs text-stone-500 font-mono font-medium tracking-wide">
                  SANJEEVANI RADAR — LIVE
                </span>
              </div>
              <div className="p-4 h-96">
                <AnimatedBeamBroadcast />
              </div>
            </div>
            <p className="text-xs text-stone-600 font-medium text-center tracking-wide uppercase">
              Patient broadcasts prescription → Nearby pharmacies notified instantly
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
