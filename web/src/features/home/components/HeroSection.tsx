import { type ReactNode } from 'react';
import { MapPin, Radio, Timer, Zap, Store } from 'lucide-react';
import { type UserRole } from '@/store/useAuthStore';

interface HeroSectionProps {
  role: UserRole | null;
}

/**
 * Hero only supports these roles.
 * Do NOT couple to full auth role union.
 */
type HeroRole = 'patient' | 'pharmacy';

const COPY: Record<
  HeroRole,
  {
    tag: string;
    headline: ReactNode;
    sub: string;
    primaryLabel: string;
    secondaryLabel: string;
  }
> = {
  patient: {
    tag: 'The Friction We Forget',
    headline: (
      <>
        Stop the search. <br />
        <span className="text-[#2D5A40]">Start the finding.</span>
      </>
    ),
    sub: "Nepal's first reverse-marketplace for medicine. Broadcast your prescription to nearby pharmacies and get real-time availability in seconds. No more driving from shop to shop.",
    primaryLabel: 'Broadcast a Ping',
    secondaryLabel: 'How it Works',
  },
  pharmacy: {
    tag: 'Your Store, Amplified',
    headline: (
      <>
        Reach patients <br />
        <span className="text-[#2D5A40]">before they walk away.</span>
      </>
    ),
    sub: 'Real-time medicine requests delivered directly to your counter. Accept with one tap, respond by voice, and never miss a sale again.',
    primaryLabel: 'View Incoming Pings',
    secondaryLabel: 'Manage Store',
  },
};

export default function HeroSection({ role }: HeroSectionProps) {
  /**
   * Map full auth role → hero-supported role
   * Admin (or anything else) defaults to patient.
   */
  const resolvedRole: HeroRole =
    role === 'pharmacy' ? 'pharmacy' : 'patient';

  const copy = COPY[resolvedRole];

  const statLabel =
    resolvedRole === 'pharmacy' ? 'Requests Today' : 'Avg. Match Time';

  const statValue =
    resolvedRole === 'pharmacy' ? '14' : '42 Sec';

  const StatIcon =
    resolvedRole === 'pharmacy' ? Zap : Timer;

  return (
    <section className="bg-white border-b border-stone-200 py-12 lg:py-16 px-6 lg:px-20">
      <div className="max-w-300 mx-auto grid lg:grid-cols-2 gap-12 items-center">

        {/* Left: Copy */}
        <div className="flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-stone-200 bg-[#FAFAF9] text-[#2D5A40] text-xs font-bold uppercase tracking-widest w-fit">
            <MapPin size={12} />
            {copy.tag}
          </div>

          <h1 className="text-[#1C1917] text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
            {copy.headline}
          </h1>

          <p className="text-stone-500 text-lg max-w-lg leading-relaxed">
            {copy.sub}
          </p>

          <div className="flex gap-4">
            <button className="bg-[#2D5A40] text-white px-8 py-3 font-bold hover:brightness-110 transition-all flex items-center gap-2">
              {resolvedRole === 'pharmacy' ? (
                <Zap size={18} />
              ) : (
                <Radio size={18} />
              )}
              {copy.primaryLabel}
            </button>

            <button className="border border-stone-200 text-[#2D5A40] px-8 py-3 font-bold hover:bg-[#FAFAF9] transition-all flex items-center gap-2">
              {resolvedRole === 'pharmacy' && (
                <Store size={16} />
              )}
              {copy.secondaryLabel}
            </button>
          </div>
        </div>

        {/* Right: Map preview */}
        <div className="relative">
          <div className="border border-stone-200 bg-white p-4 overflow-hidden">
            <div
              className="w-full aspect-video bg-cover bg-center"
              style={{
                backgroundImage:
                  'url("https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80")',
              }}
              aria-label="Live radar map showing nearby pharmacies"
              role="img"
            />

            {/* Floating stat card */}
            <div className="absolute -bottom-6 -left-6 bg-white border border-stone-200 p-5 flex items-center gap-4 shadow-md">
              <div className="size-12 bg-[#FAFAF9] border border-stone-200 flex items-center justify-center text-[#FF6B35]">
                <StatIcon size={24} />
              </div>
              <div>
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                  {statLabel}
                </p>
                <p className="text-2xl font-bold text-[#1C1917]">
                  {statValue}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}