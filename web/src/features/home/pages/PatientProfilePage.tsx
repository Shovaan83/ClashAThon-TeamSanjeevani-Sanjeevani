import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { useAuthStore } from '@/store/useAuthStore';
import {
  getPharmacyProfile,
  uploadPharmacyDocument,
  uploadPharmacyProfilePhoto,
  deletePharmacyProfilePhoto,
} from '@/lib/pharmacyapi';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80';

type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | null;

function isPdfUrl(url: string) {
  return /\.pdf(\?|#|$)/i.test(url);
}

export default function PatientProfilePage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  // Profile form (local UI)
  const [formData, setFormData] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: '',
    bloodGroup: 'B+',
  });

  useEffect(() => {
    setFormData((p) => ({
      ...p,
      name: user?.name ?? p.name,
      email: user?.email ?? p.email,
    }));
  }, [user?.name, user?.email]);

  // Right side toggles
  const [pushNotif, setPushNotif] = useState(true);
  const [twoFA, setTwoFA] = useState(false);

  // Server-driven Pharmacy Profile + single document
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [documentStatus, setDocumentStatus] = useState<DocumentStatus>(null);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Fetch profile
  useEffect(() => {
    let mounted = true;

    async function fetchProfile() {
      try {
        const res = await getPharmacyProfile();
        const data = res?.data?.data; // ✅ because your API returns {status,message,data:{...}}

        if (!mounted) return;

        // Populate formData from backend pharmacy profile
        setFormData((p) => ({
          ...p,
          name: data?.name ?? p.name,
          email: data?.email ?? p.email,
          phone: data?.phone_number ?? p.phone,
          // keep bloodGroup as UI-only unless backend has it
        }));

        setProfilePhoto(data?.profile_photo_url ?? null);
        setDocumentUrl(data?.document_url ?? null);
        setDocumentStatus((data?.document_status as DocumentStatus) ?? null);
      } catch (err) {
        console.error(err);
      }
    }

    fetchProfile();
    return () => {
      mounted = false;
    };
  }, []);

  // Logout
  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  // Photo upload
  async function handleProfilePhotoUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      const res = await uploadPharmacyProfilePhoto(file);
      const data = res?.data?.data;
      setProfilePhoto(data?.profile_photo_url ?? null);
    } catch (error) {
      console.error(error);
      alert('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  }

  async function handleDeletePhoto() {
    try {
      await deletePharmacyProfilePhoto();
      setProfilePhoto(null);
    } catch (error) {
      console.error(error);
      alert('Failed to remove photo');
    }
  }

  // Single document upload (replace if exists)
  async function handleDocumentUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingDoc(true);
      const res = await uploadPharmacyDocument(file);
      const data = res?.data?.data;

      // ✅ your upload endpoint returns { document_url, status }
      setDocumentUrl(data?.document_url ?? null);
      setDocumentStatus((data?.status as DocumentStatus) ?? 'PENDING');
    } catch (error) {
      console.error(error);
      alert('Upload failed');
    } finally {
      setUploadingDoc(false);
      e.target.value = '';
    }
  }

  const statusBadge = useMemo(() => {
    const s = documentStatus;
    if (!s) return null;

    if (s === 'APPROVED') return { label: 'APPROVED', cls: 'bg-green-100 text-green-700' };
    if (s === 'REJECTED') return { label: 'REJECTED', cls: 'bg-red-100 text-red-600' };
    return { label: 'PENDING', cls: 'bg-yellow-100 text-yellow-700' };
  }, [documentStatus]);

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
                  src={profilePhoto ?? DEFAULT_AVATAR}
                  alt={formData.name || 'Profile'}
                  className="size-full rounded-full object-cover"
                />
              </div>

              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="profileUpload"
                onChange={handleProfilePhotoUpload}
              />

              <button
                type="button"
                onClick={() =>
                  (document.getElementById('profileUpload') as HTMLInputElement | null)?.click()
                }
                className="absolute bottom-1 right-1 bg-[#FF6B35] text-white p-2 rounded-full shadow-lg hover:scale-105 transition-transform disabled:opacity-70"
                disabled={uploadingPhoto}
                title="Change photo"
              >
                <span className="material-symbols-outlined text-[16px] leading-none">
                  {uploadingPhoto ? 'progress_activity' : 'edit'}
                </span>
              </button>

              {profilePhoto && (
                <button
                  type="button"
                  onClick={handleDeletePhoto}
                  className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-red-500 hover:underline"
                >
                  Remove Photo
                </button>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold text-slate-900">
                  {formData.name || '—'}
                </h1>

                {user?.isVerified && (
                  <span className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[14px] leading-none">
                      verified
                    </span>
                    Verified
                  </span>
                )}

                {statusBadge && (
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${statusBadge.cls}`}>
                    {statusBadge.label}
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

        {/* ── Account Statistics (keep as UI) ── */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 text-center flex flex-col items-center">
            <span className="material-symbols-outlined text-primary mb-2">pill</span>
            <p className="text-3xl font-bold text-slate-900 leading-none">24</p>
            <p className="text-slate-500 text-sm mt-1">Medicine Requests</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 text-center flex flex-col items-center">
            <span className="material-symbols-outlined text-[#FF6B35] mb-2">
              notifications_active
            </span>
            <p className="text-3xl font-bold text-slate-900 leading-none">05</p>
            <p className="text-slate-500 text-sm mt-1">Active Pings</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 text-center flex flex-col items-center">
            <span className="material-symbols-outlined text-primary mb-2">local_pharmacy</span>
            <p className="text-3xl font-bold text-slate-900 leading-none">02</p>
            <p className="text-slate-500 text-sm mt-1">Saved Pharmacies</p>
          </div>
        </section>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left */}
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
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button className="bg-primary text-white px-8 py-2 rounded-lg font-bold text-sm hover:bg-primary/90 transition-all">
                  Save Changes
                </button>
              </div>
            </section>

            {/* ✅ Single Document Slot (replace-only) */}
            <section className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">folder</span>
                  Document
                </h3>

                {statusBadge && (
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${statusBadge.cls}`}>
                    {statusBadge.label}
                  </span>
                )}
              </div>

              <input
                id="singleDocUpload"
                type="file"
                className="hidden"
                accept="image/*,.pdf"
                onChange={handleDocumentUpload}
                disabled={uploadingDoc}
              />

              {!documentUrl ? (
                <button
                  type="button"
                  onClick={() =>
                    (document.getElementById('singleDocUpload') as HTMLInputElement | null)?.click()
                  }
                  disabled={uploadingDoc}
                  className="w-full rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-10 hover:border-primary transition-colors text-center disabled:opacity-70"
                >
                  <span className="material-symbols-outlined text-slate-300 text-[40px]">
                    cloud_upload
                  </span>
                  <p className="mt-2 text-sm font-bold text-slate-800">
                    {uploadingDoc ? 'Uploading...' : 'Upload Document'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    PDF / JPG / PNG — Only one document allowed (new upload replaces old)
                  </p>
                </button>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <p className="text-sm font-bold text-slate-800">Uploaded Document</p>

                    <div className="flex items-center gap-2">
                      <a
                        href={documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        Open
                      </a>

                      <button
                        type="button"
                        onClick={() =>
                          (document.getElementById('singleDocUpload') as HTMLInputElement | null)?.click()
                        }
                        disabled={uploadingDoc}
                        className="text-xs font-bold px-3 py-1 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-70"
                      >
                        {uploadingDoc ? 'Replacing...' : 'Replace'}
                      </button>
                    </div>
                  </div>

                  {isPdfUrl(documentUrl) ? (
                    <iframe
                      src={documentUrl}
                      className="w-full h-72 rounded-lg border bg-white"
                      title="Document Preview"
                    />
                  ) : (
                    <img
                      src={documentUrl}
                      alt="Uploaded Document"
                      className="w-full max-h-80 object-contain rounded-lg border bg-white"
                    />
                  )}

                  <p className="mt-2 text-[11px] text-slate-500">
                    Uploading a new file will replace the existing one and reset status to PENDING.
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Right */}
          <div className="space-y-8">
            {/* Security & Notifications */}
            <section className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">settings</span>
                Security &amp; Notifications
              </h3>

              <div className="space-y-6">
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

      <footer className="bg-white border-t border-primary/10 py-8 px-6 mt-12">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-primary/60">
            <span className="material-symbols-outlined">medical_services</span>
            <h2 className="logo-font text-xl">Sanjeevani</h2>
          </div>
          <p className="text-slate-400 text-sm">
            © 2024 Sanjeevani Healthcare Platform. All rights reserved.
          </p>
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