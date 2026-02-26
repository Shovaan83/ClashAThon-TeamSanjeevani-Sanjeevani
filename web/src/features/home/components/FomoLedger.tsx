import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts';
import { TrendingDown, AlertCircle, Clock } from 'lucide-react';
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HourlyEntry {
  time: string;
  lost: number;
}

interface RecentMiss {
  item_name: string;
  amount: number;
  time: string;
}

interface FomoData {
  total_lost_today: number;
  hourly_data: HourlyEntry[];
  recent_misses: RecentMiss[];
}

// ─── Fallback demo data (used when API is unavailable) ───────────────────────

const DUMMY: FomoData = {
  total_lost_today: 4250,
  hourly_data: [
    { time: '9 AM', lost: 120 },
    { time: '10 AM', lost: 450 },
    { time: '11 AM', lost: 200 },
    { time: '12 PM', lost: 680 },
    { time: '1 PM', lost: 350 },
    { time: '2 PM', lost: 510 },
  ],
  recent_misses: [
    { item_name: 'Paracetamol 500mg', amount: 150, time: '2:15 PM' },
    { item_name: 'Amoxicillin 250mg', amount: 320, time: '1:40 PM' },
    { item_name: 'Cetirizine 10mg', amount: 80, time: '12:05 PM' },
  ],
};

// ─── Custom tooltip for the bar chart ────────────────────────────────────────

function FomoTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-stone-200 px-3 py-2 text-xs shadow-sm">
      <p className="font-bold text-[#1C1917] mb-0.5">{label}</p>
      <p className="text-[#FF6B35] font-semibold">Rs. {payload[0].value?.toLocaleString()}</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FomoLedger() {
  const [data, setData] = useState<FomoData>(DUMMY);
  const [usingFallback, setUsingFallback] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchFomo() {
      try {
        const res = await api.getFomoLedger();
        if (cancelled) return;

        const d: FomoData = {
          total_lost_today: Number(res.total_lost_today ?? 0),
          hourly_data: Array.isArray(res.hourly_data) ? res.hourly_data : [],
          recent_misses: Array.isArray(res.recent_misses) ? res.recent_misses : [],
        };

        // If backend returns empty data (no misses today), keep dummy for demo
        const isEmpty =
          d.total_lost_today === 0 &&
          d.hourly_data.length === 0 &&
          d.recent_misses.length === 0;

        if (isEmpty) {
          setUsingFallback(true);
          setData(DUMMY);
        } else {
          setData(d);
          setUsingFallback(false);
        }
      } catch {
        if (!cancelled) {
          setUsingFallback(true);
          setData(DUMMY);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchFomo();
    return () => { cancelled = true; };
  }, []);

  const formattedTotal = `Rs. ${data.total_lost_today.toLocaleString()}`;
  const chartData = data.hourly_data.length > 0 ? data.hourly_data : DUMMY.hourly_data;

  return (
    <div className="bg-[#FAFAF9] border border-stone-200 rounded-sm p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown size={18} className="text-[#FF6B35]" />
            <h2 className="text-base font-black text-[#1C1917] tracking-tight uppercase">
              FOMO Ledger
            </h2>
          </div>
          <p className="text-xs text-stone-400 font-medium">Potential Revenue Lost Today</p>
        </div>

        {usingFallback && !loading && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 border border-stone-200 px-2 py-1 rounded-sm">
            Demo
          </span>
        )}
      </div>

      {/* ── Big Number ── */}
      <div className="border border-[#FF6B35]/20 bg-[#FF6B35]/5 px-5 py-4">
        {loading ? (
          <div className="h-10 w-32 bg-stone-200 animate-pulse rounded" />
        ) : (
          <p className="text-4xl font-black text-[#FF6B35] leading-none tracking-tight">
            {formattedTotal}
          </p>
        )}
        <p className="text-xs text-stone-400 mt-1.5 font-medium">missed today</p>
      </div>

      {/* ── Bar Chart ── */}
      <div>
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">
          Missed Requests by Hour
        </p>

        {loading ? (
          <div className="h-24 flex items-end gap-2">
            {[40, 80, 55, 95, 60, 70].map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-stone-200 animate-pulse rounded-sm"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={chartData} barCategoryGap="25%">
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: '#A8A29E' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<FomoTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Bar dataKey="lost" fill="#FF6B35" radius={[0, 0, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Recent Misses ── */}
      <div>
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">
          Recent Misses
        </p>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-9 bg-stone-200 animate-pulse rounded-sm" />
            ))}
          </div>
        ) : data.recent_misses.length === 0 ? (
          <p className="text-xs text-stone-400 py-3 text-center">No misses recorded today.</p>
        ) : (
          <ul className="space-y-1.5">
            {data.recent_misses.map((miss, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between border border-stone-200 bg-white px-4 py-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <AlertCircle size={14} className="text-[#FF6B35] shrink-0" />
                  <span className="text-sm font-semibold text-[#1C1917] truncate">
                    {miss.item_name}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className="text-xs font-bold text-[#FF6B35]">
                    Rs. {miss.amount.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-stone-400">
                    <Clock size={10} />
                    {miss.time}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
