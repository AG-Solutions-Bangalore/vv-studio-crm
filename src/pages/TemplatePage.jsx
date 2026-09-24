import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import TemplatePreviewModal from '../components/template/TemplatePreviewModal';
import Pagination from '../components/common/Pagination';
import useDebounce from '../hooks/useDebounce';
import {
  getTemplates,
  getTemplateById,
  updateTemplateStatus,
} from '../services/templateApi';
import { useAuthContext } from '../context/AuthContext';
import {
  Plus,
  Search,
  Edit2,
  RefreshCw,
  LayoutTemplate,
  Mail,
  MessageSquare,
  Eye,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Layers,
  Code2,
} from 'lucide-react';
import toast from 'react-hot-toast';

function extractList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.templates?.data)) return response.templates.data;
  if (Array.isArray(response?.templates)) return response.templates;
  if (Array.isArray(response?.template)) return response.template;
  return [];
}

export default function TemplatePage() {
  const navigate = useNavigate();
  const { hasEmail, hasWhatsApp } = useAuthContext();

  const defaultType = hasEmail && !hasWhatsApp ? 'Email' : !hasEmail && hasWhatsApp ? 'WhatsApp' : 'All';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState(defaultType); // 'All' | 'Email' | 'WhatsApp'
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Active' | 'Inactive'

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

  /* ── 1. GET /template with pagination ── */
  const fetchTemplateList = async (page = currentPage, query = debouncedSearch, type = typeFilter, status = statusFilter) => {
    setLoading(true);
    try {
      const params = {
        page,
        ...(query.trim() ? { search: query.trim(), q: query.trim() } : {}),
        ...(type !== 'All' ? { template_type: type, type } : {}),
        ...(status !== 'All' ? { status, template_status: status } : {}),
      };

      const res = await getTemplates(params);
      const list = extractList(res);
      setItems(list);

      // Automatically enrich list with full details if backend list endpoint omitted template_url
      if (Array.isArray(list) && list.length > 0) {
        Promise.all(
          list.map(async (tmpl) => {
            const hasUrl =
              tmpl?.template_url ||
              tmpl?.url ||
              tmpl?.template_link ||
              tmpl?.link ||
              tmpl?.preview_url;
            if (tmpl?.id && !hasUrl) {
              try {
                const detailRes = await getTemplateById(tmpl.id);
                const detail = detailRes?.data || detailRes?.template || detailRes;
                if (detail) {
                  return { ...tmpl, ...detail };
                }
              } catch (e) {
                // Ignore individual detail fetch failure
              }
            }
            return tmpl;
          })
        ).then((enrichedList) => {
          setItems((prev) =>
            prev.map((it) => {
              const match = enrichedList.find((e) => e && e.id === it.id);
              return match ? { ...it, ...match } : it;
            })
          );
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
      const msg = err?.response?.data?.message || err?.message || 'Failed to fetch templates.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplateList(currentPage, debouncedSearch, typeFilter, statusFilter);
  }, [currentPage, debouncedSearch, typeFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setCurrentPage(1);
    fetchTemplateList(1, searchQuery, typeFilter, statusFilter);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      fetchTemplateList(newPage, debouncedSearch, typeFilter, statusFilter);
    }
  };

  /* ── 2. PATCH /templates/{id}/status ── */
  const handleToggleStatus = async (item) => {
    const id = item.id;
    const currentStatus = item.template_status || item.status || 'Active';
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';

    // Optimistic UI update
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, template_status: nextStatus, status: nextStatus } : it))
    );

    try {
      await updateTemplateStatus(id, nextStatus);
      toast.success(`Template #${id} status changed to ${nextStatus}.`);
    } catch (err) {
      // Rollback
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, template_status: currentStatus, status: currentStatus } : it))
      );
      const msg = err?.response?.data?.message || err?.message || 'Failed to update template status.';
      toast.error(msg);
    }
  };

  /* ── 3. Preview Modal ── */
  const handleOpenPreview = async (item) => {
    setPreviewItem(item);
    setPreviewModalOpen(true);
    try {
      const res = await getTemplateById(item.id);
      const freshData = res?.data || res?.template || res;
      if (freshData) {
        setPreviewItem((prev) => ({ ...prev, ...freshData }));
      }
    } catch (err) {
      // Fallback to existing item
    }
  };

  // Metrics
  const templateStats = useMemo(() => {
    const total = totalCount || items.length;
    let emailCount = 0;
    let whatsappCount = 0;

    items.forEach((it) => {
      const type = (it.template_type || it.type || 'Email').toLowerCase();
      if (type === 'email') emailCount++;
      else if (type === 'whatsapp') whatsappCount++;
    });

    const stats = [
      {
        label: 'Total Templates',
        value: total,
        icon: LayoutTemplate,
        color: 'amber',
        filterValue: 'All',
        subtext: 'Saved broadcast designs',
      },
    ];

    if (hasEmail) {
      stats.push({
        label: 'Email Templates',
        value: emailCount,
        icon: Mail,
        color: 'emerald',
        filterValue: 'Email',
        subtext: 'Rich HTML newsletter layouts',
      });
    }

    if (hasWhatsApp) {
      stats.push({
        label: 'WhatsApp Templates',
        value: whatsappCount,
        icon: MessageSquare,
        color: 'blue',
        filterValue: 'WhatsApp',
        subtext: 'Meta broadcast message templates',
      });
    }

    return stats;
  }, [items, totalCount, hasEmail, hasWhatsApp]);

  return (
    <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Template Management" />

        <main className="flex-1 p-5 md:p-6 max-w-7xl w-full">
          
          {/* Header Bar */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-sm md:text-base font-semibold text-[#1A1817] tracking-tight">
                Message Templates
              </h1>
              <p className="text-xs text-[#78716C] mt-0.5">
                {hasEmail && hasWhatsApp
                  ? 'Manage, design, and preview Email and WhatsApp campaign templates'
                  : hasEmail
                  ? 'Manage, design, and preview Email marketing templates'
                  : 'Manage and configure WhatsApp broadcast message templates'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchTemplateList(currentPage, searchQuery, typeFilter, statusFilter)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E2DDD5] bg-white hover:bg-[#F7F4EE] text-[11px] font-medium text-[#4A443D] shadow-2xs transition-all cursor-pointer"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={() => navigate('/template/create')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-[11px] font-medium shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-[#C99C4B]" />
                <span>New Template</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white px-3.5 py-2.5 rounded-xl border border-[#E8E3DA] shadow-2xs mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9C9488] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates by name or ID..."
                className="w-full pl-8 pr-3 py-1.5 text-[11px] rounded-lg border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition-all shadow-2xs placeholder-[#9C9488]"
              />
            </form>

            {/* Type Selector (If both features active) */}
            {hasEmail && hasWhatsApp && (
              <div className="flex items-center gap-1 bg-[#FAF8F5] p-0.5 rounded-lg border border-[#E2DDD5] self-start sm:self-auto">
                {['All', 'Email', 'WhatsApp'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTypeFilter(t);
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                      typeFilter === t
                        ? 'bg-white text-[#1A1817] shadow-2xs font-semibold'
                        : 'text-[#78716C] hover:text-[#1A1817]'
                    }`}
                  >
                    {t === 'All' ? 'All Channels' : t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Templates Table Card */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-12 text-center shadow-2xs">
              <RefreshCw className="h-7 w-7 animate-spin text-[#9E7432] mx-auto mb-3" />
              <p className="text-xs font-medium text-[#78716C]">Loading message templates...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-14 text-center shadow-2xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] mb-4">
                <LayoutTemplate className="h-7 w-7" />
              </div>
              <h3 className="font-display text-base font-bold text-[#1A1817]">No templates found</h3>
              <p className="text-xs text-[#8C8275] max-w-sm mx-auto mt-1 mb-5">
                {searchQuery || typeFilter !== defaultType
                  ? 'No templates match your search keyword or selected filter.'
                  : 'Start building reusable message templates for your Email and WhatsApp broadcasts.'}
              </p>
              <button
                onClick={() => navigate('/template/create')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A1817] text-[#FAF8F5] text-xs font-semibold shadow-xs hover:bg-[#2C2825] transition cursor-pointer"
              >
                <Plus className="h-4 w-4 text-[#C99C4B]" />
                <span>Create First Template</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E8E3DA] overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E8E3DA] bg-[#FAF8F5] font-semibold text-[#5C554B]">
                      <th className="px-5 py-3 w-16">Sl.No</th>
                      <th className="px-5 py-3">Template Name</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Template ID</th>
                      <th className="px-5 py-3">Preview / Link</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0ECE3]">
                    {items.map((item, index) => {
                      const id = item.id;
                      const name = item.template_name || item.name || 'Untitled Template';
                      const type = item.template_type || item.type || 'Email';
                      const templateId = item.template_id || (type === 'Email' ? name : id);
                      const status = item.template_status || item.status || 'Active';
                      const isActive = status === 'Active';
                      const url =
                        item.template_url ||
                        item.url ||
                        item.template_link ||
                        item.link ||
                        item.preview_url;
                      const rowNumber = (currentPage - 1) * perPage + index + 1;

                      return (
                        <tr key={id || index} className="hover:bg-[#FAF8F5] transition-colors">
                          <td className="px-5 py-3.5 font-mono text-xs text-[#9C9488]">{rowNumber}</td>

                          {/* Name */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-lg border font-mono text-xs font-bold flex-shrink-0 ${
                                  type.toLowerCase() === 'email'
                                    ? 'bg-[#FBF4E8] text-[#9E7432] border-[#F2E4C9]'
                                    : 'bg-[#E6F8EE] text-[#1E7E34] border-[#C3E6CB]'
                                }`}
                              >
                                {type.toLowerCase() === 'email' ? (
                                  <Mail className="h-4 w-4" />
                                ) : (
                                  <MessageSquare className="h-4 w-4" />
                                )}
                              </div>
                              <span className="font-semibold text-xs text-[#1A1817] block">
                                {name}
                              </span>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                                type.toLowerCase() === 'email'
                                  ? 'bg-[#FAF6EE] text-[#8C6527] border-[#E8DFC8]'
                                  : 'bg-[#EBF7EE] text-[#1E7E34] border-[#C3E6CB]'
                              }`}
                            >
                              {type.toLowerCase() === 'email' ? 'Email' : 'WhatsApp'}
                            </span>
                          </td>

                          {/* Template ID */}
                          <td className="px-5 py-3.5 font-mono text-xs text-[#5C554B]">
                            {templateId || '—'}
                          </td>

                          {/* Preview Link */}
                          <td className="px-5 py-3.5 max-w-[200px] truncate">
                            {url ? (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[#9E7432] hover:underline truncate"
                              >
                                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{url}</span>
                              </a>
                            ) : (
                              <span className="text-[#8C8275]">—</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-5 py-3.5">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(item)}
                              title="Click to toggle status"
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
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenPreview(item)}
                                title="Live Preview"
                                className="p-1.5 rounded-lg border border-[#DDD7CD] bg-white hover:bg-[#EFECE6] text-[#4A443D] transition shadow-2xs cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => navigate(`/template/edit/${id}`)}
                                title="Edit Template"
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

      {/* Live Preview Modal */}
      <TemplatePreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        item={previewItem}
        onEdit={(it) => {
          setPreviewModalOpen(false);
          navigate(`/template/edit/${it.id}`);
        }}
      />
    </div>
  );
}
