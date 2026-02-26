import { useEffect, useState } from 'react';
import { TrendingDown, BarChart2 } from 'lucide-react';
import { api } from '@/lib/api';

interface HourlyEntry {
  time: string;
  lost: number;
}

interface FomoData {
  total_lost_today: number;
  hourly_data: HourlyEntry[];
}

const DUMMY_DATA: HourlyEntry[] = [
  { time: '9am', lost: 120 },
  { time: '10am', lost: 340 },
  { time: '11am', lost: 200 },
  { time: '12pm', lost: 480 },
  { time: '1pm', lost: 150 },
  { time: '2pm', lost: 310 },
];

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

export default function FomoSummary() {
  const [data, setData] = useState<FomoData>({
    total_lost_today: DUMMY_DATA.reduce((s, d) => s + d.lost, 0),
    hourly_data: DUMMY_DATA,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchFomo() {
      try {
        const res = await api.getFomoLedger();
        if (cancelled) return;

        const hourly: HourlyEntry[] = Array.isArray(res.hourly_data) ? res.hourly_data : [];
        const total = Number(res.total_lost_today ?? 0);

        if (hourly.length > 0 || total > 0) {
          setData({
            total_lost_today: total,
            hourly_data: hourly.length > 0 ? hourly : DUMMY_DATA,
          });
        }
      } catch {
        // keep dummy data on error
      }
    }

    fetchFomo();
    return () => { cancelled = true; };
  }, []);

  const chartData = data.hourly_data.length > 0 ? data.hourly_data : DUMMY_DATA;
  const maxValue = Math.max(...chartData.map((d) => d.lost));

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-[#1C1917]">
        <BarChart2 size={22} className="text-[#FF6B35]" />
        FOMO Ledger
      </h2>

      <div className="p-6 border border-stone-200 bg-white">
        {/* Headline metric */}
        <div className="flex items-center gap-3 mb-6 p-4 border border-[#FF6B35]/20 bg-[#FF6B35]/5">
          <TrendingDown size={20} className="text-[#FF6B35] shrink-0" />
          <div>
            <p className="text-xs text-stone-500 font-bold uppercase tracking-widest">
              Potential Revenue Lost Today
            </p>
            <p className="text-2xl font-bold text-[#1C1917]">
              Rs. {data.total_lost_today.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Bar chart */}
        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">
          Missed Requests by Hour
        </p>
        <div className="flex items-end gap-3">
          {chartData.map((d) => (
            <FomoBar key={d.time} hour={d.time} value={d.lost} maxValue={maxValue} />
          ))}
        </div>
      </div>
    </div>
  );
}
