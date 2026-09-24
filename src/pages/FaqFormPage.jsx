import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import SearchableSelect from '../components/common/SearchableSelect';
import {
  HelpCircle,
  Save,
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  AlertCircle,
  Tag,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import {
  getFaqById,
  createFaq,
  updateFaq,
  deleteFaqSub,
} from '../services/faqApi';
import { getPageTwoList } from '../services/pageTwoApi';
import { useAuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const emptySubItem = (index = 1, faq_for = '') => ({
  faq_sort: String(index),
  faq_for: faq_for,
  faq_heading: '',
  faq_que: '',
  faq_ans: '',
  faq_status: 'Active',
});

const initialForm = {
  faq_for: '',
  faq_status: 'Active',
  subs: [emptySubItem(1, '')],
};

export default function FaqFormPage() {
  const { isAdmin } = useAuthContext();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [form, setForm] = useState(initialForm);
  const [pages, setPages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [deletingSubId, setDeletingSubId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadPages();
    if (isEditing) {
      loadFaqDetails(id);
    }
  }, [id, isEditing]);

  const loadPages = async () => {
    setLoadingPages(true);
    try {
      const res = await getPageTwoList();
      const rawList = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.pages)
            ? res.pages
            : Array.isArray(res?.page_two)
              ? res.page_two
              : Array.isArray(res)
                ? res
                : [];

      const formatted = rawList
        .map((p) => {
          const url = p.page_two_url || p.page_url || p.url || p.slug || p.page || '';
          const name = p.page_two_name || p.page_name || p.name || p.title || p.page_two_url || url;
          return { url: String(url).trim(), name: String(name).trim() };
        })
        .filter((p) => p.url.length > 0);

      setPages(formatted);
    } catch (err) {
      console.error('Failed to load pageTwo list for FAQ:', err);
    } finally {
      setLoadingPages(false);
    }
  };

  const loadFaqDetails = async (faqId) => {
    setFetchingData(true);
    try {
      const res = await getFaqById(faqId);
      const data = res?.data || res?.faq || res || {};

      const parentFaqFor = data?.faq_for || data?.category || data?.title || '';
      const rawSubs = data?.subs || data?.sub || data?.faq_subs || data?.items || [];

      const formattedSubs = Array.isArray(rawSubs) && rawSubs.length > 0
        ? rawSubs.map((s, idx) => ({
          id: s.id,
          faq_sort: String(s.faq_sort ?? idx + 1),
          faq_for: s.faq_for || parentFaqFor,
          faq_heading: s.faq_heading || '',
          faq_que: s.faq_que || '',
          faq_ans: s.faq_ans || '',
          faq_status: (s.faq_status === 0 || s.faq_status === '0' || String(s.faq_status).toLowerCase() === 'inactive') ? 'Inactive' : 'Active',
        }))
        : [emptySubItem(1, parentFaqFor)];

      setForm({
        faq_for: parentFaqFor,
        faq_status: data?.faq_status || data?.status || 'Active',
        subs: formattedSubs,
      });
    } catch (err) {
      console.error('Failed to load FAQ details:', err);
      toast.error('Could not load FAQ details.');
      navigate('/faq');
    } finally {
      setFetchingData(false);
    }
  };

  const handleFaqForChange = (e) => {
    const val = e.target.value;
    setForm((prev) => ({
      ...prev,
      faq_for: val,
      subs: (prev.subs || []).map((s) => ({ ...s, faq_for: val })),
    }));
  };

  const handleSubChange = (index, field, value) => {
    setForm((prev) => {
      const nextSubs = [...prev.subs];
      nextSubs[index] = { ...nextSubs[index], [field]: value };
      return { ...prev, subs: nextSubs };
    });
  };

  const handleAddSub = () => {
    setForm((prev) => ({
      ...prev,
      subs: [
        ...prev.subs,
        emptySubItem(prev.subs.length + 1, prev.faq_for || ''),
      ],
    }));
  };

  const handleRemoveSub = (index) => {
    if ((form.subs || []).length <= 1) {
      toast.error('A FAQ topic must have at least one question. You cannot delete the only Q&A.');
      return;
    }

    const targetSub = form.subs[index];
    const questionLabel = targetSub.faq_que ? `"${targetSub.faq_que.slice(0, 35)}${targetSub.faq_que.length > 35 ? '...' : ''}"` : `Question #${index + 1}`;

    toast((t) => (
      <div className="flex flex-col gap-2 py-1 max-w-xs">
        <p className="text-xs font-semibold text-[#1A1817]">
          Do you really want to delete {questionLabel}?
        </p>
        <p className="text-[11px] text-[#78716C]">
          {targetSub?.id
            ? 'This will permanently delete this question from the server.'
            : 'This will remove the question from this form.'}
        </p>
        <div className="flex items-center justify-end gap-2 mt-1">
          <button
            type="button"
            onClick={() => toast.dismiss(t.id)}
            className="px-2.5 py-1 text-xs rounded-lg border border-[#DDD7CD] bg-white hover:bg-[#F2EFEB] text-[#4A443D] font-medium transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={async () => {
              toast.dismiss(t.id);
              if (targetSub?.id) {
                const toastId = toast.loading('Deleting question from server...');
                try {
                  setDeletingSubId(targetSub.id);
                  const res = await deleteFaqSub(targetSub.id);
                  toast.success(res?.message || 'Question deleted successfully.', { id: toastId });
                  setForm((prev) => {
                    const nextSubs = prev.subs.filter((_, i) => i !== index);
                    return {
                      ...prev,
                      subs: nextSubs.map((s, i) => ({ ...s, faq_sort: String(i + 1) })),
                    };
                  });
                } catch (err) {
                  const msg = err?.response?.data?.message || err?.message || 'Failed to delete question from server.';
                  toast.error(msg, { id: toastId });
                } finally {
                  setDeletingSubId(null);
                }
              } else {
                setForm((prev) => {
                  const nextSubs = prev.subs.filter((_, i) => i !== index);
                  return {
                    ...prev,
                    subs: nextSubs.map((s, i) => ({ ...s, faq_sort: String(i + 1) })),
                  };
                });
                toast.success('Question removed.');
              }
            }}
            className="px-2.5 py-1 text-xs rounded-lg bg-[#9A2D2D] hover:bg-[#802424] text-white font-semibold transition cursor-pointer shadow-xs"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    ), {
      duration: 8000,
      position: 'top-center',
    });
  };



  const validate = () => {
    setErrorMsg('');

    if (!form.faq_for?.trim()) {
      setErrorMsg('Please select a target page / category for this FAQ topic.');
      toast.error('Please select a target page.');
      return false;
    }

    const invalidSub = (form.subs || []).find((s) => !s.faq_que?.trim() || !s.faq_ans?.trim());
    if (invalidSub) {
      setErrorMsg('Please fill in both Question and Answer for all entries.');
      toast.error('Please fill in all Questions and Answers.');
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
        const res = await updateFaq(id, form);
        toast.success(res?.message || 'FAQ group updated successfully!');
        navigate('/faq');
      } else {
        const res = await createFaq(form);
        toast.success(res?.message || 'FAQ group created successfully!');
        navigate('/faq');
      }
    } catch (err) {
      console.error('Failed to save FAQ:', err);
      toast.error(err?.response?.data?.message || 'Failed to save FAQ group.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header title={isEditing ? 'Edit FAQ Topic' : 'New FAQ Topic'} />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#9E7432] mx-auto" />
              <p className="text-sm font-medium text-[#78716C]">Loading FAQ details...</p>
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
        <Header title={isEditing ? 'Edit FAQ Topic' : 'New FAQ Topic'} />

        <main className="flex-1 p-5 md:p-8 max-w-5xl w-full mx-auto space-y-6">

          {/* Breadcrumb & Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Link
                to="/faq"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2DDD5] bg-white hover:bg-[#F7F4EE] text-xs font-semibold text-[#4A443D] shadow-2xs transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to FAQs</span>
              </Link>
              <div className="flex items-center gap-1.5 text-xs text-[#9C9488]">
                <span>/</span>
                <Link to="/faq" className="hover:text-[#1A1817]">FAQ</Link>
                <span>/</span>
                <span className="text-[#1A1817] font-medium truncate max-w-[200px]">
                  {isEditing ? (form.faq_for || 'Edit FAQ') : 'Create FAQ'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/faq')}
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
                <span>{loading ? 'Saving...' : isEditing ? 'Update FAQ Group' : 'Save FAQ Group'}</span>
              </button>
            </div>
          </div>

          {/* Form Header Card */}
          <div className="bg-white rounded-2xl border border-[#E8E3DA] p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <HelpCircle className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-[#1A1817] tracking-tight">
                    {isEditing ? 'Edit FAQ Topic & Questions' : 'Create New FAQ Topic'}
                  </h1>
                  <p className="text-xs text-[#78716C] mt-0.5">
                    {isEditing
                      ? 'Update target page category and modify questions & answers.'
                      : 'Group related questions and answers for your customers and target page.'}
                  </p>
                </div>
              </div>

              {/* Status Preview */}
              {isEditing && (
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${form.faq_status === 'Active'
                      ? 'bg-[#EDF7EE] text-[#1E6B34] border-[#C6E6CC]'
                      : 'bg-[#FDF0F0] text-[#9A2D2D] border-[#F6C8C8]'
                    }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${form.faq_status === 'Active' ? 'bg-[#1E6B34]' : 'bg-[#9A2D2D]'}`} />
                    <span>{form.faq_status === 'Active' ? 'Active' : 'Inactive'}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {errorMsg && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-[#FDF0F0] border border-[#F6C8C8] text-[#9A2D2D] text-xs shadow-2xs">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Target Page / Category Selection Card */}
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-6 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-[#1A1817] pb-3 border-b border-[#F0ECE3] flex items-center gap-2">
                <Tag className="h-4 w-4 text-[#9E7432]" />
                <span>FAQ Topic & Category Assignment</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={isEditing ? 'sm:col-span-2' : 'sm:col-span-3'}>
                  <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                    Target Page / Category <span className="text-[#9A2D2D]">*</span>
                  </label>

                  <SearchableSelect
                    options={pages}
                    value={form.faq_for}
                    onChange={(val) => {
                      setForm((prev) => ({
                        ...prev,
                        faq_for: val,
                        subs: (prev.subs || []).map((s) => ({ ...s, faq_for: val })),
                      }));
                    }}
                    placeholder="Select Target Page"
                    loading={loadingPages}
                    icon={Tag}
                  />
                </div>

                {isEditing && (
                  <div>
                    <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                      Topic Status
                    </label>
                    <select
                      value={form.faq_status || 'Active'}
                      onChange={(e) => setForm((prev) => ({ ...prev, faq_status: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Questions and Answers Card */}
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-6 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#F0ECE3]">
                <div>
                  <h3 className="text-sm font-bold text-[#1A1817] flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-[#9E7432]" />
                    <span>Questions & Answers</span>
                  </h3>
                  <p className="text-xs text-[#8C8275] mt-0.5">
                    Define question and answer pairs belonging to this FAQ topic
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddSub}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#DDD7CD] bg-[#FAF8F5] hover:bg-[#EFECE6] text-xs font-semibold text-[#4A443D] transition shadow-2xs cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="h-3.5 w-3.5 text-[#9E7432]" />
                  <span>Add Question</span>
                </button>
              </div>

              {/* Sub items list */}
              <div className="space-y-4">
                {(form.subs || []).map((sub, index) => (
                  <div
                    key={sub.id || index}
                    className="p-4 sm:p-5 rounded-xl border border-[#E8E3DA] bg-[#FCFBFA] shadow-2xs relative space-y-3.5 hover:border-[#D8D2C6] transition"
                  >
                    {/* Item Header */}
                    <div className="flex items-center justify-between border-b border-[#F0ECE3] pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#FBF4E8] text-[#9E7432] font-mono text-xs font-bold border border-[#F2E4C9]">
                          Q{index + 1}
                        </span>
                        <span className="text-xs font-semibold text-[#1A1817]">
                          Question #{index + 1}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isEditing && (
                          <select
                            value={sub.faq_status || 'Active'}
                            onChange={(e) => handleSubChange(index, 'faq_status', e.target.value)}
                            className="px-2.5 py-1 text-xs rounded-lg border border-[#E2DDD5] bg-white text-[#5C554B] cursor-pointer shadow-2xs"
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        )}

                        {isAdmin && (
                          form.subs?.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => handleRemoveSub(index)}
                              disabled={deletingSubId === sub.id}
                              title="Delete this question"
                              className="p-1.5 rounded-lg text-[#8C8275] hover:text-[#9A2D2D] hover:bg-[#FDF0F0] border border-transparent hover:border-[#F6C8C8] transition cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toast.error('A FAQ topic must have at least 1 Q&A. You cannot delete the only question.')}
                              title="At least 1 Q&A is required (cannot delete)"
                              className="p-1.5 rounded-lg text-[#CDC6BA] hover:text-[#8C8275] border border-transparent cursor-not-allowed opacity-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Subsection Heading */}
                    <div>
                      <label className="block text-[11px] font-medium text-[#78716C] mb-1">
                        Optional Subsection Heading
                      </label>
                      <input
                        type="text"
                        value={sub.faq_heading || ''}
                        onChange={(e) => handleSubChange(index, 'faq_heading', e.target.value)}
                        placeholder="e.g. Orders & Shipping"
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E2DDD5] bg-white text-[#1A1817] focus:outline-none focus:border-[#C99C4B] transition shadow-2xs"
                      />
                    </div>

                    {/* Question Input */}
                    <div>
                      <label className="block text-xs font-semibold text-[#3D372E] mb-1">
                        Question <span className="text-[#9A2D2D]">*</span>
                      </label>
                      <input
                        type="text"
                        value={sub.faq_que || ''}
                        onChange={(e) => handleSubChange(index, 'faq_que', e.target.value)}
                        placeholder="e.g. What is the standard delivery timeline for customized invitations?"
                        required
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E2DDD5] bg-white text-[#1A1817] focus:outline-none focus:border-[#C99C4B] transition shadow-2xs"
                      />
                    </div>

                    {/* Answer Textarea */}
                    <div>
                      <label className="block text-xs font-semibold text-[#3D372E] mb-1">
                        Answer <span className="text-[#9A2D2D]">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={sub.faq_ans || ''}
                        onChange={(e) => handleSubChange(index, 'faq_ans', e.target.value)}
                        placeholder="Enter the detailed answer..."
                        required
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E2DDD5] bg-white text-[#1A1817] focus:outline-none focus:border-[#C99C4B] transition shadow-2xs resize-y"
                      />
                    </div>

                  </div>
                ))}
              </div>

              {/* Bottom Add Question Button */}
              <button
                type="button"
                onClick={handleAddSub}
                className="w-full py-3 rounded-xl border-2 border-dashed border-[#DDD7CD] hover:border-[#C99C4B] hover:bg-[#FBF7EE] text-xs font-semibold text-[#78716C] hover:text-[#9E7432] transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add Another Question</span>
              </button>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => navigate('/faq')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#DDD7CD] bg-white hover:bg-[#F2EFEB] text-xs font-semibold text-[#4A443D] transition shadow-2xs cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to FAQ List</span>
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
                <span>{loading ? 'Saving...' : isEditing ? 'Update FAQ Group' : 'Save FAQ Group'}</span>
              </button>
            </div>

          </form>

        </main>
      </div>
    </div>
  );
}
