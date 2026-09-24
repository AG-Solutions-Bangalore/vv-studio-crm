import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import SearchableSelect from '../components/common/SearchableSelect';
import {
  Quote,
  Save,
  ArrowLeft,
  Loader2,
  Star,
  User,
  Tag,
  AlertCircle,
} from 'lucide-react';
import {
  getTestimonialById,
  createTestimonial,
  updateTestimonial,
} from '../services/testimonialApi';
import { getPageOneList } from '../services/pageOneApi';
import toast from 'react-hot-toast';

const ratingLabels = {
  1: '1 - Poor',
  2: '2 - Fair',
  3: '3 - Good',
  4: '4 - Very Good',
  5: '5 - Excellent',
};

const initialForm = {
  testimonial_for: '',
  testimonial_client_name: '',
  testimonial_description: '',
  testimonial_rating: '5',
  testimonial_status: 'Active',
};

export default function TestimonialFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [form, setForm] = useState(initialForm);
  const [pages, setPages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadPages();
    if (isEditing) {
      loadTestimonialDetails(id);
    }
  }, [id, isEditing]);

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

      setPages(formatted);
    } catch (err) {
      console.error('Failed to load target page list for testimonial (pageOne):', err);
    } finally {
      setLoadingPages(false);
    }
  };

  const loadTestimonialDetails = async (testimonialId) => {
    setFetchingData(true);
    try {
      const res = await getTestimonialById(testimonialId);
      const data = res?.data || res?.testimonial || res || {};

      setForm({
        testimonial_for: data?.testimonial_for || data?.category || '',
        testimonial_client_name: data?.testimonial_client_name || data?.client_name || data?.name || '',
        testimonial_description: data?.testimonial_description || data?.description || data?.comment || '',
        testimonial_rating: String(data?.testimonial_rating || data?.rating || '5'),
        testimonial_status: data?.testimonial_status || data?.status || 'Active',
      });
    } catch (err) {
      console.error('Failed to load testimonial details:', err);
      toast.error('Could not load testimonial details.');
      navigate('/testimonial');
    } finally {
      setFetchingData(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRatingClick = (ratingValue) => {
    setForm((prev) => ({ ...prev, testimonial_rating: String(ratingValue) }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.testimonial_client_name?.trim()) {
      newErrors.testimonial_client_name = 'Client or customer name is required.';
    }
    if (!form.testimonial_for?.trim()) {
      newErrors.testimonial_for = 'Please select a target page / category.';
    }
    if (!form.testimonial_description?.trim()) {
      newErrors.testimonial_description = 'Review or feedback description is required.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fill in all required fields.');
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
        const res = await updateTestimonial(id, form);
        toast.success(res?.message || 'Testimonial updated successfully!');
        navigate('/testimonial');
      } else {
        const res = await createTestimonial(form);
        toast.success(res?.message || 'Testimonial created successfully!');
        navigate('/testimonial');
      }
    } catch (err) {
      console.error('Failed to save testimonial:', err);
      toast.error(err?.response?.data?.message || 'Failed to save testimonial.');
    } finally {
      setLoading(false);
    }
  };

  const currentRating = Number(form.testimonial_rating) || 5;
  const activeRatingDisplay = hoverRating || currentRating;

  if (fetchingData) {
    return (
      <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header title={isEditing ? 'Edit Testimonial' : 'New Testimonial'} />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#9E7432] mx-auto" />
              <p className="text-sm font-medium text-[#78716C]">Loading testimonial details...</p>
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
        <Header title={isEditing ? 'Edit Testimonial' : 'New Testimonial'} />

        <main className="flex-1 p-5 md:p-8 max-w-4xl w-full mx-auto space-y-6">
          
          {/* Breadcrumb & Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Link
                to="/testimonial"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2DDD5] bg-white hover:bg-[#F7F4EE] text-xs font-semibold text-[#4A443D] shadow-2xs transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Testimonials</span>
              </Link>
              <div className="flex items-center gap-1.5 text-xs text-[#9C9488]">
                <span>/</span>
                <Link to="/testimonial" className="hover:text-[#1A1817]">Testimonial</Link>
                <span>/</span>
                <span className="text-[#1A1817] font-medium truncate max-w-[200px]">
                  {isEditing ? (form.testimonial_client_name || 'Edit Review') : 'Create Review'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/testimonial')}
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
                <span>{loading ? 'Saving...' : isEditing ? 'Update Review' : 'Save Testimonial'}</span>
              </button>
            </div>
          </div>

          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-[#E8E3DA] p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <Quote className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-[#1A1817] tracking-tight">
                    {isEditing ? 'Edit Client Testimonial' : 'Add Client Testimonial'}
                  </h1>
                  <p className="text-xs text-[#78716C] mt-0.5">
                    {isEditing
                      ? 'Update customer feedback, rating score, and page association.'
                      : 'Record verified customer review and associate it with a specific page.'}
                  </p>
                </div>
              </div>

              {/* Status Preview */}
              {isEditing && (
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                    form.testimonial_status === 'Active'
                      ? 'bg-[#EDF7EE] text-[#1E6B34] border-[#C6E6CC]'
                      : 'bg-[#FDF0F0] text-[#9A2D2D] border-[#F6C8C8]'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${form.testimonial_status === 'Active' ? 'bg-[#1E6B34]' : 'bg-[#9A2D2D]'}`} />
                    <span>{form.testimonial_status === 'Active' ? 'Active' : 'Inactive'}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-6 shadow-2xs space-y-5">
              
              {/* Client Name & Target Page */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Client Name */}
                <div>
                  <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                    Client / Customer Name <span className="text-[#9A2D2D]">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9C9488] pointer-events-none" />
                    <input
                      type="text"
                      name="testimonial_client_name"
                      value={form.testimonial_client_name || ''}
                      onChange={handleInputChange}
                      placeholder="e.g. John Doe, Sarah Jenkins..."
                      className={`w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border ${
                        errors.testimonial_client_name ? 'border-[#E05252] bg-[#FFF5F5] ring-1 ring-[#E05252]' : 'border-[#E2DDD5] bg-[#FAF8F5]'
                      } text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs`}
                    />
                  </div>
                  {errors.testimonial_client_name && (
                    <p className="mt-1 text-xs text-[#E05252] flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.testimonial_client_name}
                    </p>
                  )}
                </div>

                {/* Searchable Target Page Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                    Target Page / Category <span className="text-[#9A2D2D]">*</span>
                  </label>
                  <SearchableSelect
                    options={pages}
                    value={form.testimonial_for}
                    onChange={(val) => {
                      if (errors.testimonial_for) {
                        setErrors((prev) => ({ ...prev, testimonial_for: false }));
                      }
                      setForm((prev) => ({ ...prev, testimonial_for: val }));
                    }}
                    placeholder="Select Target Page"
                    loading={loadingPages}
                    icon={Tag}
                    error={Boolean(errors.testimonial_for)}
                  />
                  {errors.testimonial_for && (
                    <p className="mt-1 text-xs text-[#E05252] flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.testimonial_for}
                    </p>
                  )}
                </div>
              </div>

              {/* Star Rating Selector */}
              <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E8E3DA]">
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-semibold text-[#3D372E]">
                    Star Rating <span className="text-[#9A2D2D]">*</span>
                  </label>
                  <span className="text-xs font-bold text-[#9E7432] bg-white px-2.5 py-1 rounded-lg border border-[#E2DDD5] shadow-2xs">
                    {ratingLabels[activeRatingDisplay] || `${activeRatingDisplay} Stars`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingClick(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 rounded-lg transition transform hover:scale-115 cursor-pointer focus:outline-none"
                    >
                      <Star
                        className={`h-7 w-7 transition-colors ${
                          star <= (hoverRating || currentRating)
                            ? 'fill-[#D4A038] text-[#D4A038]'
                            : 'text-[#DDD7CD] fill-transparent'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review / Feedback */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#3D372E]">
                    Review / Feedback Description <span className="text-[#9A2D2D]">*</span>
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
                  placeholder="Enter detailed client review, feedback, or testimonial quote..."
                  className={`w-full px-4 py-3 text-xs sm:text-sm rounded-xl border ${
                    errors.testimonial_description ? 'border-[#E05252] bg-[#FFF5F5] ring-1 ring-[#E05252]' : 'border-[#E2DDD5] bg-[#FAF8F5]'
                  } text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs resize-y`}
                />
                {errors.testimonial_description && (
                  <p className="mt-1 text-xs text-[#E05252] flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.testimonial_description}
                  </p>
                )}
              </div>

              {/* Status Selector (Editing Mode) */}
              {isEditing && (
                <div>
                  <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                    Publication Status
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

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => navigate('/testimonial')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#DDD7CD] bg-white hover:bg-[#F2EFEB] text-xs font-semibold text-[#4A443D] transition shadow-2xs cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Testimonials</span>
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
                <span>{loading ? 'Saving...' : isEditing ? 'Update Review' : 'Save Testimonial'}</span>
              </button>
            </div>

          </form>

        </main>
      </div>
    </div>
  );
}
