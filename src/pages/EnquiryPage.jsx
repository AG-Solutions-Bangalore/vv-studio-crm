import React, { useEffect, useState, useMemo } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal';
import EnquiryDetailsModal from '../components/enquiry/EnquiryDetailsModal';
import Pagination from '../components/common/Pagination';
import useDebounce from '../hooks/useDebounce';
import { getEnquiries, getEnquiryById, updateEnquiryStatus, deleteEnquiry } from '../services/enquiryApi';
import { useAuthContext } from '../context/AuthContext';
import { 
  Search, 
  Trash2, 
  Eye, 
  RefreshCw, 
  MessageSquare,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

function extractList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.enquiries?.data)) return response.enquiries.data;
  if (Array.isArray(response?.enquiries)) return response.enquiries;
  if (Array.isArray(response?.enquiry)) return response.enquiry;
  return [];
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return String(dateStr);
  }
}

const STATUS_OPTIONS = ['Pending', 'Processing', 'Completed', 'Cancel'];

export default function EnquiryPage() {
  const { hasEmail, hasWhatsApp, isAdmin } = useAuthContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 350);
  const [statusFilter, setStatusFilter] = useState('All');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);

  // Details Modal state
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Delete Modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ── 1. GET /enquiry with pagination ── */
  const fetchEnquiries = async (page = currentPage, query = debouncedSearch, status = statusFilter) => {
    setLoading(true);
    try {
      const params = {
        page,
        ...(query.trim() ? { search: query.trim(), q: query.trim() } : {}),
        ...(status !== 'All' ? { status } : {}),
      };

      const res = await getEnquiries(params);
      const list = extractList(res);
      setItems(list);

      // Extract pagination metadata from standard Laravel response
      const paginationObj = res?.data?.data ? res?.data : res;
      const total = paginationObj?.total ?? list.length;
      const lastPage = paginationObj?.last_page ?? Math.max(1, Math.ceil(total / (paginationObj?.per_page || 10)));
      const curr = paginationObj?.current_page ?? page;
      const per = paginationObj?.per_page ?? 10;

      setTotalCount(total);
      setTotalPages(lastPage);
      setCurrentPage(curr);
      setPerPage(per);
      setFrom(paginationObj?.from ?? (total > 0 ? (curr - 1) * per + 1 : 0));
      setTo(paginationObj?.to ?? Math.min(curr * per, total));
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to fetch enquiries.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries(currentPage, debouncedSearch, statusFilter);
  }, [currentPage, debouncedSearch, statusFilter]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setCurrentPage(1);
    fetchEnquiries(1, searchQuery, statusFilter);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      fetchEnquiries(newPage, debouncedSearch, statusFilter);
    }
  };

  /* ── 2. GET /enquiry/{id} ── */
  const handleViewDetails = async (id) => {
    setDetailsModalOpen(true);
    setDetailsLoading(true);
    try {
      const res = await getEnquiryById(id);
      const data = res?.data || res?.enquiry || res || {};
      setSelectedEnquiry(data);
    } catch (err) {
      const fallback = items.find((item) => item.id === id);
      setSelectedEnquiry(fallback || null);
    } finally {
      setDetailsLoading(false);
    }
  };

  /* ── 3. PUT /enquiry/{id} ── */
  const handleStatusChange = async (id, newStatus) => {
    const prevItem = items.find((item) => item.id === id);
    const prevStatus = prevItem?.enquiryStatus || prevItem?.enquiry_status || prevItem?.status;

    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, enquiryStatus: newStatus, enquiry_status: newStatus, status: newStatus }
          : item
      )
    );

    try {
      const res = await updateEnquiryStatus(id, newStatus);
      const msg = res?.message || `Status updated to ${newStatus}.`;
      toast.success(msg);
    } catch (err) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, enquiryStatus: prevStatus, enquiry_status: prevStatus, status: prevStatus }
            : item
        )
      );
      toast.error(err?.response?.data?.message || 'Unable to update status.');
    }
  };

  /* ── 4. DELETE /enquiry/{id} ── */
  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      const res = await deleteEnquiry(deletingId);
      toast.success(res?.message || 'Enquiry deleted successfully.');
      setItems((prev) => prev.filter((item) => item.id !== deletingId));
      setDeleteModalOpen(false);
      fetchEnquiries(currentPage, searchQuery, statusFilter);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete enquiry.');
    } finally {
      setDeleting(false);
      setDeletingId(null);
    }
  };

  const getStatusColor = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'completed') return 'bg-[#EDF7EE] text-[#1E6B34] border-[#C6E6CC]';
    if (s === 'processing') return 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]';
    if (s === 'cancel' || s === 'cancelled') return 'bg-[#FDF0F0] text-[#9A2D2D] border-[#F6C8C8]';
    return 'bg-[#FEF6E9] text-[#9A6218] border-[#FAD8A5]';
  };

  // Metrics
  const enquiryStats = React.useMemo(() => {
    const total = totalCount || items.length;
    let pending = 0;
    let completed = 0;
    let cancelled = 0;

    items.forEach((it) => {
      const s = String(it.enquiryStatus || it.enquiry_status || it.status || 'Pending').toLowerCase();
      if (s === 'completed') completed++;
      else if (s === 'cancel' || s === 'cancelled') cancelled++;
      else pending++;
    });

    return [
      {
        label: 'Total Enquiries',
        value: total,
        icon: MessageSquare,
        color: 'emerald',
        filterValue: 'All',
        subtext: 'Customer tickets & requests',
      },
      {
        label: 'Open / Pending',
        value: pending,
        icon: Clock,
        color: 'amber',
        filterValue: 'Pending',
        subtext: 'Awaiting resolution',
      },
      {
        label: 'Completed Enquiries',
        value: completed,
        icon: CheckCircle2,
        color: 'blue',
        filterValue: 'Completed',
        subtext: 'Resolved customer requests',
      },
    ];
  }, [items, totalCount]);

  return (
    <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Enquiry Management" />

        <main className="flex-1 p-5 md:p-6 max-w-7xl w-full">
          
          {/* Header & Action Bar */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-sm md:text-base font-semibold text-[#1A1817] tracking-tight">
                Customer Enquiries
              </h1>
              <p className="text-xs text-[#78716C] mt-0.5">
                Manage, review, and update customer enquiry statuses
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchEnquiries(currentPage, searchQuery, statusFilter)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E2DDD5] bg-white hover:bg-[#F7F4EE] text-[11px] font-medium text-[#4A443D] shadow-2xs transition-all cursor-pointer"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Search and Status Filters Toolbar */}
          <div className="bg-white px-3.5 py-2.5 rounded-xl border border-[#E8E3DA] shadow-2xs mb-4 flex flex-col md:flex-row items-center justify-between gap-3">
            
            {/* Search Input Form */}
            <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full md:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9C9488] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search enquiry..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition-all shadow-2xs placeholder-[#9C9488]"
              />
            </form>
          </div>

          {/* Enquiries Table Card */}
          <div className="bg-white rounded-xl border border-[#E8E3DA] shadow-2xs overflow-hidden">
            {loading ? (
              <div className="py-16 text-center text-[#78716C]">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1A1817] border-t-transparent mx-auto mb-2" />
                <p className="text-xs font-medium">Loading enquiry data...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="py-14 text-center text-[#78716C]">
                <div className="h-10 w-10 rounded-xl bg-[#F7F4EE] flex items-center justify-center mx-auto mb-2.5 text-[#9C9488]">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-[#1A1817]">No enquiries found</p>
                <p className="text-xs text-[#8C8275] mt-0.5">
                  {searchQuery ? 'Try adjusting your search criteria' : 'There are currently no customer enquiries recorded'}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#3D372E]">
                    <thead className="bg-[#F7F4EE] border-b border-[#E8E3DA] text-xs uppercase font-semibold text-[#78716C] tracking-wider whitespace-nowrap">
                      <tr>
                        <th className="px-4 py-2.5 w-14">Sl.No</th>
                        <th className="px-4 py-2.5">FullName</th>
                        <th className="px-4 py-2.5">Mobile</th>
                        <th className="px-4 py-2.5">Email</th>
                        <th className="px-4 py-2.5">Service</th>
                        <th className="px-4 py-2.5">Enquiry From</th>
                        <th className="px-4 py-2.5">Message</th>
                        <th className="px-4 py-2.5">UTM Tracking</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0ECE3]">
                      {items.map((item, index) => {
                        const id = item.id;
                        const fullName = item.enquiryFullName || item.full_name || item.fullName || item.name || '—';
                        const mobile = item.enquiryMobile || item.mobile || item.phone || '—';
                        const email = item.enquiryEmail || item.email || '—';
                        const service = item.enquiryService || item.service || item.service_name || '—';
                        const enquiryFrom = item.enquiryFrom || item.enquiry_from || '—';
                        const message = item.enquiryMessage || item.message || item.description || '—';
                        const utmMedium = item.utm_medium || '';
                        const utmSource = item.utm_source || '';
                        const utmCampaign = item.utm_campaign || '';
                        const hasUtm = Boolean(utmSource || utmMedium || utmCampaign);
                        const currentStatus = item.enquiryStatus || item.enquiry_status || item.status || 'Pending';
                        const rowNumber = (currentPage - 1) * perPage + index + 1;

                        return (
                          <tr key={id || index} className="hover:bg-[#FAF8F5] transition-colors">
                            {/* 1. sl.no */}
                            <td className="px-4 py-3 font-mono text-xs text-[#9C9488]">{rowNumber}</td>
                            
                            {/* 2. FullName */}
                            <td className="px-4 py-3 font-medium text-xs text-[#1A1817] whitespace-nowrap">
                              {fullName}
                            </td>

                            {/* 3. Mobile */}
                            <td className="px-4 py-3 text-xs text-[#3D372E] whitespace-nowrap font-mono">
                              {mobile}
                            </td>

                            {/* 4. Email */}
                            <td className="px-4 py-3 text-xs text-[#5C554B] whitespace-nowrap">
                              {email}
                            </td>

                            {/* 5. Service */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E8E3DA] text-[11px] text-[#4A443D] font-medium">
                                {service}
                              </span>
                            </td>

                            {/* 6. Enquiry From */}
                            <td className="px-4 py-3 text-xs text-[#6B655B] max-w-[200px]">
                              <span className="block truncate" title={enquiryFrom}>
                                {enquiryFrom}
                              </span>
                            </td>

                            {/* 7. Message */}
                            <td className="px-4 py-3 text-xs text-[#78716C] max-w-[200px]">
                              <span className="block truncate" title={message}>
                                {message}
                              </span>
                            </td>

                            {/* 8. UTM Tracking */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              {hasUtm ? (
                                <div className="flex flex-wrap gap-1 max-w-[180px]">
                                  {utmSource && (
                                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#EBF3FF] text-[#1E40AF] border border-[#BFDBFE]">
                                      s:{utmSource}
                                    </span>
                                  )}
                                  {utmMedium && (
                                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#F3E8FF] text-[#6B21A8] border border-[#E9D5FF]">
                                      m:{utmMedium}
                                    </span>
                                  )}
                                  {utmCampaign && (
                                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                                      c:{utmCampaign}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[#A8A29E] text-[11px]">—</span>
                              )}
                            </td>

                            {/* 9. Status */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              {isAdmin ? (
                                <select
                                  value={currentStatus}
                                  onChange={(e) => handleStatusChange(id, e.target.value)}
                                  className={`text-xs font-medium py-0.5 px-2.5 rounded-full border outline-none cursor-pointer transition shadow-2xs ${getStatusColor(currentStatus)}`}
                                >
                                  {STATUS_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt} className="bg-white text-[#1A1817]">
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className={`inline-flex items-center text-xs font-medium py-0.5 px-2.5 rounded-full border shadow-2xs ${getStatusColor(currentStatus)}`}>
                                  {currentStatus}
                                </span>
                              )}
                            </td>

                            {/* 10. Actions */}
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleViewDetails(id)}
                                  title="View Enquiry Details"
                                  className="p-1.5 rounded-lg text-[#78716C] hover:text-[#9E7432] hover:bg-[#FBF4E8] transition cursor-pointer"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDeletingId(id);
                                      setDeleteModalOpen(true);
                                    }}
                                    title="Delete Enquiry"
                                    className="p-1.5 rounded-lg text-[#78716C] hover:text-[#9A2D2D] hover:bg-[#FDF0F0] transition cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Server-side Pagination Component */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  perPage={perPage}
                  from={from}
                  to={to}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </div>

        </main>
      </div>

      {/* View Details Modal */}
      <EnquiryDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        enquiry={selectedEnquiry}
        loading={detailsLoading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingId(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Enquiry"
        message="Are you sure you want to delete this customer enquiry? This action cannot be undone."
        submitting={deleting}
      />
    </div>
  );
}

