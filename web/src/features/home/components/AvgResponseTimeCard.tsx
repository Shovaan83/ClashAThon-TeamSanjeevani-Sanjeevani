import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { api } from '@/lib/api';
import fallback from '@/data/analyticsData.json';

interface AvgResponseData {
  avg_minutes: number;
  benchmark: string;
}

export default function AvgResponseTimeCard() {
  const [data, setData] = useState<AvgResponseData>(fallback.avgResponseTime);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.getAnalyticsSummary()
      .then((res) => {
        if (cancelled) return;
        const d = res?.avg_response_time;
        if (d && d.avg_minutes > 0) {
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

  const { avg_minutes, benchmark } = data;

  const config =
    benchmark === 'good'
      ? { text: 'text-[#2D5A40]', border: 'border-[#2D5A40]/20', fill: 'bg-[#2D5A40]/5', label: 'Excellent', desc: 'Under 5 min target' }
      : benchmark === 'fair'
      ? { text: 'text-amber-600', border: 'border-amber-200', fill: 'bg-amber-50', label: 'Fair', desc: '5–10 min range' }
      : { text: 'text-[#FF6B35]', border: 'border-[#FF6B35]/20', fill: 'bg-[#FF6B35]/5', label: 'Slow', desc: 'Over 10 min' };

  const minutes = Math.floor(avg_minutes);
  const seconds = Math.round((avg_minutes - minutes) * 60);

  return (
    <div className="bg-[#FAFAF9] border border-stone-200 rounded-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={16} className={config.text} />
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Avg Response Time</p>
        </div>
        <div className="flex items-center gap-2">
          {usingFallback && !loading && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 border border-stone-200 px-2 py-1 rounded-sm">
              Demo
            </span>
          )}
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 border rounded-sm ${config.text} ${config.border} ${config.fill}`}>
            {config.label}
          </span>
        </div>
      </div>

      <div className={`border px-5 py-4 ${config.border} ${config.fill}`}>
        {loading ? (
          <div className="h-10 w-28 bg-stone-200 animate-pulse rounded" />
        ) : (
          <p className={`text-4xl font-black leading-none tracking-tight ${config.text}`}>
            {minutes}m {seconds}s
          </p>
        )}
        <p className="text-xs text-stone-400 mt-1.5 font-medium">average per request today</p>
      </div>

      <div className="flex items-center gap-2 text-xs text-stone-400">
        <Clock size={12} className="shrink-0" />
        <span>{config.desc}</span>
      </div>
    </div>
  );
}
