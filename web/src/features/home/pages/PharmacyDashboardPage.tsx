import { useEffect, useState, useCallback } from 'react';
import { Wifi, Loader2 } from 'lucide-react';

import HomeNavbar from '../components/HomeNavbar';
import HomeFooter from '../components/HomeFooter';
import IncomingRequestCard from '../components/IncomingRequestCard';
import IncomingRequestModal from '../components/IncomingRequestModal';
import FomoSummary from '../components/FomoSummary';
import PharmacySidebar from '../components/PharmacySidebar';
import { usePharmacyWebSocket } from '@/hooks/useWebSocket';
import { useRequestStore, type IncomingRequest } from '@/store/useRequestStore';
import { api } from '@/lib/api';

export default function PharmacyDashboardPage() {
  const { pendingRequests, setPendingRequests, showRequest } = useRequestStore();
  const [loading, setLoading] = useState(true);

  const fetchExistingRequests = useCallback(async () => {
    try {
      const res = await api.getMedicineRequests();
      const mapped: IncomingRequest[] = (res.requests ?? []).map((r: Record<string, unknown>) => ({
        id: String(r.id),
        patientName: (r.patient_name as string) ?? 'Anonymous Patient',
        patientId: '',
        location: 'Nearby',
        prescriptionImageUrl: r.image as string | undefined,
        medicines: [],
        isUrgent: false,
        quantity: r.quantity as number | undefined,
        timestamp: new Date(r.created_at as string).getTime(),
      }));
      setPendingRequests(mapped);
    } catch {
      // silently fail -- WebSocket will provide real-time data
    } finally {
      setLoading(false);
    }
  }, [setPendingRequests]);

  useEffect(() => {
    fetchExistingRequests();
  }, [fetchExistingRequests]);

  usePharmacyWebSocket();

  const handleAccept = (request: IncomingRequest) => {
    showRequest(request);
  };

  const handleDecline = async (request: IncomingRequest) => {
    try {
      await api.respondToMedicineRequest({
        request_id: request.id,
        response_type: 'REJECTED',
      });
      useRequestStore.getState().removePendingRequest(request.id);
    } catch (err) {
      console.error('Decline failed:', err);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-[#FAFAF9]">
      <HomeNavbar />

      <main className="flex-1 px-6 lg:px-20 py-8 max-w-350 mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1C1917] tracking-tight">Pharmacy Dashboard</h1>
          <p className="text-sm text-stone-400 mt-1">
            Monitor incoming patient requests and manage your availability.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2 text-[#1C1917]">
                  <Wifi size={20} className="text-[#FF6B35]" />
                  Incoming Pings
                  {pendingRequests.length > 0 && (
                    <span className="ml-2 text-sm font-medium text-stone-400">
                      ({pendingRequests.length})
                    </span>
                  )}
                </h2>
                <a
                  className="text-[#2D5A40] text-sm font-bold hover:underline underline-offset-2"
                  href="#"
                >
                  View Full History
                </a>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16 text-stone-400">
                  <Loader2 size={24} className="animate-spin" />
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-stone-200 bg-white">
                  <Wifi size={32} className="mx-auto text-stone-300 mb-3" />
                  <p className="text-stone-500 font-medium">No incoming requests</p>
                  <p className="text-stone-400 text-sm mt-1">
                    New patient requests will appear here in real-time.
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {pendingRequests.map((req) => (
                    <IncomingRequestCard
                      key={req.id}
                      status="pending"
                      medicineName={`Prescription #${req.id}`}
                      distanceKm={req.distanceKm ?? 0}
                      patientLabel={`${req.patientName} • Qty: ${req.quantity ?? 1}`}
                      isUrgent={req.isUrgent}
                      onAccept={() => handleAccept(req)}
                      onDecline={() => handleDecline(req)}
                    />
                  ))}
                </div>
              )}
            </div>
            <FomoSummary />
          </div>

          <PharmacySidebar />
        </div>
      </main>

      <HomeFooter />
      <IncomingRequestModal />
    </div>
  );
}
