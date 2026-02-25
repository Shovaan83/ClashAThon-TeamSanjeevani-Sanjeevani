import { useState } from 'react';
import {
  CheckCircle2, RefreshCw, XCircle, Loader2, Star, Volume2, ChevronDown, ChevronUp, X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { usePatientOffersStore, type PharmacyOffer } from '@/store/usePatientOffersStore';
import { useNotificationStore } from '@/store/useNotificationStore';

// ── Per-offer card ───────────────────────────────────────────────────────────

interface OfferCardProps {
  offer: PharmacyOffer;
  onSelect: (responseId: number, pharmacyName: string) => void;
  isSelecting: boolean;
  selectedResponseId: number | null;
}

function OfferCard({ offer, onSelect, isSelecting, selectedResponseId }: OfferCardProps) {
  const isThisSelecting = isSelecting && selectedResponseId === offer.responseId;
  const anySelecting = isSelecting;

  const isAccepted = offer.responseType === 'ACCEPTED';
  const isSubstitute = offer.responseType === 'SUBSTITUTE';
  const isRejected = offer.responseType === 'REJECTED';

  const [audioOpen, setAudioOpen] = useState(false);

  return (
    <div
      className={`rounded-xl border p-4 flex flex-col gap-3 transition-all ${
        isRejected
          ? 'border-slate-200 bg-slate-50 opacity-60'
          : isAccepted
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-orange-200 bg-orange-50'
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`shrink-0 size-9 rounded-full flex items-center justify-center ${
            isRejected ? 'bg-slate-200' : isAccepted ? 'bg-emerald-100' : 'bg-orange-100'
          }`}>
            {isAccepted && <CheckCircle2 size={18} className="text-emerald-600" />}
            {isSubstitute && <RefreshCw size={18} className="text-orange-500" />}
            {isRejected && <XCircle size={18} className="text-slate-400" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{offer.pharmacyName}</p>
            <p className={`text-xs font-medium ${
              isRejected ? 'text-slate-400' : isAccepted ? 'text-emerald-600' : 'text-orange-600'
            }`}>
              {isAccepted ? 'Has your medicine' : isSubstitute ? 'Substitute offered' : 'Declined'}
            </p>
          </div>
        </div>

        {/* Select button */}
        {!isRejected && (
          <button
            onClick={() => onSelect(offer.responseId, offer.pharmacyName)}
            disabled={anySelecting}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isAccepted
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                : 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isThisSelecting ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Star size={12} />
            )}
            {isThisSelecting ? 'Selecting…' : 'Select'}
          </button>
        )}
      </div>

      {/* Substitute detail */}
      {isSubstitute && offer.substituteName && (
        <div className="bg-orange-100 rounded-lg px-3 py-2 text-xs">
          <span className="font-semibold text-orange-800">Substitute: </span>
          <span className="text-orange-700">{offer.substituteName}</span>
          {offer.substitutePrice && (
            <span className="ml-1 text-orange-600 font-medium">— Rs. {offer.substitutePrice}</span>
          )}
        </div>
      )}

      {/* Message */}
      {offer.message && (
        <p className="text-xs text-slate-500 leading-relaxed">{offer.message}</p>
      )}

      {/* Audio toggle */}
      {offer.audioUrl && (
        <div>
          <button
            onClick={() => setAudioOpen((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            <Volume2 size={12} />
            Voice message
            {audioOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {audioOpen && (
            <audio
              src={offer.audioUrl}
              controls
              className="w-full mt-2 h-8"
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Panel ────────────────────────────────────────────────────────────────────

interface PharmacyOffersPanelProps {
  onPharmacySelected?: (pharmacyName: string) => void;
}

export default function PharmacyOffersPanel({ onPharmacySelected }: PharmacyOffersPanelProps) {
  const { offers, activeRequestId, selecting, selectedPharmacyName, setSelecting, setSelectedPharmacyName, clearOffers, reset } =
    usePatientOffersStore();

  const [collapsed, setCollapsed] = useState(false);
  const [selectingResponseId, setSelectingResponseId] = useState<number | null>(null);
  const [selectError, setSelectError] = useState<string | null>(null);

  // Only show panel when there's an active request AND at least one offer
  if (!activeRequestId || offers.length === 0) return null;

  // If patient already selected, show confirmation state
  if (selectedPharmacyName) {
    return (
      <div className="absolute bottom-6 right-6 z-500 w-80 bg-white rounded-2xl shadow-2xl border border-emerald-200 overflow-hidden animate-in slide-in-from-bottom-4">
        <div className="bg-emerald-600 px-4 py-3 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-white" />
          <span className="text-white font-bold text-sm">Pharmacy Selected</span>
        </div>
        <div className="px-4 py-4 text-center">
          <p className="text-slate-700 text-sm">
            You've selected <strong>{selectedPharmacyName}</strong>. Head over to pick up your medicine!
          </p>
          <button
            onClick={reset}
            className="mt-3 text-xs text-slate-400 hover:text-slate-600 underline transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  async function handleSelect(responseId: number, pharmacyName: string) {
    setSelecting(true);
    setSelectingResponseId(responseId);
    setSelectError(null);
    try {
      await api.selectPharmacy(responseId);
      setSelectedPharmacyName(pharmacyName);
      onPharmacySelected?.(pharmacyName);
      useNotificationStore.getState().addNotification({
        type: 'pharmacy_accepted',
        title: 'Pharmacy Selected',
        body: `You have selected ${pharmacyName}. Head over to pick up your medicine!`,
        requestId: activeRequestId ?? undefined,
      });
    } catch (err) {
      setSelectError(err instanceof Error ? err.message : 'Failed to select. Please try again.');
    } finally {
      setSelecting(false);
      setSelectingResponseId(null);
    }
  }

  const actionableCount = offers.filter((o) => o.responseType !== 'REJECTED').length;

  return (
    <div className="absolute bottom-6 right-6 z-500 w-84 max-w-[calc(100vw-2rem)]">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">

        {/* Header */}
        <div className="bg-linear-to-r from-[#FF6B35] to-[#e55a2b] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-white animate-pulse" />
            <span className="text-white font-bold text-sm">
              Pharmacy Offers
            </span>
            <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {actionableCount} available
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCollapsed((v) => !v)}
              className="p-1 rounded hover:bg-white/20 text-white transition-colors"
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            <button
              onClick={clearOffers}
              className="p-1 rounded hover:bg-white/20 text-white transition-colors"
              title="Dismiss all offers"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Offer list */}
        {!collapsed && (
          <div className="max-h-112 overflow-y-auto">
            <div className="p-3 flex flex-col gap-2">
              {selectError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">
                  <XCircle size={13} />
                  {selectError}
                </div>
              )}
              <p className="text-xs text-slate-400 px-1">
                {actionableCount > 0
                  ? 'Select a pharmacy to confirm your request.'
                  : 'Waiting for pharmacy responses…'}
              </p>
              {offers.map((offer) => (
                <OfferCard
                  key={offer.responseId}
                  offer={offer}
                  onSelect={handleSelect}
                  isSelecting={selecting}
                  selectedResponseId={selectingResponseId}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
