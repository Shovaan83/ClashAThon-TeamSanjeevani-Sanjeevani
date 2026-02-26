import { useEffect, useState } from 'react';
import { useAdminStore } from '@/store/useAdminStore';

type Role = 'ADMIN' | 'PHARMACY' | 'CUSTOMER' | string;

function rolePill(role: Role) {
  if (role === 'ADMIN') return 'text-purple-700 bg-purple-50 border-purple-200';
  if (role === 'PHARMACY') return 'text-[#2D5A40] bg-[#2D5A40]/10 border-[#2D5A40]/20';
  return 'text-stone-600 bg-stone-50 border-stone-200';
}

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

export default function AdminUsersPage() {
  const {
    users,
    usersLoading,
    usersError,
    usersPagination,
    fetchUsers,
  } = useAdminStore();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    fetchUsers({ role: roleFilter || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  const handleSearch = () => {
    fetchUsers({ search: search || undefined, role: roleFilter || undefined });
  };

  const handlePageChange = (page: number) => {
    fetchUsers({ page, search: search || undefined, role: roleFilter || undefined });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            All Users
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Search and filter all registered users on the platform.
          </p>
        </div>

        {/* Search + Filter */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <span className="material-symbols-outlined text-[18px]">search</span>
              </span>
              <input
                type="text"
                placeholder="Search by name or email..."
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
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-10 w-44 rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-semibold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">All Roles</option>
                <option value="CUSTOMER">Customer</option>
                <option value="PHARMACY">Pharmacy</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => fetchUsers({ search: search || undefined, role: roleFilter || undefined })}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Error */}
        {usersError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {usersError}
          </div>
        )}

        {/* Loading */}
        {usersLoading && users.length === 0 && (
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
            <div className="flex items-center gap-3 text-slate-600">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-transparent" />
              <span className="text-sm font-semibold">Loading users…</span>
            </div>
          </div>
        )}

        {/* Empty */}
        {!usersLoading && users.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-sm font-bold text-slate-900">No users found</p>
            <p className="mt-1 text-sm text-slate-500">Try changing the filter or search term.</p>
          </div>
        )}

        {/* Table */}
        {users.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-3 text-left font-bold">User</th>
                    <th className="px-6 py-3 text-left font-bold">Contact</th>
                    <th className="px-6 py-3 text-left font-bold">Role</th>
                    <th className="px-6 py-3 text-left font-bold">Status</th>
                    <th className="px-6 py-3 text-left font-bold">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 ring-1 ring-slate-200">
                            <span className="text-sm font-bold text-slate-500">
                              {(user.name?.charAt(0) || user.email.charAt(0)).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900">
                              {user.name || '—'}
                            </p>
                            <p className="truncate text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {user.phone_number || '—'}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${rolePill(user.role)}`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${
                            user.is_active
                              ? 'text-[#2D5A40] bg-[#2D5A40]/10 border-[#2D5A40]/20'
                              : 'text-slate-500 bg-slate-100 border-slate-200'
                          }`}
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-500">
                        {formatDate(user.date_joined)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            {usersPagination && usersPagination.total_pages > 1 && (
              <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row">
                <p className="text-xs text-slate-500">Total: {usersPagination.count} users</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handlePageChange(usersPagination.current_page - 1)}
                    disabled={!usersPagination.previous}
                    className="h-10 rounded-xl bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm font-semibold text-slate-600">
                    Page {usersPagination.current_page} of {usersPagination.total_pages}
                  </span>
                  <button
                    onClick={() => handlePageChange(usersPagination.current_page + 1)}
                    disabled={!usersPagination.next}
                    className="h-10 rounded-xl bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
