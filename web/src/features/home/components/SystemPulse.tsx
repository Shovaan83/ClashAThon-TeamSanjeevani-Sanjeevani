import { Network } from 'lucide-react';

interface PulseMetricProps {
  label: string;
  value: string;
  unit: string;
  fillPercent: number;
  fillColor: string;
}

function PulseMetric({ label, value, unit, fillPercent, fillColor }: PulseMetricProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-stone-500">{label}</p>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-[#1C1917]">{value}</span>
        <span className="text-stone-400 text-sm pb-1">{unit}</span>
      </div>
      <div className="w-full h-1.5 bg-stone-200 overflow-hidden">
        <div
          className="h-full transition-all"
          style={{ width: `${fillPercent}%`, backgroundColor: fillColor }}
        />
      </div>
    </div>
  );
}

export default function SystemPulse() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-[#1C1917]">
        <Network size={22} className="text-[#2D5A40]" />
        System Pulse Overview
      </h2>

      <div className="p-6 border border-stone-200 bg-[#FAFAF9]">
        <div className="grid md:grid-cols-3 gap-6 divide-x divide-stone-200">
          <PulseMetric
            label="Live Pharmacies (Local)"
            value="48"
            unit="Online"
            fillPercent={80}
            fillColor="#2D5A40"
          />
          <div className="md:pl-6">
            <PulseMetric
              label="Connection Success Rate"
              value="94%"
              unit="Found"
              fillPercent={94}
              fillColor="#FF6B35"
            />
          </div>
          <div className="md:pl-6">
            <PulseMetric
              label="Distance Saved Today"
              value="124"
              unit="Km"
              fillPercent={100}
              fillColor="#3B82F6"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
