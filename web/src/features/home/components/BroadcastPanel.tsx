import { useState, useRef } from 'react';
import { ShieldCheck, Pencil, Eraser, Radio, FileText } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export default function BroadcastPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [radius, setRadius] = useState(3.5);
  const [autoDetectPII, setAutoDetectPII] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (picked) setFile(picked);
  }

  const fillPct = ((radius - 1) / (5 - 1)) * 100;

  return (
    <div className="w-full lg:w-120 xl:w-135 bg-white border-r border-slate-200 flex flex-col h-full overflow-y-auto shrink-0 shadow-xl z-20">
      <div className="p-8 flex flex-col gap-6">

        {/* ── Title ─────────────────────────────────────────────── */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#FF6B35] font-bold text-xs uppercase tracking-wider mb-1">
            <span className="size-2 rounded-full bg-[#FF6B35] animate-pulse" />
            Live Radar Active
          </div>
          <h2 className="text-3xl font-bold text-slate-800 leading-tight">Broadcast Request</h2>
          <p className="text-slate-500 text-sm">
            Securely upload and broadcast your prescription to pharmacies within range.
          </p>
        </div>

        {/* ── Prescription Card ─────────────────────────────────── */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-50">
          {/* Card header */}
          <div className="px-4 py-3 border-b border-slate-200 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700">
              <ShieldCheck size={16} className="text-[#FF6B35]" />
              <span className="text-sm font-semibold">Privacy Shield Enabled</span>
            </div>
            {file && (
              <button
                onClick={() => setFile(null)}
                className="text-xs font-medium text-slate-400 hover:text-[#FF6B35] transition-colors underline"
              >
                Reset Image
              </button>
            )}
          </div>

          {/* Preview / Upload area */}
          {file ? (
            /* Filled state — mock prescription with redaction marks */
            <div
              className="relative aspect-4/3 bg-slate-100 overflow-hidden cursor-pointer group"
              onClick={() => inputRef.current?.click()}
            >
              {/* Faux document lines */}
              <div className="absolute inset-0 flex flex-col justify-center px-10 py-8 opacity-30 select-none pointer-events-none">
                <div className="w-full h-3 bg-slate-500 rounded mb-3" />
                <div className="w-4/5 h-2 bg-slate-400 rounded mb-2" />
                <div className="w-3/5 h-2 bg-slate-400 rounded mb-4" />
                <div className="w-full h-1.5 bg-slate-300 rounded mb-2" />
                <div className="w-full h-1.5 bg-slate-300 rounded mb-2" />
                <div className="w-4/5 h-1.5 bg-slate-300 rounded mb-4" />
                <div className="w-full h-1.5 bg-slate-200 rounded mb-2" />
                <div className="w-3/4 h-1.5 bg-slate-200 rounded" />
              </div>
              {/* Redaction bars */}
              <div className="absolute top-[30%] left-[15%] w-[42%] h-3.5 bg-slate-900 rotate-[0.5deg] shadow-sm" />
              <div className="absolute top-[37%] left-[15%] w-[28%] h-3.5 bg-slate-900 -rotate-[0.5deg] shadow-sm" />
              {/* Hover overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-white/90 backdrop-blur-sm px-5 py-3 rounded-lg shadow-lg">
                  <p className="text-sm font-medium text-slate-700">Click to replace</p>
                </div>
              </div>
              {/* Hint tooltip */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
                <span className="bg-slate-800/80 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2">
                  <Pencil size={12} />
                  Drag to redact sensitive info
                </span>
              </div>
              <input ref={inputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={handleFileChange} />
            </div>
          ) : (
            /* Empty state — drop zone */
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`aspect-4/3 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
                isDragging ? 'bg-[#FF6B35]/5' : 'bg-slate-100 hover:bg-slate-50'
              }`}
            >
              <div className={`size-14 rounded-full border-2 border-dashed flex items-center justify-center transition-colors ${isDragging ? 'border-[#FF6B35]' : 'border-slate-300'}`}>
                <FileText size={22} className={isDragging ? 'text-[#FF6B35]' : 'text-slate-400'} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-600">Drop prescription here</p>
                <p className="text-xs text-slate-400 mt-0.5">PDF, PNG or JPG</p>
              </div>
              <input ref={inputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={handleFileChange} />
            </div>
          )}

          {/* Redaction toolbar */}
          <div className="px-3 py-2.5 bg-white border-t border-slate-200 flex items-center justify-between">
            <div className="flex gap-1">
              <button className="p-2 rounded hover:bg-slate-100 text-slate-500 transition-colors" title="Marker">
                <Pencil size={17} />
              </button>
              <button className="p-2 rounded hover:bg-slate-100 text-slate-500 transition-colors" title="Eraser">
                <Eraser size={17} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Auto-detect PII</span>
              <Switch checked={autoDetectPII} onCheckedChange={setAutoDetectPII} className="scale-90" />
            </div>
          </div>
        </div>

        {/* ── Radius Slider ─────────────────────────────────────── */}
        <div className="space-y-3 pt-1">
          <div className="flex items-end justify-between">
            <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">
              Broadcast Radius
            </label>
            <span className="text-xl font-bold text-[#FF6B35]">{radius.toFixed(1)} km</span>
          </div>
          <div className="relative h-6 flex items-center">
            {/* Track */}
            <div className="absolute w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#FF6B35] rounded-full transition-all" style={{ width: `${fillPct}%` }} />
            </div>
            {/* Visual thumb */}
            <div
              className="absolute size-6 bg-white border-2 border-[#FF6B35] rounded-full shadow-md flex items-center justify-center pointer-events-none transition-all"
              style={{ left: `calc(${fillPct}% - 12px)` }}
            >
              <div className="size-2 bg-[#FF6B35] rounded-full" />
            </div>
            {/* Input (transparent, for interaction) */}
            <input
              type="range" min={1} max={5} step={0.1} value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="absolute w-full h-full opacity-0 cursor-pointer z-10"
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 font-medium px-0.5">
            <span>1 km</span>
            <span>5 km</span>
          </div>
        </div>

        {/* ── Broadcast Button ──────────────────────────────────── */}
        <div className="pt-2">
          <button className="group relative w-full h-14 bg-[#FF6B35] hover:bg-[#e55a2b] text-white rounded-xl shadow-lg shadow-[#FF6B35]/30 overflow-hidden transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-3">
            <Radio size={22} className="group-hover:rotate-45 transition-transform duration-300" />
            <span className="text-lg font-bold tracking-wide uppercase">Broadcast Request</span>
          </button>
          <p className="text-center text-xs text-slate-400 mt-3">
            Your request will expire automatically in 30 minutes.
          </p>
        </div>

      </div>
    </div>
  );
}
