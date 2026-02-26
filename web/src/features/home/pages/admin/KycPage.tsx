import { useEffect, useState } from 'react';
import { useAdminStore } from '@/store/useAdminStore';

const KycPage = () => {
  const {
    documents,
    documentsLoading,
    documentsError,
    documentsPagination,
    kycActionLoading,
    fetchPharmacyDocuments,
    approvePharmacy,
    rejectPharmacy,
  } = useAdminStore();

  const [rejectMsg, setRejectMsg] = useState<string>('');
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchPharmacyDocuments({ status: statusFilter || undefined });
  }, [statusFilter]);

  const handleApprove = async (pharmacyId: number) => {
    await approvePharmacy(pharmacyId);
  };

  const handleReject = async (pharmacyId: number) => {
    if (!rejectMsg.trim()) {
      alert('Please enter rejection message');
      return;
    }
    await rejectPharmacy(pharmacyId, rejectMsg);
    setRejectMsg('');
    setRejectingId(null);
  };

  const handlePageChange = (page: number) => {
    fetchPharmacyDocuments({ page, status: statusFilter || undefined });
  };

  if (documentsLoading && documents.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pharmacy KYC Requests</h1>
        
        {/* Status Filter */}
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

      {documentsError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {documentsError}
        </div>
      )}

      {documents.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No KYC requests found.
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="border p-4 rounded-lg shadow-sm bg-white flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1">
                <div className="flex-1">
                  <p className="font-semibold text-lg">{doc.pharmacy_name}</p>
                  <p className="text-sm text-gray-500">{doc.email}</p>
                  <p className="text-sm text-gray-500">{doc.phone_number}</p>
                  <p className="mt-1">
                    Status:{' '}
                    <span
                      className={`font-semibold ${
                        doc.status === 'APPROVED'
                          ? 'text-green-600'
                          : doc.status === 'REJECTED'
                          ? 'text-red-600'
                          : 'text-yellow-600'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Submitted: {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
                {doc.document_url && (
                  <a
                    href={doc.document_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    View Document
                  </a>
                )}
              </div>

              {doc.status === 'PENDING' && (
                <div className="flex flex-col gap-2 w-full md:w-auto">
                  <button
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleApprove(doc.pharmacy_id)}
                    disabled={kycActionLoading === doc.pharmacy_id}
                  >
                    {kycActionLoading === doc.pharmacy_id ? 'Processing...' : 'Approve'}
                  </button>
                  
                  {rejectingId === doc.pharmacy_id ? (
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        placeholder="Rejection reason"
                        className="border px-3 py-2 rounded w-full"
                        value={rejectMsg}
                        onChange={(e) => setRejectMsg(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button
                          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50 flex-1"
                          onClick={() => handleReject(doc.pharmacy_id)}
                          disabled={kycActionLoading === doc.pharmacy_id}
                        >
                          {kycActionLoading === doc.pharmacy_id ? 'Processing...' : 'Confirm Reject'}
                        </button>
                        <button
                          className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                          onClick={() => {
                            setRejectingId(null);
                            setRejectMsg('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                      onClick={() => setRejectingId(doc.pharmacy_id)}
                    >
                      Reject
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {documentsPagination && documentsPagination.total_pages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            onClick={() => handlePageChange(documentsPagination.current_page - 1)}
            disabled={!documentsPagination.previous}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
          >
            Previous
          </button>
          <span className="text-gray-600">
            Page {documentsPagination.current_page} of {documentsPagination.total_pages}
          </span>
          <button
            onClick={() => handlePageChange(documentsPagination.current_page + 1)}
            disabled={!documentsPagination.next}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
          >
            Next
          </button>
        </div>
      )}

      {/* Total count */}
      {documentsPagination && (
        <p className="text-center text-gray-500 mt-2">
          Total: {documentsPagination.count} documents
        </p>
      )}
    </div>
  );
};

export default KycPage;