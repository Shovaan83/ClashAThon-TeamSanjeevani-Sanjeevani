import { CheckCircle, Clock, Mic, MicOff, Radio } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useRequestStore } from '@/store/useRequestStore';

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

// Detect support once so the toggle can be disabled if unavailable
const isSpeechSupported =
  typeof window !== 'undefined' &&
  !!(window.SpeechRecognition || window.webkitSpeechRecognition);

export default function PharmacySidebar({ stats, wsConnected }: PharmacySidebarProps) {
  const total = (stats?.accepted ?? 0) + (stats?.rejected ?? 0);
  const { voiceMode, toggleVoiceMode } = useRequestStore();
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
              <Radio size={16} className={wsConnected ? 'text-[#2D5A40]' : 'text-[#FF6B35]'} />
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
          {/* Voice mode toggle */}
          <div
            className={`flex items-center justify-between p-3 border transition-colors ${
              voiceMode
                ? 'border-[#2D5A40]/20 bg-[#2D5A40]/5'
                : 'border-stone-200 bg-stone-50'
            }`}
          >
            <div className="flex items-center gap-2">
              {voiceMode ? (
                <Mic size={14} className="text-[#2D5A40]" />
              ) : (
                <MicOff size={14} className="text-stone-400" />
              )}
              <span
                className={`text-sm font-bold ${voiceMode ? 'text-[#2D5A40]' : 'text-stone-400'}`}
              >
                {voiceMode ? 'Awaz: on' : 'Awaz: off'}
              </span>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <Switch
                checked={voiceMode}
                onCheckedChange={toggleVoiceMode}
                disabled={!isSpeechSupported}
                aria-label="Toggle Awaz voice mode"
              />
              {!isSpeechSupported && (
                <span className="text-[10px] text-stone-400 leading-tight">Chrome/Edge only</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
