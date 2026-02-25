import { useEffect, useCallback, useRef, useState } from 'react';
import {
  Check,
  X,
  ChevronRight,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';
import { useRequestStore } from '@/store/useRequestStore';

// ─── Slide-to-Accept ──────────────────────────────────────────────────────────
const HANDLE_SIZE = 64; // px — handle is square, fits inside h-20 track with 8px top/bottom gap

function SlideToAccept({ onAccept }: { onAccept: () => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const startClientX = useRef(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const getMaxDragX = useCallback(() => {
    if (!trackRef.current) return 0;
    // 8px gap on each side, handle width = HANDLE_SIZE
    return trackRef.current.clientWidth - HANDLE_SIZE - 16;
  }, []);

  const startDrag = useCallback(
    (clientX: number) => {
      if (isConfirmed) return;
      startClientX.current = clientX;
      setIsDragging(true);
    },
    [isConfirmed],
  );

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (clientX: number) => {
      const maxDragX = getMaxDragX();
      const newX = Math.max(0, Math.min(clientX - startClientX.current, maxDragX));
      setDragX(newX);

      if (newX >= maxDragX * 0.85) {
        // Threshold reached — confirm
        setIsConfirmed(true);
        setIsDragging(false);
        setTimeout(onAccept, 350);
      }
    };

    const handleMouseMove = (e: MouseEvent) => onMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => onMove(e.touches[0].clientX);
    const handleRelease = () => {
      setIsDragging(false);
      setDragX(0); // snap back if threshold wasn't reached
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('mouseup', handleRelease);
    window.addEventListener('touchend', handleRelease);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleRelease);
      window.removeEventListener('touchend', handleRelease);
    };
  }, [isDragging, getMaxDragX, onAccept]);

  const maxDragX = getMaxDragX();
  const progress = maxDragX > 0 ? dragX / maxDragX : 0;

  return (
    <div
      ref={trackRef}
      className="relative w-full h-20 bg-[#2D5A40] overflow-hidden shadow-lg select-none"
      role="button"
      aria-label="Slide right to accept medicine request"
    >
      {/* Diagonal hatch texture */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Slide progress fill */}
      <div
        className="absolute top-0 left-0 h-full bg-white/10 pointer-events-none"
        style={{
          width: `${dragX + HANDLE_SIZE + 8}px`,
          transition: isDragging ? 'none' : 'width 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      />

      {/* Label + chevrons — fade as user slides */}
      <div
        className="absolute inset-0 flex items-center justify-center gap-3 pointer-events-none pl-20"
        style={{ opacity: isConfirmed ? 0 : Math.max(0, 1 - progress * 1.2) }}
      >
        <span className="text-lg font-bold tracking-widest uppercase text-white">
          {progress > 0.45 ? 'Release to Accept' : 'Slide to Accept'}
        </span>
        <div className="flex items-center">
          <ChevronRight size={22} className="text-white/40 animate-pulse" />
          <ChevronRight
            size={22}
            className="text-white/70 animate-pulse"
            style={{ animationDelay: '75ms' }}
          />
          <ChevronRight
            size={22}
            className="text-white animate-pulse"
            style={{ animationDelay: '150ms' }}
          />
        </div>
      </div>

      {/* Confirmed flash */}
      {isConfirmed && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-white text-lg font-bold uppercase tracking-widest">
            Accepted ✓
          </span>
        </div>
      )}

      {/* Draggable handle circle */}
      <div
        className="absolute top-2 bottom-2 aspect-square bg-white rounded-full flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing z-10"
        style={{
          left: `${dragX + 8}px`,
          transition: isDragging ? 'none' : 'left 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          color: isConfirmed ? '#16a34a' : '#2D5A40',
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          startDrag(e.clientX);
        }}
        onTouchStart={(e) => {
          startDrag(e.touches[0].clientX);
        }}
      >
        <Check size={28} strokeWidth={2.5} />
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function IncomingRequestModal() {
  const { activeRequest, isModalOpen, isResponding, acceptRequest, declineRequest, dismissModal } =
    useRequestStore();

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismissModal();
    },
    [dismissModal],
  );

  useEffect(() => {
    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll while modal is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isModalOpen, handleKeyDown]);

  if (!isModalOpen || !activeRequest) return null;

  const {
    patientName,
    patientId,
    location,
    prescriptionImageUrl,
    medicines,
    additionalMedicinesCount,
    isUrgent,
    doctorNote,
  } = activeRequest;

  // Medicines displayed inline (max 2 shown as tags, rest as "+N others")
  const visibleMeds = medicines.slice(0, 2);
  const extraCount = additionalMedicinesCount ?? Math.max(0, medicines.length - 2);

  return (
    /* Full-screen overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Incoming pharmacy request"
    >
      {/* Blurred dashboard background tint */}
      <div
        className="absolute inset-0 bg-[#2D5A40]/50 backdrop-blur-sm"
        onClick={dismissModal}
        aria-hidden="true"
      />

      {/* Modal card — Bento Grid: sharp corners, 1px border, no gradient fill */}
      <div className="relative z-10 w-full max-w-3xl bg-[#FAFAF9] border border-stone-300 shadow-2xl flex flex-col overflow-hidden">
        {/* ── Header ─────────────────────────────────── */}
        <div className="pt-10 pb-6 px-10 flex flex-col items-center text-center border-b border-stone-200">
          {/* Live Request badge */}
          <div className="mb-5 inline-flex items-center gap-2 px-4 py-1.5 border border-[#FF6B35]/25 bg-[#FF6B35]/5 text-[#FF6B35] text-xs font-bold uppercase tracking-widest">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6B35] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF6B35]" />
            </span>
            Live Request
          </div>

          <h1 className="text-4xl font-bold text-[#1C1917] tracking-tight mb-1">{patientName}</h1>
          <p className="text-stone-500 text-base">
            Patient ID: {patientId} &bull; {location}
          </p>
        </div>

        {/* ── Content grid ───────────────────────────── */}
        <div className="px-10 py-8 flex flex-col md:flex-row gap-10 items-center">
          {/* Scalloped prescription thumbnail */}
          <div className="relative w-44 h-44 shrink-0 group">
            {/* Decorative offset layers */}
            <div
              className="absolute inset-0 scalloped-mask rotate-3 scale-105 transition-transform group-hover:rotate-6"
              style={{ backgroundColor: 'rgba(255,107,53,0.12)' }}
            />
            <div
              className="absolute inset-0 scalloped-mask -rotate-3 transition-transform group-hover:-rotate-1"
              style={{ backgroundColor: 'rgba(45,90,64,0.10)' }}
            />
            {/* Actual image */}
            <div className="relative w-full h-full scalloped-mask bg-stone-200 overflow-hidden border-2 border-stone-300">
              {prescriptionImageUrl ? (
                <img
                  src={prescriptionImageUrl}
                  alt="Prescription"
                  className="w-full h-full object-cover grayscale-20"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-400 text-4xl select-none">
                  ℞
                </div>
              )}
            </div>
          </div>

          {/* Request details */}
          <div className="flex-1 space-y-5 min-w-0">
            {/* Prescribed medicines */}
            <div>
              <h3 className="text-xs font-bold text-[#2D5A40] uppercase tracking-widest mb-3">
                Prescribed Medicines
              </h3>
              <div className="flex flex-wrap gap-2">
                {visibleMeds.map((med) => (
                  <span
                    key={med}
                    className="px-4 py-2 bg-stone-100 border border-stone-200 text-stone-700 font-medium text-sm"
                  >
                    {med}
                  </span>
                ))}
                {extraCount > 0 && (
                  <span className="px-4 py-2 bg-stone-100 border border-stone-200 text-stone-500 font-medium text-sm">
                    + {extraCount} others
                  </span>
                )}
              </div>
            </div>

            {/* Action chips */}
            <div className="flex gap-3">
              {isUrgent && (
                <button
                  type="button"
                  className="flex items-center gap-2 px-5 py-2 border border-[#FF6B35]/25 bg-[#FF6B35]/5 text-[#FF6B35] hover:bg-[#FF6B35]/15 transition-colors"
                  aria-label="Marked as urgent"
                >
                  <AlertTriangle size={16} strokeWidth={2.5} />
                  <span className="font-bold text-sm uppercase tracking-wider">Urgent</span>
                </button>
              )}
              <button
                type="button"
                className="flex items-center gap-2 px-5 py-2 border border-stone-200 bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
                aria-label="Message patient"
              >
                <MessageSquare size={16} />
                <span className="font-bold text-sm uppercase tracking-wider">Message</span>
              </button>
            </div>

            {/* Doctor's note */}
            {doctorNote && (
              <p className="text-stone-500 text-sm leading-relaxed italic border-l-2 border-stone-300 pl-3">
                &ldquo;{doctorNote}&rdquo;
              </p>
            )}
          </div>
        </div>

        {/* ── Action footer ───────────────────────────── */}
        <div className="bg-[#2D5A40]/5 border-t border-stone-200 px-10 py-8">
          {/* Slide-to-accept */}
          <SlideToAccept onAccept={acceptRequest} />

          {/* Decline link */}
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={declineRequest}
              disabled={isResponding}
              className="flex items-center gap-2 text-stone-400 hover:text-[#FF6B35] transition-colors font-bold text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Decline and notify doctor"
            >
              <X size={16} strokeWidth={2.5} />
              {isResponding ? 'Sending…' : 'Decline and Notify Doctor'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
