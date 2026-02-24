import { CheckCircle, XCircle, Clock, ToggleRight } from 'lucide-react';

interface StatRowProps {
  label: string;
  value: string;
  valueColor?: string;
}

function StatRow({ label, value, valueColor = 'text-[#1C1917]' }: StatRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-stone-100 last:border-b-0">
      <p className="text-sm text-stone-500">{label}</p>
      <p className={`text-sm font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}

export default function PharmacySidebar() {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="p-6 border border-stone-200 bg-white">
        <h3 className="text-lg font-bold mb-4 text-[#1C1917]">Today's Stats</h3>
        <div>
          <StatRow label="Requests Received" value="14" />
          <StatRow label="Accepted" value="9" valueColor="text-[#2D5A40]" />
          <StatRow label="Missed / Declined" value="5" valueColor="text-[#FF6B35]" />
          <StatRow label="Revenue Earned" value="Rs. 4,280" valueColor="text-[#2D5A40]" />
        </div>
      </div>

      {/* Store Status */}
      <div className="p-6 border border-stone-200 bg-white">
        <h3 className="text-lg font-bold mb-4 text-[#1C1917]">Store Status</h3>

        <div className="space-y-3">
          {/* Online toggle row */}
          <div className="flex items-center justify-between p-3 border border-[#2D5A40]/20 bg-[#2D5A40]/5">
            <div className="flex items-center gap-2">
              <ToggleRight size={16} className="text-[#2D5A40]" />
              <span className="text-sm font-bold text-[#2D5A40]">Accepting Pings</span>
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-[#2D5A40]">
              <span className="size-2 rounded-full bg-[#2D5A40] animate-pulse" />
              LIVE
            </span>
          </div>

          <div className="flex items-center gap-3 text-sm text-stone-500">
            <CheckCircle size={14} className="text-[#2D5A40]" />
            Siren alerts active
          </div>
          <div className="flex items-center gap-3 text-sm text-stone-500">
            <Clock size={14} className="text-stone-400" />
            Open until 9:00 PM
          </div>
          <div className="flex items-center gap-3 text-sm text-stone-500">
            <XCircle size={14} className="text-[#FF6B35]" />
            Voice mode: off
          </div>
        </div>

        <button className="w-full mt-5 py-2.5 border border-stone-200 text-stone-600 text-sm font-bold hover:bg-stone-100 transition-colors">
          Go Offline
        </button>
      </div>
    </div>
  );
}
