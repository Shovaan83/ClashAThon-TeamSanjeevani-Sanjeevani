import { Radio, Bell, LayoutDashboard, History, Settings, Wifi } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { Link, useLocation } from 'react-router-dom';

const NAV = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Broadcast', href: '/dashboard/patient', icon: Wifi },
  { label: 'History', href: '#', icon: History },
  { label: 'Settings', href: '#', icon: Settings },
];

export default function DashboardNavbar() {
  const { user } = useAuthStore();
  const { pathname } = useLocation();

  return (
    <header className="h-16 bg-[#2D5A40] text-white shadow-lg z-30 flex items-center justify-between px-6 lg:px-10 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <Radio size={26} strokeWidth={2} className="text-[#FF6B35]" />
        <span
          className="text-2xl font-black text-white uppercase"
          style={{ letterSpacing: '-0.05em' }}
        >
          Sanjeevani
        </span>
      </div>

      {/* Nav links */}
      <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
        {NAV.map(({ label, href }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={label}
              to={href}
              className={`transition-colors pb-0.5 ${
                isActive
                  ? 'text-[#FF6B35] font-bold border-b-2 border-[#FF6B35]'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-full hover:bg-white/10 transition-colors">
          <Bell size={20} className="text-white" />
          <span className="absolute top-2 right-2 size-2 rounded-full bg-[#FF6B35] border border-[#2D5A40]" />
        </button>

        <div
          className="size-9 rounded-full bg-white/20 border border-white/30 bg-cover bg-center cursor-pointer"
          title={user?.name ?? 'Profile'}
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80")',
          }}
        />
      </div>
    </header>
  );
}
