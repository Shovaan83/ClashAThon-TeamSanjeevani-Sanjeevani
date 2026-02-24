import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

const NAV_LINKS = [
  { label: 'Home', href: '/home' },
  { label: 'Search', href: '/search' },
  { label: 'Add', href: '/add' },
  { label: 'Notifications', href: '/notifications' },
  { label: 'Profile', href: '/profile' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between border-b border-primary/10 bg-white px-6 md:px-20 py-3 sticky top-0 z-50 shadow-sm">
      {/* Left: Logo + Nav */}
      <div className="flex items-center gap-8">
        <Link to="/home" className="flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined text-[28px] text-primary">medical_services</span>
          <h2 className="logo-font text-2xl leading-tight text-primary">Sanjeevani</h2>
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

      {/* Right: Search + Avatar */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center bg-slate-100 rounded-lg px-3 py-1.5 border border-slate-200 gap-1">
          <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
          <input
            className="bg-transparent border-none outline-none focus:ring-0 text-sm w-40 placeholder:text-slate-400"
            placeholder="Search medicines..."
            type="text"
          />
        </div>

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
