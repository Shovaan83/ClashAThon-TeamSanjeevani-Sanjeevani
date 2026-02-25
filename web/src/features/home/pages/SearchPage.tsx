import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import HomeFooter from '../components/HomeFooter';
import { useGeolocation } from '@/hooks/useGeolocation';

// ─── Types ────────────────────────────────────────────────────────────────────

type VerificationStatus = 'verified' | 'pending' | 'unverified';
type OpenStatus = 'open' | 'closed';
type CardVariant = 'default' | 'highlighted';

interface Pharmacy {
  id: number;
  name: string;
  address: string;
  distance: string;
  rating: number;
  reviewCount: string;
  verification: VerificationStatus;
  status: OpenStatus;
  variant: CardVariant;
  icon: string;
  badge?: string;
  primaryAction: 'order' | 'profile' | 'view';
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_PHARMACIES: Pharmacy[] = [
  {
    id: 1,
    name: 'Apollo Pharmacy',
    address: 'Sector 4, RK Puram Market',
    distance: '0.8 km',
    rating: 4.8,
    reviewCount: '1.2k',
    verification: 'verified',
    status: 'open',
    variant: 'default',
    icon: 'local_pharmacy',
    primaryAction: 'order',
  },
  {
    id: 2,
    name: 'Guardian LifeCare',
    address: 'A-Block Market, Vasant Vihar',
    distance: '1.5 km',
    rating: 4.5,
    reviewCount: '850',
    verification: 'pending',
    status: 'open',
    variant: 'default',
    icon: 'medical_services',
    primaryAction: 'order',
  },
  {
    id: 3,
    name: 'Netmeds Clinic',
    address: 'Basant Lok Community Centre',
    distance: '2.1 km',
    rating: 4.9,
    reviewCount: '2.4k',
    verification: 'verified',
    status: 'closed',
    variant: 'highlighted',
    icon: 'store',
    badge: 'Best Rated',
    primaryAction: 'profile',
  },
  {
    id: 4,
    name: 'MedPlus',
    address: 'Munirka DDA Flats Market',
    distance: '3.4 km',
    rating: 4.3,
    reviewCount: '620',
    verification: 'verified',
    status: 'open',
    variant: 'default',
    icon: 'vaccines',
    primaryAction: 'view',
  },
  {
    id: 5,
    name: 'Jan Aushadhi Kendra',
    address: 'Dwarka Sector 10 Market',
    distance: '4.2 km',
    rating: 4.1,
    reviewCount: '310',
    verification: 'verified',
    status: 'open',
    variant: 'default',
    icon: 'medication',
    primaryAction: 'order',
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function VerificationBadge({ status }: { status: VerificationStatus }) {
  if (status === 'verified') {
    return (
      <div className="flex items-center gap-1 text-primary">
        <span className="material-symbols-outlined text-sm">verified</span>
        <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
      </div>
    );
  }
  if (status === 'pending') {
    return (
      <div className="flex items-center gap-1 text-slate-400">
        <span className="material-symbols-outlined text-sm">info</span>
        <span className="text-[10px] font-black uppercase tracking-widest">Pending</span>
      </div>
    );
  }
  return null;
}

function StatusBadge({ status }: { status: OpenStatus }) {
  if (status === 'open') {
    return (
      <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold w-fit">
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
        OPEN
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-slate-400 bg-slate-50 px-2 py-1 rounded text-xs font-bold w-fit">
      <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
      CLOSED
    </span>
  );
}

function ActionButton({
  action,
  variant,
}: {
  action: Pharmacy['primaryAction'];
  variant: CardVariant;
}) {
  const isHighlighted = variant === 'highlighted';

  const label =
    action === 'order'
      ? 'Order Medicine'
      : action === 'profile'
        ? 'View Profile'
        : 'View Medicines';

  const icon =
    action === 'order'
      ? 'arrow_forward'
      : action === 'profile'
        ? 'visibility'
        : 'arrow_forward';

  if (isHighlighted) {
    return (
      <button className="w-full md:w-48 py-3 bg-accent/10 text-accent font-bold rounded-xl hover:bg-accent hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer">
        {label}
        <span className="material-symbols-outlined text-sm">{icon}</span>
      </button>
    );
  }

  if (action === 'view') {
    return (
      <button className="text-primary text-xs font-bold hover:underline cursor-pointer">
        View Medicines
      </button>
    );
  }

  return (
    <button className="w-full md:w-48 py-3 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer">
      {label}
      <span className="material-symbols-outlined text-sm">{icon}</span>
    </button>
  );
}

function PharmacyCard({ pharmacy }: { pharmacy: Pharmacy }) {
  const isHighlighted = pharmacy.variant === 'highlighted';
  const isCompact = pharmacy.primaryAction === 'view';

  if (isCompact) {
    return (
      <div className="bg-white rounded-2xl shadow-[0_2px_4px_rgba(44,88,64,0.05),0_1px_2px_rgba(0,0,0,0.1)] border border-primary/5 flex flex-col md:flex-row items-center p-6 hover:shadow-lg transition-all">
        <div className="w-12 h-12 bg-primary/5 rounded-lg flex items-center justify-center text-primary shrink-0 mb-4 md:mb-0 md:mr-6">
          <span className="material-symbols-outlined text-2xl">{pharmacy.icon}</span>
        </div>
        <div className="flex-1 w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-slate-900">{pharmacy.name}</h4>
            <p className="text-slate-500 text-xs">{pharmacy.address}</p>
          </div>
          <div className="flex items-center gap-6">
            <StatusBadge status={pharmacy.status} />
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">near_me</span>
              {pharmacy.distance}
            </span>
            <ActionButton action={pharmacy.primaryAction} variant={pharmacy.variant} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-2xl shadow-[0_2px_4px_rgba(44,88,64,0.05),0_1px_2px_rgba(0,0,0,0.1)] flex flex-col md:flex-row items-center p-6 hover:shadow-xl transition-all group relative overflow-hidden ${
        isHighlighted
          ? 'border-2 border-accent/30 hover:shadow-accent/10'
          : 'border border-primary/5 hover:shadow-primary/5 border-l-4 border-l-primary'
      }`}
    >
      {/* Best Rated badge */}
      {pharmacy.badge && (
        <div className="absolute top-0 right-0">
          <div className="bg-accent text-white px-4 py-1 text-[10px] font-bold uppercase tracking-tighter">
            {pharmacy.badge}
          </div>
        </div>
      )}

      {/* Icon */}
      <div
        className={`w-16 h-16 rounded-xl flex items-center justify-center shrink-0 mb-4 md:mb-0 md:mr-6 ${
          isHighlighted ? 'bg-accent/10 text-accent' : 'bg-primary/5 text-primary'
        }`}
      >
        <span className="material-symbols-outlined text-4xl">{pharmacy.icon}</span>
      </div>

      {/* Info */}
      <div className="flex-1 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-3">
            <h3
              className={`text-xl font-bold text-slate-900 transition-colors ${
                isHighlighted ? 'group-hover:text-accent' : 'group-hover:text-primary'
              }`}
            >
              {pharmacy.name}
            </h3>
            <VerificationBadge status={pharmacy.verification} />
          </div>
          <StatusBadge status={pharmacy.status} />
        </div>

        <p className="text-slate-500 text-sm mb-4">{pharmacy.address}</p>

        <div className="flex items-center gap-6 text-sm font-medium">
          <div className="flex items-center gap-1 text-slate-600">
            <span className="material-symbols-outlined text-primary text-lg">near_me</span>
            {pharmacy.distance} away
          </div>
          <div className="flex items-center gap-1 text-slate-600">
            <span className="material-symbols-outlined text-yellow-500 text-lg">star</span>
            {pharmacy.rating} ({pharmacy.reviewCount} Reviews)
          </div>
        </div>
      </div>

      {/* Action */}
      <div className="w-full md:w-auto mt-6 md:mt-0 md:ml-8 shrink-0">
        <ActionButton action={pharmacy.primaryAction} variant={pharmacy.variant} />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const { location, loading: geoLoading, error: geoError, requestLocation } = useGeolocation();
  const [cityName, setCityName] = useState<string | null>(null);
  const [radius, setRadius] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  // Reverse-geocode coordinates → city name via OpenStreetMap Nominatim
  useEffect(() => {
    if (!location) return;
    setCityName(null);
    const controller = new AbortController();
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${location.lat}&lon=${location.lng}&format=json`,
      { signal: controller.signal, headers: { 'Accept-Language': 'en' } }
    )
      .then((r) => r.json())
      .then((data) => {
        const addr = data.address ?? {};
        const city =
          addr.city ?? addr.town ?? addr.village ?? addr.county ?? addr.state ?? 'Unknown location';
        const state = addr.state ?? '';
        setCityName(state && state !== city ? `${city}, ${state}` : city);
      })
      .catch(() => {
        // silently ignore abort or network errors
      });
    return () => controller.abort();
  }, [location]);

  const totalPages = 6;

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-[#f6f7f7]">
      <Navbar />

      <main className="flex-1 max-w-360 mx-auto w-full flex flex-col lg:flex-row gap-6 p-6 lg:p-10">
        {/* ── Left Filter Panel ─────────────────────────────────────────── */}
        <aside className="w-full lg:w-80 shrink-0">
          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_4px_rgba(44,88,64,0.05),0_1px_2px_rgba(0,0,0,0.1)] border border-primary/5">
            <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">tune</span>
              Search Filters
            </h3>

            {/* Location */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Current Location
              </label>
              <div className="flex flex-col gap-2">
                <button
                  onClick={requestLocation}
                  disabled={geoLoading}
                  className="flex items-center gap-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span className={`material-symbols-outlined text-lg shrink-0 ${geoLoading ? 'text-slate-400 animate-spin' : 'text-primary'}`}>
                    {geoLoading ? 'progress_activity' : 'my_location'}
                  </span>
                  <span className="text-sm font-medium text-slate-700 truncate">
                    {geoLoading
                      ? 'Detecting location…'
                      : location
                        ? (cityName ?? 'Resolving city…')
                        : 'Detect My Location'}
                  </span>
                </button>
                {geoError && (
                  <p className="text-xs text-red-500 font-medium leading-tight">{geoError}</p>
                )}
                {location && (
                  <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Location detected
                  </p>
                )}
              </div>
            </div>

            {/* Radius slider */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                  Search Radius
                </label>
                <span className="text-primary font-bold bg-primary/10 px-2 py-0.5 rounded text-sm">
                  {radius.toFixed(1)} km
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={0.5}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full h-2 bg-primary/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4.5 [&::-webkit-slider-thumb]:h-4.5 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                <span>1 km</span>
                <span>10 km</span>
              </div>
            </div>

            <button className="w-full bg-primary text-white py-3 rounded-lg font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98] cursor-pointer">
              Apply Search
            </button>
          </div>
        </aside>

        {/* ── Main Content ──────────────────────────────────────────────── */}
        <section className="flex-1 min-w-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Nearby Pharmacies
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Found {MOCK_PHARMACIES.length} reliable partners in your area
            </p>
          </div>

          {/* Pharmacy list */}
          <div className="flex flex-col gap-6">
            {MOCK_PHARMACIES.map((pharmacy) => (
              <PharmacyCard key={pharmacy.id} pharmacy={pharmacy} />
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-12 flex justify-center">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-[0_2px_4px_rgba(44,88,64,0.05),0_1px_2px_rgba(0,0,0,0.1)] border border-slate-100">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary rounded-lg transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>

              {[1, 2, 3].map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold transition-colors cursor-pointer ${
                    currentPage === page
                      ? 'bg-primary text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              ))}

              <span className="px-2 text-slate-300">...</span>

              <button
                onClick={() => setCurrentPage(totalPages)}
                className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold transition-colors cursor-pointer ${
                  currentPage === totalPages
                    ? 'bg-primary text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {totalPages}
              </button>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary rounded-lg transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}
