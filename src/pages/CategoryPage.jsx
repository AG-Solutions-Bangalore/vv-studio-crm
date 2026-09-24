import React, { useEffect, useState, useMemo } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import CategoryModal from '../components/category/CategoryModal';
import Pagination from '../components/common/Pagination';
import useDebounce from '../hooks/useDebounce';
import { 
  getCategories, 
  getCategoryById, 
  createCategory, 
  updateCategory, 
  updateCategoryStatus 
} from '../services/categoryApi';
import { 
  Plus, 
  Search, 
  Edit2, 
  RefreshCw, 
  Layers,
  FolderTree,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

function extractList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.categories?.data)) return response.categories.data;
  if (Array.isArray(response?.categories)) return response.categories;
  if (Array.isArray(response?.category)) return response.category;
  return [];
}

export default function CategoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const debouncedSearch = useDebounce(searchQuery, 350);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ category_name: '', category_status: 'Active' });

  // Compute Active & Inactive counts
  const activeCount = useMemo(() => {
    return items.filter((item) => {
      const s = String(item.category_status || item.categories_status || item.status || '').toLowerCase();
      return s === 'active' || s === '1';
    }).length;
  }, [items]);

  const inactiveCount = useMemo(() => {
    return items.filter((item) => {
      const s = String(item.category_status || item.categories_status || item.status || '').toLowerCase();
      return s === 'inactive' || s === '0';
    }).length;
  }, [items]);

  const categoryStats = useMemo(() => [
    {
      label: 'Total Categories',
      value: totalCount,
      icon: Layers,
      color: 'emerald',
      filterValue: 'All',
      subtext: 'Catalog taxonomy items'
    },
    {
      label: 'Active Categories',
      value: activeCount,
      icon: CheckCircle2,
      color: 'amber',
      filterValue: 'Active',
      subtext: 'Live & visible in catalog'
    },
    {
      label: 'Inactive Categories',
      value: inactiveCount,
      icon: XCircle,
      color: 'rose',
      filterValue: 'Inactive',
      subtext: 'Archived / hidden'
    }
  ], [totalCount, activeCount, inactiveCount]);

  /* ── 1. GET /category with pagination ── */
  const fetchCategories = async (page = currentPage, query = debouncedSearch, status = statusFilter) => {
    setLoading(true);
    try {
      const params = {
        page,
        ...(query.trim() ? { search: query.trim(), q: query.trim() } : {}),
        ...(status !== 'All' ? { status, category_status: status } : {}),
      };

      const res = await getCategories(params);
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
      const msg = err?.response?.data?.message || err?.message || 'Failed to fetch categories.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories(currentPage, debouncedSearch, statusFilter);
  }, [currentPage, debouncedSearch, statusFilter]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setCurrentPage(1);
    fetchCategories(1, searchQuery, statusFilter);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      fetchCategories(newPage, debouncedSearch, statusFilter);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /* ── 2. CREATE (POST /category) & UPDATE (PUT /category/{id}) ── */
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!form.category_name.trim()) {
      toast.error('Category name is required.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        const res = await updateCategory(editingId, {
          category_name: form.category_name.trim(),
          category_status: form.category_status || 'Active',
        });
        toast.success(res?.message || 'Category updated successfully.');
      } else {
        const res = await createCategory({
          category_name: form.category_name.trim(),
        });
        toast.success(res?.message || 'Category created successfully.');
      }

      setIsModalOpen(false);
      setEditingId(null);
      setForm({ category_name: '', category_status: 'Active' });
      fetchCategories(currentPage, searchQuery, statusFilter);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save category.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── 3. EDIT (GET /category/{id}) ── */
  const handleOpenEdit = async (id) => {
    try {
      const res = await getCategoryById(id);
      const data = res?.data?.data || res?.data || res?.category || res || {};
      setEditingId(id);
      setForm({
        category_name: data?.category_name || data?.categories || data?.name || '',
        category_status: data?.category_status || data?.categories_status || data?.status || 'Active',
      });
      setIsModalOpen(true);
    } catch (err) {
      const fallback = items.find((i) => i.id === id);
      setEditingId(id);
      setForm({
        category_name: fallback?.category_name || fallback?.categories || fallback?.name || '',
        category_status: fallback?.category_status || fallback?.categories_status || fallback?.status || 'Active',
      });
      setIsModalOpen(true);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({ category_name: '', category_status: 'Active' });
    setIsModalOpen(true);
  };

  /* ── 4. PATCH /categorys/{id}/status ── */
  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';

    // Optimistic UI update
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, category_status: nextStatus, categories_status: nextStatus, status: nextStatus }
          : item
      )
    );

    try {
      const res = await updateCategoryStatus(id, nextStatus);
      toast.success(res?.message || `Category set to ${nextStatus}.`);
    } catch (err) {
      // Revert on error
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, category_status: currentStatus, categories_status: currentStatus, status: currentStatus }
            : item
        )
      );
      toast.error(err?.response?.data?.message || 'Unable to update status.');
    }
  };


  return (
    <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Category Management" />

        <main className="flex-1 p-5 md:p-6 max-w-7xl w-full">
          
          {/* Header Bar */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-sm md:text-base font-semibold text-[#1A1817] tracking-tight">
                Product Categories
              </h1>
              <p className="text-xs text-[#78716C] mt-0.5">
                Manage catalog taxonomy, categories, and active/inactive visibility settings
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchCategories(currentPage, searchQuery, statusFilter)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E2DDD5] bg-white hover:bg-[#F7F4EE] text-[11px] font-medium text-[#4A443D] shadow-2xs transition-all cursor-pointer"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              {/* <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-[11px] font-medium shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-[#C99C4B]" />
                <span>Add Category</span>
              </button> */}
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white px-3.5 py-2.5 rounded-xl border border-[#E8E3DA] shadow-2xs mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {/* Search Form */}
            <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9C9488] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search category name..."
                className="w-full pl-8 pr-3 py-1.5 text-[11px] rounded-lg border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition-all shadow-2xs placeholder-[#9C9488]"
              />
            </form>
          </div>

          {/* Categories Table Card */}
          <div className="bg-white rounded-xl border border-[#E8E3DA] shadow-2xs overflow-hidden">
            {loading ? (
              <div className="py-16 text-center text-[#78716C]">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1A1817] border-t-transparent mx-auto mb-2" />
                <p className="text-xs font-medium">Loading categories...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="py-14 text-center text-[#78716C]">
                <div className="h-10 w-10 rounded-xl bg-[#F7F4EE] flex items-center justify-center mx-auto mb-2.5 text-[#9C9488]">
                  <Layers className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-[#1A1817]">No categories found</p>
                <p className="text-xs text-[#8C8275] mt-0.5">
                  {searchQuery ? 'No category matches your search keyword' : 'Click "Add Category" to create your first category'}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#3D372E]">
                    <thead className="bg-[#F7F4EE] border-b border-[#E8E3DA] text-xs uppercase font-semibold text-[#78716C] tracking-wider">
                      <tr>
                        <th className="px-4 py-2.5 w-16">Sl.No</th>
                        <th className="px-4 py-2.5">Category Name</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0ECE3]">
                      {items.map((item, index) => {
                        const id = item.id;
                        const name = item.category_name || item.categories || item.name || 'Unnamed Category';
                        const status = item.category_status || item.categories_status || item.status || 'Active';
                        const isActive = status === 'Active';
                        const rowNumber = (currentPage - 1) * perPage + index + 1;

                        return (
                          <tr key={id || index} className="hover:bg-[#FAF8F5] transition-colors">
                            <td className="px-4 py-3 font-mono text-xs text-[#9C9488]">{rowNumber}</td>
                            
                            <td className="px-4 py-3 text-xs font-medium text-[#1A1817]">
                              <div className="flex items-center gap-2.5">
                                <div className="h-7 w-7 rounded-lg bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] flex items-center justify-center flex-shrink-0">
                                  <Layers className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-xs font-medium tracking-tight text-[#1A1817]">{name}</span>
                              </div>
                            </td>

                            {/* Status Pill & Quick Toggle */}
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleToggleStatus(id, status)}
                                title={`Click to mark ${isActive ? 'Inactive' : 'Active'}`}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                                  isActive
                                    ? 'bg-[#EDF7EE] text-[#1E6B34] border-[#C6E6CC] hover:bg-[#DFF0E1]'
                                    : 'bg-[#FDF0F0] text-[#9A2D2D] border-[#F6C8C8] hover:bg-[#FBE4E4]'
                                }`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-[#1E6B34]' : 'bg-[#9A2D2D]'}`} />
                                <span>{status}</span>
                              </button>
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleOpenEdit(id)}
                                  title="Edit Category"
                                  className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1A1817] hover:bg-[#EFECE6] transition cursor-pointer"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
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

      {/* Create / Edit Category Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingId(null);
        }}
        onSubmit={handleFormSubmit}
        form={form}
        onChange={handleFormChange}
        editingId={editingId}
        submitting={submitting}
      />
    </div>
  );
}

