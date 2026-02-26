import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import fallback from '@/data/analyticsData.json';

interface TrendEntry {
  day: string;
  lost: number;
}

function WeeklyTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-stone-200 px-3 py-2 text-xs shadow-sm">
      <p className="font-bold text-[#1C1917] mb-0.5">{label}</p>
      <p className="text-[#FF6B35] font-semibold">Rs. {payload[0].value?.toLocaleString()}</p>
    </div>
  );
}

export default function WeeklyFomoTrend() {
  const [chartData, setChartData] = useState<TrendEntry[]>(fallback.weeklyFomoTrend);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.getWeeklyFomoTrend()
      .then((res: TrendEntry[]) => {
        if (cancelled) return;
        const hasData = Array.isArray(res) && res.some((d) => d.lost > 0);
        if (hasData) {
          setChartData(res);
          setUsingFallback(false);
        } else {
          setUsingFallback(true);
        }
      })
      .catch(() => {
        if (!cancelled) setUsingFallback(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const totalWeek = chartData.reduce((sum, d) => sum + d.lost, 0);

  return (
    <div className="bg-[#FAFAF9] border border-stone-200 rounded-sm p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-[#FF6B35]" />
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Weekly FOMO Trend</p>
        </div>
        <div className="flex items-start gap-3">
          {usingFallback && !loading && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 border border-stone-200 px-2 py-1 rounded-sm">
              Demo
            </span>
          )}
          <div className="text-right">
            <p className="text-sm font-black text-[#FF6B35]">Rs. {totalWeek.toLocaleString()}</p>
            <p className="text-[10px] text-stone-400 font-medium">lost this week</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-[140px] flex items-end gap-2 px-2">
          {[60, 80, 55, 90, 70, 85, 65].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-stone-200 animate-pulse rounded-sm"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="fomoGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: '#A8A29E' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip content={<WeeklyTooltip />} cursor={{ stroke: '#E7E5E4', strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="lost"
              stroke="#FF6B35"
              strokeWidth={2}
              fill="url(#fomoGradient)"
              dot={{ r: 3, fill: '#FF6B35', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#FF6B35', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
