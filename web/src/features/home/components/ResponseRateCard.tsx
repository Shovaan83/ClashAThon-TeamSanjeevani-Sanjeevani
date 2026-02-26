import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { api } from '@/lib/api';
import fallback from '@/data/analyticsData.json';

interface ResponseRateData {
  total_requests: number;
  responded: number;
  rate: number;
}

export default function ResponseRateCard() {
  const [data, setData] = useState<ResponseRateData>(fallback.responseRate);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.getAnalyticsSummary()
      .then((res) => {
        if (cancelled) return;
        const d = res?.response_rate;
        if (d && d.total_requests > 0) {
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

  const { total_requests, responded, rate } = data;

  const color =
    rate >= 80
      ? { text: 'text-[#2D5A40]', bg: 'bg-[#2D5A40]', border: 'border-[#2D5A40]/20', fill: 'bg-[#2D5A40]/5', label: 'Good' }
      : rate >= 60
      ? { text: 'text-amber-600', bg: 'bg-amber-500', border: 'border-amber-200', fill: 'bg-amber-50', label: 'Fair' }
      : { text: 'text-[#FF6B35]', bg: 'bg-[#FF6B35]', border: 'border-[#FF6B35]/20', fill: 'bg-[#FF6B35]/5', label: 'Low' };

  return (
    <div className="bg-[#FAFAF9] border border-stone-200 rounded-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={16} className={color.text} />
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Response Rate</p>
        </div>
        <div className="flex items-center gap-2">
          {usingFallback && !loading && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 border border-stone-200 px-2 py-1 rounded-sm">
              Demo
            </span>
          )}
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 border rounded-sm ${color.text} ${color.border} ${color.fill}`}>
            {color.label}
          </span>
        </div>
      </div>

      <div className={`border px-5 py-4 ${color.border} ${color.fill}`}>
        {loading ? (
          <div className="h-10 w-24 bg-stone-200 animate-pulse rounded" />
        ) : (
          <p className={`text-4xl font-black leading-none tracking-tight ${color.text}`}>
            {rate.toFixed(1)}%
          </p>
        )}
        <p className="text-xs text-stone-400 mt-1.5 font-medium">of requests responded</p>
      </div>

      <div>
        <div className="w-full h-2 bg-stone-100 rounded-none overflow-hidden">
          <div className={`h-full transition-all ${color.bg}`} style={{ width: `${rate}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-stone-400 font-medium">
          <span>{responded} responded</span>
          <span>{total_requests} total</span>
        </div>
      </div>
    </div>
  );
}
