import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import {
  FileText,
  Save,
  ArrowLeft,
  Loader2,
  Sparkles,
  Upload,
  Globe,
  Star,
  Home,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
  ChevronRight,
  ImageIcon,
} from 'lucide-react';
import {
  createBlog,
  updateBlog,
  getBlogById,
} from '../services/blogApi';
import { getActiveCategories } from '../services/categoryApi';
import { getAssetBaseURL } from '../services/api';
import RichTextEditor from '../components/common/RichTextEditor';
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

export default function BlogFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'media' | 'seo'
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [errors, setErrors] = useState({});
  const [manualSlug, setManualSlug] = useState(false);
  const [imageBaseUrl, setImageBaseUrl] = useState(() => getAssetBaseURL('/assets/images/blog_images/'));

  const [form, setForm] = useState({
    blog_title: '',
    blog_slug: '',
    blog_short_description: '',
    blog_description: '',
    blog_categories_ids: '',
    blog_banner_image: null,
    blog_banner_image_alt: '',
    blog_meta_keywords: '',
    blog_status: 'Active',
    blog_index: '1',
    blog_front: '0',
    blog_featured: '0',
    banner_image_url: null,
  });

  const titleInputRef = useRef(null);
  const slugInputRef = useRef(null);

  useEffect(() => {
    loadCategories();
    if (isEditing) {
      loadBlogDetails(id);
    }
  }, [id, isEditing]);

  const loadCategories = async () => {
    try {
      const res = await getActiveCategories();
      const list = res?.data?.data || res?.data || res?.categories || res || [];
      if (Array.isArray(list)) {
        setCategories(list);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadBlogDetails = async (blogId) => {
    setFetchingData(true);
    try {
      const res = await getBlogById(blogId);
      let data = res?.data?.data || res?.data?.blog || res?.data || res?.blog || res?.blogs || res || {};
      if (Array.isArray(data)) {
        data = data[0] || {};
      }

      const title = data?.blog_title || data?.title || data?.name || data?.blog_meta_title || '';
      const slug = data?.blog_slug || data?.slug || data?.url_slug || slugify(title);
      const rawImg = data?.blog_banner_image || data?.banner_image || data?.image || data?.blog_image || data?.banner || data?.banner_image_url || data?.image_url;

      let resolvedBase = imageBaseUrl;
      if (Array.isArray(res?.image_url)) {
        const blogImg = res.image_url.find((img) => img.image_for?.toLowerCase() === 'blog');
        if (blogImg?.image_url) {
          resolvedBase = blogImg.image_url;
          setImageBaseUrl(resolvedBase);
        }
      }

      const isFront = data?.blog_front === true || String(data?.blog_front) === '1' || data?.blog_front === 'Active' || data?.front === true || String(data?.front) === '1' || data?.front === 'Active' || String(data?.blog_front || data?.front).toLowerCase() === 'yes';
      const isFeatured = data?.blog_featured === true || String(data?.blog_featured) === '1' || data?.blog_featured === 'Active' || data?.featured === true || String(data?.featured) === '1' || data?.featured === 'Active' || String(data?.blog_featured || data?.featured).toLowerCase() === 'yes';
      const isIndex = data?.blog_index !== undefined && data?.blog_index !== null
        ? String(data?.blog_index)
        : data?.index !== undefined && data?.index !== null
        ? String(data?.index)
        : '1';

      setForm({
        blog_title: title,
        blog_slug: slug,
        blog_short_description: data?.blog_short_description || data?.short_description || data?.excerpt || data?.blog_meta_description || data?.meta_description || '',
        blog_description: data?.blog_description || data?.description || data?.content || data?.body || data?.blog_content || '',
        blog_categories_ids: String(data?.blog_categories_ids || data?.category_id || data?.categories_id || data?.categories_ids || ''),
        blog_banner_image: null,
        blog_banner_image_alt: data?.blog_banner_image_alt || data?.banner_image_alt || data?.alt_text || data?.alt || '',
        blog_meta_keywords: data?.blog_meta_keywords || data?.meta_keywords || data?.keywords || '',
        blog_status: data?.blog_status || data?.status || 'Active',
        blog_index: isIndex === '0' || isIndex === 'false' ? '0' : '1',
        blog_front: isFront ? '1' : '0',
        blog_featured: isFeatured ? '1' : '0',
        banner_image_url: rawImg,
      });

      if (rawImg) {
        setPreviewImage(resolveImageUrl(rawImg, resolvedBase));
      }
      setManualSlug(true);
    } catch (err) {
      console.error('Failed to load blog:', err);
      toast.error('Could not load article details.');
      navigate('/blog');
    } finally {
      setFetchingData(false);
    }
  };

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
        if (name === 'blog_title' && !isEditing && !manualSlug) {
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
    }));
    setManualSlug(true);
    if (errors.blog_slug) {
      setErrors((prev) => ({ ...prev, blog_slug: false }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.blog_title.trim()) {
      newErrors.blog_title = 'Article Title is required.';
    }
    if (!form.blog_slug.trim()) {
      newErrors.blog_slug = 'URL Slug is required.';
    }
    const cleanDesc = (form.blog_description || '').replace(/<[^>]*>/g, '').trim();
    if (!cleanDesc) {
      newErrors.blog_description = 'Full Article Body / Description is required.';
    }
    setErrors(newErrors);

    if (newErrors.blog_title || newErrors.blog_slug || newErrors.blog_description) {
      setActiveTab('general');
      const firstMsg = newErrors.blog_title || newErrors.blog_slug || newErrors.blog_description;
      toast.error(firstMsg);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (isEditing) {
        const res = await updateBlog(id, form);
        toast.success(res?.message || 'Article updated successfully!');
        navigate(`/blog/view/${id}`);
      } else {
        const res = await createBlog(form);
        toast.success(res?.message || 'Article published successfully!');
        const createdId = res?.data?.id || res?.id || res?.data?.blog?.id;
        if (createdId) {
          navigate(`/blog/view/${createdId}`);
        } else {
          navigate('/blog');
        }
      }
    } catch (err) {
      console.error('Failed to save blog:', err);
      toast.error(err?.response?.data?.message || 'Failed to save blog article.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header title={isEditing ? 'Edit Blog Article' : 'New Blog Article'} />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#9E7432] mx-auto" />
              <p className="text-sm font-medium text-[#78716C]">Loading article details...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title={isEditing ? 'Edit Blog Article' : 'New Blog Article'} />

        <main className="flex-1 p-5 md:p-8 max-w-5xl w-full mx-auto space-y-6">
          
          {/* Breadcrumb & Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Link
                to="/blog"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2DDD5] bg-white hover:bg-[#F7F4EE] text-xs font-semibold text-[#4A443D] shadow-2xs transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Articles</span>
              </Link>
              <div className="flex items-center gap-1.5 text-xs text-[#9C9488]">
                <span>/</span>
                <Link to="/blog" className="hover:text-[#1A1817]">Blog</Link>
                <span>/</span>
                <span className="text-[#1A1817] font-medium truncate max-w-[200px]">
                  {isEditing ? (form.blog_title || 'Edit Article') : 'Create Article'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/blog')}
                className="px-4 py-2 rounded-xl border border-[#DDD7CD] bg-white hover:bg-[#F2EFEB] text-xs font-medium text-[#4A443D] transition shadow-2xs cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-xs font-semibold shadow-xs transition active:scale-95 disabled:bg-[#A39C91] cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#C99C4B]" />
                ) : (
                  <Save className="h-4 w-4 text-[#C99C4B]" />
                )}
                <span>{loading ? 'Saving...' : isEditing ? 'Update Article' : 'Publish Article'}</span>
              </button>
            </div>
          </div>

          {/* Form Header Card */}
          <div className="bg-white rounded-2xl border border-[#E8E3DA] p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-[#1A1817] tracking-tight">
                    {isEditing ? 'Edit Blog Article' : 'Create New Blog Article'}
                  </h1>
                  <p className="text-xs text-[#78716C] mt-0.5">
                    {isEditing
                      ? 'Modify content, replace banner images, and optimize SEO tags.'
                      : 'Draft a new blog post with rich text formatting and metadata.'}
                  </p>
                </div>
              </div>

              {/* Status pill preview */}
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                  form.blog_status === 'Active'
                    ? 'bg-[#EDF7EE] text-[#1E6B34] border-[#C6E6CC]'
                    : 'bg-[#FDF0F0] text-[#9A2D2D] border-[#F6C8C8]'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${form.blog_status === 'Active' ? 'bg-[#1E6B34]' : 'bg-[#9A2D2D]'}`} />
                  <span>{form.blog_status === 'Active' ? 'Active' : 'Inactive'}</span>
                </span>
              </div>
            </div>

            {/* Tab navigation */}
            <div className="flex items-center gap-2 mt-6 pt-4 border-t border-[#E8E3DA]">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`pb-2 px-3 text-xs font-medium transition cursor-pointer border-b-2 ${
                  activeTab === 'general'
                    ? 'border-[#1A1817] text-[#1A1817] font-semibold'
                    : 'border-transparent text-[#78716C] hover:text-[#1A1817]'
                }`}
              >
                1. General & Content
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('media')}
                className={`pb-2 px-3 text-xs font-medium transition cursor-pointer border-b-2 ${
                  activeTab === 'media'
                    ? 'border-[#1A1817] text-[#1A1817] font-semibold'
                    : 'border-transparent text-[#78716C] hover:text-[#1A1817]'
                }`}
              >
                2. Banner Image
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('seo')}
                className={`pb-2 px-3 text-xs font-medium transition cursor-pointer border-b-2 ${
                  activeTab === 'seo'
                    ? 'border-[#1A1817] text-[#1A1817] font-semibold'
                    : 'border-transparent text-[#78716C] hover:text-[#1A1817]'
                }`}
              >
                3. SEO & Publishing
              </button>
            </div>
          </div>

          {/* Form Content Sections */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* TAB 1: General & Content */}
            {activeTab === 'general' && (
              <div className="bg-white rounded-2xl border border-[#E8E3DA] p-6 shadow-2xs space-y-5">
                <h3 className="text-sm font-bold text-[#1A1817] pb-3 border-b border-[#F0ECE3] flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#9E7432]" />
                  <span>Article Details & Copy</span>
                </h3>

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                    Article Title <span className="text-[#9A2D2D]">*</span>
                  </label>
                  <input
                    ref={titleInputRef}
                    type="text"
                    name="blog_title"
                    value={form.blog_title}
                    onChange={handleChange}
                    placeholder="e.g. Top 10 Luxury Wedding Card Trends of 2026..."
                    className={`w-full px-4 py-2.5 text-sm rounded-xl border ${
                      errors.blog_title ? 'border-[#E05252] bg-[#FFF5F5] ring-1 ring-[#E05252]' : 'border-[#E2DDD5] bg-[#FAF8F5]'
                    } text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs`}
                  />
                  {errors.blog_title && (
                    <p className="mt-1 text-xs text-[#E05252] flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.blog_title}
                    </p>
                  )}
                </div>

                {/* Slug and Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#9C9488] font-mono">/</span>
                      <input
                        ref={slugInputRef}
                        type="text"
                        name="blog_slug"
                        value={form.blog_slug}
                        onChange={(e) => {
                          setManualSlug(true);
                          handleChange(e);
                        }}
                        placeholder="top-10-luxury-wedding-cards"
                        className={`w-full pl-6 pr-4 py-2.5 text-sm rounded-xl border ${
                          errors.blog_slug ? 'border-[#E05252] bg-[#FFF5F5] ring-1 ring-[#E05252]' : 'border-[#E2DDD5] bg-[#FAF8F5]'
                        } text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs font-mono`}
                      />
                    </div>
                    {errors.blog_slug && (
                      <p className="mt-1 text-xs text-[#E05252] flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.blog_slug}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                      Article Category
                    </label>
                    <select
                      name="blog_categories_ids"
                      value={form.blog_categories_ids}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs cursor-pointer"
                    >
                      <option value="">Select Category...</option>
                      {categories.map((cat) => {
                        const catId = cat.id;
                        const name = cat.category_name || cat.categories || cat.name || `Category #${catId}`;
                        return (
                          <option key={catId} value={catId}>
                            {name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Excerpt */}
                <div>
                  <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                    Short Summary / Excerpt
                  </label>
                  <textarea
                    name="blog_short_description"
                    rows={2}
                    value={form.blog_short_description}
                    onChange={handleChange}
                    placeholder="Brief synopsis displayed on card previews, search results, and header meta tags..."
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs resize-none"
                  />
                </div>

                {/* Rich text editor body */}
                <div>
                  <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                    Full Article Body <span className="text-[#9A2D2D]">*</span>
                  </label>
                  <RichTextEditor
                    value={form.blog_description}
                    onChange={(htmlContent) => {
                      setForm((prev) => ({ ...prev, blog_description: htmlContent }));
                      if (errors.blog_description) {
                        setErrors((prev) => ({ ...prev, blog_description: false }));
                      }
                    }}
                    placeholder="Write and format the full content of your article here..."
                    minHeight="350px"
                  />
                  {errors.blog_description && (
                    <p className="text-[11px] text-[#E05252] mt-1 font-medium">{errors.blog_description}</p>
                  )}
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('media')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-xs font-semibold transition cursor-pointer"
                  >
                    <span>Next: Banner Image</span>
                    <ChevronRight className="h-3.5 w-3.5 text-[#C99C4B]" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Media */}
            {activeTab === 'media' && (
              <div className="bg-white rounded-2xl border border-[#E8E3DA] p-6 shadow-2xs space-y-5">
                <h3 className="text-sm font-bold text-[#1A1817] pb-3 border-b border-[#F0ECE3] flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-[#9E7432]" />
                  <span>Banner Image & Artwork</span>
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                    Banner Cover Image
                  </label>
                  <div className="border-2 border-dashed border-[#E2DDD5] rounded-2xl p-8 text-center bg-[#FAF8F5] hover:bg-[#F5F2EB] transition relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    />
                    {previewImage ? (
                      <div className="space-y-3">
                        <img
                          src={previewImage}
                          alt="Banner Preview"
                          className="h-56 w-full max-w-lg mx-auto object-cover rounded-xl border border-[#E8E3DA] shadow-xs"
                        />
                        <p className="text-xs text-[#8C6527] font-medium">
                          Click or drag a new image file to replace this banner
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 py-6">
                        <div className="h-14 w-14 rounded-2xl bg-white border border-[#E2DDD5] flex items-center justify-center mx-auto text-[#9C9488] shadow-2xs">
                          <Upload className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#1A1817]">Upload Article Banner</p>
                          <p className="text-xs text-[#8C8275] mt-1">Recommended size: 1200 x 630 px</p>
                        </div>
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
                    value={form.blog_banner_image_alt}
                    onChange={handleChange}
                    placeholder="e.g. Luxurious gold embossed wedding invitations..."
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs"
                  />
                  <p className="text-[11px] text-[#8C8275] mt-1">Improves accessibility for screen readers and search ranking.</p>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('general')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#DDD7CD] bg-white hover:bg-[#F2EFEB] text-xs font-semibold text-[#4A443D] transition cursor-pointer shadow-2xs"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back: Content</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('seo')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-xs font-semibold transition cursor-pointer"
                  >
                    <span>Next: SEO & Publishing</span>
                    <ChevronRight className="h-3.5 w-3.5 text-[#C99C4B]" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: SEO & Visibility */}
            {activeTab === 'seo' && (
              <div className="bg-white rounded-2xl border border-[#E8E3DA] p-6 shadow-2xs space-y-5">
                <h3 className="text-sm font-bold text-[#1A1817] pb-3 border-b border-[#F0ECE3] flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[#9E7432]" />
                  <span>SEO Metadata & Visibility Configuration</span>
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                    Meta Keywords (SEO)
                  </label>
                  <input
                    type="text"
                    name="blog_meta_keywords"
                    value={form.blog_meta_keywords}
                    onChange={handleChange}
                    placeholder="e.g. wedding cards, luxury stationery, invites 2026..."
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs"
                  />
                  <p className="text-[11px] text-[#8C8275] mt-1">Comma-separated keywords for search engine indexing.</p>
                </div>

                <div className={isEditing ? 'grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1' : 'pt-1'}>
                  {isEditing && (
                    <div>
                      <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                        Status
                      </label>
                      <select
                        name="blog_status"
                        value={form.blog_status || 'Active'}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs cursor-pointer"
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
                      value={String(form.blog_index)}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs cursor-pointer"
                    >
                      <option value="1">Index</option>
                      <option value="0">No-Index</option>
                    </select>
                  </div>
                </div>

                {/* Featured and Homepage Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <label className="flex items-center gap-3.5 p-4 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] cursor-pointer hover:bg-[#F5F2EB] transition">
                    <input
                      type="checkbox"
                      name="blog_featured"
                      checked={String(form.blog_featured) === '1' || form.blog_featured === true || form.blog_featured === 'Active'}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-[#DDD7CD] text-[#1A1817] focus:ring-[#C99C4B] cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                        <span className="font-semibold text-xs text-[#1A1817]">Featured Article</span>
                      </div>
                      <span className="text-xs text-[#8C8275] block mt-0.5">Showcase this post in the spotlight carousel</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3.5 p-4 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] cursor-pointer hover:bg-[#F5F2EB] transition">
                    <input
                      type="checkbox"
                      name="blog_front"
                      checked={String(form.blog_front) === '1' || form.blog_front === true || form.blog_front === 'Active'}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-[#DDD7CD] text-[#1A1817] focus:ring-[#C99C4B] cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Home className="h-3.5 w-3.5 text-indigo-600" />
                        <span className="font-semibold text-xs text-[#1A1817]">Show on Homepage</span>
                      </div>
                      <span className="text-xs text-[#8C8275] block mt-0.5">Feature on the marketing landing page</span>
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#F0ECE3]">
                  <button
                    type="button"
                    onClick={() => setActiveTab('media')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#DDD7CD] bg-white hover:bg-[#F2EFEB] text-xs font-semibold text-[#4A443D] transition cursor-pointer shadow-2xs"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back: Media</span>
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-xs font-semibold shadow-xs transition active:scale-95 disabled:bg-[#A39C91] cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[#C99C4B]" />
                    ) : (
                      <Save className="h-4 w-4 text-[#C99C4B]" />
                    )}
                    <span>{loading ? 'Saving...' : isEditing ? 'Update Article' : 'Publish Article'}</span>
                  </button>
                </div>
              </div>
            )}

          </form>

        </main>
      </div>
    </div>
  );
}
