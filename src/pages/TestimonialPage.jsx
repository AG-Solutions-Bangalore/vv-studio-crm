import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import TestimonialViewModal from '../components/testimonial/TestimonialViewModal';
import Pagination from '../components/common/Pagination';
import useDebounce from '../hooks/useDebounce';
import {
  getTestimonials,
  updateTestimonialStatus,
} from '../services/testimonialApi';
import {
  Plus,
  Search,
  Edit2,
  RefreshCw,
  Quote,
  Star,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';

function extractList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.testimonials?.data)) return response.testimonials.data;
  if (Array.isArray(response?.testimonials)) return response.testimonials;
  if (Array.isArray(response?.testimonial)) return response.testimonial;
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

export default function TestimonialPage() {
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

  /* ── 1. GET /testimonial with pagination ── */
  const fetchTestimonials = async (page = currentPage, query = debouncedSearch, status = statusFilter) => {
    setLoading(true);
    try {
      const params = {
        page,
        ...(query.trim() ? { search: query.trim(), q: query.trim() } : {}),
        ...(status !== 'All' ? { status } : {}),
      };

      const res = await getTestimonials(params);
      const list = extractList(res);
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
      const msg = err?.response?.data?.message || err?.message || 'Failed to fetch testimonials.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials(currentPage, debouncedSearch, statusFilter);
  }, [currentPage, debouncedSearch, statusFilter]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setCurrentPage(1);
    fetchTestimonials(1, searchQuery, statusFilter);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      fetchTestimonials(newPage, debouncedSearch, statusFilter);
    }
  };

  /* ── 2. Status toggle ── */
  const handleToggleStatus = async (item) => {
    const id = item.id;
    const currentStatus = item.testimonial_status || item.status || 'Active';
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';

    // Optimistic UI update
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, testimonial_status: nextStatus, status: nextStatus } : it))
    );

    try {
      await updateTestimonialStatus(id, nextStatus);
      toast.success(`Review #${id} status changed to ${nextStatus}.`);
    } catch (err) {
      // Rollback
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, testimonial_status: currentStatus, status: currentStatus } : it))
      );
      const msg = err?.response?.data?.message || err?.message || 'Failed to update review status.';
      toast.error(msg);
    }
  };

  /* ── 3. Preview Modal ── */
  const handleOpenPreview = (item) => {
    setPreviewItem(item);
    setPreviewModalOpen(true);
  };

  // Filtered items
  const displayedItems = useMemo(() => {
    if (statusFilter === 'All') return items;
    return items.filter((it) => {
      const st = String(it.testimonial_status || it.status || 'Active').toLowerCase();
      return st === statusFilter.toLowerCase();
    });
  }, [items, statusFilter]);

  return (
    <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Testimonials Management" />

        <main className="flex-1 p-5 md:p-6 max-w-7xl w-full">

          {/* Header Bar */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-sm md:text-base font-semibold text-[#1A1817] tracking-tight">
                Client Reviews & Testimonials
              </h1>
              <p className="text-xs text-[#78716C] mt-0.5">
                Collect and manage authentic customer ratings, feedback, and website reviews
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchTestimonials(currentPage, searchQuery, statusFilter)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E2DDD5] bg-white hover:bg-[#F7F4EE] text-[11px] font-medium text-[#4A443D] shadow-2xs transition-all cursor-pointer"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={() => navigate('/testimonial/create')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-[11px] font-medium shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-[#C99C4B]" />
                <span>Add Testimonial</span>
              </button>
            </div>
          </div>

          {/* Search Toolbar */}
          <div className="bg-white px-3.5 py-2.5 rounded-xl border border-[#E8E3DA] shadow-2xs mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full sm:w-80">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9C9488] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by client name, category..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition-all shadow-2xs placeholder-[#9C9488]"
              />
            </form>
          </div>

          {/* Main Content Area - Table Only */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-12 text-center shadow-2xs">
              <RefreshCw className="h-7 w-7 animate-spin text-[#9E7432] mx-auto mb-3" />
              <p className="text-xs font-medium text-[#78716C]">Loading testimonials...</p>
            </div>
          ) : displayedItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-14 text-center shadow-2xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] mb-4">
                <Quote className="h-7 w-7" />
              </div>
              <h3 className="font-display text-base font-bold text-[#1A1817]">No testimonials found</h3>
              <p className="text-xs text-[#8C8275] max-w-sm mx-auto mt-1 mb-5">
                {searchQuery || statusFilter !== 'All'
                  ? 'No client reviews match your search or filter criteria.'
                  : 'Add your first verified client review to build credibility on your landing pages.'}
              </p>
              <button
                onClick={() => navigate('/testimonial/create')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A1817] text-[#FAF8F5] text-xs font-semibold shadow-xs hover:bg-[#2C2825] transition cursor-pointer"
              >
                <Plus className="h-4 w-4 text-[#C99C4B]" />
                <span>Add First Review</span>
              </button>
            </div>
          ) : (
            /* ── TABLE VIEW ── */
            <div className="bg-white rounded-2xl border border-[#E8E3DA] overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E8E3DA] bg-[#FAF8F5] font-semibold text-[#5C554B] whitespace-nowrap">
                      <th className="px-4 py-3 w-16">Sl.No</th>
                      <th className="px-4 py-3">Page_for</th>
                      <th className="px-4 py-3">client_name</th>
                      <th className="px-4 py-3 max-w-xs">description</th>
                      <th className="px-4 py-3">created</th>
                      <th className="px-4 py-3">rating</th>
                      <th className="px-4 py-3">status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0ECE3]">
                    {displayedItems.map((item, index) => {
                      const id = item.id;
                      const category = item.testimonial_for || item.category || 'home';
                      const clientName = item.testimonial_client_name || item.client_name || item.name || 'Anonymous';
                      const description = item.testimonial_description || item.description || item.comment || '';
                      const createdDate =
                        item.testimonial_created_date ||
                        item.testimonial_create_date ||
                        item.testimonial_created_at ||
                        item.created_at ||
                        item.createdAt ||
                        item.created_date ||
                        item.createdDate ||
                        item.date;
                      const rating = Number(item.testimonial_rating || item.rating || 5);
                      const status = item.testimonial_status || item.status || 'Active';
                      const isActive = status === 'Active';
                      const rowNumber = (currentPage - 1) * perPage + index + 1;

                      return (
                        <tr key={id || index} className="hover:bg-[#FAF8F5] transition-colors">
                          {/* 1. sl.no */}
                          <td className="px-4 py-3 font-mono text-xs text-[#9C9488]">{rowNumber}</td>

                          {/* 2. for */}
                          <td className="px-4 py-3 text-[#5C554B] whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E2DDD5] text-[11px] font-medium">
                              {category}
                            </span>
                          </td>

                          {/* 3. client_name */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1A1817] text-[#FAF8F5] text-[11px] font-bold">
                                {clientName[0]?.toUpperCase() || 'C'}
                              </div>
                              <span className="font-semibold text-[#1A1817]">{clientName}</span>
                            </div>
                          </td>

                          {/* 4. description */}
                          <td className="px-4 py-3 text-[#78716C] max-w-xs truncate italic" title={description}>
                            {description}
                          </td>

                          {/* 5. created */}
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-[#78716C]">
                            {formatDate(createdDate)}
                          </td>

                          {/* 6. rating */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 fill-[#D4A038] text-[#D4A038]" />
                              <span className="font-mono font-bold text-[#1A1817]">{rating}.0</span>
                            </div>
                          </td>

                          {/* 7. status */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(item)}
                              title="Click to toggle status"
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer ${isActive
                                ? 'bg-[#EBF7EE] text-[#1E7E34] border border-[#C3E6CB] hover:bg-[#D4EDDA]'
                                : 'bg-[#FBEAEA] text-[#9A2D2D] border border-[#F5C6CB] hover:bg-[#F8D7DA]'
                                }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-[#1E7E34]' : 'bg-[#9A2D2D]'}`}
                              />
                              {status}
                            </button>
                          </td>

                          {/* 9. Actions */}
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              {/* <button
                                type="button"
                                onClick={() => handleOpenPreview(item)}
                                title="Read Review"
                                className="p-1.5 rounded-lg border border-[#DDD7CD] bg-white hover:bg-[#EFECE6] text-[#4A443D] transition shadow-2xs cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button> */}

                              <button
                                type="button"
                                onClick={() => navigate(`/testimonial/edit/${item.id}`)}
                                title="Edit Review"
                                className="p-1.5 rounded-lg border border-[#DDD7CD] bg-white hover:bg-[#EFECE6] text-[#4A443D] transition shadow-2xs cursor-pointer"
                              >
                                <Edit2 className="h-3.5 w-3.5 text-[#9E7432]" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
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
          )}

        </main>
      </div>

      {/* View Testimonial Modal */}
      <TestimonialViewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        item={previewItem}
        onEdit={(it) => navigate(`/testimonial/edit/${it.id}`)}
      />
    </div>
  );
}
