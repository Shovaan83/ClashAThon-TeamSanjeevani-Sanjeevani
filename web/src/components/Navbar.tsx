import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore, type AppNotification } from '@/store/useNotificationStore';
import { Volume2, X, CheckCircle2, XCircle, Repeat, Package, Star } from 'lucide-react';

const PATIENT_LINKS = [
  { label: 'Home',        href: '/home' },
  { label: 'Broadcast',   href: '/dashboard/patient' },
  { label: 'Search',      href: '/search' },
  { label: 'My Requests', href: '/pharmacy/requests' },
  { label: 'Profile',     href: '/profile' },
];

const PHARMACY_LINKS = [
  { label: 'Dashboard', href: '/dashboard/pharmacy' },
  { label: 'History',   href: '/pharmacy/requests' },
  { label: 'Analytics', href: '/pharmacy/analytics' },
  { label: 'Profile',   href: '/profile' },
];

const GUEST_LINKS = [
  { label: 'Home',   href: '/home' },
  { label: 'Search', href: '/search' },
];

// ─── Inline audio player ──────────────────────────────────────────────────────
function AudioPlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.pause();
    else audio.play().catch(() => null);
    setPlaying(!playing);
  };

  return (
    <div className="mt-1.5">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); toggle(); }}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-semibold rounded transition-colors"
      >
        <Volume2 size={11} />
        {playing ? 'Pause' : 'Play Audio'}
      </button>
      <audio ref={audioRef} src={url} onEnded={() => setPlaying(false)} className="hidden" />
    </div>
  );
}

// ─── Icon + color per notification type ──────────────────────────────────────
function NotifIcon({ type }: { type: AppNotification['type'] }) {
  const base = 'size-4 shrink-0';
  switch (type) {
    case 'pharmacy_accepted':
      return <CheckCircle2 className={`${base} text-green-500`} />;
    case 'pharmacy_rejected':
      return <XCircle className={`${base} text-rose-500`} />;
    case 'pharmacy_substitute':
      return <Repeat className={`${base} text-[#FF6B35]`} />;
    case 'new_request':
      return <Package className={`${base} text-[#2D5A40]`} />;
    case 'request_taken':
      return <XCircle className={`${base} text-slate-400`} />;
    case 'patient_selected_you':
      return <Star className={`${base} text-yellow-500`} />;
  }
}

function iconBg(type: AppNotification['type']): string {
  switch (type) {
    case 'pharmacy_accepted': return 'bg-green-50';
    case 'pharmacy_rejected': return 'bg-rose-50';
    case 'pharmacy_substitute': return 'bg-orange-50';
    case 'new_request': return 'bg-emerald-50';
    case 'request_taken': return 'bg-slate-100';
    case 'patient_selected_you': return 'bg-yellow-50';
  }
}

// ─── Single notification row ──────────────────────────────────────────────────
function NotifItem({ n }: { n: AppNotification }) {
  const { markRead, dismiss } = useNotificationStore();

  const timeLabel = (() => {
    const diffMs = Date.now() - n.timestamp;
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    return `${Math.floor(hrs / 24)} d ago`;
  })();

  return (
    <li
      className={`relative flex items-start gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors ${
        n.unread ? 'bg-primary/5' : ''
      }`}
      onClick={() => markRead(n.id)}
    >
      {/* Dismiss button */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
        className="absolute top-2.5 right-2.5 text-slate-300 hover:text-slate-500 transition-colors"
        aria-label="Dismiss notification"
      >
        <X size={12} />
      </button>

      {/* Icon badge */}
      <div className={`mt-0.5 size-8 rounded-full flex items-center justify-center shrink-0 ${iconBg(n.type)}`}>
        <NotifIcon type={n.type} />
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-xs font-bold text-slate-900 leading-snug">{n.title}</p>
        <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{n.body}</p>

        {/* Substitute details */}
        {n.type === 'pharmacy_substitute' && n.substituteName && (
          <div className="mt-1.5 px-2 py-1.5 border border-[#FF6B35]/20 bg-[#FF6B35]/5 rounded">
            <p className="text-[11px] font-bold text-[#1C1917]">{n.substituteName}</p>
            {n.substitutePrice && (
              <p className="text-[10px] text-[#FF6B35] font-bold mt-0.5">Rs. {n.substitutePrice}</p>
            )}
          </div>
        )}

        {/* Pharmacist note */}
        {n.message && (
          <p className="text-[10px] text-slate-400 italic mt-1 leading-snug">
            &ldquo;{n.message}&rdquo;
          </p>
        )}

        {/* Audio */}
        {n.audioUrl && <AudioPlayer url={n.audioUrl} />}

        <p className="text-[10px] text-slate-400 mt-1">{timeLabel}</p>
      </div>

      {/* Unread dot */}
      {n.unread && (
        <span className="absolute right-7 top-4 size-1.5 rounded-full bg-accent shrink-0" />
      )}
    </li>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
export default function Navbar() {
  const { pathname } = useLocation();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { notifications, markAllRead } = useNotificationStore();

  const navLinks =
    user?.role === 'pharmacy'
      ? PHARMACY_LINKS
      : user?.role === 'patient'
        ? PATIENT_LINKS
        : GUEST_LINKS;

  const [notifOpen, setNotifOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifOpen]);

  return (
    <header className="flex items-center justify-between border-b border-primary/10 bg-white px-6 md:px-20 py-3 sticky top-0 z-50 shadow-sm">
      {/* Left: Logo + Nav */}
      <div className="flex items-center gap-8">
        <Link to="/home" className="flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined text-[28px] text-primary">
            medical_services
          </span>
          <h2 className="logo-font text-2xl leading-tight text-primary">
            Sanjeevani
          </h2>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(({ label, href }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={label}
                to={href}
                className={`text-sm font-semibold transition-colors pb-0.5 ${
                  isActive
                    ? 'text-primary font-bold border-b-2 border-primary'
                    : 'text-slate-600 hover:text-primary'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right: Bell + Avatar */}
      <div className="flex items-center gap-3" ref={panelRef}>
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative flex items-center justify-center size-10 rounded-full hover:bg-slate-100 transition-colors focus:outline-none"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined text-slate-600 text-[22px]">
              notifications
            </span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-accent border-2 border-white" />
            )}
          </button>

          {/* Notification Modal / Dropdown */}
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-84 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50" style={{ width: '22rem' }}>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification list */}
              {notifications.length === 0 ? (
                <div className="px-4 py-10 text-center text-slate-400">
                  <span className="material-symbols-outlined text-[40px] text-slate-200 block mb-2">
                    notifications_none
                  </span>
                  <p className="text-xs font-medium">No notifications yet</p>
                  <p className="text-[11px] mt-0.5">Pharmacy responses will appear here</p>
                </div>
              ) : (
                <ul className="max-h-88 overflow-y-auto divide-y divide-slate-50">
                  {notifications.map((n) => (
                    <NotifItem key={n.id} n={n} />
                  ))}
                </ul>
              )}

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-2.5 border-t border-slate-100 text-center">
                  <button
                    onClick={() => { markAllRead(); setNotifOpen(false); }}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Avatar */}
        <button
          onClick={() => navigate('/profile')}
          className="size-10 rounded-full border-2 border-primary overflow-hidden hover:opacity-90 transition-opacity focus:outline-none"
          aria-label={user?.name ?? 'Profile'}
        >
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
            alt={user?.name ?? 'User avatar'}
            className="w-full h-full object-cover"
          />
        </button>
      </div>
    </header>
  );
}
