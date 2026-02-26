import AnimatedBeamBroadcast from './AnimatedBeamBroadcast';
import AnimatedBeamAcceptance from './AnimatedBeamAcceptance';

const steps = [
  { number: '01', label: 'Patient uploads prescription' },
  { number: '02', label: 'Sanjeevani broadcasts to nearby pharmacies' },
  { number: '03', label: 'Pharmacies respond with availability' },
  { number: '04', label: 'Patient picks the best offer' },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-white border-b border-stone-200 py-16 px-6 lg:px-20">
      <div className="max-w-7xl mx-auto">

        {/* Section header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-stone-200 bg-[#FAFAF9] text-[#2D5A40] text-xs font-bold uppercase tracking-widest mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B35]" />
            How It Works
          </div>
          <h2 className="text-[#1C1917] text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            From prescription to pharmacy <br className="hidden lg:block" />
            <span className="text-[#2D5A40]">in under 60 seconds.</span>
          </h2>
        </div>

        {/* Step pills */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          {steps.map((step) => (
            <div
              key={step.number}
              className="border border-stone-200 bg-[#FAFAF9] p-4"
            >
              <p className="text-[#FF6B35] text-xs font-black uppercase tracking-widest mb-1">
                Step {step.number}
              </p>
              <p className="text-[#1C1917] text-sm font-semibold leading-snug">
                {step.label}
              </p>
            </div>
          ))}
        </div>

        {/* Two bento cards with animated beams */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Card 1: Broadcast */}
          <div className="border border-stone-200 bg-white overflow-hidden">
            <div className="border-b border-stone-200 px-6 py-4 flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-[#FF6B35] animate-ping" />
              <div>
                <p className="text-xs text-stone-500 font-bold uppercase tracking-widest">
                  Step 1 — 2
                </p>
                <h3 className="text-[#1C1917] font-black text-lg leading-tight">
                  Broadcast Your Request
                </h3>
              </div>
            </div>
            <div className="p-6 h-96">
              <AnimatedBeamBroadcast />
            </div>
            <div className="border-t border-stone-200 px-6 py-4 bg-[#FAFAF9]">
              <p className="text-stone-500 text-sm leading-relaxed">
                One tap sends your prescription to all active pharmacies within a 1–5 km radius via the{' '}
                <span className="text-[#2D5A40] font-semibold">Sanjeevani Radar</span>.
                No calls. No driving. No guessing.
              </p>
            </div>
          </div>

          {/* Card 2: Acceptance */}
          <div className="border border-stone-200 bg-white overflow-hidden">
            <div className="border-b border-stone-200 px-6 py-4 flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-[#2D5A40] animate-pulse" />
              <div>
                <p className="text-xs text-stone-500 font-bold uppercase tracking-widest">
                  Step 3 — 4
                </p>
                <h3 className="text-[#1C1917] font-black text-lg leading-tight">
                  Pharmacies Respond
                </h3>
              </div>
            </div>
            <div className="p-6 h-96">
              <AnimatedBeamAcceptance />
            </div>
            <div className="border-t border-stone-200 px-6 py-4 bg-[#FAFAF9]">
              <p className="text-stone-500 text-sm leading-relaxed">
                Pharmacists shout{' '}
                <span className="font-bold text-[#1C1917]">"Cha!"</span> to
                accept via voice, or tap to confirm. Offers arrive in your app
                in real-time — pick the closest or cheapest.
              </p>
            </div>
          </div>

        </div>

        {/* Bottom feature row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="border border-stone-200 p-5 flex gap-4 items-start">
            <div className="shrink-0 h-10 w-10 bg-[#FAFAF9] border border-stone-200 flex items-center justify-center">
              <span className="text-[#FF6B35] font-black text-sm">42s</span>
            </div>
            <div>
              <p className="font-bold text-[#1C1917] text-sm">Average Match Time</p>
              <p className="text-stone-500 text-xs mt-0.5 leading-snug">
                From broadcast to first pharmacy response
              </p>
            </div>
          </div>
          <div className="border border-stone-200 p-5 flex gap-4 items-start">
            <div className="shrink-0 h-10 w-10 bg-[#FAFAF9] border border-stone-200 flex items-center justify-center">
              <span className="text-[#2D5A40] font-black text-sm">5km</span>
            </div>
            <div>
              <p className="font-bold text-[#1C1917] text-sm">Geofenced Radius</p>
              <p className="text-stone-500 text-xs mt-0.5 leading-snug">
                Only nearby pharmacies receive your ping
              </p>
            </div>
          </div>
          <div className="border border-stone-200 p-5 flex gap-4 items-start">
            <div className="shrink-0 h-10 w-10 bg-[#FAFAF9] border border-stone-200 flex items-center justify-center">
              <span className="text-[#FF6B35] font-black text-xs">Awaz</span>
            </div>
            <div>
              <p className="font-bold text-[#1C1917] text-sm">Voice Acceptance</p>
              <p className="text-stone-500 text-xs mt-0.5 leading-snug">
                Pharmacists accept hands-free with "Cha!"
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
