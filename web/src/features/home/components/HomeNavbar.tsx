import { Radio, Search, Bell, Radar, Pill } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export default function HomeNavbar() {
  const { user } = useAuthStore();

  return (
    <header className="flex items-center justify-between border-b border-stone-200 bg-[#FAFAF9] px-6 py-3 lg:px-20">
      {/* Left: Logo + Nav + Search */}
      <div className="flex items-center gap-10">
        {/* Logo */}
        <div className="flex items-center gap-2 text-[#2D5A40]">
          <Radio size={26} strokeWidth={2} />
          <h2 className="font-black text-xl text-[#2D5A40] uppercase tracking-tight" style={{ letterSpacing: '-0.05em' }}>
            Sanjeevani
          </h2>
        </div>

        {/* Nav Links — role-aware */}
        <nav className="hidden md:flex items-center gap-8">
          <a className="text-[#2D5A40] font-bold text-sm hover:opacity-80 transition-opacity" href="#">
            Home
          </a>
          {user?.role === 'patient' && (
            <>
              <a className="text-stone-500 font-medium text-sm hover:text-[#2D5A40] transition-colors" href="#">
                Broadcast Request
              </a>
              <a className="text-stone-500 font-medium text-sm hover:text-[#2D5A40] transition-colors" href="#">
                Pharmacy Hub
              </a>
            </>
          )}
          {user?.role === 'pharmacy' && (
            <>
              <a className="text-stone-500 font-medium text-sm hover:text-[#2D5A40] transition-colors" href="#">
                Incoming Pings
              </a>
              <a className="text-stone-500 font-medium text-sm hover:text-[#2D5A40] transition-colors" href="#">
                Inventory
              </a>
              <a className="text-stone-500 font-medium text-sm hover:text-[#2D5A40] transition-colors" href="#">
                Analytics
              </a>
            </>
          )}
          {!user && (
            <>
              <a className="text-stone-500 font-medium text-sm hover:text-[#2D5A40] transition-colors" href="#">
                How it Works
              </a>
              <a className="text-stone-500 font-medium text-sm hover:text-[#2D5A40] transition-colors" href="#">
                Join as Pharmacy
              </a>
            </>
          )}
        </nav>

        {/* Search */}
        <div className="hidden lg:flex items-center border border-stone-200 bg-white h-10 min-w-64">
          <div className="flex items-center justify-center pl-3 text-stone-400">
            <Search size={16} />
          </div>
          <input
            className="flex-1 bg-transparent border-none outline-none focus:ring-0 px-3 text-sm placeholder:text-stone-400 text-[#1C1917]"
            placeholder="Search medicines or local pharmacies..."
          />
        </div>
      </div>

      {/* Right: Actions + Avatar */}
      <div className="flex items-center gap-3">
        {user?.role === 'pharmacy' ? (
          <button className="flex items-center gap-2 h-10 px-5 bg-[#2D5A40] text-white text-sm font-bold hover:brightness-110 transition-all">
            <Pill size={16} />
            <span>Go Online</span>
          </button>
        ) : (
          <button className="flex items-center gap-2 h-10 px-5 bg-[#FF6B35] text-white text-sm font-bold hover:brightness-110 transition-all">
            <Radar size={16} />
            <span>New Ping</span>
          </button>
        )}

        <button className="relative flex items-center justify-center h-10 w-10 border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 transition-colors">
          <Bell size={18} />
          <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-[#FF6B35]" />
        </button>

        {/* User Avatar */}
        <div
          className="h-10 w-10 border border-stone-200 bg-cover bg-center"
          title={user?.name ?? 'User profile'}
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80")',
          }}
          aria-label={user?.name ?? 'User profile'}
          role="img"
        />
      </div>
    </header>
  );
}
