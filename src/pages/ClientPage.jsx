import React, { useEffect, useState, useMemo } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import ClientModal from '../components/client/ClientModal';
import Pagination from '../components/common/Pagination';
import useDebounce from '../hooks/useDebounce';
import { useAppContext } from '../context/AppContext';
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  updateClientStatus,
} from '../services/clientApi';
import { getAssetBaseURL } from '../services/api';
import {
  Plus,
  Search,
  Edit2,
  RefreshCw,
  Building2,
  CheckCircle2,
  XCircle,
  Layers,
  Image,
} from 'lucide-react';
import toast from 'react-hot-toast';

function extractList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.clients?.data)) return response.clients.data;
  if (Array.isArray(response?.clients)) return response.clients;
  if (Array.isArray(response?.client)) return response.client;
  return [];
}

const initialForm = {
  clients_name: '',
  clients_image: null,
  clients_status: 'Active',
  existing_image_url: null,
};

export default function ClientPage() {
  const { imageUrlConfig, noImageUrl } = useAppContext();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const debouncedSearch = useDebounce(searchQuery, 350);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [perPage, setPerPage] = useState(12);
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);

  // Modal State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialForm);

  // Base client images URL prefix
  const clientBaseUrl = useMemo(() => {
    const found = (imageUrlConfig || []).find(
      (i) =>
        i?.image_for?.toLowerCase() === 'client' ||
        i?.image_for?.toLowerCase() === 'clients' ||
        i?.image_for?.toLowerCase() === 'client_image' ||
        i?.image_for?.toLowerCase() === 'client_images'
    );
    const fallbackBase = getAssetBaseURL('/assets/images/client_images/');
    return found?.image_url || fallbackBase;
  }, [imageUrlConfig]);

  const resolveImageUrl = (imageVal) => {
    if (!imageVal) return noImageUrl || '';
    if (typeof imageVal !== 'string') return '';
    if (imageVal.startsWith('blob:') || imageVal.startsWith('data:')) {
      return imageVal;
    }
    let fullUrl = imageVal;
    if (!imageVal.startsWith('http://') && !imageVal.startsWith('https://')) {
      const cleanBase = clientBaseUrl.replace(/\/$/, '');
      fullUrl = `${cleanBase}/${imageVal.replace(/^\//, '')}`;
    }
    return fullUrl;
  };

  /* ── 1. GET /client with pagination ── */
  const fetchClientList = async (page = currentPage, query = debouncedSearch, status = statusFilter) => {
    setLoading(true);
    try {
      const params = {
        page,
        ...(query.trim() ? { search: query.trim(), q: query.trim() } : {}),
        ...(status !== 'All' ? { status, clients_status: status } : {}),
      };

      const res = await getClients(params);
      const list = extractList(res);
      setItems(list);

      // Pagination metadata
      const paginationObj = res?.data?.data ? res?.data : res;
      const total = paginationObj?.total ?? list.length;
      const lastPage = paginationObj?.last_page ?? Math.max(1, Math.ceil(total / (paginationObj?.per_page || 12)));
      const curr = paginationObj?.current_page ?? page;
      const per = paginationObj?.per_page ?? 12;

      setTotalCount(total);
      setTotalPages(lastPage);
      setCurrentPage(curr);
      setPerPage(per);
      setFrom(paginationObj?.from ?? (total > 0 ? (curr - 1) * per + 1 : 0));
      setTo(paginationObj?.to ?? Math.min(curr * per, total));
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to fetch clients.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientList(currentPage, debouncedSearch, statusFilter);
  }, [currentPage, debouncedSearch, statusFilter]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setCurrentPage(1);
    fetchClientList(1, searchQuery, statusFilter);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      fetchClientList(newPage, debouncedSearch, statusFilter);
    }
  };

  /* ── 2. CREATE (POST /client) & UPDATE (PUT /client/{id}) ── */
  const handleOpenCreateModal = () => {
    setEditingId(null);
    setForm(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (item) => {
    const id = item?.id;
    if (!id) return;
    setEditingId(id);
    setIsModalOpen(true);

    // Populate immediate values
    const directName = item?.clients_name || item?.client_name || item?.name || '';
    const directStatus = item?.clients_status || item?.status || 'Active';
    const directImage = item?.clients_image || item?.client_image || item?.image || item?.file_name || null;

    setForm({
      clients_name: directName,
      clients_image: null,
      clients_status: directStatus,
      existing_image_url: directImage ? resolveImageUrl(directImage) : null,
    });

    try {
      const res = await getClientById(id);
      const data = res?.data || res?.client || res || {};
      if (data && (data.clients_name || data.client_name || data.name || data.id)) {
        const fetchedName = data.clients_name || data.client_name || data.name || directName;
        const fetchedStatus = data.clients_status || data.status || directStatus;
        const fetchedImg = data.clients_image || data.client_image || data.image || data.file_name || directImage;

        setForm({
          clients_name: fetchedName,
          clients_image: null,
          clients_status: fetchedStatus,
          existing_image_url: fetchedImg ? resolveImageUrl(fetchedImg) : null,
        });
      }
    } catch (err) {
      console.warn('Could not fetch single client details, using row data:', err);
    }
  };

  const handleFormSubmit = async (e) => {
    e?.preventDefault();
    if (!form.clients_name?.trim()) {
      toast.error('Please enter the client / partner name.');
      return;
    }

    if (!editingId && !form.clients_image) {
      toast.error('Please upload a client logo.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('clients_name', form.clients_name.trim());
      payload.append('clients_status', form.clients_status || 'Active');

      if (form.clients_image instanceof File) {
        payload.append('clients_image', form.clients_image);
      }

      if (editingId) {
        payload.append('_method', 'PUT');
        const res = await updateClient(editingId, payload);
        toast.success(res?.message || 'Client logo updated successfully!');
      } else {
        const res = await createClient(payload);
        toast.success(res?.message || 'Client logo created successfully!');
      }

      setIsModalOpen(false);
      setForm(initialForm);
      setEditingId(null);
      fetchClientList(editingId ? currentPage : 1, debouncedSearch, statusFilter);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save client logo.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── 3. Toggle Status (POST /client/status/{id}) ── */
  const handleToggleStatus = async (item) => {
    const id = item.id;
    const currentStatus = item.clients_status || item.status || 'Active';
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';

    // Optimistic UI update
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, clients_status: nextStatus, status: nextStatus } : it))
    );

    try {
      await updateClientStatus(id, nextStatus);
      toast.success(`Client #${id} status changed to ${nextStatus}.`);
    } catch (err) {
      // Rollback
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, clients_status: currentStatus, status: currentStatus } : it))
      );
      const msg = err?.response?.data?.message || err?.message || 'Failed to update client status.';
      toast.error(msg);
    }
  };

  // Filtered items based on statusFilter tab
  const displayedItems = useMemo(() => {
    if (statusFilter === 'All') return items;
    return items.filter((it) => {
      const st = String(it.clients_status || it.status || 'Active').toLowerCase();
      return st === statusFilter.toLowerCase();
    });
  }, [items, statusFilter]);

  return (
    <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Clients & Partners" />

        <main className="flex-1 p-5 md:p-6 max-w-7xl w-full">
          
          {/* Header Bar */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-sm md:text-base font-semibold text-[#1A1817] tracking-tight">
                Clients & Partner Logos
              </h1>
              <p className="text-xs text-[#78716C] mt-0.5">
                Manage client partner brand logos showcased on the website
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchClientList(currentPage, searchQuery, statusFilter)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E2DDD5] bg-white hover:bg-[#F7F4EE] text-[11px] font-medium text-[#4A443D] shadow-2xs transition-all cursor-pointer"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-[11px] font-medium shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-[#C99C4B]" />
                <span>Add Client Logo</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white px-3.5 py-2.5 rounded-xl border border-[#E8E3DA] shadow-2xs mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full sm:w-80">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9C9488] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search client or partner name..."
                className="w-full pl-8 pr-3 py-1.5 text-[11px] rounded-lg border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition-all shadow-2xs placeholder-[#9C9488]"
              />
            </form>
          </div>

          {/* Main Content Area */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-12 text-center shadow-2xs">
              <RefreshCw className="h-7 w-7 animate-spin text-[#9E7432] mx-auto mb-3" />
              <p className="text-xs font-medium text-[#78716C]">Loading client logos...</p>
            </div>
          ) : displayedItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-14 text-center shadow-2xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] mb-4">
                <Building2 className="h-7 w-7" />
              </div>
              <h3 className="font-display text-base font-bold text-[#1A1817]">No client partners found</h3>
              <p className="text-xs text-[#8C8275] max-w-sm mx-auto mt-1 mb-5">
                {searchQuery || statusFilter !== 'All'
                  ? 'No clients match your filter criteria. Try adjusting your query or status tab.'
                  : 'You have not added any client logos yet. Upload your partner and client brand logos.'}
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A1817] text-[#FAF8F5] text-xs font-semibold shadow-xs hover:bg-[#2C2825] transition cursor-pointer"
              >
                <Plus className="h-4 w-4 text-[#C99C4B]" />
                <span>Add First Client</span>
              </button>
            </div>
          ) : (
            /* ── TABLE VIEW ── */
            <div className="bg-white rounded-2xl border border-[#E8E3DA] overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#3D372E] border-collapse">
                  <thead className="bg-[#FAF8F5] border-b border-[#E8E3DA] text-xs uppercase font-semibold text-[#78716C] tracking-wider">
                    <tr>
                      <th className="px-4 py-3 w-20">Sl.No</th>
                      <th className="px-4 py-3 w-28">Logo</th>
                      <th className="px-4 py-3">Client / Partner Name</th>
                      <th className="px-4 py-3 w-40 text-center">Status</th>
                      <th className="px-4 py-3 w-24 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0ECE3]">
                    {displayedItems.map((item, index) => {
                      const id = item.id;
                      const name = item.clients_name || item.client_name || item.name || 'Client Partner';
                      const imageField = item.clients_image || item.client_image || item.image || item.file_name;
                      const imageUrl = resolveImageUrl(imageField);
                      const status = item.clients_status || item.status || 'Active';
                      const isActive = status === 'Active';
                      const rowNumber = (currentPage - 1) * perPage + index + 1;

                      return (
                        <tr key={id || index} className="hover:bg-[#FAF8F5] transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-[#9C9488] align-middle">{rowNumber}</td>
                          
                          {/* Logo */}
                          <td className="px-4 py-3 align-middle">
                            <div className="h-11 w-18 rounded-lg bg-[#FAF8F5] border border-[#E8E3DA] p-1 overflow-hidden flex items-center justify-center shadow-2xs">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={name}
                                  className="h-full w-full object-contain"
                                  onError={(e) => {
                                    e.currentTarget.src = noImageUrl || '';
                                  }}
                                />
                              ) : (
                                <Building2 className="h-4 w-4 text-[#9E7432]" />
                              )}
                            </div>
                          </td>

                          {/* Client Name */}
                          <td className="px-4 py-3 align-middle">
                            <span className="text-xs font-medium text-[#1A1817] truncate max-w-sm">
                              {name}
                            </span>
                          </td>

                          {/* Status Pill Toggle (Centered) */}
                          <td className="px-4 py-3 align-middle text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(item)}
                              title="Click to toggle status"
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-[#EDF7EE] text-[#1E6B34] border-[#C6E6CC] hover:bg-[#DFF0E1]'
                                  : 'bg-[#FDF0F0] text-[#9A2D2D] border-[#F6C8C8] hover:bg-[#FBE4E4]'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-[#1E6B34]' : 'bg-[#9A2D2D]'}`}
                              />
                              <span>{status}</span>
                            </button>
                          </td>

                          {/* Actions (Edit only) */}
                          <td className="px-4 py-3 align-middle text-right">
                            <div className="inline-flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(item)}
                                title="Edit Client"
                                className="p-1.5 rounded-lg border border-[#DDD7CD] bg-white hover:bg-[#EFECE6] text-[#4A443D] hover:text-[#9E7432] transition shadow-2xs cursor-pointer inline-flex items-center justify-center"
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

      {/* Add / Edit Client Modal */}
      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        form={form}
        setForm={setForm}
        editingId={editingId}
        submitting={submitting}
      />
    </div>
  );
}
