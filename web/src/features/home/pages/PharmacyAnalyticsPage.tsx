import Navbar from '@/components/Navbar';
import { BarChart2, TrendingUp, Clock, AlertCircle } from 'lucide-react';

export default function PharmacyAnalyticsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF9]">
      <Navbar />

      <main className="flex-1 px-6 md:px-20 py-12">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-[#1C1917] tracking-tight">
            FOMO Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Missed opportunities, potential revenue, and response analytics
          </p>
        </div>

        {/* Coming soon banner */}
        <div className="rounded-2xl border border-dashed border-[#2D5A40]/30 bg-white px-8 py-14 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-[#2D5A40]/8">
            <BarChart2 size={32} className="text-[#2D5A40]" strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-bold text-[#1C1917]">Analytics Coming Soon</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
            Your FOMO Ledger will show missed requests, potential revenue lost, and
            peak demand windows — helping you stay stocked and never miss a sale.
          </p>
        </div>

        {/* Preview cards */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: <AlertCircle size={20} className="text-rose-400" />,
              label: 'Missed Requests',
              value: '—',
              sub: 'Requests you declined or expired',
            },
            {
              icon: <TrendingUp size={20} className="text-[#FF6B35]" />,
              label: 'Potential Revenue Lost',
              value: '—',
              sub: 'Estimated value of missed orders',
            },
            {
              icon: <Clock size={20} className="text-[#2D5A40]" />,
              label: 'Peak Demand Hours',
              value: '—',
              sub: 'When patients need you most',
            },
          ].map(({ icon, label, value, sub }) => (
            <div
              key={label}
              className="rounded-xl border border-slate-100 bg-white px-5 py-5 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                {icon}
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {label}
                </span>
              </div>
              <p className="text-3xl font-black text-[#1C1917]">{value}</p>
              <p className="mt-1 text-[11px] text-slate-400">{sub}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
