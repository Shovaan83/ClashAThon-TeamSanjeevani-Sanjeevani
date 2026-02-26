import { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts';
import { BarChart2 } from 'lucide-react';
import { api } from '@/lib/api';
import fallback from '@/data/analyticsData.json';

interface BreakdownData {
  accepted: number;
  rejected: number;
  substituted: number;
}

const COLORS = ['#2D5A40', '#FF6B35', '#3B82F6'];

function BreakdownTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-stone-200 px-3 py-2 text-xs shadow-sm">
      <p className="font-bold text-[#1C1917] mb-0.5">{payload[0].name}</p>
      <p className="font-semibold" style={{ color: payload[0].payload.fill }}>
        {payload[0].value} requests
      </p>
    </div>
  );
}

export default function ResponseBreakdown() {
  const [data, setData] = useState<BreakdownData>(fallback.responseBreakdown);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.getAnalyticsSummary()
      .then((res) => {
        if (cancelled) return;
        const d = res?.response_breakdown;
        const hasData = d && (d.accepted + d.rejected + d.substituted) > 0;
        if (hasData) {
          setData(d);
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

  const { accepted, rejected, substituted } = data;
  const total = accepted + rejected + substituted;

  const chartData = [
    { name: 'Accepted', value: accepted, fill: COLORS[0] },
    { name: 'Rejected', value: rejected, fill: COLORS[1] },
    { name: 'Substituted', value: substituted, fill: COLORS[2] },
  ];

  return (
    <div className="bg-[#FAFAF9] border border-stone-200 rounded-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 size={16} className="text-[#2D5A40]" />
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Response Breakdown</p>
        </div>
        {usingFallback && !loading && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 border border-stone-200 px-2 py-1 rounded-sm">
            Demo
          </span>
        )}
      </div>

      {loading ? (
        <div className="h-28 flex items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-transparent" />
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <ResponsiveContainer width={120} height={120}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={52}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<BreakdownTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="flex-1 space-y-2">
            {chartData.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: entry.fill }} />
                  <span className="text-xs text-stone-500">{entry.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#1C1917]">{entry.value}</span>
                  <span className="text-[10px] text-stone-400">
                    {total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
            ))}

            <div className="pt-1 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-400">Total</span>
                <span className="text-xs font-black text-[#1C1917]">{total}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
