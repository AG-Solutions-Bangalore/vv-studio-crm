import React, { useState, useEffect } from 'react';
import { X, Star, Quote, Save, User, Tag, AlertCircle, RefreshCw, ChevronDown } from 'lucide-react';
import { getPageOneList } from '../../services/pageOneApi';

const ratingLabels = {
  1: '1 - Poor',
  2: '2 - Fair',
  3: '3 - Good',
  4: '4 - Very Good',
  5: '5 - Excellent',
};

export default function TestimonialModal({
  isOpen,
  onClose,
  onSubmit,
  form,
  setForm,
  editingId,
  submitting,
}) {
  const [hoverRating, setHoverRating] = useState(0);
  const [pages, setPages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadPages = async () => {
      setLoadingPages(true);
      try {
        const res = await getPageOneList();
        const rawList = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.pages)
              ? res.pages
              : Array.isArray(res?.page_one)
                ? res.page_one
                : Array.isArray(res)
                  ? res
                  : [];

        const formatted = rawList
          .map((p) => {
            const url = p.page_one_url || p.page_url || p.url || p.slug || p.page || '';
            const name = p.page_one_name || p.page_name || p.name || p.title || p.page_one_url || url;
            return { url: String(url).trim(), name: String(name).trim() };
          })
          .filter((p) => p.url.length > 0);

        if (isMounted) {
          setPages(formatted);
        }
      } catch (err) {
        console.error('Failed to load pageOne list:', err);
      } finally {
        if (isMounted) setLoadingPages(false);
      }
    };

    loadPages();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRatingClick = (ratingValue) => {
    setForm((prev) => ({ ...prev, testimonial_rating: String(ratingValue) }));
  };

  const handlePageSelect = (pageUrl) => {
    setForm((prev) => ({ ...prev, testimonial_for: pageUrl }));
  };

  const currentRating = Number(form.testimonial_rating) || 5;
  const activeRatingDisplay = hoverRating || currentRating;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fade-in overflow-y-auto"
    >
      <div className="w-full max-w-lg rounded-2xl border border-[#E8E3DA] bg-[#FCFBFA] shadow-2xl relative my-auto flex flex-col max-h-[90vh] overflow-hidden">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E3DA] bg-[#FAF8F5] rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] flex items-center justify-center flex-shrink-0">
              <Quote className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-[#1A1817] tracking-tight">
                {editingId ? 'Edit Testimonial' : 'Add Client Testimonial'}
              </h3>
              <p className="text-xs text-[#78716C]">
                {editingId ? 'Update client review and visibility status' : 'Add a verified client review linked to a page'}
              </p>
            </div>
          </div>

          {/* Prominent Visible Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-[#78716C] hover:text-[#1A1817] hover:bg-[#EFECE6] border border-[#E2DDD5] bg-white transition cursor-pointer shadow-2xs flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-4 flex-1">

            {/* Client Name */}
            <div>
              <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                Client / Customer Name <span className="text-[#9A2D2D]">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9C9488]" />
                <input
                  type="text"
                  name="testimonial_client_name"
                  value={form.testimonial_client_name || ''}
                  onChange={handleInputChange}
                  placeholder="Enter client or customer name"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs"
                />
              </div>
            </div>

            {/* Testimonial For (Dropdown populated from pageOne API) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#3D372E]">
                  Target Page / Category <span className="text-[#9A2D2D]">*</span>
                </label>
                {loadingPages && (
                  <span className="text-[11px] text-[#9E7432] flex items-center gap-1">
                    <RefreshCw className="h-3 w-3 animate-spin" /> Loading pages...
                  </span>
                )}
              </div>

              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9C9488] pointer-events-none" />
                <select
                  name="testimonial_for"
                  value={form.testimonial_for || ''}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-9 pr-9 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs cursor-pointer appearance-none"
                >
                  <option value="" disabled>
                    {loadingPages ? 'Loading available pages...' : 'Select Page'}
                  </option>
                  {pages.map((p) => (
                    <option key={p.url} value={p.url}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9C9488] pointer-events-none" />
              </div>
            </div>

            {/* Interactive Star Rating */}
            <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E8E3DA]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-[#3D372E]">
                  Star Rating <span className="text-[#9A2D2D]">*</span>
                </label>
                <span className="text-xs font-bold text-[#9E7432] bg-[#FBF4E8] px-2 py-0.5 rounded border border-[#F2E4C9]">
                  {ratingLabels[activeRatingDisplay] || `${activeRatingDisplay} Stars`}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 rounded-md transition transform hover:scale-115 cursor-pointer focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 transition-colors ${star <= (hoverRating || currentRating)
                          ? 'fill-[#D4A038] text-[#D4A038]'
                          : 'text-[#DDD7CD] fill-transparent'
                        }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Testimonial Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#3D372E]">
                  Review / Feedback <span className="text-[#9A2D2D]">*</span>
                </label>
                <span className="text-[11px] text-[#8C8275]">
                  {form.testimonial_description?.length || 0} characters
                </span>
              </div>
              <textarea
                name="testimonial_description"
                rows={4}
                value={form.testimonial_description || ''}
                onChange={handleInputChange}
                placeholder="Enter review or client feedback..."
                required
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs resize-y"
              />
            </div>

            {/* Status selector (Editing mode) */}
            {editingId && (
              <div>
                <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                  Display Status
                </label>
                <select
                  name="testimonial_status"
                  value={form.testimonial_status || 'Active'}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            )}

          </div>

          {/* Modal Footer (Sticky at bottom) */}
          <div className="px-6 py-3.5 bg-[#FAF8F5] border-t border-[#E8E3DA] flex items-center justify-end gap-3 rounded-b-2xl flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#DDD7CD] bg-white hover:bg-[#EFECE6] text-xs font-medium text-[#4A443D] transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-xs font-semibold shadow-xs transition active:scale-95 disabled:bg-[#A39C91] cursor-pointer"
            >
              <Save className="h-3.5 w-3.5 text-[#C99C4B]" />
              <span>{submitting ? 'Saving...' : editingId ? 'Update Review' : 'Save Testimonial'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
