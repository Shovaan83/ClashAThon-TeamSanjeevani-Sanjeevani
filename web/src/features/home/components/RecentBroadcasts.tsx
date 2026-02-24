import { Clock, Receipt, Droplets, ExternalLink } from 'lucide-react';
import { type LucideIcon } from 'lucide-react';

interface BroadcastItem {
  id: string;
  icon: LucideIcon;
  name: string;
  detail: string;
}

const BROADCASTS: BroadcastItem[] = [
  {
    id: '1',
    icon: Clock,
    name: 'Paracetamol 500mg',
    detail: 'Found in 12s • Feb 24',
  },
  {
    id: '2',
    icon: Receipt,
    name: 'Asthma Inhaler',
    detail: 'Found in 45s • Feb 22',
  },
  {
    id: '3',
    icon: Droplets,
    name: 'Post-Op Antibiotics',
    detail: 'Found in 2m • Feb 18',
  },
];

export default function RecentBroadcasts() {
  return (
    <div className="p-6 border border-stone-200 bg-white">
      <h3 className="text-lg font-bold mb-4 text-[#1C1917]">Recent Broadcasts</h3>

      <div className="space-y-4">
        {BROADCASTS.map(({ id, icon: Icon, name, detail }) => (
          <div
            key={id}
            className="flex items-center gap-4 group cursor-pointer border border-transparent hover:border-stone-200 p-2 -mx-2 transition-colors"
          >
            <div className="size-10 border border-stone-200 bg-[#FAFAF9] flex items-center justify-center text-stone-400 group-hover:text-[#2D5A40] group-hover:border-[#2D5A40]/20 transition-colors shrink-0">
              <Icon size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1C1917]">{name}</p>
              <p className="text-xs text-stone-400">{detail}</p>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-6 pt-4 border-t border-stone-200 text-[#2D5A40] text-sm font-bold flex items-center justify-center gap-2 hover:opacity-80 transition-opacity">
        Full Ledger <ExternalLink size={13} />
      </button>
    </div>
  );
}
