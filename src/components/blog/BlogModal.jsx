import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Sparkles, Upload, FileText, ChevronRight, ChevronLeft } from 'lucide-react';
import { getActiveCategories } from '../../services/categoryApi';
import { getAssetBaseURL } from '../../services/api';
import RichTextEditor from '../common/RichTextEditor';
import toast from 'react-hot-toast';

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function resolveImageUrl(url, baseUrl = getAssetBaseURL('/assets/images/blog_images/')) {
  if (!url) return null;
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  let resolved = url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    resolved = `${cleanBase}${cleanUrl}`;
  }
  const sep = resolved.includes('?') ? '&' : '?';
  return `${resolved}${sep}t=${Date.now()}`;
}

export default function BlogModal({
  isOpen,
  onClose,
  onSubmit,
  form,
  setForm,
  editingId,
  submitting,
  imageBaseUrl = getAssetBaseURL('/assets/images/blog_images/'),
}) {
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('general');
  const [previewImage, setPreviewImage] = useState(null);
  const [errors, setErrors] = useState({});

  const titleInputRef = useRef(null);
  const slugInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('general');
      setErrors({});

      // Fetch active categories for dropdown
      getActiveCategories()
        .then((res) => {
          const list = res?.data?.data || res?.data || res?.categories || res || [];
          if (Array.isArray(list)) setCategories(list);
        })
        .catch(() => {});

      // Auto focus required field on open
      const timer = setTimeout(() => {
        if (!form.blog_title || !form.blog_title.trim()) {
          titleInputRef.current?.focus();
        } else if (!form.blog_slug || !form.blog_slug.trim()) {
          slugInputRef.current?.focus();
        } else {
          titleInputRef.current?.focus();
        }
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Sync preview image whenever form banner image changes
  useEffect(() => {
    if (form.blog_banner_image instanceof File) {
      setPreviewImage(URL.createObjectURL(form.blog_banner_image));
    } else if (form.banner_image_url) {
      setPreviewImage(resolveImageUrl(form.banner_image_url, imageBaseUrl));
    } else {
      setPreviewImage(null);
    }
  }, [form.blog_banner_image, form.banner_image_url, imageBaseUrl]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }

    if (type === 'checkbox') {
      setForm((prev) => ({ ...prev, [name]: checked ? '1' : '0' }));
    } else {
      setForm((prev) => {
        const next = { ...prev, [name]: value };
        // Auto-generate slug on new blogs if user types title
        if (name === 'blog_title' && !editingId && !prev.manualSlug) {
          next.blog_slug = slugify(value);
        }
        return next;
      });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm((prev) => ({
        ...prev,
        blog_banner_image: file,
        banner_image: file,
        image: file,
      }));
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleGenerateSlug = () => {
    setForm((prev) => ({
      ...prev,
      blog_slug: slugify(prev.blog_title || ''),
      manualSlug: true,
    }));
    if (errors.blog_slug) {
      setErrors((prev) => ({ ...prev, blog_slug: false }));
    }
  };

  const validateRequiredFields = () => {
    if (!form.blog_title || !form.blog_title.trim()) {
      setErrors((prev) => ({ ...prev, blog_title: true }));
      setActiveTab('general');
      toast.error('Article Title is required.');
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
      return false;
    }

    if (!form.blog_slug || !form.blog_slug.trim()) {
      setErrors((prev) => ({ ...prev, blog_slug: true }));
      setActiveTab('general');
      toast.error('URL Slug is required.');
      setTimeout(() => {
        slugInputRef.current?.focus();
      }, 100);
      return false;
    }

    const cleanDesc = (form.blog_description || '').replace(/<[^>]*>/g, '').trim();
    if (!cleanDesc) {
      setErrors((prev) => ({ ...prev, blog_description: true }));
      setActiveTab('general');
      toast.error('Full Article Body / Description is required.');
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (activeTab === 'general') {
      if (!validateRequiredFields()) return;
      setActiveTab('media');
    } else if (activeTab === 'media') {
      setActiveTab('seo');
    }
  };

  const handlePrev = () => {
    if (activeTab === 'seo') {
      setActiveTab('media');
    } else if (activeTab === 'media') {
      setActiveTab('general');
    }
  };

  const handleTabClick = (tab) => {
    if (tab === 'media' || tab === 'seo') {
      if (!validateRequiredFields()) return;
    }
    setActiveTab(tab);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!validateRequiredFields()) {
      return;
    }
    onSubmit(e);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fade-in overflow-y-auto"
    >
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-[#E8E3DA] bg-[#FCFBFA] shadow-2xl relative my-auto overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E3DA] bg-[#FAF8F5] rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] flex items-center justify-center flex-shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-[#1A1817] tracking-tight">
                {editingId ? 'Edit Article' : 'Create New Article'}
              </h3>
              <p className="text-xs text-[#78716C]">
                {editingId ? 'Update blog article details, media, and SEO' : 'Publish a new blog post to your portal'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-[#78716C] hover:text-[#1A1817] hover:bg-[#EFECE6] border border-[#E2DDD5] bg-white transition cursor-pointer shadow-2xs flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Nav Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-[#E8E3DA] bg-[#FAF8F5]/50 flex-shrink-0">
          <button
            type="button"
            onClick={() => handleTabClick('general')}
            className={`pb-2.5 px-3 text-xs font-medium transition cursor-pointer border-b-2 ${
              activeTab === 'general'
                ? 'border-[#1A1817] text-[#1A1817] font-semibold'
                : 'border-transparent text-[#78716C] hover:text-[#1A1817]'
            }`}
          >
            General & Content
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('media')}
            className={`pb-2.5 px-3 text-xs font-medium transition cursor-pointer border-b-2 ${
              activeTab === 'media'
                ? 'border-[#1A1817] text-[#1A1817] font-semibold'
                : 'border-transparent text-[#78716C] hover:text-[#1A1817]'
            }`}
          >
            Banner Image
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('seo')}
            className={`pb-2.5 px-3 text-xs font-medium transition cursor-pointer border-b-2 ${
              activeTab === 'seo'
                ? 'border-[#1A1817] text-[#1A1817] font-semibold'
                : 'border-transparent text-[#78716C] hover:text-[#1A1817]'
            }`}
          >
            SEO & Visibility
          </button>
        </div>

        {/* Form Body with Scroll */}
        <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* TAB 1: GENERAL & CONTENT */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                  Article Title <span className="text-[#9A2D2D]">*</span>
                </label>
                <input
                  ref={titleInputRef}
                  type="text"
                  name="blog_title"
                  value={form.blog_title || ''}
                  onChange={handleChange}
                  placeholder="e.g. Top 10 Luxury Wedding Card Trends of 2026..."
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${
                    errors.blog_title ? 'border-[#E05252] bg-[#FFF5F5] ring-1 ring-[#E05252]' : 'border-[#E2DDD5] bg-[#FAF8F5]'
                  } text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs`}
                />
                {errors.blog_title && (
                  <p className="mt-1 text-xs text-[#E05252]">Article title is required.</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[#3D372E]">
                      URL Slug <span className="text-[#9A2D2D]">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateSlug}
                      className="text-xs text-[#8C6527] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Sparkles className="h-3 w-3" />
                      Auto Slug
                    </button>
                  </div>
                  <input
                    ref={slugInputRef}
                    type="text"
                    name="blog_slug"
                    value={form.blog_slug || ''}
                    onChange={handleChange}
                    placeholder="top-10-luxury-wedding-cards..."
                    className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${
                      errors.blog_slug ? 'border-[#E05252] bg-[#FFF5F5] ring-1 ring-[#E05252]' : 'border-[#E2DDD5] bg-[#FAF8F5]'
                    } text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs font-mono`}
                  />
                  {errors.blog_slug && (
                    <p className="mt-1 text-xs text-[#E05252]">URL slug is required.</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                    Category
                  </label>
                  <select
                    name="blog_categories_ids"
                    value={form.blog_categories_ids || ''}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs cursor-pointer"
                  >
                    <option value="">Select Category...</option>
                    {categories.map((cat) => {
                      const id = cat.id;
                      const name = cat.category_name || cat.categories || cat.name || `Category #${id}`;
                      return (
                        <option key={id} value={id}>
                          {name}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                  Short Summary / Excerpt
                </label>
                <textarea
                  name="blog_short_description"
                  rows={2}
                  value={form.blog_short_description || ''}
                  onChange={handleChange}
                  placeholder="Brief synopsis displayed on card previews and search results..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                  Full Article Body
                </label>
                <RichTextEditor
                  value={form.blog_description || ''}
                  onChange={(htmlContent) => {
                    setForm((prev) => ({ ...prev, blog_description: htmlContent }));
                  }}
                  placeholder="Write and format the full content of your blog post here..."
                  minHeight="250px"
                />
              </div>
            </div>
          )}

          {/* TAB 2: BANNER IMAGE */}
          {activeTab === 'media' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                  Banner Image
                </label>
                <div className="border-2 border-dashed border-[#E2DDD5] rounded-2xl p-6 text-center bg-[#FAF8F5] hover:bg-[#F5F2EB] transition relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  {previewImage ? (
                    <div className="space-y-2">
                      <img
                        src={previewImage}
                        alt="Banner Preview"
                        className="h-40 w-full max-w-sm mx-auto object-cover rounded-xl border border-[#E8E3DA] shadow-xs"
                      />
                      <p className="text-xs text-[#8C6527] font-medium">
                        Click or drag a new image to replace
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 py-4">
                      <div className="h-11 w-11 rounded-xl bg-white border border-[#E2DDD5] flex items-center justify-center mx-auto text-[#9C9488]">
                        <Upload className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-semibold text-[#1A1817]">Upload Banner Image</p>
                      <p className="text-xs text-[#8C8275]">Supports PNG, JPG, WEBP • Max 5MB</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                  Banner Image Alt Text
                </label>
                <input
                  type="text"
                  name="blog_banner_image_alt"
                  value={form.blog_banner_image_alt || ''}
                  onChange={handleChange}
                  placeholder="Accessible description of the image for SEO..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs"
                />
              </div>
            </div>
          )}

          {/* TAB 3: SEO & VISIBILITY */}
          {activeTab === 'seo' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                  Meta Keywords
                </label>
                <input
                  type="text"
                  name="blog_meta_keywords"
                  value={form.blog_meta_keywords || ''}
                  onChange={handleChange}
                  placeholder="wedding cards, invitations, luxury stationery..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs"
                />
              </div>

              <div className={editingId ? 'grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1' : 'pt-1'}>
                {editingId && (
                  <div>
                    <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                      Status
                    </label>
                    <select
                      name="blog_status"
                      value={form.blog_status || 'Active'}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                    Search Engine Indexing
                  </label>
                  <select
                    name="blog_index"
                    value={String(form.blog_index ?? '1')}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs cursor-pointer"
                  >
                    <option value="1">Index</option>
                    <option value="0">No-Index</option>
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <label className="flex items-center gap-3 p-3.5 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] cursor-pointer hover:bg-[#F5F2EB] transition">
                  <input
                    type="checkbox"
                    name="blog_featured"
                    checked={String(form.blog_featured) === '1' || form.blog_featured === true || form.blog_featured === 'Active'}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-[#DDD7CD] text-[#1A1817] focus:ring-[#C99C4B] cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-xs text-[#1A1817] block">Featured Article</span>
                    <span className="text-xs text-[#8C8275]">Pin to featured spotlight section</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] cursor-pointer hover:bg-[#F5F2EB] transition">
                  <input
                    type="checkbox"
                    name="blog_front"
                    checked={String(form.blog_front) === '1' || form.blog_front === true || form.blog_front === 'Active'}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-[#DDD7CD] text-[#1A1817] focus:ring-[#C99C4B] cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-xs text-[#1A1817] block">Show on Homepage</span>
                    <span className="text-xs text-[#8C8275]">Display on main website landing page</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          </div>

          {/* Sticky Modal Footer */}
          <div className="px-6 py-3.5 bg-[#FAF8F5] border-t border-[#E8E3DA] flex items-center justify-between rounded-b-2xl flex-shrink-0">
            {/* Steps Progress Indicator */}
            <div className="flex items-center gap-2">
              {['general', 'media', 'seo'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleTabClick(tab)}
                  className={`h-2 w-7 rounded-full transition-all cursor-pointer ${
                    activeTab === tab ? 'bg-[#1A1817]' : 'bg-[#E2DDD5] hover:bg-[#CDC6BA]'
                  }`}
                />
              ))}
            </div>

            {/* Navigation & Action Buttons */}
            <div className="flex items-center gap-2.5">
              {activeTab !== 'general' && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-[#DDD7CD] bg-white hover:bg-[#F2EFEB] text-xs font-semibold text-[#4A443D] transition cursor-pointer shadow-2xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[#DDD7CD] bg-white hover:bg-[#F2EFEB] text-xs font-medium text-[#4A443D] transition cursor-pointer shadow-2xs"
              >
                Cancel
              </button>

              {activeTab !== 'seo' && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] hover:bg-[#EFECE6] text-xs font-semibold text-[#1A1817] transition cursor-pointer shadow-2xs"
                >
                  <span>Next Step</span>
                  <ChevronRight className="h-3.5 w-3.5 text-[#C99C4B]" />
                </button>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-xs font-semibold shadow-xs transition active:scale-95 disabled:bg-[#A39C91] cursor-pointer"
              >
                <Save className="h-3.5 w-3.5 text-[#C99C4B]" />
                <span>{submitting ? 'Saving...' : editingId ? 'Update Article' : 'Publish Article'}</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
