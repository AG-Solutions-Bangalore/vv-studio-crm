import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import FaqViewModal from '../components/faq/FaqViewModal';
import Pagination from '../components/common/Pagination';
import useDebounce from '../hooks/useDebounce';
import {
  getFaqs,
  getFaqById,
  updateFaqStatus,
} from '../services/faqApi';
import {
  Plus,
  Search,
  Edit2,
  RefreshCw,
  HelpCircle,
  Eye,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

function extractList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.faqs?.data)) return response.faqs.data;
  if (Array.isArray(response?.faqs)) return response.faqs;
  if (Array.isArray(response?.faq)) return response.faq;
  return [];
}

export default function FaqPage() {
  const navigate = useNavigate();

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

  // Preview Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  /* ── 1. GET /faq with pagination ── */
  const fetchFaqList = async (page = currentPage, query = debouncedSearch, status = statusFilter) => {
    setLoading(true);
    try {
      const params = {
        page,
        ...(query.trim() ? { search: query.trim(), q: query.trim() } : {}),
        ...(status !== 'All' ? { status } : {}),
      };

      const res = await getFaqs(params);
      let list = extractList(res);

      // Check if items in list have subs; if not, enrich with details from getFaqById
      if (list.length > 0) {
        const enriched = await Promise.allSettled(
          list.map(async (item) => {
            const existingSubs = item.subs || item.sub || item.faq_subs || item.faq_sub || item.faqsubs || item.sub_faqs || item.sub_faq || item.questions || item.faq_questions || item.items;
            if (Array.isArray(existingSubs) && existingSubs.length > 0) {
              return { ...item, subs: existingSubs };
            }
            try {
              const detailRes = await getFaqById(item.id);
              const detailData = detailRes?.data || detailRes?.faq || detailRes || {};
              const detailSubs = detailData.subs || detailData.sub || detailData.faq_subs || detailData.faq_sub || detailData.faqsubs || detailData.sub_faqs || detailData.sub_faq || detailData.questions || detailData.faq_questions || detailData.items || [];
              return {
                ...item,
                ...detailData,
                subs: detailSubs,
              };
            } catch (e) {
              return item;
            }
          })
        );
        list = enriched.map((r, i) => (r.status === 'fulfilled' ? r.value : list[i]));
      }

      setItems(list);

      // Pagination metadata
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
      const msg = err?.response?.data?.message || err?.message || 'Failed to fetch FAQ list.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqList(currentPage, debouncedSearch, statusFilter);
  }, [currentPage, debouncedSearch, statusFilter]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setCurrentPage(1);
    fetchFaqList(1, searchQuery, statusFilter);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      fetchFaqList(newPage, debouncedSearch, statusFilter);
    }
  };

  /* ── 2. PATCH /faqs/{id}/status ── */
  const handleToggleStatus = async (item) => {
    const id = item.id;
    const currentStatus = item.faq_status || item.status || 'Active';
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';

    // Optimistic UI update
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, faq_status: nextStatus, status: nextStatus } : it))
    );

    try {
      await updateFaqStatus(id, nextStatus);
      toast.success(`FAQ group #${id} status changed to ${nextStatus}.`);
    } catch (err) {
      // Rollback
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, faq_status: currentStatus, status: currentStatus } : it))
      );
      const msg = err?.response?.data?.message || err?.message || 'Failed to update FAQ status.';
      toast.error(msg);
    }
  };

  // Filter FAQs by status
  const displayedItems = useMemo(() => {
    return items.filter((it) => {
      const status = it.faq_status || it.status || 'Active';
      if (statusFilter !== 'All' && status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [items, statusFilter]);

  /* ── 4. Preview Modal ── */
  const handleOpenPreview = async (item) => {
    setPreviewItem(item);
    setPreviewModalOpen(true);

    try {
      const res = await getFaqById(item.id);
      const freshData = res?.data || res?.faq || res;
      if (freshData) {
        setPreviewItem(freshData);
      }
    } catch (err) {
      // Use existing item info
    }
  };

  // Metrics calculation
  const faqStats = useMemo(() => {
    const totalGroups = totalCount || items.length;
    let activeGroups = 0;
    let inactiveGroups = 0;

    items.forEach((it) => {
      const status = (it.faq_status || it.status || 'Active').toLowerCase();
      if (status === 'active' || status === '1') {
        activeGroups++;
      } else {
        inactiveGroups++;
      }
    });

    return [
      {
        label: 'Total FAQ Categories',
        value: totalGroups,
        icon: HelpCircle,
        color: 'emerald',
        filterValue: 'All',
        subtext: 'Configured knowledgebase topics',
      },
      {
        label: 'Active Topics',
        value: activeGroups,
        icon: CheckCircle2,
        color: 'amber',
        filterValue: 'Active',
        subtext: 'Visible in help center',
      },
      {
        label: 'Inactive / Drafts',
        value: inactiveGroups,
        icon: XCircle,
        color: 'rose',
        filterValue: 'Inactive',
        subtext: 'Hidden from public view',
      },
    ];
  }, [items, totalCount]);

  return (
    <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="FAQ Management" />

        <main className="flex-1 p-5 md:p-6 max-w-7xl w-full">
          
          {/* Header Bar */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-sm md:text-base font-semibold text-[#1A1817] tracking-tight">
                Frequently Asked Questions
              </h1>
              <p className="text-xs text-[#78716C] mt-0.5">
                Manage FAQ topics, question lists, answers, and section visibility
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchFaqList(currentPage, searchQuery, statusFilter)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E2DDD5] bg-white hover:bg-[#F7F4EE] text-[11px] font-medium text-[#4A443D] shadow-2xs transition-all cursor-pointer"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={() => navigate('/faq/create')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-[11px] font-medium shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-[#C99C4B]" />
                <span>Add FAQ Topic</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white px-3.5 py-2.5 rounded-xl border border-[#E8E3DA] shadow-2xs mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9C9488] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search FAQ topic or question..."
                className="w-full pl-8 pr-3 py-1.5 text-[11px] rounded-lg border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition-all shadow-2xs placeholder-[#9C9488]"
              />
            </form>
          </div>

          {/* Main List */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-12 text-center shadow-2xs">
              <RefreshCw className="h-7 w-7 animate-spin text-[#9E7432] mx-auto mb-3" />
              <p className="text-xs font-medium text-[#78716C]">Loading FAQ sections...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-14 text-center shadow-2xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] mb-4">
                <HelpCircle className="h-7 w-7" />
              </div>
              <h3 className="font-display text-base font-bold text-[#1A1817]">No FAQ groups found</h3>
              <p className="text-xs text-[#8C8275] max-w-sm mx-auto mt-1 mb-5">
                {searchQuery || statusFilter !== 'All'
                  ? 'No FAQ groups match your search or filter criteria.'
                  : 'Start building your knowledge base by creating your first FAQ group with questions and answers.'}
              </p>
              <button
                onClick={() => navigate('/faq/create')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A1817] text-[#FAF8F5] text-xs font-semibold shadow-xs hover:bg-[#2C2825] transition cursor-pointer"
              >
                <Plus className="h-4 w-4 text-[#C99C4B]" />
                <span>Create First FAQ</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => {
                const id = item.id;
                const faqFor = item.faq_for || item.title || item.category || 'General FAQ';
                const status = item.faq_status || item.status || 'Active';
                const isActive = status === 'Active';
                const subs = item.subs || item.sub || item.faq_subs || [];
                const rowNumber = (currentPage - 1) * perPage + index + 1;

                return (
                  <div
                    key={id || index}
                    className="bg-white rounded-2xl border border-[#E8E3DA] overflow-hidden shadow-2xs hover:shadow-xs transition duration-200"
                  >
                    {/* Header Bar */}
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FCFBFA]">
                      
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] font-mono text-xs font-bold flex-shrink-0" title={`Sl.No ${rowNumber}`}>
                          {rowNumber}
                        </span>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-display text-sm sm:text-base font-bold text-[#1A1817] tracking-tight truncate">
                              {faqFor}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full bg-[#F5EFE3] text-[#78716C] text-[10px] font-semibold">
                              {subs.length} {subs.length === 1 ? 'Q&A' : 'Q&As'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F0ECE3]">
                        {/* Status Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          title="Click to toggle group status"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                            isActive
                              ? 'bg-[#EBF7EE] text-[#1E7E34] border border-[#C3E6CB] hover:bg-[#D4EDDA]'
                              : 'bg-[#FBEAEA] text-[#9A2D2D] border border-[#F5C6CB] hover:bg-[#F8D7DA]'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-[#1E7E34]' : 'bg-[#9A2D2D]'}`}
                          />
                          {status}
                        </button>

                        {/* Actions */}
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => navigate(`/faq/edit/${item.id}`)}
                            title="Edit FAQ Group"
                            className="p-1.5 rounded-lg border border-[#DDD7CD] bg-white hover:bg-[#EFECE6] text-[#4A443D] transition shadow-2xs cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-[#9E7432]" />
                          </button>
                        </div>
                      </div>

                    </div>

                  </div>
                );
              })}

              {/* Pagination */}
              <div className="bg-white rounded-xl border border-[#E8E3DA] overflow-hidden shadow-2xs">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  perPage={perPage}
                  onPageChange={handlePageChange}
                  from={from}
                  to={to}
                />
              </div>
            </div>
          )}

        </main>
      </div>

      {/* View / Accordion FAQ Modal */}
      <FaqViewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        item={previewItem}
        onEdit={(it) => navigate(`/faq/edit/${it.id}`)}
      />
    </div>
  );
}
