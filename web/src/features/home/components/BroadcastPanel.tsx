import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { ShieldCheck, Pencil, Eraser, Radio, FileText, MapPin, Loader2, AlertCircle, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import type { GeoLocation } from '@/hooks/useGeolocation';

// ── Types ──────────────────────────────────────────────────────────────────
interface BroadcastPanelProps {
  radius: number;
  setRadius: (v: number) => void;
  location: GeoLocation;
  geoLoading: boolean;
  geoError: string | null;
}

type Tool = 'pen' | 'eraser';

interface Rect { x: number; y: number; w: number; h: number }

// ── Helpers ────────────────────────────────────────────────────────────────
function getRelativePos(e: React.MouseEvent, canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

function rectsOverlap(pos: { x: number; y: number }, r: Rect) {
  return pos.x >= r.x && pos.x <= r.x + r.w && pos.y >= r.y && pos.y <= r.y + r.h;
}

// Compute the object-contain display bounds of an image inside a container
function containBounds(
  containerW: number, containerH: number,
  naturalW: number, naturalH: number,
) {
  const ca = containerW / containerH;
  const ia = naturalW / naturalH;
  let dw: number, dh: number, ox: number, oy: number;
  if (ia > ca) {
    dw = containerW; dh = dw / ia;
    ox = 0; oy = (containerH - dh) / 2;
  } else {
    dh = containerH; dw = dh * ia;
    ox = (containerW - dw) / 2; oy = 0;
  }
  return { dw, dh, ox, oy };
}

// ── Component ──────────────────────────────────────────────────────────────
export default function BroadcastPanel({ radius, setRadius, location, geoLoading, geoError }: BroadcastPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [autoDetectPII, setAutoDetectPII] = useState(true);
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [redactions, setRedactions] = useState<Rect[]>([]);
  const [liveRect, setLiveRect] = useState<Rect | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawStart = useRef<{ x: number; y: number } | null>(null);
  const isDrawing = useRef(false);

  // Object URL for image preview
  const previewUrl = useMemo(() => {
    if (!file || !file.type.startsWith('image/')) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  // Clear redactions when file changes
  useEffect(() => { setRedactions([]); setLiveRect(null); setActiveTool(null); }, [file]);

  // ── Canvas drawing ─────────────────────────────────────────────────────
  const redrawCanvas = useCallback(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas resolution to its CSS size
    const { width, height } = canvas.getBoundingClientRect();
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f172a'; // slate-900

    for (const r of redactions) {
      ctx.fillRect(r.x, r.y, r.w, r.h);
    }
    if (liveRect) {
      ctx.globalAlpha = 0.75;
      ctx.fillRect(liveRect.x, liveRect.y, liveRect.w, liveRect.h);
      ctx.globalAlpha = 1;
    }
  }, [redactions, liveRect]);

  useEffect(() => { redrawCanvas(); }, [redrawCanvas]);

  // ── Canvas pointer events ──────────────────────────────────────────────
  function handleCanvasMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!activeTool || !overlayRef.current) return;
    e.preventDefault();
    const pos = getRelativePos(e, overlayRef.current);

    if (activeTool === 'pen') {
      drawStart.current = pos;
      isDrawing.current = true;
    } else if (activeTool === 'eraser') {
      setRedactions((prev) => prev.filter((r) => !rectsOverlap(pos, r)));
    }
  }

  function handleCanvasMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing.current || activeTool !== 'pen' || !drawStart.current || !overlayRef.current) return;
    const pos = getRelativePos(e, overlayRef.current);
    setLiveRect({
      x: Math.min(drawStart.current.x, pos.x),
      y: Math.min(drawStart.current.y, pos.y),
      w: Math.abs(pos.x - drawStart.current.x),
      h: Math.abs(pos.y - drawStart.current.y),
    });
  }

  function handleCanvasMouseUp(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing.current || activeTool !== 'pen' || !drawStart.current || !overlayRef.current) return;
    const pos = getRelativePos(e, overlayRef.current);
    const r: Rect = {
      x: Math.min(drawStart.current.x, pos.x),
      y: Math.min(drawStart.current.y, pos.y),
      w: Math.abs(pos.x - drawStart.current.x),
      h: Math.abs(pos.y - drawStart.current.y),
    };
    if (r.w > 5 && r.h > 5) setRedactions((prev) => [...prev, r]);
    setLiveRect(null);
    isDrawing.current = false;
    drawStart.current = null;
  }

  // Handle mouse leaving the canvas mid-draw
  function handleCanvasMouseLeave() {
    if (isDrawing.current && liveRect && activeTool === 'pen') {
      if (liveRect.w > 5 && liveRect.h > 5) setRedactions((prev) => [...prev, liveRect]);
      setLiveRect(null);
      isDrawing.current = false;
      drawStart.current = null;
    }
  }

  // ── File handlers ──────────────────────────────────────────────────────
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

  // ── Broadcast ──────────────────────────────────────────────────────────
  async function handleBroadcast() {
    if (!file) return;
    setIsBroadcasting(true);

    try {
      let finalFile = file;

      // For images with redactions: flatten onto an offscreen canvas
      if (file.type.startsWith('image/') && redactions.length > 0 && imgRef.current && containerRef.current) {
        const img = imgRef.current;
        const container = containerRef.current;
        const { clientWidth: cw, clientHeight: ch } = container;
        const { dw, dh, ox, oy } = containBounds(cw, ch, img.naturalWidth, img.naturalHeight);

        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = img.naturalWidth;
        exportCanvas.height = img.naturalHeight;
        const ctx = exportCanvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);

        ctx.fillStyle = '#000000';
        for (const r of redactions) {
          // Map from overlay (container) coords → natural image coords
          const nx = ((r.x - ox) / dw) * img.naturalWidth;
          const ny = ((r.y - oy) / dh) * img.naturalHeight;
          const nw = (r.w / dw) * img.naturalWidth;
          const nh = (r.h / dh) * img.naturalHeight;
          ctx.fillRect(nx, ny, nw, nh);
        }

        finalFile = await new Promise<File>((resolve) =>
          exportCanvas.toBlob(
            (blob) => resolve(new File([blob!], 'redacted_prescription.png', { type: 'image/png' })),
            'image/png',
          ),
        );
      }

      // TODO: POST finalFile + location + radius to backend
      console.log('Broadcasting:', finalFile, location, radius);

      // Simulate network delay for demo
      await new Promise((r) => setTimeout(r, 1200));
    } finally {
      setIsBroadcasting(false);
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────
  const fillPct = ((radius - 1) / (5 - 1)) * 100;
  const isPdf = file?.type === 'application/pdf';
  const isImageFile = file?.type.startsWith('image/') ?? false;

  const toolCursor =
    activeTool === 'pen' ? 'cursor-crosshair' :
    activeTool === 'eraser' ? 'cursor-cell' :
    '';

  // ── Render ─────────────────────────────────────────────────────────────
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

        {/* ── Location Status ───────────────────────────────────── */}
        <div className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm border ${
          geoError
            ? 'bg-red-50 border-red-200 text-red-700'
            : geoLoading
            ? 'bg-slate-50 border-slate-200 text-slate-500'
            : 'bg-green-50 border-green-200 text-green-700'
        }`}>
          {geoLoading ? (
            <Loader2 size={15} className="mt-0.5 shrink-0 animate-spin" />
          ) : geoError ? (
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
          ) : (
            <MapPin size={15} className="mt-0.5 shrink-0" />
          )}
          <span className="leading-snug">
            {geoLoading
              ? 'Detecting your location…'
              : geoError
              ? geoError
              : `Location detected — ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
          </span>
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
              <div className="flex items-center gap-3">
                {redactions.length > 0 && (
                  <button
                    onClick={() => setRedactions([])}
                    className="text-xs font-medium text-slate-400 hover:text-[#FF6B35] transition-colors flex items-center gap-1"
                  >
                    <X size={11} />
                    Clear redactions
                  </button>
                )}
                <button
                  onClick={() => setFile(null)}
                  className="text-xs font-medium text-slate-400 hover:text-[#FF6B35] transition-colors underline"
                >
                  Reset Image
                </button>
              </div>
            )}
          </div>

          {/* Preview / Upload area */}
          {file ? (
            <div
              ref={containerRef}
              className={`relative aspect-4/3 bg-slate-100 overflow-hidden ${!activeTool ? 'cursor-pointer' : ''}`}
              onClick={!activeTool ? () => inputRef.current?.click() : undefined}
            >
              {isPdf ? (
                /* PDF — can't redact, just show name */
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="size-14 rounded-xl bg-white border border-slate-200 shadow flex items-center justify-center">
                    <FileText size={28} className="text-[#FF6B35]" />
                  </div>
                  <div className="text-center px-4">
                    <p className="text-sm font-semibold text-slate-700 truncate max-w-60">{file.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">PDF Prescription</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Actual image */}
                  <img
                    ref={imgRef}
                    src={previewUrl!}
                    alt="Prescription preview"
                    className="absolute inset-0 w-full h-full object-contain select-none"
                    draggable={false}
                  />

                  {/* Redaction canvas overlay */}
                  <canvas
                    ref={overlayRef}
                    className={`absolute inset-0 w-full h-full ${toolCursor}`}
                    style={{ pointerEvents: activeTool ? 'auto' : 'none' }}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseLeave}
                  />
                </>
              )}

              {/* Hover overlay — only when no tool active and not PDF */}
              {!activeTool && !isPdf && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/10 pointer-events-none">
                  <div className="bg-white/90 backdrop-blur-sm px-5 py-3 rounded-lg shadow-lg">
                    <p className="text-sm font-medium text-slate-700">Click to replace</p>
                  </div>
                </div>
              )}

              {/* Active tool hint */}
              {activeTool && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
                  <span className="bg-slate-800/85 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2">
                    {activeTool === 'pen' ? (
                      <><Pencil size={12} /> Drag to redact — release to commit</>
                    ) : (
                      <><Eraser size={12} /> Click a redaction to remove it</>
                    )}
                  </span>
                </div>
              )}

              {/* Redaction count badge */}
              {redactions.length > 0 && !activeTool && (
                <div className="absolute top-3 left-3 pointer-events-none">
                  <span className="bg-slate-900/80 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                    {redactions.length} redaction{redactions.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}

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
              <button
                disabled={!isImageFile}
                onClick={() => setActiveTool((t) => t === 'pen' ? null : 'pen')}
                title={isImageFile ? 'Redact tool — drag to hide sensitive areas' : 'Upload an image to use redaction tools'}
                className={`p-2 rounded transition-colors ${
                  !isImageFile
                    ? 'text-slate-300 cursor-not-allowed'
                    : activeTool === 'pen'
                    ? 'bg-[#FF6B35]/10 text-[#FF6B35] ring-1 ring-[#FF6B35]/30'
                    : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                <Pencil size={17} />
              </button>
              <button
                disabled={!isImageFile || redactions.length === 0}
                onClick={() => setActiveTool((t) => t === 'eraser' ? null : 'eraser')}
                title={redactions.length === 0 ? 'No redactions to erase' : 'Eraser — click a redaction to remove it'}
                className={`p-2 rounded transition-colors ${
                  !isImageFile || redactions.length === 0
                    ? 'text-slate-300 cursor-not-allowed'
                    : activeTool === 'eraser'
                    ? 'bg-[#FF6B35]/10 text-[#FF6B35] ring-1 ring-[#FF6B35]/30'
                    : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
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
            <div className="absolute w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#FF6B35] rounded-full transition-all" style={{ width: `${fillPct}%` }} />
            </div>
            <div
              className="absolute size-6 bg-white border-2 border-[#FF6B35] rounded-full shadow-md flex items-center justify-center pointer-events-none transition-all"
              style={{ left: `calc(${fillPct}% - 12px)` }}
            >
              <div className="size-2 bg-[#FF6B35] rounded-full" />
            </div>
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
          <button
            onClick={handleBroadcast}
            disabled={!file || isBroadcasting}
            className="group relative w-full h-14 bg-[#FF6B35] hover:bg-[#e55a2b] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl shadow-lg shadow-[#FF6B35]/30 overflow-hidden transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-3"
          >
            {isBroadcasting ? (
              <><Loader2 size={22} className="animate-spin" /><span className="text-lg font-bold tracking-wide uppercase">Preparing…</span></>
            ) : (
              <><Radio size={22} className="group-hover:rotate-45 transition-transform duration-300" /><span className="text-lg font-bold tracking-wide uppercase">Broadcast Request</span></>
            )}
          </button>
          <p className="text-center text-xs text-slate-400 mt-3">
            {redactions.length > 0
              ? `${redactions.length} area${redactions.length > 1 ? 's' : ''} will be redacted before sending.`
              : 'Your request will expire automatically in 30 minutes.'}
          </p>
        </div>

      </div>
    </div>
  );
}
