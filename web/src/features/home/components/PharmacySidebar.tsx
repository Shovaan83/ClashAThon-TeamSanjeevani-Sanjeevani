import { CheckCircle, XCircle, Clock, ToggleRight } from 'lucide-react';

interface StatRowProps {
  label: string;
  value: string;
  valueColor?: string;
}

export interface PharmacyStats {
  accepted: number;
  rejected: number;
  pending: number;
}

function StatRow({ label, value, valueColor = 'text-[#1C1917]' }: StatRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-stone-100 last:border-b-0">
      <p className="text-sm text-stone-500">{label}</p>
      <p className={`text-sm font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}

interface PharmacySidebarProps {
  stats?: PharmacyStats;
  wsConnected?: boolean;
}

export default function PharmacySidebar({ stats, wsConnected }: PharmacySidebarProps) {
  const total = (stats?.accepted ?? 0) + (stats?.rejected ?? 0);
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="p-6 border border-stone-200 bg-white">
        <h3 className="text-lg font-bold mb-4 text-[#1C1917]">Stats</h3>
        <div>
          <StatRow label="Total Responded" value={String(total)} />
          <StatRow label="Accepted" value={String(stats?.accepted ?? '—')} valueColor="text-[#2D5A40]" />
          <StatRow label="Rejected" value={String(stats?.rejected ?? '—')} valueColor="text-[#FF6B35]" />
          <StatRow label="Pending Now" value={String(stats?.pending ?? '—')} />
        </div>
      </div>

      {/* Connection Status */}
      <div className="p-6 border border-stone-200 bg-white">
        <h3 className="text-lg font-bold mb-4 text-[#1C1917]">Connection</h3>

        <div className="space-y-3">
          <div className={`flex items-center justify-between p-3 border ${wsConnected ? 'border-[#2D5A40]/20 bg-[#2D5A40]/5' : 'border-[#FF6B35]/20 bg-[#FF6B35]/5'}`}>
            <div className="flex items-center gap-2">
              <ToggleRight size={16} className={wsConnected ? 'text-[#2D5A40]' : 'text-[#FF6B35]'} />
              <span className={`text-sm font-bold ${wsConnected ? 'text-[#2D5A40]' : 'text-[#FF6B35]'}`}>
                {wsConnected ? 'Accepting Pings' : 'Reconnecting…'}
              </span>
            </div>
            <span className={`flex items-center gap-1 text-xs font-bold ${wsConnected ? 'text-[#2D5A40]' : 'text-[#FF6B35]'}`}>
              <span className={`size-2 rounded-full ${wsConnected ? 'bg-[#2D5A40] animate-pulse' : 'bg-[#FF6B35]'}`} />
              {wsConnected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-sm text-stone-500">
            <CheckCircle size={14} className="text-[#2D5A40]" />
            Real-time alerts active
          </div>
          <div className="flex items-center gap-3 text-sm text-stone-500">
            <Clock size={14} className="text-stone-400" />
            Requests expire after 10 min
          </div>
          <div className="flex items-center gap-3 text-sm text-stone-500">
            <XCircle size={14} className="text-[#FF6B35]" />
            Voice mode: off
          </div>
        </div>
      </div>
    </div>
  );
}
