import Navbar from '@/components/Navbar';
import FomoLedger from '../components/FomoLedger';
import ResponseRateCard from '../components/ResponseRateCard';
import AvgResponseTimeCard from '../components/AvgResponseTimeCard';
import WeeklyFomoTrend from '../components/WeeklyFomoTrend';
import TopMissedMedicines from '../components/TopMissedMedicines';
import ResponseBreakdown from '../components/ResponseBreakdown';

export default function PharmacyAnalyticsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF9]">
      <Navbar />

      <main className="flex-1 px-6 md:px-20 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-[#1C1917] tracking-tight">
            Pharmacy Analytics
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Missed opportunities, potential revenue, and response analytics
          </p>
        </div>

        <div className="space-y-6">

          {/* Row 1 — Stat Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <ResponseRateCard />
            <AvgResponseTimeCard />
          </div>

          {/* Row 2 — Weekly Trend (full width) */}
          <WeeklyFomoTrend />

          {/* Row 3 — FOMO Ledger + Response Breakdown */}
          <div className="grid md:grid-cols-2 gap-6">
            <FomoLedger />
            <ResponseBreakdown />
          </div>

          {/* Row 4 — Top Missed Medicines (full width) */}
          <TopMissedMedicines />

        </div>
      </main>
    </div>
  );
}
