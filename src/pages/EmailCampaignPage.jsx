import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { 
  Mail, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Eye, 
  Loader2, 
  RefreshCw, 
  Calendar, 
  Users, 
  CheckCircle2, 
  ShieldAlert, 
  Clock, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Send
} from 'lucide-react';
import { 
  getEmailCampaigns, 
  updateEmailCampaignStatus, 
  deleteEmailCampaign,
} from '../services/emailCampaignApi';
import Pagination from '../components/common/Pagination';
import useDebounce from '../hooks/useDebounce';
import toast from 'react-hot-toast';

function extractList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.campaigns?.data)) return response.campaigns.data;
  if (Array.isArray(response?.campaigns)) return response.campaigns;
  if (Array.isArray(response?.email_campaign)) return response.email_campaign;
  return [];
}

export default function EmailCampaignPage() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Debounced search query
  const debouncedSearch = useDebounce(search, 350);

  // Action states
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCampaigns = async (page = currentPage, query = debouncedSearch, status = statusFilter) => {
    setLoading(true);
    try {
      const params = {
        page,
        ...(query.trim() ? { search: query.trim(), q: query.trim() } : {}),
        ...(status !== 'All' ? { status, email_campaign_status: status } : {}),
      };

      const res = await getEmailCampaigns(params);
      const list = extractList(res);
      setCampaigns(list);

      const paginationObj = res?.data?.data ? res?.data : (res?.data || res);
      const total = paginationObj?.total ?? list.length;
      const lastPage = paginationObj?.last_page ?? Math.max(1, Math.ceil(total / (paginationObj?.per_page || 10)));
      
      setTotalPages(lastPage);
      setTotalCount(total);
    } catch (err) {
      console.error('Failed to load email campaigns:', err);
      toast.error('Failed to load email campaigns.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns(currentPage, debouncedSearch, statusFilter);
  }, [currentPage, debouncedSearch, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCampaigns(1, search, statusFilter);
  };

  const handleStatusFilterChange = (newStatus) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
  };

  const handleStatusChange = async (id, newStatus) => {
    setStatusUpdatingId(id);
    try {
      await updateEmailCampaignStatus(id, newStatus);
      toast.success(`Status updated to ${newStatus}`);
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, email_campaign_status: newStatus, status: newStatus } : c
        )
      );
    } catch (err) {
      console.error('Status update failed:', err);
      toast.error('Failed to update campaign status.');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      await deleteEmailCampaign(deleteConfirmId);
      toast.success('Campaign deleted successfully.');
      setDeleteConfirmId(null);
      fetchCampaigns(currentPage, debouncedSearch, statusFilter);
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete campaign.');
    } finally {
      setDeleting(false);
    }
  };

  // Statistics
  const emailStats = useMemo(() => {
    const total = totalCount || campaigns.length;
    let pending = 0;
    let sent = 0;
    let hold = 0;

    campaigns.forEach((c) => {
      const st = String(c.email_campaign_status || c.status || 'Pending').toLowerCase();
      if (st === 'sent') sent++;
      else if (st === 'hold') hold++;
      else pending++;
    });

    return [
      {
        label: 'Total Email Broadcasts',
        value: total,
        icon: Mail,
        color: 'amber',
        filterValue: 'All',
        subtext: 'Scheduled & delivered campaigns',
      },
      {
        label: 'Pending Dispatches',
        value: pending,
        icon: Clock,
        color: 'blue',
        filterValue: 'Pending',
        subtext: 'Queued for delivery',
      },
      {
        label: 'Delivered Campaigns',
        value: sent,
        icon: CheckCircle2,
        color: 'emerald',
        filterValue: 'Sent',
        subtext: 'Successfully transmitted',
      },
    ];
  }, [campaigns, totalCount]);

  return (
    <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Email Campaigns" />

        <main className="flex-1 p-5 md:p-6 max-w-7xl w-full">
          
          {/* Header Bar */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-sm md:text-base font-semibold text-[#1A1817] tracking-tight">
                Email Campaigns
              </h1>
              <p className="text-xs text-[#78716C] mt-0.5">
                Schedule broadcast marketing emails, track executions, and manage recipient audiences
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchCampaigns(currentPage)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E2DDD5] bg-white hover:bg-[#F7F4EE] text-[11px] font-medium text-[#4A443D] shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={() => navigate('/email-campaign/create')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-[11px] font-medium shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-[#C99C4B]" />
                <span>Create Email Campaign</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white px-3.5 py-2.5 rounded-xl border border-[#E8E3DA] shadow-2xs mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9C9488] pointer-events-none" />
              <input
                type="text"
                placeholder="Search email campaigns..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 text-[11px] rounded-lg border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition-all shadow-2xs placeholder-[#9C9488]"
              />
            </form>
          </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-[#E8E3DA] bg-white overflow-hidden shadow-2xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#C99C4B] mb-2" />
            <p className="text-xs font-semibold text-[#1A1817]">Loading email campaigns...</p>
            <p className="text-[11px] text-[#8C8275]">Please wait a moment</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FAF8F5] border border-[#E8E3DA] text-[#8C8275] mb-3">
              <Mail className="h-6 w-6 text-[#9E7432]" />
            </div>
            <p className="text-xs font-semibold text-[#1A1817]">No email campaigns found</p>
            <p className="text-[11px] text-[#8C8275] mt-0.5 max-w-xs mb-4">
              {search || statusFilter !== 'All'
                ? 'Try adjusting your search terms or filter selection.'
                : 'Get started by scheduling your first email marketing campaign broadcast.'}
            </p>
            <button
              onClick={() => navigate('/email-campaign/create')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1A1817] text-[#FAF8F5] text-xs font-medium shadow-xs hover:bg-[#2C2825] transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 text-[#C99C4B]" />
              <span>Create Campaign</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E8E3DA] bg-[#FAF8F5] font-semibold text-[#5C554B]">
                  <th className="py-3 px-4 w-16 text-center">Sl.No</th>
                  <th className="py-3 px-4">Campaign & Subject</th>
                  <th className="py-3 px-4">Schedule Date</th>
                  <th className="py-3 px-4">Holiday Rule</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE3]">
                {campaigns.map((camp, index) => {
                  const name = camp.email_campaign_name || camp.name || 'Unnamed Campaign';
                  const subject = camp.email_campaign_subject || camp.subject || '—';
                  const date = camp.email_campaign_date || camp.date || '—';
                  const holiday = camp.email_campaign_holiday || camp.holiday || 'Yes';
                  const currentStatus = camp.email_campaign_status || camp.status || 'Pending';
                  const rowNumber = (currentPage - 1) * 10 + index + 1;
                  const isStatusLoading = statusUpdatingId === camp.id;

                  return (
                    <tr key={camp.id || index} className="hover:bg-[#FAF8F5] transition">
                      {/* Row Index */}
                      <td className="py-3.5 px-4 font-mono text-[#9C9488] text-center">
                        {rowNumber}
                      </td>

                      {/* Campaign Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FAF8F5] border border-[#E8E3DA] text-[#9E7432] shrink-0">
                            <Mail className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 max-w-xs sm:max-w-md">
                            <p className="font-semibold text-xs text-[#1A1817] truncate">{name}</p>
                            <p className="text-[11px] text-[#8C8275] truncate mt-0.5">
                              {subject}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Schedule Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[#5C554B]">
                        <div className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                          <Calendar className="h-3.5 w-3.5 text-[#9C9488]" />
                          <span>{date}</span>
                        </div>
                      </td>

                      {/* Holiday Rule */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                            holiday === 'Yes'
                              ? 'bg-[#FAF8F5] text-[#5C554B] border border-[#E8E3DA]'
                              : 'bg-[#FFF9E6] text-[#9E7432] border border-[#FCE8AE]'
                          }`}
                        >
                          <ShieldAlert className="h-3 w-3" />
                          {holiday === 'Yes' ? 'Skip on Holiday' : 'Ignore Holiday'}
                        </span>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="relative inline-block">
                          <select
                            value={currentStatus}
                            disabled={isStatusLoading}
                            onChange={(e) => handleStatusChange(camp.id, e.target.value)}
                            className={`appearance-none rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer outline-none ${
                              String(currentStatus).toLowerCase() === 'sent'
                                ? 'border-[#C3E6CB] bg-[#EBF7EE] text-[#1E7E34]'
                                : String(currentStatus).toLowerCase() === 'hold'
                                ? 'border-[#F1D5C4] bg-[#FBF0EA] text-[#8F4E24]'
                                : 'border-[#E8E3DA] bg-[#FAF8F5] text-[#8C6D23]'
                            }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Sent">Sent</option>
                            <option value="Hold">Hold</option>
                          </select>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => navigate(`/email-campaign/view/${camp.id}`)}
                            title="View Overview"
                            className="p-1.5 text-[#8C8275] hover:text-[#1A1817] hover:bg-[#FAF8F5] rounded-lg transition cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(camp.id)}
                            title="Delete Campaign"
                            className="p-1.5 text-[#8C8275] hover:text-[#9A2D2D] hover:bg-[#FBEAEA] rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Server Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          perPage={10}
          onPageChange={(newPage) => {
            setCurrentPage(newPage);
            fetchCampaigns(newPage);
          }}
        />
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-2xl bg-[#FAF8F5] p-6 shadow-2xl border border-[#E8E3DA]">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FBEAEA] text-[#9A2D2D] mb-4">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-[#1A1817]">Delete Email Campaign?</h3>
            <p className="mt-1.5 text-xs text-[#8C8275] leading-relaxed">
              Are you sure you want to delete this email campaign? This will halt scheduled broadcasts and delete related records.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleting}
                className="rounded-xl border border-[#E8E3DA] bg-white px-4 py-2 text-xs font-semibold text-[#5C554B] hover:bg-[#FAF8F5] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex items-center gap-2 rounded-xl bg-[#9A2D2D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7D2424] transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
        </main>
      </div>
    </div>
  );
}
