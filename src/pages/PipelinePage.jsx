import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import PipelineViewModal from '../components/pipeline/PipelineViewModal';
import Pagination from '../components/common/Pagination';
import useDebounce from '../hooks/useDebounce';
import {
  getPipelines,
  getPipelineById,
  updatePipelineStatus,
} from '../services/pipelineApi';
import {
  Plus,
  Search,
  Edit2,
  RefreshCw,
  Workflow,
  Eye,
  CheckCircle2,
  XCircle,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

function extractList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.pipelines?.data)) return response.pipelines.data;
  if (Array.isArray(response?.pipelines)) return response.pipelines;
  if (Array.isArray(response?.pipeline)) return response.pipeline;
  return [];
}

function formatPipelineTime(time) {
  if (time === 0 || time === '0' || String(time).toLowerCase() === 'immediate') return 'Immediate';
  const num = parseInt(time, 10);
  if (!isNaN(num)) {
    return num === 1 ? '1 Day' : `${num} Days`;
  }
  return time || 'Immediate';
}

const initialForm = {
  pipeline_name: '',
  pipeline_status: 'Active',
  subs: [],
};

export default function PipelinePage() {
  const navigate = useNavigate();

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

  // Preview Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  /* ── 1. GET /pipeline with pagination ── */
  const fetchPipelineList = async (page = currentPage, query = debouncedSearch, status = statusFilter) => {
    setLoading(true);
    try {
      const params = {
        page,
        ...(query.trim() ? { search: query.trim(), q: query.trim() } : {}),
        ...(status !== 'All' ? { status, pipeline_status: status } : {}),
      };

      const res = await getPipelines(params);
      const list = extractList(res);
      setItems(list);

      // Background fetch sub-stages for all visible pipelines to populate sequence flowchips
      if (list.length > 0) {
        Promise.all(
          list.map(async (pipe) => {
            try {
              const detailRes = await getPipelineById(pipe.id);
              const detail = detailRes?.data?.pipeline || detailRes?.data?.data || detailRes?.data || detailRes;
              if (detail && (detail.subs || detail.sub)) {
                return {
                  ...pipe,
                  subs: detail.subs || detail.sub || [],
                  subs_count: detail.subs_count ?? (detail.subs || detail.sub || []).length,
                };
              }
            } catch {
              // keep existing
            }
            return pipe;
          })
        ).then((fullList) => {
          setItems(fullList);
        });
      }

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
      const msg = err?.response?.data?.message || err?.message || 'Failed to fetch pipelines.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipelineList(currentPage, debouncedSearch, statusFilter);
  }, [currentPage, debouncedSearch, statusFilter]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setCurrentPage(1);
    fetchPipelineList(1, searchQuery, statusFilter);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      fetchPipelineList(newPage, debouncedSearch, statusFilter);
    }
  };

  /* ── 2. PATCH /pipelines/{id}/status ── */
  const handleToggleStatus = async (item) => {
    const id = item.id;
    const currentStatus = item.pipeline_status || item.status || 'Active';
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';

    // Optimistic UI update
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, pipeline_status: nextStatus, status: nextStatus } : it))
    );

    try {
      await updatePipelineStatus(id, nextStatus);
      toast.success(`Pipeline #${id} status changed to ${nextStatus}.`);
    } catch (err) {
      // Rollback
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, pipeline_status: currentStatus, status: currentStatus } : it))
      );
      const msg = err?.response?.data?.message || err?.message || 'Failed to update pipeline status.';
      toast.error(msg);
    }
  };

  /* ── 4. Preview Modal ── */
  const handleOpenPreview = async (item) => {
    setPreviewItem(item);
    setPreviewModalOpen(true);
    try {
      const res = await getPipelineById(item.id);
      const freshData = res?.data?.pipeline || res?.data?.data || res?.data || res?.pipeline || res;
      if (freshData) {
        setPreviewItem(freshData);
      }
    } catch (err) {
      // keep initial
    }
  };

  // Metrics
  const pipelineStats = useMemo(() => {
    const total = totalCount || items.length;
    let totalStages = 0;
    let active = 0;
    let inactive = 0;

    items.forEach((it) => {
      const subs = it.subs || it.sub || it.stages || it.steps || [];
      const count = it.subs_count !== undefined && it.subs_count !== null ? Number(it.subs_count) : subs.length;
      totalStages += count;
      const st = (it.pipeline_status || it.status || 'Active').toLowerCase();
      if (st === 'active' || st === '1') active++;
      else inactive++;
    });

    return [
      {
        label: 'Total Pipelines',
        value: total,
        icon: Workflow,
        color: 'emerald',
        filterValue: 'All',
        subtext: 'Automated drip workflows',
      },
      {
        label: 'Active Sequences',
        value: active,
        icon: CheckCircle2,
        color: 'amber',
        filterValue: 'Active',
        subtext: 'Running & triggering steps',
      },
      {
        label: 'Inactive / Paused',
        value: inactive,
        icon: XCircle,
        color: 'rose',
        filterValue: 'Inactive',
        subtext: 'Paused or draft workflows',
      },
    ];
  }, [items, totalCount]);

  return (
    <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Automation Pipelines" />

        <main className="flex-1 p-5 md:p-6 max-w-7xl w-full">
          
          {/* Header Bar */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-sm md:text-base font-semibold text-[#1A1817] tracking-tight">
                Marketing Drip Pipelines
              </h1>
              <p className="text-xs text-[#78716C] mt-0.5">
                Configure automated multi-step message workflows, triggers, and delay timers
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchPipelineList(currentPage, searchQuery, statusFilter)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E2DDD5] bg-white hover:bg-[#F7F4EE] text-[11px] font-medium text-[#4A443D] shadow-2xs transition-all cursor-pointer"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={() => navigate('/pipeline/create')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-[11px] font-medium shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-[#C99C4B]" />
                <span>Add Pipeline</span>
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
                placeholder="Search pipelines by name or ID..."
                className="w-full pl-8 pr-3 py-1.5 text-[11px] rounded-lg border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition-all shadow-2xs placeholder-[#9C9488]"
              />
            </form>
          </div>

          {/* Pipeline Cards View */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-12 text-center shadow-2xs">
              <RefreshCw className="h-7 w-7 animate-spin text-[#9E7432] mx-auto mb-3" />
              <p className="text-xs font-medium text-[#78716C]">Loading automation pipelines...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-14 text-center shadow-2xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] mb-4">
                <Workflow className="h-7 w-7" />
              </div>
              <h3 className="font-display text-base font-bold text-[#1A1817]">No pipelines found</h3>
              <p className="text-xs text-[#8C8275] max-w-sm mx-auto mt-1 mb-5">
                {searchQuery || statusFilter !== 'All'
                  ? 'No pipelines match your search query or filter.'
                  : 'Automate your customer follow-ups by creating your first multi-stage pipeline.'}
              </p>
              <button
                onClick={() => navigate('/pipeline/create')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A1817] text-[#FAF8F5] text-xs font-semibold shadow-xs hover:bg-[#2C2825] transition cursor-pointer"
              >
                <Plus className="h-4 w-4 text-[#C99C4B]" />
                <span>Create Pipeline</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => {
                const id = item.id;
                const name = item.pipeline_name || item.name || 'Untitled Pipeline';
                const status = item.pipeline_status || item.status || 'Active';
                const isActive = status === 'Active';
                const subs = item.subs || item.sub || item.stages || item.steps || [];

                return (
                  <div
                    key={id || index}
                    className="bg-white rounded-2xl border border-[#E8E3DA] p-5 shadow-2xs hover:shadow-xs transition duration-200 space-y-4"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0ECE3] pb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] font-mono text-xs font-bold">
                          #{id}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-display text-base font-bold text-[#1A1817] tracking-tight">
                              {name}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E2DDD5] text-[10px] font-semibold text-[#5C554B]">
                              {(item.subs_count !== undefined && item.subs_count !== null ? Number(item.subs_count) : subs.length)} {(item.subs_count === 1 || (item.subs_count === undefined && subs.length === 1)) ? 'Step' : 'Steps'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center justify-between sm:justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          title="Click to toggle pipeline status"
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

                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenPreview(item)}
                            title="View Workflow Sequence"
                            className="p-1.5 rounded-lg border border-[#DDD7CD] bg-white hover:bg-[#EFECE6] text-[#4A443D] transition shadow-2xs cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5 text-[#9E7432]" />
                          </button>

                          <button
                            type="button"
                            onClick={() => navigate(`/pipeline/edit/${item.id}`)}
                            title="Edit Pipeline"
                            className="p-1.5 rounded-lg border border-[#DDD7CD] bg-white hover:bg-[#EFECE6] text-[#4A443D] transition shadow-2xs cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-[#9E7432]" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Step Chips Flow */}
                    <div className="overflow-x-auto pb-1">
                      <div className="flex items-center gap-2 min-w-max">
                        {subs.length === 0 ? (
                          <span className="text-xs text-[#8C8275] italic">No steps configured yet.</span>
                        ) : (
                          subs.map((s, sIdx) => {
                            const stepTitle = s.pipeline_sub_name || `Step ${sIdx + 1}`;
                            const stepDelay = formatPipelineTime(s.pipeline_sub_time);
                            return (
                              <React.Fragment key={s.id || sIdx}>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E8E3DA] text-xs">
                                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1A1817] text-[#FAF8F5] font-mono text-[10px] font-bold">
                                    {sIdx + 1}
                                  </span>
                                  <span className="font-semibold text-[#1A1817] max-w-[160px] truncate">
                                    {stepTitle}
                                  </span>
                                  <span className="text-[10px] text-[#8C8275] bg-white px-1.5 py-0.5 rounded border border-[#E2DDD5]">
                                    {stepDelay}
                                  </span>
                                </div>
                                {sIdx < subs.length - 1 && (
                                   <ChevronRight className="h-4 w-4 text-[#9C9488] flex-shrink-0" />
                                 )}
                              </React.Fragment>
                            );
                          })
                        )}
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

      {/* View Pipeline Modal */}
      <PipelineViewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        item={previewItem}
        onEdit={(it) => navigate(`/pipeline/edit/${it.id}`)}
      />
    </div>
  );
}
