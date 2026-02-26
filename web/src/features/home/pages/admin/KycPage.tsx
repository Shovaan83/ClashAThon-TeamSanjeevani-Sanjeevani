import { useEffect, useState } from 'react';
import { useAdminStore } from '@/store/useAdminStore';

type Status = 'PENDING' | 'APPROVED' | 'REJECTED' | string;

function isPdfUrl(url: string) {
  return /\.pdf(\?|#|$)/i.test(url);
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

function statusBadge(status: Status) {
  if (status === 'APPROVED') return 'bg-green-100 text-green-700 border-green-200';
  if (status === 'REJECTED') return 'bg-red-100 text-red-700 border-red-200';
  return 'bg-yellow-100 text-yellow-800 border-yellow-200';
}

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

  const [statusFilter, setStatusFilter] = useState<string>('');

  // Reject modal state
  const [rejecting, setRejecting] = useState<{
    pharmacyId: number;
    pharmacyName: string;
  } | null>(null);
  const [rejectMsg, setRejectMsg] = useState('');

  useEffect(() => {
    fetchPharmacyDocuments({ status: statusFilter || undefined });
  }, [statusFilter, fetchPharmacyDocuments]);

  const handleApprove = async (pharmacyId: number) => {
    await approvePharmacy(pharmacyId);
    fetchPharmacyDocuments({
      status: statusFilter || undefined,
      page: documentsPagination?.current_page,
    });
  };

  const handleRejectConfirm = async () => {
    if (!rejecting) return;
    if (!rejectMsg.trim()) {
      alert('Please enter rejection message');
      return;
    }
    await rejectPharmacy(rejecting.pharmacyId, rejectMsg.trim());
    setRejectMsg('');
    setRejecting(null);
    fetchPharmacyDocuments({
      status: statusFilter || undefined,
      page: documentsPagination?.current_page,
    });
  };

  const handlePageChange = (page: number) => {
    fetchPharmacyDocuments({ page, status: statusFilter || undefined });
  };

  const emptyState = !documentsLoading && documents.length === 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Pharmacy KYC
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Review submitted pharmacy documents and approve or reject verification.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Filter */}
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
              onClick={() => fetchPharmacyDocuments({ status: statusFilter || undefined })}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Error */}
        {documentsError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {documentsError}
          </div>
        )}

        {/* Loading */}
        {documentsLoading && documents.length === 0 && (
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
            <div className="flex items-center gap-3 text-slate-600">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-transparent" />
              <span className="text-sm font-semibold">Loading KYC requests…</span>
            </div>
          </div>
        )}

        {/* Empty */}
        {emptyState && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-200">
              <span className="material-symbols-outlined text-slate-400">inbox</span>
            </div>
            <p className="mt-3 text-sm font-bold text-slate-900">No KYC requests found</p>
            <p className="mt-1 text-sm text-slate-500">Try changing the filter or refresh.</p>
          </div>
        )}

        {/* List */}
        {!emptyState && documents.length > 0 && (
          <div className="space-y-4">
            {documents.map((doc) => {
              const isBusy = kycActionLoading === doc.pharmacy_id;
              const hasDoc = !!doc.document_url; // ✅ null safe
              const isPdf = hasDoc ? isPdfUrl(doc.document_url as string) : false;

              return (
                <div
                  key={doc.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    {/* Left */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-bold text-slate-900">
                          {doc.pharmacy_name}
                        </h3>

                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${statusBadge(
                            doc.status
                          )}`}
                        >
                          <span className="material-symbols-outlined text-[14px] leading-none">
                            {doc.status === 'APPROVED'
                              ? 'verified'
                              : doc.status === 'REJECTED'
                              ? 'cancel'
                              : 'hourglass_empty'}
                          </span>
                          {doc.status}
                        </span>

                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${
                            doc.is_active
                              ? 'border-slate-200 bg-slate-50 text-slate-700'
                              : 'border-slate-200 bg-slate-100 text-slate-500'
                          }`}
                        >
                          {doc.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <span className="material-symbols-outlined text-[18px] text-slate-400">
                            mail
                          </span>
                          <span className="truncate">{doc.email}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <span className="material-symbols-outlined text-[18px] text-slate-400">
                            call
                          </span>
                          <span>{doc.phone_number}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
                          <span className="material-symbols-outlined text-[18px] text-slate-400">
                            calendar_month
                          </span>
                          <span className="text-xs text-slate-500">
                            Submitted: {formatDate(doc.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Document */}
                      <div className="mt-4">
                        {hasDoc ? (
                          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                              <p className="text-sm font-bold text-slate-800">Document</p>
                              <a
                                href={doc.document_url as string}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-bold text-primary hover:underline"
                              >
                                Open
                              </a>
                            </div>

                            <div className="p-4">
                              {isPdf ? (
                                <iframe
                                  src={doc.document_url as string}
                                  className="h-56 w-full rounded-lg border bg-white"
                                  title={`KYC Doc ${doc.id}`}
                                />
                              ) : (
                                <img
                                  src={doc.document_url as string}
                                  alt="KYC Document"
                                  className="h-56 w-full rounded-lg border bg-white object-contain"
                                />
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-sm font-semibold text-slate-800">No document</p>
                            <p className="mt-1 text-xs text-slate-500">
                              This pharmacy hasn’t uploaded a document yet.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="w-full lg:w-56">
                      {doc.status === 'PENDING' ? (
                        <div className="flex flex-col gap-2">
                          <button
                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-green-700 disabled:opacity-60"
                            onClick={() => handleApprove(doc.pharmacy_id)}
                            disabled={isBusy}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {isBusy ? 'progress_activity' : 'check_circle'}
                            </span>
                            {isBusy ? 'Processing…' : 'Approve'}
                          </button>

                          <button
                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
                            onClick={() =>
                              setRejecting({
                                pharmacyId: doc.pharmacy_id,
                                pharmacyName: doc.pharmacy_name,
                              })
                            }
                            disabled={isBusy}
                          >
                            <span className="material-symbols-outlined text-[18px]">cancel</span>
                            Reject
                          </button>

                          <p className="mt-2 text-xs text-slate-500">
                            Approve or reject the verification request.
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-sm font-bold text-slate-800">Decision made</p>
                          <p className="mt-1 text-xs text-slate-500">
                            This request is already{' '}
                            <span className="font-semibold">{doc.status}</span>.
                          </p>
                          <button
                            className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
                            onClick={() => doc.document_url && window.open(doc.document_url, '_blank')}
                            disabled={!doc.document_url}
                          >
                            View document
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {documentsPagination && documentsPagination.total_pages > 1 && (
          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => handlePageChange(documentsPagination.current_page - 1)}
                disabled={!documentsPagination.previous}
                className="h-10 rounded-xl bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <span className="text-sm font-semibold text-slate-600">
                Page {documentsPagination.current_page} of {documentsPagination.total_pages}
              </span>

              <button
                onClick={() => handlePageChange(documentsPagination.current_page + 1)}
                disabled={!documentsPagination.next}
                className="h-10 rounded-xl bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>

            <p className="text-xs text-slate-500">Total: {documentsPagination.count} requests</p>
          </div>
        )}
      </main>

      {/* Reject Modal */}
      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-lg font-bold text-slate-900">Reject KYC</p>
                <p className="mt-1 text-sm text-slate-500">
                  Pharmacy: <span className="font-semibold">{rejecting.pharmacyName}</span>
                </p>
              </div>
              <button
                className="rounded-lg p-2 hover:bg-slate-50"
                onClick={() => {
                  setRejecting(null);
                  setRejectMsg('');
                }}
              >
                <span className="material-symbols-outlined text-slate-500">close</span>
              </button>
            </div>

            <div className="px-5 py-4">
              <label className="text-sm font-semibold text-slate-700">Rejection reason</label>
              <textarea
                value={rejectMsg}
                onChange={(e) => setRejectMsg(e.target.value)}
                placeholder="Write a clear reason (e.g. document unclear, missing registration number...)"
                className="mt-2 h-28 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="mt-2 text-xs text-slate-500">
                This message may be shown to the pharmacy.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
              <button
                onClick={() => {
                  setRejecting(null);
                  setRejectMsg('');
                }}
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                disabled={kycActionLoading === rejecting.pharmacyId}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                className="h-10 rounded-xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                disabled={kycActionLoading === rejecting.pharmacyId}
              >
                {kycActionLoading === rejecting.pharmacyId ? 'Rejecting…' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KycPage;