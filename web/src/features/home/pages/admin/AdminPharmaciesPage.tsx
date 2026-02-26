import { useEffect, useMemo, useState } from 'react';
import { useAdminStore } from '@/store/useAdminStore';

type Status = 'PENDING' | 'APPROVED' | 'REJECTED' | string;

function statusPill(status: Status) {
  if (status === 'APPROVED') return 'bg-green-100 text-green-700 border-green-200';
  if (status === 'REJECTED') return 'bg-red-100 text-red-700 border-red-200';
  return 'bg-yellow-100 text-yellow-800 border-yellow-200';
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

const DUMMY_PHARMACIES = [
  {
    id: 1,
    name: 'City Pharmacy',
    user_name: 'pharmacy',
    email: 'pharmacy@gmail.com',
    phone_number: '9841234567',
    address: 'Kathmandu, Nepal',
    lat: 27.7172,
    lng: 85.324,
    profile_photo_url: null,
    document_url: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1200&q=80',
    document_status: 'PENDING',
    is_active: true,
    created_at: '2026-02-25T16:52:35.480047Z',
  },
  {
    id: 2,
    name: 'Everest Pharmacy',
    user_name: 'everest',
    email: 'everest@test.com',
    phone_number: '9840000002',
    address: 'Pokhara, Nepal',
    lat: 28.2096,
    lng: 83.9856,
    profile_photo_url:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    document_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    document_status: 'APPROVED',
    is_active: true,
    created_at: '2026-02-24T12:22:12.480047Z',
  },
  {
    id: 3,
    name: 'Himalayan Meds',
    user_name: 'himalayan',
    email: 'himalayan@test.com',
    phone_number: '9840000003',
    address: 'Biratnagar, Nepal',
    lat: 26.4525,
    lng: 87.2718,
    profile_photo_url: null,
    document_url: null,
    document_status: 'REJECTED',
    is_active: false,
    created_at: '2026-02-20T09:30:00.000000Z',
  },
];

export default function AdminPharmaciesPage() {
  const {
    pharmacies,
    pharmaciesLoading,
    pharmaciesError,
    pharmaciesPagination,
    fetchPharmacies,
  } = useAdminStore();

  // flip this while building UI
  const USE_DUMMY = false;

  const data = USE_DUMMY ? DUMMY_PHARMACIES : pharmacies;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');


  useEffect(() => {
    fetchPharmacies({
      search: search || undefined,
      status: statusFilter || undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleSearch = () => {
    fetchPharmacies({
      search: search || undefined,
      status: statusFilter || undefined,
    });
  };

  const handlePageChange = (page: number) => {
    fetchPharmacies({
      page,
      search: search || undefined,
      status: statusFilter || undefined,
    });
  };

  const stats = useMemo(() => {
    const total = data.length;
    const approved = data.filter((p: any) => p.document_status === 'APPROVED').length;
    const pending = data.filter((p: any) => (p.document_status ?? 'PENDING') === 'PENDING').length;
    const rejected = data.filter((p: any) => p.document_status === 'REJECTED').length;
    const active = data.filter((p: any) => p.is_active).length;
    return { total, approved, pending, rejected, active };
  }, [data]);

  if (!USE_DUMMY && pharmaciesLoading && pharmacies.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-16 flex items-center justify-center">
          <div className="flex items-center gap-3 text-slate-600">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-transparent" />
            <span className="text-sm font-semibold">Loading pharmacies…</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              All Pharmacies
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Search, filter and review registered pharmacies.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-500">TOTAL</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-green-600">APPROVED</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stats.approved}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-yellow-600">PENDING</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stats.pending}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-red-600">REJECTED</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stats.rejected}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-600">ACTIVE</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stats.active}</p>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full items-center gap-2">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <span className="material-symbols-outlined text-[18px]">search</span>
              </span>
              <input
                type="text"
                placeholder="Search by name, username or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-semibold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <button
              onClick={handleSearch}
              className="h-10 rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-sm hover:bg-primary/90"
            >
              Search
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <span className="material-symbols-outlined text-[18px]">filter_list</span>
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 w-48 rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-semibold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() =>
                fetchPharmacies({ search: search || undefined, status: statusFilter || undefined })
              }
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Error */}
        {!USE_DUMMY && pharmaciesError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pharmaciesError}
          </div>
        )}

        {/* Table */}
        {data.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-sm font-bold text-slate-900">No pharmacies found</p>
            <p className="mt-1 text-sm text-slate-500">Try another search or filter.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-3 text-left font-bold">Pharmacy</th>
                    <th className="px-6 py-3 text-left font-bold">Contact</th>
                    <th className="px-6 py-3 text-left font-bold">Status</th>
                    <th className="px-6 py-3 text-left font-bold">Created</th>
                    <th className="px-6 py-3 text-left font-bold">Document</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((pharmacy: any) => (
                    <tr key={pharmacy.id} className="hover:bg-slate-50">
                      {/* Pharmacy cell */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {pharmacy.profile_photo_url ? (
                            <img
                              src={pharmacy.profile_photo_url}
                              alt={pharmacy.name}
                              className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 ring-1 ring-slate-200">
                              <span className="text-sm font-bold text-slate-500">
                                {(pharmacy.name?.charAt(0) || 'P').toUpperCase()}
                              </span>
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900">
                              {pharmacy.name || pharmacy.user_name || 'N/A'}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {pharmacy.address || '—'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div className="truncate">{pharmacy.email}</div>
                        <div className="text-xs text-slate-500">
                          {pharmacy.phone_number || 'N/A'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${
                            statusPill(pharmacy.document_status || 'PENDING')
                          }`}
                        >
                          {pharmacy.document_status || 'PENDING'}
                        </span>

                        <div className="mt-1 text-[11px] text-slate-500">
                          {pharmacy.is_active ? 'Active' : 'Inactive'}
                        </div>
                      </td>

                      {/* Created */}
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {formatDate(pharmacy.created_at)}
                      </td>

                      {/* Document */}
                      <td className="px-6 py-4">
                        {pharmacy.document_url ? (
                          <a
                            href={pharmacy.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              description
                            </span>
                            View
                          </a>
                        ) : (
                          <span className="text-sm text-slate-400">No document</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer pagination */}
            {!USE_DUMMY && pharmaciesPagination && (
              <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row">
                <p className="text-xs text-slate-500">
                  Total: {pharmaciesPagination.count} pharmacies
                </p>

                {pharmaciesPagination.total_pages > 1 && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handlePageChange(pharmaciesPagination.current_page - 1)}
                      disabled={!pharmaciesPagination.previous}
                      className="h-10 rounded-xl bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm font-semibold text-slate-600">
                      Page {pharmaciesPagination.current_page} of{' '}
                      {pharmaciesPagination.total_pages}
                    </span>
                    <button
                      onClick={() => handlePageChange(pharmaciesPagination.current_page + 1)}
                      disabled={!pharmaciesPagination.next}
                      className="h-10 rounded-xl bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}