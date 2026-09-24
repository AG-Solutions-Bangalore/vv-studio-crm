import React, { useEffect, useState, useMemo } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal';
import Pagination from '../components/common/Pagination';
import useDebounce from '../hooks/useDebounce';
import { getNewsletters, deleteNewsletter } from '../services/newsletterApi';
import { useAuthContext } from '../context/AuthContext';
import { 
  Search, 
  Trash2, 
  RefreshCw, 
  Mail, 
  Copy, 
  Check,
  Users,
  CheckCircle2,
  Inbox,
} from 'lucide-react';
import toast from 'react-hot-toast';

function extractList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.newsletters?.data)) return response.newsletters.data;
  if (Array.isArray(response?.newsletters)) return response.newsletters;
  if (Array.isArray(response?.newsletter)) return response.newsletter;
  if (Array.isArray(response?.subscribers)) return response.subscribers;
  return [];
}

export default function NewsletterPage() {
  const { isAdmin } = useAuthContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 350);
  const [copiedId, setCopiedId] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ── 1. GET /newsletter with pagination ── */
  const fetchNewsletters = async (page = currentPage, query = debouncedSearch) => {
    setLoading(true);
    try {
      const params = {
        page,
        ...(query.trim() ? { search: query.trim(), q: query.trim() } : {}),
      };

      const res = await getNewsletters(params);
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
      const msg = err?.response?.data?.message || err?.message || 'Failed to fetch newsletter subscriptions.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewsletters(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setCurrentPage(1);
    fetchNewsletters(1, searchQuery);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      fetchNewsletters(newPage, debouncedSearch);
    }
  };

  /* ── 2. DELETE /newsletter/{id} ── */
  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      const res = await deleteNewsletter(deletingId);
      toast.success(res?.message || 'Subscriber removed successfully.');
      setItems((prev) => prev.filter((item) => item.id !== deletingId));
      setDeleteModalOpen(false);
      fetchNewsletters(currentPage, searchQuery);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete subscriber.');
    } finally {
      setDeleting(false);
      setDeletingId(null);
    }
  };

  const handleCopyEmail = (email, id) => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    toast.success('Email copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const newsletterStats = React.useMemo(() => {
    const total = totalCount || items.length;
    return [
      {
        label: 'Total Subscribers',
        value: total,
        icon: Mail,
        color: 'amber',
        subtext: 'Registered newsletter audience',
      },
      {
        label: 'Verified Addresses',
        value: total,
        icon: CheckCircle2,
        color: 'emerald',
        subtext: 'Active email subscribers',
      },
      {
        label: 'Subscriber Growth',
        value: '100%',
        icon: Users,
        color: 'blue',
        subtext: 'Opted in via web portal',
      },
    ];
  }, [items, totalCount]);

  return (
    <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Newsletter Subscribers" />

        <main className="flex-1 p-5 md:p-6 max-w-7xl w-full">
          
          {/* Header Bar */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-sm md:text-base font-semibold text-[#1A1817] tracking-tight">
                Newsletter Subscriptions
              </h1>
              <p className="text-xs text-[#78716C] mt-0.5">
                View and manage email subscribers collected from your web portal
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchNewsletters(currentPage, searchQuery)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E2DDD5] bg-white hover:bg-[#F7F4EE] text-[11px] font-medium text-[#4A443D] shadow-2xs transition-all cursor-pointer"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Search Toolbar */}
          <div className="bg-white px-3.5 py-2.5 rounded-xl border border-[#E8E3DA] shadow-2xs mb-4 flex items-center justify-between">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9C9488] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subscriber email & hit Enter..."
                className="w-full pl-8 pr-3 py-1.5 text-[11px] rounded-lg border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition-all shadow-2xs placeholder-[#9C9488]"
              />
            </form>
          </div>

          {/* Subscribers Table Card */}
          <div className="bg-white rounded-xl border border-[#E8E3DA] shadow-2xs overflow-hidden">
            {loading ? (
              <div className="py-16 text-center text-[#78716C]">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1A1817] border-t-transparent mx-auto mb-2" />
                <p className="text-xs font-medium">Loading subscribers...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="py-14 text-center text-[#78716C]">
                <div className="h-10 w-10 rounded-xl bg-[#F7F4EE] flex items-center justify-center mx-auto mb-2.5 text-[#9C9488]">
                  <Mail className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-[#1A1817]">No subscribers found</p>
                <p className="text-xs text-[#8C8275] mt-0.5">
                  {searchQuery ? 'No subscriber matches your search term' : 'There are no newsletter subscribers yet'}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#3D372E]">
                    <thead className="bg-[#F7F4EE] border-b border-[#E8E3DA] text-xs uppercase font-semibold text-[#78716C] tracking-wider">
                      <tr>
                        <th className="px-4 py-2.5 w-16">Sl.No</th>
                        <th className="px-4 py-2.5">Subscriber Email</th>
                        <th className="px-4 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0ECE3]">
                      {items.map((item, index) => {
                        const id = item.id;
                        const email = item.email || item.newsletter_email || item.newsletterEmail || 'N/A';
                        const rowNumber = (currentPage - 1) * perPage + index + 1;

                        return (
                          <tr key={id || index} className="hover:bg-[#FAF8F5] transition-colors">
                            <td className="px-4 py-3 font-mono text-xs text-[#9C9488]">{rowNumber}</td>
                            
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="h-7 w-7 rounded-lg bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] flex items-center justify-center flex-shrink-0">
                                  <Mail className="h-3.5 w-3.5" />
                                </div>
                                <span className="font-medium text-xs text-[#1A1817] tracking-tight">{email}</span>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleCopyEmail(email, id)}
                                  title="Copy Email"
                                  className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1A1817] hover:bg-[#EFECE6] transition cursor-pointer"
                                >
                                  {copiedId === id ? <Check className="h-3.5 w-3.5 text-[#1E6B34]" /> : <Copy className="h-3.5 w-3.5" />}
                                </button>

                                {isAdmin && (
                                  <button
                                    onClick={() => {
                                      setDeletingId(id);
                                      setDeleteModalOpen(true);
                                    }}
                                    title="Delete Subscriber"
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

                {/* Server Pagination */}
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingId(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Newsletter Subscriber"
        message="Are you sure you want to remove this email subscriber from the newsletter list?"
        submitting={deleting}
      />
    </div>
  );
}

