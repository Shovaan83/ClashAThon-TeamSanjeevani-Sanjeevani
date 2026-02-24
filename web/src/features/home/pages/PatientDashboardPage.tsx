import BroadcastPanel from '../components/BroadcastPanel';
import RadarMapPanel from '../components/RadarMapPanel';
import DashboardNavbar from '../components/DashboardNavbar';

export default function PatientDashboardPage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f5f5f0]">
      <DashboardNavbar />

      <main className="flex flex-1 overflow-hidden">
        <BroadcastPanel />
        <RadarMapPanel />
      </main>
    </div>
  );
}

