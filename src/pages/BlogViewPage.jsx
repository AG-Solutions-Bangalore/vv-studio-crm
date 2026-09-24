import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import {
  FileText,
  Edit2,
  Trash2,
  Loader2,
  ArrowLeft,
  Calendar,
  Tag,
  Star,
  Home,
  Globe,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ImageIcon,
  Share2,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  getBlogById,
  deleteBlog,
  updateBlogStatus,
} from '../services/blogApi';
import { getActiveCategories } from '../services/categoryApi';
import { getAssetBaseURL } from '../services/api';
import { useAuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

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

export default function BlogViewPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAdmin } = useAuthContext();

  const [blog, setBlog] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [imageBaseUrl, setImageBaseUrl] = useState(() => getAssetBaseURL('/assets/images/blog_images/'));

  const fetchBlogDetails = async () => {
    setLoading(true);
    try {
      const [res, catRes] = await Promise.allSettled([
        getBlogById(id),
        getActiveCategories(),
      ]);

      if (catRes.status === 'fulfilled') {
        const catList = catRes.value?.data?.data || catRes.value?.data || catRes.value?.categories || catRes.value || [];
        if (Array.isArray(catList)) setCategories(catList);
      }

      if (res.status === 'fulfilled') {
        const data = res.value?.data?.data || res.value?.data || res.value?.blog || res.value || {};
        setBlog(data);

        if (Array.isArray(res.value?.image_url)) {
          const blogImg = res.value.image_url.find((img) => img.image_for?.toLowerCase() === 'blog');
          if (blogImg?.image_url) {
            setImageBaseUrl(blogImg.image_url);
          }
        }
      } else {
        toast.error('Failed to load article details.');
      }
    } catch (err) {
      console.error('Error fetching blog overview:', err);
      toast.error('Could not load article overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogDetails();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!blog) return;
    const currentStatus = blog.blog_status || blog.status || 'Active';
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';

    setTogglingStatus(true);
    try {
      await updateBlogStatus(id, nextStatus);
      setBlog((prev) => ({ ...prev, blog_status: nextStatus, status: nextStatus }));
      toast.success(`Article marked as ${nextStatus}.`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to update status.');
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteBlog(id);
      toast.success('Blog article deleted successfully.');
      navigate('/blog');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete article.');
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header title="Blog Article Overview" />
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

  if (!blog) {
    return (
      <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header title="Blog Article Overview" />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="bg-white p-8 rounded-2xl border border-[#E8E3DA] text-center max-w-md shadow-2xs space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h2 className="text-base font-bold text-[#1A1817]">Article Not Found</h2>
              <p className="text-xs text-[#78716C]">
                The requested blog post could not be loaded or may have been removed.
              </p>
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A1817] text-[#FAF8F5] text-xs font-semibold hover:bg-[#2C2825] transition"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Articles</span>
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const title = blog.blog_title || blog.blog_meta_title || blog.title || blog.name || 'Untitled Article';
  const slug = blog.blog_slug || blog.slug || blog.url_slug || '—';
  const rawImg = blog.blog_banner_image || blog.banner_image || blog.image || blog.blog_image || blog.banner_image_url || blog.photo || blog.file_name;
  const image = resolveImageUrl(rawImg, imageBaseUrl);
  const status = blog.blog_status || blog.status || 'Active';
  const isActive = status === 'Active';
  const isFeatured = String(blog.blog_featured) === '1' || blog.blog_featured === 'Active' || blog.blog_featured === true;
  const isFront = String(blog.blog_front) === '1' || blog.blog_front === 'Active' || blog.blog_front === true;
  const isIndexed = String(blog.blog_index ?? '1') === '1';
  const altText = blog.blog_banner_image_alt || blog.banner_image_alt || blog.alt_text || 'Banner image';
  const keywords = blog.blog_meta_keywords || blog.meta_keywords || '';
  const shortDesc = blog.blog_short_description || blog.short_description || blog.excerpt || '';
  const fullContent = blog.blog_description || blog.description || blog.content || '';

  const catId = blog.blog_categories_ids || blog.category_id || blog.categories_id;
  const matchedCategory = categories.find((c) => String(c.id) === String(catId));
  const categoryName = matchedCategory?.category_name || matchedCategory?.name || (catId ? `Category #${catId}` : 'Uncategorized');

  const createdDate = formatDate(blog.blog_created_date || blog.created_at || blog.createdDate || blog.date);
  const updatedDate = formatDate(blog.blog_updated_date || blog.updated_at || blog.updatedDate);

  return (
    <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Blog Article Overview" />

        <main className="flex-1 p-5 md:p-8 max-w-6xl w-full mx-auto space-y-6">
          
          {/* Top Bar Navigation & Actions */}
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
                <span className="text-[#1A1817] font-medium truncate max-w-[220px]">{title}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchBlogDetails}
                title="Refresh Details"
                className="p-2 rounded-xl border border-[#E2DDD5] bg-white hover:bg-[#F7F4EE] text-[#4A443D] transition shadow-2xs cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => navigate(`/blog/edit/${id}`)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#DDD7CD] bg-white hover:bg-[#F2EFEB] text-xs font-semibold text-[#1A1817] transition shadow-2xs cursor-pointer"
              >
                <Edit2 className="h-3.5 w-3.5 text-[#9E7432]" />
                <span>Edit Article</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => setDeleteModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#F6C8C8] bg-[#FFF5F5] hover:bg-[#FBE4E4] text-xs font-semibold text-[#9A2D2D] transition shadow-2xs cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Columns: Article Header, Banner, Excerpt, Content */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Article Hero Card */}
              <div className="bg-white rounded-2xl border border-[#E8E3DA] p-6 shadow-2xs space-y-4">
                
                {/* Badges and Category */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9]">
                      <Tag className="h-3 w-3" />
                      <span>{categoryName}</span>
                    </span>
                  </div>

                  {/* Status Toggle Button */}
                  <button
                    onClick={handleToggleStatus}
                    disabled={togglingStatus}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${
                      isActive
                        ? 'bg-[#EDF7EE] text-[#1E6B34] border-[#C6E6CC] hover:bg-[#DFF0E1]'
                        : 'bg-[#FDF0F0] text-[#9A2D2D] border-[#F6C8C8] hover:bg-[#FBE4E4]'
                    }`}
                  >
                    {togglingStatus ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-[#1E6B34]' : 'bg-[#9A2D2D]'}`} />
                    )}
                    <span>{isActive ? 'Active' : 'Inactive'}</span>
                  </button>
                </div>

                {/* Article Title */}
                <h1 className="text-xl md:text-2xl font-bold text-[#1A1817] tracking-tight leading-snug">
                  {title}
                </h1>

                {/* Metadata row */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-[#78716C] pt-2 border-t border-[#F0ECE3]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[#9C9488]" />
                    <span>Published: {createdDate}</span>
                  </div>
                  {updatedDate && updatedDate !== '—' && (
                    <div className="flex items-center gap-1.5">
                      <span>•</span>
                      <span>Updated: {updatedDate}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 font-mono text-[#8C6527]">
                    <span>•</span>
                    <span>/{slug}</span>
                  </div>
                </div>

                {/* Banner Image */}
                {image ? (
                  <div className="rounded-xl overflow-hidden border border-[#E8E3DA] bg-[#FAF8F5]">
                    <img
                      src={image}
                      alt={altText}
                      className="w-full h-auto max-h-[380px] object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    {altText && (
                      <div className="px-3.5 py-1.5 bg-[#FAF8F5] text-[11px] text-[#78716C] border-t border-[#E8E3DA]">
                        <span className="font-semibold text-[#4A443D]">Alt Text: </span>
                        {altText}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-44 rounded-xl bg-[#FAF8F5] border border-dashed border-[#E2DDD5] flex flex-col items-center justify-center text-[#9C9488] gap-2">
                    <ImageIcon className="h-8 w-8 text-[#CDC6BA]" />
                    <span className="text-xs">No banner image uploaded</span>
                  </div>
                )}

                {/* Excerpt / Summary */}
                {shortDesc && (
                  <div className="bg-[#FAF8F5] border-l-4 border-[#C99C4B] p-4 rounded-r-xl">
                    <p className="text-xs md:text-sm italic text-[#4A443D] leading-relaxed">
                      "{shortDesc}"
                    </p>
                  </div>
                )}
              </div>

              {/* Full Article Body */}
              <div className="bg-white rounded-2xl border border-[#E8E3DA] p-6 md:p-8 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-[#1A1817] pb-3 border-b border-[#F0ECE3] flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#9E7432]" />
                  <span>Article Body</span>
                </h3>

                {fullContent ? (
                  <div
                    className="prose prose-sm max-w-none text-[#2C2825] leading-relaxed space-y-4"
                    dangerouslySetInnerHTML={{ __html: fullContent }}
                  />
                ) : (
                  <p className="text-xs text-[#9C9488] py-8 text-center italic">
                    No article body content written yet.
                  </p>
                )}
              </div>

            </div>

            {/* Right 1 Column: Metadata & SEO Sidebar */}
            <div className="space-y-6">
              
              {/* Quick Details Card */}
              <div className="bg-white rounded-2xl border border-[#E8E3DA] p-5 shadow-2xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#78716C]">
                  Article Metadata
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-2 border-b border-[#F0ECE3]">
                    <span className="text-[#78716C]">ID</span>
                    <span className="font-mono font-semibold text-[#1A1817]">#{id}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-[#F0ECE3]">
                    <span className="text-[#78716C]">Category</span>
                    <span className="font-semibold text-[#1A1817]">{categoryName}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-[#F0ECE3]">
                    <span className="text-[#78716C]">Status</span>
                    <span className={`font-semibold ${isActive ? 'text-[#1E6B34]' : 'text-[#9A2D2D]'}`}>
                      {status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-[#F0ECE3]">
                    <span className="text-[#78716C]">Search Index</span>
                    <span className="font-medium text-[#1A1817]">
                      {isIndexed ? 'Indexed (Google Visible)' : 'No-Index'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-[#F0ECE3]">
                    <span className="text-[#78716C]">Featured Post</span>
                    <span className="font-medium text-[#1A1817]">
                      {isFeatured ? 'Yes' : 'No'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-[#F0ECE3]">
                    <span className="text-[#78716C]">Show on Home</span>
                    <span className="font-medium text-[#1A1817]">
                      {isFront ? 'Yes' : 'No'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2">
                    <span className="text-[#78716C]">Created Date</span>
                    <span className="font-medium text-[#1A1817]">{createdDate}</span>
                  </div>
                </div>
              </div>

              {/* SEO & Search Engine Preview */}
              <div className="bg-white rounded-2xl border border-[#E8E3DA] p-5 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#78716C]">
                  <Globe className="h-3.5 w-3.5 text-[#9E7432]" />
                  <span>SEO Preview</span>
                </div>

                {/* Google Search Snippet preview */}
                <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E8E3DA] space-y-1">
                  <div className="text-[11px] text-[#5F6368] truncate">
                    easemarketing.in &gt; blog &gt; {slug}
                  </div>
                  <div className="text-xs font-semibold text-[#1a0dab] line-clamp-1 hover:underline cursor-pointer">
                    {title}
                  </div>
                  <p className="text-[11px] text-[#4d5156] line-clamp-2 leading-tight">
                    {shortDesc || 'No meta description provided for this blog article.'}
                  </p>
                </div>

                {keywords && (
                  <div className="pt-2">
                    <span className="text-[11px] font-semibold text-[#78716C] block mb-1.5">
                      Meta Keywords
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {keywords.split(',').map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E2DDD5] text-[10px] text-[#4A443D]"
                        >
                          {kw.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>

        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-[#E8E3DA] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1A1817]">Delete Blog Article</h3>
                <p className="text-xs text-[#78716C]">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-[#4A443D] bg-[#FAF8F5] p-3 rounded-xl border border-[#E8E3DA]">
              Are you sure you want to permanently delete <strong className="text-[#1A1817]">"{title}"</strong>?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#DDD7CD] bg-white hover:bg-[#F2EFEB] text-xs font-medium text-[#4A443D] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#9A2D2D] hover:bg-[#802424] text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:bg-[#C98B8B]"
              >
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                <span>{deleting ? 'Deleting...' : 'Delete Article'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
