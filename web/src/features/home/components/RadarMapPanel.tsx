import { Crosshair } from 'lucide-react';

const PHARMACY_NODES = [
  { id: 1, label: 'Nepal Pharmacy',   top: '-8rem',   left: '-6rem',  active: true  },
  { id: 2, label: 'City Care',        top: '10rem',   right: '-9rem', active: true  },
  { id: 3, label: 'Everest Meds',     bottom: '-6rem', left: '8rem',  active: true  },
  { id: 4, label: 'LifeLine Drugs',   top: '-16rem',  right: '3rem',  active: false },
];

// SVG connection lines: [x1, y1, x2, y2] — all relative to 800×800 viewBox, center = 400,400
const CONNECTION_LINES = [
  { id: 1, x1: 400, y1: 400, x2: 304, y2: 272 },
  { id: 2, x1: 400, y1: 400, x2: 544, y2: 560 },
  { id: 3, x1: 400, y1: 400, x2: 528, y2: 296 },
];

export default function RadarMapPanel() {
  return (
    <div
      className="grow relative overflow-hidden"
      style={{
        backgroundColor: '#f5f5f0',
        backgroundImage:
          'linear-gradient(rgba(209,213,219,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(209,213,219,0.4) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    >
      {/* ── Top-right badge + location btn ─────────────────────── */}
      <div className="absolute top-5 right-5 z-10 flex flex-col gap-3 items-end">
        <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-sm border border-slate-200 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-green-500" />
            <span className="text-sm font-bold text-slate-700">12 Pharmacies</span>
          </div>
          <span className="h-4 w-px bg-slate-200" />
          <span className="text-xs text-slate-500 font-medium">Online Now</span>
        </div>
        <button className="size-10 bg-white rounded-lg shadow-sm border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#FF6B35] hover:border-[#FF6B35] transition-colors">
          <Crosshair size={18} />
        </button>
      </div>

      {/* ── Radar center ─────────────────────────────────────────── */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex items-center justify-center">

          {/* Expanding rings */}
          <div className="absolute size-140 border border-[#FF6B35]/10 rounded-full animate-radar-beam" />
          <div className="absolute size-140 border border-[#FF6B35]/15 rounded-full animate-radar-beam-delay-1" />
          <div className="absolute size-140 bg-[#FF6B35]/4 rounded-full animate-radar-beam-delay-2" />

          {/* Static faint ring (radius boundary) */}
          <div className="absolute size-105 border border-[#FF6B35]/10 rounded-full" />

          {/* SVG dashed connection lines */}
          <svg
            className="absolute pointer-events-none overflow-visible"
            width="800"
            height="800"
            viewBox="0 0 800 800"
            style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
          >
            <defs>
              <linearGradient id="gradLine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#FF6B35" stopOpacity="0" />
                <stop offset="50%"  stopColor="#FF6B35" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#FF6B35" stopOpacity="0" />
              </linearGradient>
            </defs>
            {CONNECTION_LINES.map((l) => (
              <line
                key={l.id}
                x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                stroke="url(#gradLine)"
                strokeWidth="2"
                strokeDasharray="5 5"
                className="animate-pulse"
              />
            ))}
          </svg>

          {/* User / patient dot */}
          <div className="relative z-10 size-6 bg-[#FF6B35] rounded-full shadow-[0_0_20px_rgba(255,107,53,0.6)] flex items-center justify-center">
            <div className="absolute inset-0 bg-[#FF6B35] rounded-full animate-ping opacity-75" />
            <div className="size-2.5 bg-white rounded-full relative z-20" />
          </div>

          {/* Pharmacy nodes */}
          {PHARMACY_NODES.map((node) => (
            <div
              key={node.id}
              className={`absolute flex flex-col items-center gap-1 group cursor-pointer ${!node.active ? 'opacity-40' : ''}`}
              style={{
                top: node.top,
                bottom: node.bottom,
                left: node.left,
                right: node.right,
              }}
            >
              <div
                className={`size-10 rounded-full bg-white shadow-md flex items-center justify-center transition-transform group-hover:scale-110 ${
                  node.active
                    ? 'border-2 border-[#2D5A40]'
                    : 'border border-slate-300'
                }`}
              >
                {/* Pharmacy cross icon */}
                <svg viewBox="0 0 24 24" className={`size-4 ${node.active ? 'text-[#2D5A40]' : 'text-slate-400'}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9h6V3h6v6h6v6h-6v6H9v-6H3z" />
                </svg>
              </div>
              {node.active && (
                <span className="text-xs font-bold text-slate-700 bg-white/90 px-2 py-0.5 rounded shadow backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {node.label}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom stats bar ──────────────────────────────────────── */}
      <div className="absolute bottom-5 right-5 z-10">
        <div className="bg-white/85 backdrop-blur-md border border-slate-200 rounded-xl shadow-lg px-6 py-4 flex items-center gap-8">
          <div className="text-center">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Wait Time</p>
            <p className="text-xl font-bold text-slate-800 mt-0.5">~5 min</p>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="text-center">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Responses</p>
            <p className="text-xl font-bold text-[#FF6B35] mt-0.5">0/3</p>
          </div>
        </div>
      </div>
    </div>
  );
}
