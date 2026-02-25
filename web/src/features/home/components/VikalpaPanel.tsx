import { useState } from 'react';
import { ArrowLeft, Send, Tag, IndianRupee, FileText, AlertCircle } from 'lucide-react';
import { useRequestStore } from '@/store/useRequestStore';

export default function VikalpaPanel() {
  const { closeVikalpa, offerSubstitute, isResponding } = useRequestStore();

  const [substituteName, setSubstituteName] = useState('');
  const [substitutePrice, setSubstitutePrice] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<{ name?: string; price?: string }>({});

  const validate = (): boolean => {
    const next: { name?: string; price?: string } = {};
    if (!substituteName.trim()) {
      next.name = 'Substitute medicine name is required.';
    }
    const priceNum = parseFloat(substitutePrice);
    if (!substitutePrice.trim() || isNaN(priceNum) || priceNum <= 0) {
      next.price = 'Enter a valid price in Rs.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await offerSubstitute(
      substituteName.trim(),
      parseFloat(substitutePrice),
      note.trim() || undefined,
    );
  };

  return (
    <div className="border-t border-stone-200 bg-[#FAFAF9]">
      {/* ── Vikalpa header ── */}
      <div className="px-10 pt-6 pb-4 flex items-center justify-between border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-[#FF6B35]" aria-hidden="true" />
          <div>
            <p className="text-xs font-bold text-[#FF6B35] uppercase tracking-widest">Vikalpa</p>
            <h3 className="text-lg font-bold text-[#1C1917] leading-tight">Offer a Substitute</h3>
          </div>
        </div>
        <button
          type="button"
          onClick={closeVikalpa}
          disabled={isResponding}
          className="flex items-center gap-1.5 text-stone-400 hover:text-[#1C1917] transition-colors text-sm font-bold uppercase tracking-wider disabled:opacity-40"
          aria-label="Back to request"
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
          Back
        </button>
      </div>

      {/* ── Bento form grid ── */}
      <div className="px-10 py-6 grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Substitute name */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
            Substitute Medicine Name
          </label>
          <div className={`flex items-center border ${errors.name ? 'border-[#FF6B35]' : 'border-stone-200'} bg-white`}>
            <span className="flex items-center justify-center w-11 h-11 border-r border-stone-200 text-stone-400 shrink-0">
              <Tag size={15} />
            </span>
            <input
              type="text"
              value={substituteName}
              onChange={(e) => {
                setSubstituteName(e.target.value);
                if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
              }}
              placeholder="e.g. Paracetamol 500mg (Generic)"
              className="flex-1 h-11 px-3 text-sm text-[#1C1917] bg-transparent outline-none placeholder:text-stone-300"
              disabled={isResponding}
              aria-label="Substitute medicine name"
            />
          </div>
          {errors.name && (
            <p className="mt-1 flex items-center gap-1 text-xs text-[#FF6B35]">
              <AlertCircle size={11} />
              {errors.name}
            </p>
          )}
        </div>

        {/* Price */}
        <div>
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
            Price
          </label>
          <div className={`flex items-center border ${errors.price ? 'border-[#FF6B35]' : 'border-stone-200'} bg-white`}>
            <span className="flex items-center justify-center w-11 h-11 border-r border-stone-200 text-stone-400 shrink-0">
              <IndianRupee size={15} />
            </span>
            <input
              type="number"
              min="0"
              step="0.5"
              value={substitutePrice}
              onChange={(e) => {
                setSubstitutePrice(e.target.value);
                if (errors.price) setErrors((p) => ({ ...p, price: undefined }));
              }}
              placeholder="0.00"
              className="flex-1 h-11 px-3 text-sm text-[#1C1917] bg-transparent outline-none placeholder:text-stone-300"
              disabled={isResponding}
              aria-label="Substitute price in rupees"
            />
            <span className="pr-3 text-xs text-stone-400 font-bold shrink-0">Rs.</span>
          </div>
          {errors.price && (
            <p className="mt-1 flex items-center gap-1 text-xs text-[#FF6B35]">
              <AlertCircle size={11} />
              {errors.price}
            </p>
          )}
        </div>

        {/* Note — spans full width on small, right column on md */}
        <div>
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
            Note to Patient <span className="normal-case text-stone-400">(optional)</span>
          </label>
          <div className="flex items-start border border-stone-200 bg-white">
            <span className="flex items-center justify-center w-11 pt-3 text-stone-400 shrink-0">
              <FileText size={15} />
            </span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Same composition, different brand"
              rows={2}
              className="flex-1 px-3 py-2.5 text-sm text-[#1C1917] bg-transparent outline-none resize-none placeholder:text-stone-300"
              disabled={isResponding}
              aria-label="Note to patient"
            />
          </div>
        </div>
      </div>

      {/* ── Submit row ── */}
      <div className="px-10 pb-8">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isResponding}
          className="w-full flex items-center justify-center gap-2 h-14 bg-[#2D5A40] text-white font-bold text-sm uppercase tracking-widest hover:bg-[#245033] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Send substitute offer to patient"
        >
          {isResponding ? (
            <span className="animate-pulse">Sending Offer…</span>
          ) : (
            <>
              <Send size={16} strokeWidth={2.5} />
              Send Substitute Offer
            </>
          )}
        </button>
        <p className="mt-3 text-center text-xs text-stone-400">
          The patient will be notified instantly and can decide to visit your pharmacy.
        </p>
      </div>
    </div>
  );
}
