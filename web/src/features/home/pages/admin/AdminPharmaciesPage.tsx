import { useEffect, useState } from 'react';
import { useAdminStore } from '@/store/useAdminStore';

const AdminPharmaciesPage = () => {
  const {
    pharmacies,
    pharmaciesLoading,
    pharmaciesError,
    pharmaciesPagination,
    fetchPharmacies,
  } = useAdminStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchPharmacies({ search: search || undefined, status: statusFilter || undefined });
  }, [statusFilter]);

  const handleSearch = () => {
    fetchPharmacies({ search: search || undefined, status: statusFilter || undefined });
  };

  const handlePageChange = (page: number) => {
    fetchPharmacies({ page, search: search || undefined, status: statusFilter || undefined });
  };

  if (pharmaciesLoading && pharmacies.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">All Pharmacies</h1>

      {/* Search and Filter */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex gap-2 flex-1">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="border rounded px-4 py-2 flex-1"
          />
          <button
            onClick={handleSearch}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Search
          </button>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded px-4 py-2 bg-white"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {pharmaciesError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {pharmaciesError}
        </div>
      )}

      {pharmacies.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No pharmacies found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pharmacies.map((pharmacy) => (
                <tr key={pharmacy.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {pharmacy.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {pharmacy.profile_photo_url ? (
                        <img
                          src={pharmacy.profile_photo_url}
                          alt={pharmacy.name}
                          className="h-10 w-10 rounded-full mr-3"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                          <span className="text-gray-500 text-sm">
                            {pharmacy.name?.charAt(0) || 'P'}
                          </span>
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-900">
                        {pharmacy.name || pharmacy.user_name || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pharmacy.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pharmacy.phone_number || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {pharmacy.address || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        pharmacy.document_status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : pharmacy.document_status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {pharmacy.document_status || 'PENDING'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(pharmacy.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {pharmacy.document_url ? (
                      <a
                        href={pharmacy.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline hover:text-blue-800"
                      >
                        View Document
                      </a>
                    ) : (
                      <span className="text-gray-400">No Document</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pharmaciesPagination && pharmaciesPagination.total_pages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            onClick={() => handlePageChange(pharmaciesPagination.current_page - 1)}
            disabled={!pharmaciesPagination.previous}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
          >
            Previous
          </button>
          <span className="text-gray-600">
            Page {pharmaciesPagination.current_page} of {pharmaciesPagination.total_pages}
          </span>
          <button
            onClick={() => handlePageChange(pharmaciesPagination.current_page + 1)}
            disabled={!pharmaciesPagination.next}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
          >
            Next
          </button>
        </div>
      )}

      {/* Total count */}
      {pharmaciesPagination && (
        <p className="text-center text-gray-500 mt-2">
          Total: {pharmaciesPagination.count} pharmacies
        </p>
      )}
    </div>
  );
};

export default AdminPharmaciesPage;
