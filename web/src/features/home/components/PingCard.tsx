import { Radar, Pill } from 'lucide-react';

export type PingStatus = 'searching' | 'found';

interface PingCardProps {
  status: PingStatus;
  medicineName: string;
  subtitle: string;
  actionLabel: string;
}

export default function PingCard({
  status,
  medicineName,
  subtitle,
  actionLabel,
}: PingCardProps) {
  const isSearching = status === 'searching';

  return (
    <div
      className={`p-5 border bg-white relative overflow-hidden ${
        isSearching ? 'border-[#FF6B35]/30' : 'border-[#2D5A40]/30'
      }`}
    >
      {/* Status indicator strip */}
      <div
        className={`absolute top-0 left-0 w-1 h-full ${
          isSearching ? 'bg-[#FF6B35] animate-pulse' : 'bg-[#2D5A40]'
        }`}
      />

      <div className="flex items-start justify-between mb-4 pl-2">
        {/* Icon */}
        <div
          className={`size-12 border flex items-center justify-center ${
            isSearching
              ? 'border-[#FF6B35]/20 bg-[#FF6B35]/5 text-[#FF6B35]'
              : 'border-[#2D5A40]/20 bg-[#2D5A40]/5 text-[#2D5A40]'
          }`}
        >
          {isSearching ? <Radar size={22} /> : <Pill size={22} />}
        </div>

        {/* Badge */}
        {isSearching ? (
          <span className="flex items-center gap-1 px-2 py-1 border border-[#FF6B35]/20 bg-[#FF6B35]/5 text-[#FF6B35] text-[10px] font-bold uppercase tracking-wider">
            <span className="size-1.5 rounded-full bg-[#FF6B35] animate-ping" />
            Searching
          </span>
        ) : (
          <span className="px-2 py-1 border border-[#2D5A40]/20 bg-[#2D5A40]/5 text-[#2D5A40] text-[10px] font-bold uppercase tracking-wider">
            Found Match
          </span>
        )}
      </div>

      <div className="pl-2">
        <h3 className="font-bold text-lg text-[#1C1917]">{medicineName}</h3>
        <p className="text-stone-500 text-sm mb-4">{subtitle}</p>

        <button
          className={`w-full py-2 text-sm font-bold transition-all ${
            isSearching
              ? 'bg-[#FAFAF9] border border-stone-200 text-stone-700 hover:bg-stone-100'
              : 'bg-[#2D5A40] text-white hover:brightness-110 flex items-center justify-center gap-2'
          }`}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
