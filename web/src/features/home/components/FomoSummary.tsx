import { TrendingDown, BarChart2 } from 'lucide-react';

interface FomoBarProps {
  hour: string;
  value: number;
  maxValue: number;
}

function FomoBar({ hour, value, maxValue }: FomoBarProps) {
  const heightPercent = Math.round((value / maxValue) * 100);
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] text-stone-400 font-mono">Rs.{value}</span>
      <div className="w-8 bg-stone-100 border border-stone-200" style={{ height: '60px' }}>
        <div
          className="w-full bg-[#FF6B35] transition-all"
          style={{ height: `${heightPercent}%`, marginTop: `${100 - heightPercent}%` }}
        />
      </div>
      <span className="text-[10px] text-stone-400">{hour}</span>
    </div>
  );
}

const FOMO_DATA = [
  { hour: '9am', value: 120 },
  { hour: '10am', value: 340 },
  { hour: '11am', value: 200 },
  { hour: '12pm', value: 480 },
  { hour: '1pm', value: 150 },
  { hour: '2pm', value: 310 },
];

export default function FomoSummary() {
  const maxValue = Math.max(...FOMO_DATA.map((d) => d.value));
  const total = FOMO_DATA.reduce((sum, d) => sum + d.value, 0);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-[#1C1917]">
        <BarChart2 size={22} className="text-[#FF6B35]" />
        FOMO Ledger
      </h2>

      <div className="p-6 border border-stone-200 bg-white">
        {/* Headline metric */}
        <div className="flex items-center gap-3 mb-6 p-4 border border-[#FF6B35]/20 bg-[#FF6B35]/5">
          <TrendingDown size={20} className="text-[#FF6B35] flex-shrink-0" />
          <div>
            <p className="text-xs text-stone-500 font-bold uppercase tracking-widest">
              Potential Revenue Lost Today
            </p>
            <p className="text-2xl font-bold text-[#1C1917]">Rs. {total.toLocaleString()}</p>
          </div>
        </div>

        {/* Bar chart */}
        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">
          Missed Requests by Hour
        </p>
        <div className="flex items-end gap-3">
          {FOMO_DATA.map((d) => (
            <FomoBar key={d.hour} hour={d.hour} value={d.value} maxValue={maxValue} />
          ))}
        </div>
      </div>
    </div>
  );
}
