import { MapPin } from 'lucide-react';

export default function MapPlaceholder() {
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-stone-100 border border-stone-200">
      {/* Grid texture */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(#d4d4d4 1px, transparent 1px), linear-gradient(90deg, #d4d4d4 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Subtle concentric rings suggesting a ping radius */}
      <div className="absolute size-72 rounded-full border border-stone-300/60" />
      <div className="absolute size-48 rounded-full border border-stone-300/80" />
      <div className="absolute size-24 rounded-full border border-stone-400/60" />

      {/* Center content */}
      <div className="relative flex flex-col items-center gap-3 text-stone-400">
        <div className="flex size-14 items-center justify-center border-2 border-stone-300 bg-white">
          <MapPin size={24} className="text-[#FF6B35]" />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-stone-500 uppercase tracking-widest">
            Leaflet Map Loads Here
          </p>
          <p className="text-xs text-stone-400 mt-1">
            react-leaflet integration coming next
          </p>
        </div>
      </div>

      {/* Corner label */}
      <div className="absolute bottom-3 right-3 text-[10px] font-bold uppercase tracking-wider text-stone-400 border border-stone-300 bg-white px-2 py-1">
        Map Placeholder
      </div>
    </div>
  );
}
