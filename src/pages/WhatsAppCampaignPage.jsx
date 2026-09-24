import React, { useEffect, useState, useMemo } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import WhatsAppCampaignModal from '../components/campaign/WhatsAppCampaignModal';
import WhatsAppCampaignViewModal from '../components/campaign/WhatsAppCampaignViewModal';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal';
import Pagination from '../components/common/Pagination';
import {
  getWhatsAppCampaigns,
  getWhatsAppCampaignById,
  createWhatsAppCampaign,
  updateWhatsAppCampaign,
  updateWhatsAppCampaignStatus,
  deleteWhatsAppCampaign,
} from '../services/whatsappCampaignApi';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  Send,
  MessageSquare,
  Calendar,
  Workflow,
  Boxes,
  Eye,
  CheckCircle2,
  Clock,
  PauseCircle,
  ShieldAlert,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useDebounce from '../hooks/useDebounce';

function extractList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.campaigns?.data)) return response.campaigns.data;
  if (Array.isArray(response?.campaigns)) return response.campaigns;
  if (Array.isArray(response?.whats_app_campaign)) return response.whats_app_campaign;
  return [];
}

const initialForm = {
  whats_app_campaign_name: '',
  whats_app_campaign_pipeline_id: '',
  whats_app_campaign_date: new Date().toISOString().split('T')[0],
  whats_app_campaign_group: [],
  whats_app_campaign_holiday: 'Yes',
  whats_app_campaign_status: 'Pending',
};

export default function WhatsAppCampaignPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Pending' | 'Sent' | 'Hold'

  const debouncedSearch = useDebounce(searchQuery, 350);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);

  // Modal State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialForm);

  // Preview Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ── 1. GET /whatsappcampaign with pagination ── */
  const fetchCampaignList = async (page = currentPage, query = debouncedSearch, status = statusFilter) => {
    setLoading(true);
    try {
      const params = {
        page,
        ...(query.trim() ? { search: query.trim(), q: query.trim() } : {}),
        ...(status !== 'All' ? { status, whats_app_campaign_status: status } : {}),
      };

      const res = await getWhatsAppCampaigns(params);
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
      const msg = err?.response?.data?.message || err?.message || 'Failed to fetch WhatsApp campaigns.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignList(currentPage, debouncedSearch, statusFilter);
  }, [currentPage, debouncedSearch, statusFilter]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setCurrentPage(1);
    fetchCampaignList(1, searchQuery, statusFilter);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      fetchCampaignList(newPage, searchQuery, statusFilter);
    }
  };

  /* ── 2. CREATE (POST /whatsappcampaign) & UPDATE (PUT /whatsappcampaign/{id}) ── */
  const handleOpenCreateModal = () => {
    setEditingId(null);
    setForm(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (item) => {
    setEditingId(item.id);
    setIsModalOpen(true);

    let rawGroups = item.whats_app_campaign_group || item.groups || item.group || [];
    let groupArr = [];
    if (Array.isArray(rawGroups)) {
      groupArr = rawGroups.map((g) => (typeof g === 'object' && g !== null ? (g.id || g.group_id) : Number(g) || g));
    } else if (typeof rawGroups === 'string' && rawGroups.trim()) {
      groupArr = rawGroups.split(',').map((s) => Number(s.trim()) || s.trim());
    }

    setForm({
      whats_app_campaign_name: item.whats_app_campaign_name || item.name || '',
      whats_app_campaign_pipeline_id: item.whats_app_campaign_pipeline_id || '',
      whats_app_campaign_date: item.whats_app_campaign_date || new Date().toISOString().split('T')[0],
      whats_app_campaign_group: groupArr,
      whats_app_campaign_holiday: item.whats_app_campaign_holiday || 'Yes',
      whats_app_campaign_status: item.whats_app_campaign_status || item.status || 'Pending',
    });

    try {
      const res = await getWhatsAppCampaignById(item.id);
      const freshData = res?.data || res?.campaign || res;
      if (freshData) {
        let fGroups = freshData.whats_app_campaign_group || rawGroups;
        let fGroupArr = [];
        if (Array.isArray(fGroups)) {
          fGroupArr = fGroups.map((g) => (typeof g === 'object' && g !== null ? (g.id || g.group_id) : Number(g) || g));
        } else if (typeof fGroups === 'string' && fGroups.trim()) {
          fGroupArr = fGroups.split(',').map((s) => Number(s.trim()) || s.trim());
        }

        setForm({
          whats_app_campaign_name: freshData.whats_app_campaign_name || item.whats_app_campaign_name || '',
          whats_app_campaign_pipeline_id: freshData.whats_app_campaign_pipeline_id || item.whats_app_campaign_pipeline_id || '',
          whats_app_campaign_date: freshData.whats_app_campaign_date || item.whats_app_campaign_date || '',
          whats_app_campaign_group: fGroupArr,
          whats_app_campaign_holiday: freshData.whats_app_campaign_holiday || 'Yes',
          whats_app_campaign_status: freshData.whats_app_campaign_status || 'Pending',
        });
      }
    } catch (err) {
      // Use existing values
    }
  };

  const handleFormSubmit = async (e) => {
    e?.preventDefault();
    setSubmitting(true);

    try {
      if (editingId) {
        // PUT /whatsappcampaign/{id}
        await updateWhatsAppCampaign(editingId, form);
        toast.success('WhatsApp campaign updated successfully.');
      } else {
        // POST /whatsappcampaign
        await createWhatsAppCampaign(form);
        toast.success('WhatsApp campaign scheduled successfully.');
      }

      setIsModalOpen(false);
      setForm(initialForm);
      fetchCampaignList(currentPage, searchQuery, statusFilter);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save campaign.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── 3. PATCH /whatsappcampaigns/{id}/status ── */
  const handleUpdateStatus = async (item, nextStatus) => {
    const id = item.id;
    const currentStatus = item.whats_app_campaign_status || item.status || 'Pending';

    // Optimistic UI update
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, whats_app_campaign_status: nextStatus, status: nextStatus } : it))
    );

    try {
      await updateWhatsAppCampaignStatus(id, nextStatus);
      toast.success(`Campaign #${id} status changed to ${nextStatus}.`);
    } catch (err) {
      // Rollback
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, whats_app_campaign_status: currentStatus, status: currentStatus } : it))
      );
      const msg = err?.response?.data?.message || err?.message || 'Failed to update campaign status.';
      toast.error(msg);
    }
  };

  /* ── 4. DELETE /whatsappcampaign/{id} ── */
  const handleOpenDeleteModal = (id) => {
    setDeletingId(id);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await deleteWhatsAppCampaign(deletingId);
      toast.success('Campaign deleted successfully.');
      setDeleteModalOpen(false);
      setDeletingId(null);
      fetchCampaignList(currentPage, searchQuery, statusFilter);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to delete campaign.';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  /* ── 5. Preview Modal ── */
  const handleOpenPreview = (item) => {
    setPreviewItem(item);
    setPreviewModalOpen(true);
  };

  // Metrics
  const whatsAppStats = useMemo(() => {
    const total = totalCount || items.length;
    let pending = 0;
    let sent = 0;
    let hold = 0;

    items.forEach((it) => {
      const st = (it.whats_app_campaign_status || it.status || 'Pending').toLowerCase();
      if (st === 'sent') sent++;
      else if (st === 'hold') hold++;
      else pending++;
    });

    return [
      {
        label: 'Total WhatsApp Broadcasts',
        value: total,
        icon: Send,
        color: 'amber',
        filterValue: 'All',
        subtext: 'Configured WhatsApp dispatches',
      },
      {
        label: 'Pending Sequences',
        value: pending,
        icon: Clock,
        color: 'blue',
        filterValue: 'Pending',
        subtext: 'Queued for dispatch',
      },
      {
        label: 'Sent Campaigns',
        value: sent,
        icon: CheckCircle2,
        color: 'emerald',
        filterValue: 'Sent',
        subtext: 'Delivered messages',
      },
    ];
  }, [items, totalCount]);

  return (
    <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="WhatsApp Campaigns" />

        <main className="flex-1 p-5 md:p-6 max-w-7xl w-full">
          
          {/* Header Bar */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-sm md:text-base font-semibold text-[#1A1817] tracking-tight">
                WhatsApp Campaigns
              </h1>
              <p className="text-xs text-[#78716C] mt-0.5">
                Schedule and monitor automated WhatsApp broadcast sequences connected to marketing pipelines
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchCampaignList(currentPage, searchQuery, statusFilter)}
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
                <span>Create WhatsApp Campaign</span>
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
                placeholder="Search campaigns by name..."
                className="w-full pl-8 pr-3 py-1.5 text-[11px] rounded-lg border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition-all shadow-2xs placeholder-[#9C9488]"
              />
            </form>
          </div>

          {/* Campaigns Table */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-12 text-center shadow-2xs">
              <RefreshCw className="h-7 w-7 animate-spin text-[#1E7E34] mx-auto mb-3" />
              <p className="text-xs font-medium text-[#78716C]">Loading WhatsApp campaigns...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-14 text-center shadow-2xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EBF7EE] text-[#1E7E34] border border-[#C3E6CB] mb-4">
                <Send className="h-7 w-7" />
              </div>
              <h3 className="font-display text-base font-bold text-[#1A1817]">No campaigns found</h3>
              <p className="text-xs text-[#8C8275] max-w-sm mx-auto mt-1 mb-5">
                {searchQuery || statusFilter !== 'All'
                  ? 'No campaigns match your search or filter options.'
                  : 'Start sending personalized WhatsApp message sequences to your customer groups.'}
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A1817] text-[#FAF8F5] text-xs font-semibold shadow-xs hover:bg-[#2C2825] transition cursor-pointer"
              >
                <Plus className="h-4 w-4 text-[#C99C4B]" />
                <span>Create WhatsApp Campaign</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E8E3DA] overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E8E3DA] bg-[#FAF8F5] font-semibold text-[#5C554B]">
                      <th className="px-4 py-3 w-16">Sl.No</th>
                      <th className="px-4 py-3">Campaign Name</th>
                      <th className="px-4 py-3">Pipeline</th>
                      <th className="px-4 py-3">Target Groups</th>
                      <th className="px-4 py-3">Launch Date</th>
                      <th className="px-4 py-3">Holiday Pause</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0ECE3]">
                    {items.map((item, index) => {
                      const id = item.id;
                      const name = item.whats_app_campaign_name || item.name || 'Untitled Campaign';
                      const pipeline = item.pipeline?.pipeline_name || item.pipeline_name || `Pipeline #${item.whats_app_campaign_pipeline_id}`;
                      const date = item.whats_app_campaign_date || item.date || '—';
                      const status = item.whats_app_campaign_status || item.status || 'Pending';
                      const holiday = item.whats_app_campaign_holiday || 'Yes';
                      const rowNumber = (currentPage - 1) * perPage + index + 1;

                      let groups = [];
                      if (Array.isArray(item.groups)) groups = item.groups;
                      else if (Array.isArray(item.group)) groups = item.group;
                      else if (typeof item.whats_app_campaign_group === 'string' && item.whats_app_campaign_group.trim()) {
                        groups = item.whats_app_campaign_group.split(',');
                      }

                      return (
                        <tr key={id || index} className="hover:bg-[#FAF8F5] transition-colors">
                          <td className="px-4 py-3.5 font-mono text-xs text-[#9C9488]">{rowNumber}</td>
                          
                          {/* Name */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EBF7EE] text-[#1E7E34] border border-[#C3E6CB] font-mono text-xs font-bold flex-shrink-0">
                                <Send className="h-3.5 w-3.5" />
                              </div>
                              <span className="font-semibold text-xs text-[#1A1817]">{name}</span>
                            </div>
                          </td>

                          {/* Pipeline */}
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E2DDD5] text-[11px] font-medium text-[#5C554B]">
                              <Workflow className="h-3 w-3 text-[#9E7432]" />
                              <span className="truncate max-w-[140px]">{pipeline}</span>
                            </span>
                          </td>

                          {/* Target Groups */}
                          <td className="px-4 py-3.5">
                            {groups.length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {groups.slice(0, 2).map((g, gIdx) => {
                                  const gName = typeof g === 'object' ? (g.group_name || g.name || `#${g.id}`) : `Group #${g}`;
                                  return (
                                    <span
                                      key={gIdx}
                                      className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-[#FBF4E8] border border-[#F2E4C9] text-[10px] text-[#9E7432]"
                                    >
                                      <Boxes className="h-2.5 w-2.5" />
                                      <span className="truncate max-w-[90px]">{gName}</span>
                                    </span>
                                  );
                                })}
                                {groups.length > 2 && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-[#F5EFE3] text-[10px] text-[#78716C] font-semibold">
                                    +{groups.length - 2}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[#8C8275] text-[11px]">All Groups</span>
                            )}
                          </td>

                          {/* Date */}
                          <td className="px-4 py-3.5 font-mono text-xs text-[#1A1817]">
                            <span className="inline-flex items-center gap-1 text-[#5C554B]">
                              <Calendar className="h-3 w-3 text-[#9E7432]" />
                              <span>{date}</span>
                            </span>
                          </td>

                          {/* Holiday */}
                          <td className="px-4 py-3.5">
                            <span className="text-[11px] text-[#78716C] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E2DDD5]">
                              {holiday === 'Yes' ? 'Yes (Paused)' : 'No'}
                            </span>
                          </td>

                          {/* Status Dropdown Pill */}
                          <td className="px-4 py-3.5">
                            <select
                              value={status}
                              onChange={(e) => handleUpdateStatus(item, e.target.value)}
                              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border cursor-pointer transition ${
                                status === 'Sent'
                                  ? 'bg-[#EBF7EE] text-[#1E7E34] border-[#C3E6CB]'
                                  : status === 'Hold'
                                  ? 'bg-[#FDF0F0] text-[#9A2D2D] border-[#F6C8C8]'
                                  : 'bg-[#FFF9E6] text-[#9E7432] border-[#FCE8AE]'
                              }`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Sent">Sent</option>
                              <option value="Hold">Hold</option>
                            </select>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenPreview(item)}
                                title="View Details"
                                className="p-1.5 rounded-lg border border-[#DDD7CD] bg-white hover:bg-[#EFECE6] text-[#4A443D] transition shadow-2xs cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenDeleteModal(id)}
                                title="Delete Campaign"
                                className="p-1.5 rounded-lg border border-[#F6C8C8] bg-[#FDF0F0] hover:bg-[#FBEAEA] text-[#9A2D2D] transition shadow-2xs cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
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

      {/* Add / Edit WhatsApp Campaign Modal */}
      <WhatsAppCampaignModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        form={form}
        setForm={setForm}
        editingId={editingId}
        submitting={submitting}
      />

      {/* View Campaign Modal */}
      <WhatsAppCampaignViewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        item={previewItem}
        onEdit={(it) => handleOpenEditModal(it)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete WhatsApp Campaign"
        message="Are you sure you want to delete this scheduled campaign? This action cannot be undone."
        submitting={deleting}
      />
    </div>
  );
}
