import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

const NAV_LINKS = [
  { label: 'Home', href: '/home' },
  { label: 'Search', href: '/search' },
  { label: 'Add', href: '/broadcast' },
  { label: 'Profile', href: '/profile' },
];

interface Notification {
  id: number;
  icon: string;
  iconColor: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    icon: 'check_circle',
    iconColor: 'text-green-500',
    title: 'Medicine Found',
    body: 'Everest Pharmacy has Insulin Glargine in stock near you.',
    time: '2 min ago',
    unread: true,
  },
  {
    id: 2,
    icon: 'notifications_active',
    iconColor: 'text-accent',
    title: 'New Ping Response',
    body: 'Himalayan Meds responded to your Azithromycin request.',
    time: '15 min ago',
    unread: true,
  },
  {
    id: 3,
    icon: 'local_pharmacy',
    iconColor: 'text-primary',
    title: 'Pharmacy Online',
    body: 'City Care Pharmacy is now online and accepting requests.',
    time: '1 hr ago',
    unread: false,
  },
  {
    id: 4,
    icon: 'info',
    iconColor: 'text-slate-400',
    title: 'Request Expired',
    body: 'Your ping for Paracetamol 500mg expired without a match.',
    time: '3 hrs ago',
    unread: false,
  },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] =
    useState<Notification[]>(MOCK_NOTIFICATIONS);

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

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }

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
          {NAV_LINKS.map(({ label, href }) => {
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
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
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
              <ul className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors ${
                      n.unread ? 'bg-primary/5' : ''
                    }`}
                    onClick={() =>
                      setNotifications((prev) =>
                        prev.map((x) =>
                          x.id === n.id ? { ...x, unread: false } : x,
                        ),
                      )
                    }
                  >
                    <div className="mt-0.5 size-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <span
                        className={`material-symbols-outlined text-[18px] ${n.iconColor}`}
                      >
                        {n.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900">
                        {n.title}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                        {n.body}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                    </div>
                    {n.unread && (
                      <span className="mt-1.5 size-2 rounded-full bg-accent shrink-0" />
                    )}
                  </li>
                ))}
              </ul>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-slate-100 text-center">
                <Link
                  to="/notifications"
                  onClick={() => setNotifOpen(false)}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  View all notifications
                </Link>
              </div>
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

