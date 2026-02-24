import { Activity, Wifi } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

import HomeNavbar from '../components/HomeNavbar';
import HeroSection from '../components/HeroSection';
import HomeFooter from '../components/HomeFooter';
import SystemPulse from '../components/SystemPulse';

// Patient-specific
import PingCard from '../components/PingCard';
import RecentBroadcasts from '../components/RecentBroadcasts';
import EmergencyBox from '../components/EmergencyBox';

// Pharmacy-specific
import IncomingRequestCard from '../components/IncomingRequestCard';
import FomoSummary from '../components/FomoSummary';
import PharmacySidebar from '../components/PharmacySidebar';

function PatientDashboard() {
  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-[#1C1917]">
              <Activity size={22} className="text-[#FF6B35]" />
              Active Radar Pings
            </h2>
            <a className="text-[#2D5A40] text-sm font-bold hover:underline underline-offset-2" href="#">
              View Broadcast History
            </a>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <PingCard
              status="searching"
              medicineName="Insulin Glargine"
              subtitle="Radius: 2.5km • 12 Pharmacies Pinged"
              actionLabel="Cancel Ping"
            />
            <PingCard
              status="found"
              medicineName="Azithromycin 500mg"
              subtitle="Accepted by Sanjeevani Medical (800m)"
              actionLabel="Reserve & Navigate"
            />
          </div>
        </div>
        <SystemPulse />
      </div>

      <div className="space-y-6">
        <RecentBroadcasts />
        <EmergencyBox />
      </div>
    </div>
  );
}

function PharmacyDashboard() {
  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-[#1C1917]">
              <Wifi size={22} className="text-[#FF6B35]" />
              Incoming Pings
            </h2>
            <a className="text-[#2D5A40] text-sm font-bold hover:underline underline-offset-2" href="#">
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
  );
}

export default function HomePage() {
  const { user } = useAuthStore();

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-[#FAFAF9]">
      <HomeNavbar />

      <main className="flex-1">
        <HeroSection role={user?.role ?? null} />

        <section className="py-12 px-6 lg:px-20 max-w-350 mx-auto">
          {user?.role === 'pharmacy' ? <PharmacyDashboard /> : <PatientDashboard />}
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}
