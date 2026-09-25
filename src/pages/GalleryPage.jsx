import React, { useEffect, useState, useMemo } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import GalleryModal from '../components/gallery/GalleryModal';
import GalleryImageViewModal from '../components/gallery/GalleryImageViewModal';
import Pagination from '../components/common/Pagination';
import useDebounce from '../hooks/useDebounce';
import { useAppContext } from '../context/AppContext';
import {
  getGalleries,
  createGallery,
  updateGallery,
  updateGalleryStatus,
} from '../services/galleryApi';
import { getAssetBaseURL } from '../services/api';
import {
  Plus,
  Search,
  RefreshCw,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Edit2,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';

function extractList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.gallery?.data)) return response.gallery.data;
  if (Array.isArray(response?.gallery)) return response.gallery;
  if (Array.isArray(response?.galleries?.data)) return response.galleries.data;
  if (Array.isArray(response?.galleries)) return response.galleries;
  return [];
}

const initialForm = {
  gallery_image: null,
  gallery_images: [],
};

export default function GalleryPage() {
  const { imageUrlConfig, noImageUrl } = useAppContext();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  const debouncedSearch = useDebounce(searchQuery, 350);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [perPage, setPerPage] = useState(12);
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);

  // Upload/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialForm);

  // Preview Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  // Dynamic base gallery images URL prefix from API response
  const [apiGalleryBaseUrl, setApiGalleryBaseUrl] = useState(null);

  const galleryBaseUrl = useMemo(() => {
    if (apiGalleryBaseUrl) return apiGalleryBaseUrl;
    const found = (imageUrlConfig || []).find(
      (i) =>
        i?.image_for?.toLowerCase() === 'gallery' ||
        i?.image_for?.toLowerCase() === 'galleries' ||
        i?.image_for?.toLowerCase() === 'gallery_image' ||
        i?.image_for?.toLowerCase() === 'gallery_images'
    );
    const fallbackBase = getAssetBaseURL('/assets/images/gallerys_images/');
    return found?.image_url || fallbackBase;
  }, [apiGalleryBaseUrl, imageUrlConfig]);

  // Resolve full image URL helper
  const resolveImageUrl = (imageVal, itemObj = null) => {
    const targetObj = typeof imageVal === 'object' && imageVal !== null ? imageVal : itemObj;
    const rawVal = typeof imageVal === 'string' ? imageVal : (targetObj?.gallery_image || targetObj?.image || targetObj?.file_name || targetObj?.photo || targetObj?.gallery_photo);
    
    if (!rawVal) return noImageUrl || '';
    const cacheBuster = targetObj?.updated_at ? new Date(targetObj.updated_at).getTime() : '';
    if (rawVal.startsWith('http://') || rawVal.startsWith('https://') || rawVal.startsWith('data:') || rawVal.startsWith('blob:')) {
      const sep = rawVal.includes('?') ? '&' : '?';
      return cacheBuster ? `${rawVal}${sep}t=${cacheBuster}` : rawVal;
    }

    const baseUrl = targetObj?.gallery_url || targetObj?.image_url || galleryBaseUrl;
    const cleanBase = String(baseUrl).replace(/\/$/, '');
    const cleanPath = String(rawVal).replace(/^\//, '');
    const sep = cleanPath.includes('?') ? '&' : '?';
    return cacheBuster ? `${cleanBase}/${cleanPath}${sep}t=${cacheBuster}` : `${cleanBase}/${cleanPath}`;
  };

  const [copiedId, setCopiedId] = useState(null);

  const handleCopyLink = async (url, id) => {
    if (!url) {
      toast.error('Image URL is not available.');
      return;
    }
    const cleanUrl = url.split('?')[0];
    try {
      await navigator.clipboard.writeText(cleanUrl);
      setCopiedId(id);
      toast.success('Image link copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      // Fallback if clipboard API fails
      try {
        const textarea = document.createElement('textarea');
        textarea.value = cleanUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopiedId(id);
        toast.success('Image link copied to clipboard!');
        setTimeout(() => setCopiedId(null), 2000);
      } catch (e) {
        toast.error('Failed to copy image link.');
      }
    }
  };

  /* ── 1. GET /gallery with pagination ── */
  const fetchGalleryList = async (page = currentPage, query = debouncedSearch, status = statusFilter) => {
    setLoading(true);
    try {
      const params = {
        page,
        ...(query.trim() ? { search: query.trim(), q: query.trim() } : {}),
        ...(status !== 'All' ? { status, gallery_status: status } : {}),
      };

      const res = await getGalleries(params);
      const list = extractList(res);
      setItems(list);

      // Extract image base URL from API response
      if (Array.isArray(res?.image_url)) {
        const found = res.image_url.find(
          (img) =>
            img.image_for?.toLowerCase() === 'gallery' ||
            img.image_for?.toLowerCase() === 'galleries' ||
            img.image_for?.toLowerCase() === 'gallery_image' ||
            img.image_for?.toLowerCase() === 'gallery_images'
        );
        if (found?.image_url) {
          setApiGalleryBaseUrl(found.image_url);
        }
      }

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
      const msg = err?.response?.data?.message || err?.message || 'Failed to fetch gallery images.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGalleryList(currentPage, debouncedSearch, statusFilter);
  }, [currentPage, debouncedSearch, statusFilter]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setCurrentPage(1);
    fetchGalleryList(1, searchQuery, statusFilter);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      fetchGalleryList(newPage, debouncedSearch, statusFilter);
    }
  };

  /* ── 2. CREATE & EDIT (POST & PUT /gallery) ── */
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setForm(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    const imageField = item.gallery_image || item.image || item.photo || item.gallery || item.file_name || item.gallery_photo || item.image_name;
    const imageUrl = resolveImageUrl(imageField, item);
    setForm({
      gallery_image: null,
      gallery_images: [],
      gallery_status: item.gallery_status || item.status || 'Active',
      existingImage: imageUrl,
      fileName: imageField || `Photo #${item.id}`,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e?.preventDefault();
    setSubmitting(true);

    try {
      if (editingItem) {
        // Edit / Replace existing photo or update status
        const fileToUpload = form.gallery_image || (Array.isArray(form.gallery_images) && form.gallery_images.length > 0 ? form.gallery_images[0] : null);

        await updateGallery(editingItem.id, {
          gallery_image: fileToUpload,
          gallery_status: form.gallery_status || editingItem.gallery_status || 'Active',
        });
        toast.success('Gallery photo updated successfully.');
      } else {
        // POST /gallery (supports multiple photo batch upload)
        const filesToUpload = Array.isArray(form.gallery_images) && form.gallery_images.length > 0
          ? form.gallery_images
          : form.gallery_image
          ? [form.gallery_image]
          : [];

        if (filesToUpload.length === 0) {
          toast.error('Please select at least one WEBP photo.');
          setSubmitting(false);
          return;
        }

        if (filesToUpload.length === 1) {
          await createGallery({
            gallery_image: filesToUpload[0],
          });
          toast.success('Gallery photo uploaded successfully.');
        } else {
          let successCount = 0;
          let failCount = 0;

          for (const file of filesToUpload) {
            try {
              await createGallery({
                gallery_image: file,
              });
              successCount++;
            } catch (err) {
              failCount++;
            }
          }

          if (successCount > 0) {
            toast.success(`Successfully uploaded ${successCount} photos to gallery.${failCount > 0 ? ` (${failCount} failed)` : ''}`);
          } else {
            toast.error('Failed to upload photos.');
          }
        }
      }

      setIsModalOpen(false);
      setEditingItem(null);
      setForm(initialForm);
      fetchGalleryList(currentPage, searchQuery, statusFilter);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save gallery photo.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── 3. PATCH /gallerys/{id}/status ── */
  const handleToggleStatus = async (item) => {
    const id = item.id;
    const currentStatus = item.gallery_status || item.status || 'Active';
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';

    // Optimistic UI update
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, gallery_status: nextStatus, status: nextStatus } : it))
    );

    try {
      await updateGalleryStatus(id, nextStatus);
      toast.success(`Photo #${id} status changed to ${nextStatus}.`);
    } catch (err) {
      // Rollback
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, gallery_status: currentStatus, status: currentStatus } : it))
      );
      const msg = err?.response?.data?.message || err?.message || 'Failed to update photo status.';
      toast.error(msg);
    }
  };

  /* ── 4. Preview Modal ── */
  const handleOpenPreview = (item) => {
    setPreviewItem(item);
    setPreviewModalOpen(true);
  };

  // Metrics
  const activeCount = useMemo(() => {
    return items.filter((item) => {
      const s = String(item.gallery_status || item.status || '').toLowerCase();
      return s === 'active' || s === '1';
    }).length;
  }, [items]);

  const inactiveCount = useMemo(() => {
    return items.filter((item) => {
      const s = String(item.gallery_status || item.status || '').toLowerCase();
      return s === 'inactive' || s === '0';
    }).length;
  }, [items]);

  const galleryStats = useMemo(() => [
    {
      label: 'Total Gallery Photos',
      value: totalCount || items.length,
      icon: ImageIcon,
      color: 'emerald',
      filterValue: 'All',
      subtext: 'Media assets in storage',
    },
    {
      label: 'Active Photos',
      value: activeCount,
      icon: CheckCircle2,
      color: 'amber',
      filterValue: 'Active',
      subtext: 'Visible in live showcase',
    },
    {
      label: 'Inactive / Hidden',
      value: inactiveCount,
      icon: XCircle,
      color: 'rose',
      filterValue: 'Inactive',
      subtext: 'Archived media',
    },
  ], [items, totalCount, activeCount, inactiveCount]);

  return (
    <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Gallery Management" />

        <main className="flex-1 p-5 md:p-6 max-w-7xl w-full">
          
          {/* Header Bar */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-sm md:text-base font-semibold text-[#1A1817] tracking-tight">
                Media Gallery
              </h1>
              <p className="text-xs text-[#78716C] mt-0.5">
                Upload and manage high-resolution portfolio images, banners, and showcase photos
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchGalleryList(currentPage, searchQuery, statusFilter)}
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
                <span>Upload Photos</span>
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
                placeholder="Search gallery ..."
                className="w-full pl-8 pr-3 py-1.5 text-[11px] rounded-lg border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition-all shadow-2xs placeholder-[#9C9488]"
              />
            </form>

            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              {/* View Mode Toggle (Grid / Table) */}
              <div className="inline-flex rounded-lg border border-[#E2DDD5] bg-[#FAF8F5] p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                  className={`p-1 rounded-md transition cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-[#1A1817] text-[#FAF8F5] shadow-xs'
                      : 'text-[#5C554B] hover:text-[#1A1817]'
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  title="Table View"
                  className={`p-1 rounded-md transition cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-[#1A1817] text-[#FAF8F5] shadow-xs'
                      : 'text-[#5C554B] hover:text-[#1A1817]'
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

          </div>

          {/* Main Content Area */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-12 text-center shadow-2xs">
              <RefreshCw className="h-7 w-7 animate-spin text-[#9E7432] mx-auto mb-3" />
              <p className="text-xs font-medium text-[#78716C]">Loading gallery images...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-14 text-center shadow-2xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] mb-4">
                <ImageIcon className="h-7 w-7" />
              </div>
              <h3 className="font-display text-base font-bold text-[#1A1817]">No gallery photos found</h3>
              <p className="text-xs text-[#8C8275] max-w-sm mx-auto mt-1 mb-5">
                {searchQuery || statusFilter !== 'All'
                  ? `No photos match '${statusFilter}' status filter. Try switching tabs or clearing your search.`
                  : 'Your gallery is currently empty. Start uploading showcase images to present to your customers.'}
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A1817] text-[#FAF8F5] text-xs font-semibold shadow-xs hover:bg-[#2C2825] transition cursor-pointer"
              >
                <Plus className="h-4 w-4 text-[#C99C4B]" />
                <span>Upload First Photo</span>
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* ── GRID VIEW ── */
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
                {items.map((item, index) => {
                  const imageField = item.gallery_image || item.image || item.photo || item.gallery || item.file_name || item.gallery_photo || item.image_name;
                  const imageUrl = resolveImageUrl(imageField, item);
                  const status = item.gallery_status || item.status || 'Active';
                  const isActive = status === 'Active';

                  return (
                    <div
                      key={item.id || index}
                      className="group bg-white rounded-xl border border-[#E8E3DA] overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col"
                    >
                      {/* Image Thumbnail with Overlay Hover Action */}
                      <div className="relative aspect-4/3 bg-[#F7F4EE] overflow-hidden">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={`Gallery #${item.id}`}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.src = noImageUrl || '';
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#9E7432] bg-[#FBF4E8]">
                            <ImageIcon className="h-8 w-8 opacity-50" />
                          </div>
                        )}

                        {/* Hover Overlay Control (Quick Preview) */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleOpenPreview(item)}
                            title="Quick Preview"
                            className="p-2.5 rounded-full bg-white/95 hover:bg-white text-[#1A1817] shadow-md transition transform hover:scale-110 cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Status Badge in Top Left */}
                        <div className="absolute top-2.5 left-2.5">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item)}
                            title="Click to toggle status"
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight shadow-xs backdrop-blur-xs transition cursor-pointer ${
                              isActive
                                ? 'bg-white/95 text-[#1E7E34] border border-[#C3E6CB]'
                                : 'bg-white/95 text-[#9A2D2D] border border-[#F5C6CB]'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-[#1E7E34]' : 'bg-[#9A2D2D]'}`}
                            />
                            {status}
                          </button>
                        </div>

                        {/* ID Tag in Top Right */}
                        <div className="absolute top-2.5 right-2.5">
                          <span className="font-mono text-[10px] font-semibold bg-black/60 text-white px-1.5 py-0.5 rounded shadow-xs backdrop-blur-xs">
                            #{item.id}
                          </span>
                        </div>
                      </div>

                      {/* Card Info Footer */}
                      <div className="p-3 bg-white flex items-center justify-between border-t border-[#F0ECE3] text-[11px] text-[#78716C]">
                        <span className="truncate max-w-[130px] font-medium text-[#1A1817]" title={imageField || `Photo #${item.id}`}>
                          {imageField || `Photo #${item.id}`}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleCopyLink(imageUrl, item.id)}
                            className="p-1 rounded hover:bg-[#FAF8F5] text-[#5C554B] hover:text-[#1A1817] transition cursor-pointer"
                            title="Copy Image URL"
                          >
                            {copiedId === item.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1 rounded hover:bg-[#FAF8F5] text-[#5C554B] hover:text-[#9E7432] transition cursor-pointer"
                            title="Edit Photo"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

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
          ) : (
            /* ── TABLE VIEW ── */
            <div className="bg-white rounded-2xl border border-[#E8E3DA] overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#3D372E] border-collapse">
                  <thead className="bg-[#FAF8F5] border-b border-[#E8E3DA] text-xs uppercase font-semibold text-[#78716C] tracking-wider">
                    <tr>
                      <th className="px-4 py-3 w-20">Sl.No</th>
                      <th className="px-4 py-3 w-28">Preview</th>
                      <th className="px-4 py-3">Photo File</th>
                      <th className="px-4 py-3 w-40 text-center">Status</th>
                      <th className="px-4 py-3 w-28 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0ECE3]">
                    {items.map((item, index) => {
                      const imageField = item.gallery_image || item.image || item.photo || item.gallery || item.file_name || item.gallery_photo || item.image_name;
                      const imageUrl = resolveImageUrl(imageField, item);
                      const status = item.gallery_status || item.status || 'Active';
                      const isActive = status === 'Active';
                      const rowNumber = (currentPage - 1) * perPage + index + 1;

                      return (
                        <tr key={item.id || index} className="hover:bg-[#FAF8F5] transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-[#9C9488] align-middle">{rowNumber}</td>
                          
                          {/* Image Preview */}
                          <td className="px-4 py-3 align-middle">
                            <div
                              onClick={() => handleOpenPreview(item)}
                              className="h-11 w-18 rounded-lg bg-[#FAF8F5] border border-[#E8E3DA] p-0.5 overflow-hidden cursor-pointer hover:border-[#C99C4B] transition flex items-center justify-center group shadow-2xs"
                              title="Click to preview"
                            >
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={`#${item.id}`}
                                  className="h-full w-full object-cover rounded-md group-hover:scale-105 transition-transform"
                                  onError={(e) => {
                                    e.currentTarget.src = noImageUrl || '';
                                  }}
                                />
                              ) : (
                                <ImageIcon className="h-4 w-4 text-[#9E7432]" />
                              )}
                            </div>
                          </td>

                          {/* Copy Link Button */}
                          <td className="px-4 py-3 align-middle">
                            <button
                              type="button"
                              onClick={() => handleCopyLink(imageUrl, item.id)}
                              title="Copy Image URL"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2DDD5] bg-[#FAF8F5] hover:bg-[#F2EFEB] text-[#4A443D] hover:text-[#1A1817] text-xs font-medium transition cursor-pointer shadow-2xs"
                            >
                              {copiedId === item.id ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                  <span className="text-emerald-700 font-semibold text-xs">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5 text-[#9E7432]" />
                                  <span className="text-xs">Copy Link</span>
                                </>
                              )}
                            </button>
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

                          {/* Action Button (Edit - Right aligned) */}
                          <td className="px-4 py-3 align-middle text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(item)}
                              title="Edit Photo"
                              className="p-1.5 rounded-lg border border-[#DDD7CD] bg-white hover:bg-[#EFECE6] text-[#4A443D] hover:text-[#9E7432] transition shadow-2xs cursor-pointer inline-flex items-center justify-center"
                            >
                              <Edit2 className="h-3.5 w-3.5 text-[#9E7432]" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-white border-t border-[#E8E3DA] p-3">
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

      {/* Upload / Edit Gallery Photos Modal */}
      <GalleryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleFormSubmit}
        form={form}
        setForm={setForm}
        submitting={submitting}
        isEditing={Boolean(editingItem)}
      />

      {/* Lightbox / Preview Modal */}
      <GalleryImageViewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        item={previewItem}
        imageUrl={previewItem ? resolveImageUrl(previewItem.gallery_image || previewItem.image || previewItem.photo || previewItem.gallery || previewItem.file_name || previewItem.gallery_photo || previewItem.image_name) : ''}
      />
    </div>
  );
}
