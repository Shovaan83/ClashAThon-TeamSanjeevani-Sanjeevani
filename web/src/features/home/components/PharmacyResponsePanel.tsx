import { useRef, useState } from 'react';
import { X, CheckCircle2, XCircle, Volume2, ChevronDown, ChevronUp, Bell } from 'lucide-react';
import type { PharmacyResponseEvent } from '@/hooks/useWebSocket';

interface PharmacyResponsePanelProps {
  responses: PharmacyResponseEvent[];
  onDismiss: (index: number) => void;
}

function AudioPlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      <button
        type="button"
        onClick={toggle}
        className="flex items-center gap-2 px-3 py-1.5 bg-stone-100 border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-200 transition-colors"
      >
        <Volume2 size={13} />
        {playing ? 'Pause Audio' : 'Play Audio Message'}
      </button>
      <audio
        ref={audioRef}
        src={url}
        onEnded={() => setPlaying(false)}
        className="hidden"
      />
    </div>
  );
}

function ResponseCard({
  response,
  index,
  onDismiss,
}: {
  response: PharmacyResponseEvent;
  index: number;
  onDismiss: (i: number) => void;
}) {
  const accepted = response.response_type === 'ACCEPTED';
  const time = new Date(response.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`relative bg-white border shadow-md p-4 flex flex-col gap-1 animate-in slide-in-from-left-4 duration-300 ${
        accepted ? 'border-l-4 border-l-[#2D5A40]' : 'border-l-4 border-l-[#FF6B35]'
      }`}
    >
      {/* Dismiss */}
      <button
        type="button"
        onClick={() => onDismiss(index)}
        className="absolute top-2 right-2 text-stone-400 hover:text-stone-700 transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>

      {/* Header */}
      <div className="flex items-center gap-2 pr-5">
        {accepted ? (
          <CheckCircle2 size={16} className="text-[#2D5A40] shrink-0" />
        ) : (
          <XCircle size={16} className="text-[#FF6B35] shrink-0" />
        )}
        <span className="font-bold text-sm text-[#1C1917] truncate">{response.pharmacy_name}</span>
        <span
          className={`ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 shrink-0 ${
            accepted
              ? 'bg-[#2D5A40]/10 text-[#2D5A40]'
              : 'bg-[#FF6B35]/10 text-[#FF6B35]'
          }`}
        >
          {accepted ? 'Accepted' : 'Rejected'}
        </span>
      </div>

      {/* Message */}
      {response.message && (
        <p className="text-xs text-stone-500 leading-relaxed mt-0.5 pr-2">
          &ldquo;{response.message}&rdquo;
        </p>
      )}

      {/* Audio */}
      {response.audio_url && <AudioPlayer url={response.audio_url} />}

      {/* Timestamp */}
      <p className="text-[10px] text-stone-400 mt-1">{time}</p>
    </div>
  );
}

export default function PharmacyResponsePanel({ responses, onDismiss }: PharmacyResponsePanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (responses.length === 0) return null;

  const acceptedCount = responses.filter((r) => r.response_type === 'ACCEPTED').length;

  return (
    <div className="absolute bottom-5 left-5 z-400 w-72 flex flex-col gap-2">
      {/* Header toggle bar */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 shadow-md text-sm font-bold text-[#1C1917] hover:bg-stone-50 transition-colors"
      >
        <Bell size={15} className="text-[#FF6B35]" />
        <span className="flex-1 text-left">
          {responses.length} Response{responses.length !== 1 ? 's' : ''}
          {acceptedCount > 0 && (
            <span className="ml-2 text-[#2D5A40]">· {acceptedCount} Accepted</span>
          )}
        </span>
        {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Cards */}
      {!collapsed && (
        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
          {responses.map((r, i) => (
            <ResponseCard key={`${r.pharmacy_id}-${r.timestamp}`} response={r} index={i} onDismiss={onDismiss} />
          ))}
        </div>
      )}
    </div>
  );
}
