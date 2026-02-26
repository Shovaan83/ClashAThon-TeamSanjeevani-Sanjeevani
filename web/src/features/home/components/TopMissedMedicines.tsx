import { useEffect, useState } from 'react';
import { Pill } from 'lucide-react';
import { api } from '@/lib/api';
import fallback from '@/data/analyticsData.json';

interface MedicineEntry {
  name: string;
  count: number;
  total_lost: number;
}

export default function TopMissedMedicines() {
  const [medicines, setMedicines] = useState<MedicineEntry[]>(fallback.topMissedMedicines);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.getTopMissedMedicines()
      .then((res: MedicineEntry[]) => {
        if (cancelled) return;
        if (Array.isArray(res) && res.length > 0) {
          setMedicines(res);
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

  const maxCount = medicines.length > 0 ? Math.max(...medicines.map((m) => m.count)) : 1;

  return (
    <div className="bg-[#FAFAF9] border border-stone-200 rounded-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pill size={16} className="text-[#FF6B35]" />
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Top Missed Medicines</p>
        </div>
        {usingFallback && !loading && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 border border-stone-200 px-2 py-1 rounded-sm">
            Demo
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-stone-100 animate-pulse rounded-sm" />
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {medicines.map((med, idx) => (
            <li key={med.name} className="flex items-center gap-3 border border-stone-200 bg-white px-4 py-3">
              <span className="text-xs font-black text-stone-300 w-4 shrink-0">{idx + 1}</span>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1C1917] truncate">{med.name}</p>
                <div className="mt-1.5 w-full h-1 bg-stone-100">
                  <div
                    className="h-full bg-[#FF6B35]/60"
                    style={{ width: `${(med.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>

              <div className="shrink-0 text-right ml-3">
                <p className="text-xs font-bold text-[#FF6B35]">Rs. {med.total_lost.toLocaleString()}</p>
                <p className="text-[10px] text-stone-400 font-medium">{med.count}× missed</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
