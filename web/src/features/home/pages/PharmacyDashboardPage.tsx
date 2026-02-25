import { useEffect, useState, useCallback } from 'react';
import { Wifi, Loader2, History, AlertCircle } from 'lucide-react';

import HomeNavbar from '../components/HomeNavbar';
import HomeFooter from '../components/HomeFooter';
import IncomingRequestCard from '../components/IncomingRequestCard';
import IncomingRequestModal from '../components/IncomingRequestModal';
import FomoSummary from '../components/FomoSummary';
import PharmacySidebar, { type PharmacyStats } from '../components/PharmacySidebar';
import { usePharmacyWebSocket } from '@/hooks/useWebSocket';
import { useRequestStore, type IncomingRequest } from '@/store/useRequestStore';
import { api } from '@/lib/api';

interface HistoryItem {
  id: string;
  patientName: string;
  quantity: number;
  status: string;
  prescriptionImageUrl?: string;
  timestamp: number;
}

export default function PharmacyDashboardPage() {
  const { pendingRequests, setPendingRequests, showRequest } = useRequestStore();
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState<PharmacyStats>({ accepted: 0, rejected: 0, pending: 0 });

  const fetchExistingRequests = useCallback(async (silent = false) => {
    if (!silent) setFetchError(null);
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

      // On silent polls, only add genuinely new requests (don't wipe the list,
      // which would remove anything added by WebSocket between polls).
      if (silent) {
        const { pendingRequests: current, addPendingRequest } = useRequestStore.getState();
        const currentIds = new Set(current.map((r) => r.id));
        for (const req of mapped) {
          if (!currentIds.has(req.id)) {
            addPendingRequest(req);
          }
        }
      } else {
        setPendingRequests(mapped);
      }

      const historyMapped: HistoryItem[] = (res.history ?? []).map((r: Record<string, unknown>) => ({
        id: String(r.id),
        patientName: (r.patient_name as string) ?? 'Anonymous Patient',
        quantity: (r.quantity as number) ?? 1,
        status: (r.status as string) ?? 'ACCEPTED',
        prescriptionImageUrl: r.image as string | undefined,
        timestamp: new Date(r.updated_at as string).getTime(),
      }));
      setHistory(historyMapped);

      if (res.stats) {
        setStats({
          accepted: res.stats.accepted ?? 0,
          rejected: res.stats.rejected ?? 0,
          pending: mapped.length,
        });
      }
    } catch (err) {
      if (!silent) setFetchError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [setPendingRequests]);

  // Initial fetch on mount
  useEffect(() => {
    fetchExistingRequests();
  }, [fetchExistingRequests]);

  // Polling fallback: re-sync pending requests every 20 s in case a WebSocket
  // notification was missed (e.g. connection dropped, or same-browser testing).
  useEffect(() => {
    const id = setInterval(() => {
      fetchExistingRequests(true);
    }, 20_000);
    return () => clearInterval(id);
  }, [fetchExistingRequests]);

  const { connected } = usePharmacyWebSocket();

  // Keep pending count in stats in sync
  useEffect(() => {
    setStats((s) => ({ ...s, pending: pendingRequests.length }));
  }, [pendingRequests.length]);

  const handleAccept = (request: IncomingRequest) => {
    showRequest(request);
  };

  const handleDecline = async (request: IncomingRequest) => {
    try {
      await api.respondToMedicineRequest({
        request_id: request.id,
        response_type: 'REJECTED',
      });
    } catch (err) {
      console.error('Decline failed:', err);
    } finally {
      // Always remove — if the backend rejected it (already taken / already responded),
      // the request is no longer actionable and should leave the list.
      useRequestStore.getState().removePendingRequest(request.id);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-[#FAFAF9]">
      <HomeNavbar />

      <main className="flex-1 px-6 lg:px-20 py-8 max-w-350 mx-auto w-full">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1C1917] tracking-tight">Pharmacy Dashboard</h1>
            <p className="text-sm text-stone-400 mt-1">
              Monitor incoming patient requests and manage your availability.
            </p>
          </div>
          {/* WebSocket status pill */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider border ${connected ? 'border-[#2D5A40]/20 bg-[#2D5A40]/5 text-[#2D5A40]' : 'border-[#FF6B35]/20 bg-[#FF6B35]/5 text-[#FF6B35]'}`}>
            <span className={`size-2 rounded-full ${connected ? 'bg-[#2D5A40] animate-pulse' : 'bg-[#FF6B35]'}`} />
            {connected ? 'Live' : 'Connecting…'}
          </div>
        </div>

        {fetchError && (
          <div className="mb-6 flex items-center gap-3 p-4 border border-[#FF6B35]/30 bg-[#FF6B35]/5 text-[#FF6B35]">
            <AlertCircle size={16} className="shrink-0" />
            <p className="text-sm font-medium">{fetchError}</p>
            <button
              onClick={fetchExistingRequests}
              className="ml-auto text-xs font-bold underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">

            {/* ── Incoming Pings ─────────────────────────────── */}
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
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16 text-stone-400">
                  <Loader2 size={24} className="animate-spin" />
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-stone-200 bg-white">
                  <Wifi size={32} className="mx-auto text-stone-300 mb-3" />
                  <p className="text-stone-500 font-medium">No pending requests</p>
                  <p className="text-stone-400 text-sm mt-1">
                    New patient broadcasts will appear here in real-time.
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

            {/* ── Request History ────────────────────────────── */}
            {!loading && (
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 text-[#1C1917] mb-6">
                  <History size={20} className="text-[#2D5A40]" />
                  Request History
                  {history.length > 0 && (
                    <span className="ml-2 text-sm font-medium text-stone-400">
                      ({history.length})
                    </span>
                  )}
                </h2>

                {history.length === 0 ? (
                  <div className="py-10 text-center border border-dashed border-stone-200 bg-white">
                    <History size={28} className="mx-auto text-stone-300 mb-3" />
                    <p className="text-stone-500 font-medium">No history yet</p>
                    <p className="text-stone-400 text-sm mt-1">Requests you accept will appear here.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {history.map((item) => (
                      <IncomingRequestCard
                        key={item.id}
                        status={item.status === 'ACCEPTED' ? 'accepted' : 'missed'}
                        medicineName={`Prescription #${item.id}`}
                        distanceKm={0}
                        patientLabel={`${item.patientName} • Qty: ${item.quantity}`}
                        isUrgent={false}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            <FomoSummary />
          </div>

          <PharmacySidebar stats={stats} wsConnected={connected} />
        </div>
      </main>

      <HomeFooter />
      <IncomingRequestModal />
    </div>
  );
}
