import { AlertTriangle, Megaphone } from 'lucide-react';

export default function EmergencyBox() {
  return (
    <div className="p-6 bg-[#FF6B35] border border-[#FF6B35]">
      <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-white">
        <AlertTriangle size={18} />
        Life-Critical Request?
      </h3>
      <p className="text-white/90 text-sm mb-6 leading-relaxed">
        Trigger an emergency ping. This overrides silent modes on pharmacy devices
        and expands the search radius automatically.
      </p>
      <button className="w-full py-3 bg-white text-[#FF6B35] font-bold text-sm hover:bg-stone-50 transition-colors flex items-center justify-center gap-2">
        <Megaphone size={16} />
        Trigger Emergency Ping
      </button>
    </div>
  );
}
