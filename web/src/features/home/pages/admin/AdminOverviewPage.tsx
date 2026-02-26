import { useEffect } from 'react';
import { Building2, FileCheck, Clock } from 'lucide-react';
import { useAdminStore } from '@/store/useAdminStore';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-NP', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function statusBadge(status: string) {
  if (status === 'APPROVED') return 'text-[#2D5A40] bg-[#2D5A40]/10 border-[#2D5A40]/20';
  if (status === 'REJECTED') return 'text-[#FF6B35] bg-[#FF6B35]/10 border-[#FF6B35]/20';
  return 'text-amber-700 bg-amber-50 border-amber-200';
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
  textAccent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent: string;
  textAccent: string;
}) {
  return (
    <div className="bg-[#FAFAF9] border border-stone-200 rounded-sm p-5 space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{label}</p>
      </div>
      <div className={`border px-4 py-3 ${accent}`}>
        <p className={`text-3xl font-black leading-none ${textAccent}`}>{value}</p>
        <p className="text-xs text-stone-400 mt-1 font-medium">{sub}</p>
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  const {
    pharmacies,
    pharmaciesPagination,
    pharmaciesLoading,
    documents,
    documentsPagination,
    documentsLoading,
    fetchPharmacies,
    fetchPharmacyDocuments,
  } = useAdminStore();

  useEffect(() => {
    fetchPharmacies({ page_size: 1 });
    fetchPharmacyDocuments({ page_size: 5 });
  }, [fetchPharmacies, fetchPharmacyDocuments]);

  const totalPharmacies = pharmaciesPagination?.count ?? pharmacies.length;
  const totalKycs = documentsPagination?.count ?? documents.length;
  const pendingKycs = documents.filter((d) => d.status === 'PENDING').length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[#1C1917]">Admin Overview</h1>
        <p className="mt-1 text-sm text-stone-400">Platform summary at a glance</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Building2 size={20} className="text-[#2D5A40]" />}
          label="Total Pharmacies"
          value={pharmaciesLoading ? '…' : String(totalPharmacies)}
          sub="registered on platform"
          accent="border-[#2D5A40]/20 bg-[#2D5A40]/5"
          textAccent="text-[#2D5A40]"
        />
        <StatCard
          icon={<FileCheck size={20} className="text-amber-600" />}
          label="KYC Submissions"
          value={documentsLoading ? '…' : String(totalKycs)}
          sub="total submissions"
          accent="border-amber-200 bg-amber-50"
          textAccent="text-amber-700"
        />
        <StatCard
          icon={<Clock size={20} className="text-[#FF6B35]" />}
          label="Pending Review"
          value={documentsLoading ? '…' : String(pendingKycs)}
          sub="awaiting approval"
          accent="border-[#FF6B35]/20 bg-[#FF6B35]/5"
          textAccent="text-[#FF6B35]"
        />
      </div>

      {/* Recent KYC submissions */}
      <div className="bg-[#FAFAF9] border border-stone-200 rounded-sm p-6">
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-4">
          Recent KYC Submissions
        </p>

        {documentsLoading && documents.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-stone-100 animate-pulse rounded-sm" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <p className="text-sm text-stone-400 py-4 text-center">No KYC submissions yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {documents.slice(0, 5).map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between border border-stone-200 bg-white px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#1C1917] truncate">{doc.pharmacy_name}</p>
                  <p className="text-xs text-stone-400">{doc.email}</p>
                </div>
                <div className="flex items-center gap-3 ml-3 shrink-0">
                  <span className="text-[10px] text-stone-400">{formatDate(doc.created_at)}</span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-1 border rounded-sm ${statusBadge(doc.status)}`}
                  >
                    {doc.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
