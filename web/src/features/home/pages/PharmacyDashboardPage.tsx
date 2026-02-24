import { Wifi } from 'lucide-react';

import HomeNavbar from '../components/HomeNavbar';
import HomeFooter from '../components/HomeFooter';
import IncomingRequestCard from '../components/IncomingRequestCard';
import FomoSummary from '../components/FomoSummary';
import PharmacySidebar from '../components/PharmacySidebar';

export default function PharmacyDashboardPage() {
  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-[#FAFAF9]">
      <HomeNavbar />

      <main className="flex-1 px-6 lg:px-20 py-8 max-w-350 mx-auto w-full">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1C1917] tracking-tight">Pharmacy Dashboard</h1>
          <p className="text-sm text-stone-400 mt-1">
            Monitor incoming patient requests and manage your availability.
          </p>
        </div>

        {/* Dashboard grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2 text-[#1C1917]">
                  <Wifi size={20} className="text-[#FF6B35]" />
                  Incoming Pings
                </h2>
                <a
                  className="text-[#2D5A40] text-sm font-bold hover:underline underline-offset-2"
                  href="#"
                >
                  View Full History
                </a>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <IncomingRequestCard
                  status="pending"
                  medicineName="Insulin Glargine"
                  distanceKm={0.8}
                  patientLabel="Anonymous Patient • Urgent request"
                  isUrgent
                />
                <IncomingRequestCard
                  status="accepted"
                  medicineName="Azithromycin 500mg"
                  distanceKm={1.4}
                  patientLabel="Anonymous Patient • Standard request"
                />
              </div>
            </div>
            <FomoSummary />
          </div>

          <PharmacySidebar />
        </div>
      </main>

      <HomeFooter />
    </div>
  );
}
