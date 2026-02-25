import { MapPin, Check, X, RefreshCw } from 'lucide-react';

export type RequestStatus = 'pending' | 'accepted' | 'missed';

interface IncomingRequestCardProps {
  status: RequestStatus;
  medicineName: string;
  distanceKm: number;
  patientLabel: string;
  isUrgent?: boolean;
}

const STATUS_CONFIG: Record<RequestStatus, { borderColor: string; stripColor: string; badgeClass: string; badgeLabel: string }> = {
  pending: {
    borderColor: 'border-[#FF6B35]/30',
    stripColor: 'bg-[#FF6B35] animate-pulse',
    badgeClass: 'border-[#FF6B35]/20 bg-[#FF6B35]/5 text-[#FF6B35]',
    badgeLabel: 'Incoming',
  },
  accepted: {
    borderColor: 'border-[#2D5A40]/30',
    stripColor: 'bg-[#2D5A40]',
    badgeClass: 'border-[#2D5A40]/20 bg-[#2D5A40]/5 text-[#2D5A40]',
    badgeLabel: 'Accepted',
  },
  missed: {
    borderColor: 'border-stone-200',
    stripColor: 'bg-stone-300',
    badgeClass: 'border-stone-200 bg-stone-100 text-stone-400',
    badgeLabel: 'Missed',
  },
};

export default function IncomingRequestCard({
  status,
  medicineName,
  distanceKm,
  patientLabel,
  isUrgent = false,
}: IncomingRequestCardProps) {
  const cfg = STATUS_CONFIG[status];

  return (
    <div className={`p-5 border bg-white relative overflow-hidden ${cfg.borderColor}`}>
      {/* Status strip */}
      <div className={`absolute top-0 left-0 w-1 h-full ${cfg.stripColor}`} />

      <div className="pl-2">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-stone-400" />
            <span className="text-xs text-stone-500 font-medium">{distanceKm} km away</span>
            {isUrgent && (
              <span className="px-1.5 py-0.5 bg-[#FF6B35] text-white text-[9px] font-bold uppercase tracking-wider">
                Urgent
              </span>
            )}
          </div>
          <span className={`px-2 py-1 border text-[10px] font-bold uppercase tracking-wider ${cfg.badgeClass}`}>
            {cfg.badgeLabel}
          </span>
        </div>

        <h3 className="font-bold text-lg text-[#1C1917] mb-1">{medicineName}</h3>
        <p className="text-stone-500 text-sm mb-4">{patientLabel}</p>

        {status === 'pending' && (
          <div className="grid grid-cols-2 gap-2">
            <button className="flex items-center justify-center gap-1.5 py-2 bg-[#2D5A40] text-white text-sm font-bold hover:brightness-110 transition-all">
              <Check size={14} /> Accept
            </button>
            <button className="flex items-center justify-center gap-1.5 py-2 border border-stone-200 text-stone-600 text-sm font-bold hover:bg-stone-100 transition-all">
              <X size={14} /> Decline
            </button>
          </div>
        )}

        {status === 'accepted' && (
          <button className="w-full py-2 bg-[#2D5A40] text-white text-sm font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2">
            <Check size={14} /> Confirmed — Awaiting Patient
          </button>
        )}

        {status === 'missed' && (
          <button className="w-full py-2 border border-stone-200 text-stone-400 text-sm font-bold cursor-not-allowed flex items-center justify-center gap-2">
            <RefreshCw size={14} /> Request Expired
          </button>
        )}
      </div>
    </div>
  );
}
