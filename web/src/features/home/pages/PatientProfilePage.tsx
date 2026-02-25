import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { useAuthStore } from '@/store/useAuthStore';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const SAVED_PHARMACIES = [
  { id: 1, name: 'Everest Pharmacy', address: 'Lazimpat, Kathmandu' },
  { id: 2, name: 'Himalayan Meds', address: 'New Road, Kathmandu' },
];

const HEALTH_RECORDS = [
  {
    id: 1,
    name: 'General Checkup.pdf',
    date: 'Oct 12, 2023',
    thumb:
      'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=400&q=80',
  },
  {
    id: 2,
    name: 'Pharmacy Receipt.jpg',
    date: 'Nov 05, 2023',
    thumb:
      'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&q=80',
  },
];

export default function PatientProfilePage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name ?? 'Arjun Sharma',
    email: user?.email ?? 'arjun.sharma@example.com',
    phone: '+977 984-1234567',
    bloodGroup: 'B+',
  });

  const [pushNotif, setPushNotif] = useState(true);
  const [twoFA, setTwoFA] = useState(false);
  const [savedPharmacies, setSavedPharmacies] = useState(SAVED_PHARMACIES);



 async function handleLogout() {
  await logout();
  navigate('/login');
}

  function removeSavedPharmacy(id: number) {
    setSavedPharmacies((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-[#f6f7f7]">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full py-8 px-6">
        {/* ── Profile Header ── */}
        <section className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Avatar */}
            <div className="relative">
              <div className="size-32 rounded-full border-4 border-primary/20 p-1">
                <img
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
                  alt={formData.name}
                  className="size-full rounded-full object-cover"
                />
              </div>
              <button className="absolute bottom-1 right-1 bg-[#FF6B35] text-white p-2 rounded-full shadow-lg hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[16px] leading-none">edit</span>
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold text-slate-900">{formData.name}</h1>
                {user?.isVerified && (
                  <span className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[14px] leading-none">verified</span>
                    Verified
                  </span>
                )}
              </div>
              <p className="text-slate-500 flex items-center justify-center md:justify-start gap-1">
                <span className="material-symbols-outlined text-[18px]">location_on</span>
                Kathmandu, Nepal
              </p>
              <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
                <button className="bg-primary text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-primary/90 transition-all">
                  Edit Profile
                </button>
                <button className="bg-slate-100 text-slate-700 px-6 py-2 rounded-lg font-bold text-sm hover:bg-slate-200 transition-all">
                  Download ID
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Account Statistics ── */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 text-center flex flex-col items-center">
            <span className="material-symbols-outlined text-primary mb-2">pill</span>
            <p className="text-3xl font-bold text-slate-900 leading-none">24</p>
            <p className="text-slate-500 text-sm mt-1">Medicine Requests</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 text-center flex flex-col items-center">
            <span className="material-symbols-outlined text-[#FF6B35] mb-2">notifications_active</span>
            <p className="text-3xl font-bold text-slate-900 leading-none">05</p>
            <p className="text-slate-500 text-sm mt-1">Active Pings</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 text-center flex flex-col items-center">
            <span className="material-symbols-outlined text-primary mb-2">local_pharmacy</span>
            <p className="text-3xl font-bold text-slate-900 leading-none">{savedPharmacies.length}</p>
            <p className="text-slate-500 text-sm mt-1">Saved Pharmacies</p>
          </div>
        </section>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Personal Info + Health Records */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Information */}
            <section className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person</span>
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-500">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-500">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-500">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-500">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData((p) => ({ ...p, bloodGroup: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Save button */}
              <div className="mt-6 flex justify-end">
                <button className="bg-primary text-white px-8 py-2 rounded-lg font-bold text-sm hover:bg-primary/90 transition-all">
                  Save Changes
                </button>
              </div>
            </section>

            {/* Health Records */}
            <section className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">description</span>
                  Health Records
                </h3>
                <button className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Upload New
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {HEALTH_RECORDS.map((rec) => (
                  <div
                    key={rec.id}
                    className="group relative rounded-lg border border-slate-200 overflow-hidden cursor-pointer"
                  >
                    <img
                      src={rec.thumb}
                      alt={rec.name}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-2 bg-white">
                      <p className="text-xs font-bold truncate">{rec.name}</p>
                      <p className="text-[10px] text-slate-500">{rec.date}</p>
                    </div>
                    <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="material-symbols-outlined text-white">visibility</span>
                    </div>
                  </div>
                ))}

                {/* Add new */}
                <label className="flex flex-col items-center justify-center h-full min-h-36 border-2 border-dashed border-slate-200 rounded-lg p-4 hover:border-primary transition-colors cursor-pointer">
                  <input type="file" className="sr-only" accept="image/*,.pdf" />
                  <span className="material-symbols-outlined text-slate-300 text-[32px]">cloud_upload</span>
                  <p className="text-[10px] text-slate-500 mt-1">Add File</p>
                </label>
              </div>
            </section>
          </div>

          {/* Right: Saved Pharmacies + Security */}
          <div className="space-y-8">
            {/* Saved Pharmacies */}
            <section className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">favorite</span>
                Saved Pharmacies
              </h3>
              <div className="space-y-4">
                {savedPharmacies.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No saved pharmacies yet.</p>
                ) : (
                  savedPharmacies.map((ph) => (
                    <div
                      key={ph.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100"
                    >
                      <div className="size-10 bg-primary/10 rounded flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary text-[20px]">store</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{ph.name}</p>
                        <p className="text-[10px] text-slate-500">{ph.address}</p>
                      </div>
                      <button
                        onClick={() => removeSavedPharmacy(ph.id)}
                        className="text-[#FF6B35] hover:scale-110 transition-transform shrink-0"
                        title="Remove"
                      >
                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          favorite
                        </span>
                      </button>
                    </div>
                  ))
                )}
                <a className="block text-center text-xs font-bold text-primary hover:underline mt-2" href="#">
                  View All Pharmacies
                </a>
              </div>
            </section>

            {/* Security & Notifications */}
            <section className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">settings</span>
                Security &amp; Notifications
              </h3>

              <div className="space-y-6">
                {/* Push Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">Push Notifications</p>
                    <p className="text-xs text-slate-500">Alerts for pings and requests</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={pushNotif}
                      onChange={(e) => setPushNotif(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                  </label>
                </div>

                {/* 2FA */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">2FA Authentication</p>
                    <p className="text-xs text-slate-500">Enhanced account protection</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={twoFA}
                      onChange={(e) => setTwoFA(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                  </label>
                </div>

                <hr className="border-slate-100" />

                <button
                  onClick={handleLogout}
                  className="w-full py-2 bg-slate-100 text-red-500 text-sm font-bold rounded-lg hover:bg-red-50 transition-colors"
                >
                  Logout Session
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-primary/10 py-8 px-6 mt-12">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-primary/60">
            <span className="material-symbols-outlined">medical_services</span>
            <h2 className="logo-font text-xl">Sanjeevani</h2>
          </div>
          <p className="text-slate-400 text-sm">© 2024 Sanjeevani Healthcare Platform. All rights reserved.</p>
          <div className="flex gap-4">
            <a className="text-slate-400 hover:text-primary transition-colors" href="#">
              <span className="material-symbols-outlined">social_leaderboard</span>
            </a>
            <a className="text-slate-400 hover:text-primary transition-colors" href="#">
              <span className="material-symbols-outlined">language</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
