import React, { useState, useEffect } from 'react';
import { X, HelpCircle, Plus, Trash2, Save, AlertCircle, GripVertical, ChevronDown, RefreshCw, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { deleteFaqSub } from '../../services/faqApi';
import { getPageTwoList } from '../../services/pageTwoApi';
import { useAuthContext } from '../../context/AuthContext';

const emptySubItem = (index = 1, faq_for = '') => ({
  faq_sort: String(index),
  faq_for: faq_for,
  faq_heading: '',
  faq_que: '',
  faq_ans: '',
  faq_status: 'Active',
});

export default function FaqModal({
  isOpen,
  onClose,
  onSubmit,
  form,
  setForm,
  editingId,
  submitting,
}) {
  const { isAdmin } = useAuthContext();
  const [deletingSubId, setDeletingSubId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [pages, setPages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setErrorMsg('');
    if (!form.subs || form.subs.length === 0) {
      setForm((prev) => ({
        ...prev,
        subs: [emptySubItem(1, prev.faq_for || '')],
      }));
    }

    let isMounted = true;
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

        if (isMounted) {
          setPages(formatted);
        }
      } catch (err) {
        console.error('Failed to load pageTwo list for FAQ:', err);
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

  const handleFaqForChange = (e) => {
    const val = e.target.value;
    setForm((prev) => ({
      ...prev,
      faq_for: val,
      subs: (prev.subs || []).map((s) => ({ ...s, faq_for: val })),
    }));
  };

  const handleSelectPage = (val) => {
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
      toast.error('A FAQ group must have at least one question.');
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
            ? 'This will permanently remove the question from the server.'
            : 'This will remove the unsaved question from this form.'}
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

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.faq_for?.trim()) {
      setErrorMsg('Please select a target page/category for this FAQ group.');
      return;
    }

    const invalidSub = (form.subs || []).find((s) => !s.faq_que?.trim() || !s.faq_ans?.trim());
    if (invalidSub) {
      setErrorMsg('Please fill in both Question and Answer for all entries.');
      return;
    }

    onSubmit(e);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-[#E8E3DA] bg-[#FCFBFA] shadow-2xl relative my-6 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E3DA] bg-[#FAF8F5] rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] flex items-center justify-center">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-[#1A1817] tracking-tight">
                {editingId ? 'Edit FAQ Group' : 'Create FAQ Group'}
              </h3>
              <p className="text-xs text-[#78716C]">
                {editingId ? 'Update category and questions & answers' : 'Group related questions and answers for your customers'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8C8275] hover:text-[#1A1817] hover:bg-[#EFECE6] transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FDF0F0] border border-[#F6C8C8] text-[#9A2D2D] text-xs">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Parent FAQ Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-[#FAF8F5] p-4 rounded-xl border border-[#E8E3DA]">
              <div className={editingId ? 'sm:col-span-2' : 'sm:col-span-3'}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#3D372E]">
                    FAQ Category / Section (faq_for) <span className="text-[#9A2D2D]">*</span>
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
                    value={form.faq_for || ''}
                    onChange={handleFaqForChange}
                    required
                    className="w-full pl-9 pr-9 py-2 text-xs rounded-lg border border-[#E2DDD5] bg-white text-[#1A1817] focus:outline-none focus:border-[#C99C4B] transition shadow-2xs cursor-pointer appearance-none"
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

              {editingId && (
                <div>
                  <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                    Group Status
                  </label>
                  <select
                    value={form.faq_status || 'Active'}
                    onChange={(e) => setForm((prev) => ({ ...prev, faq_status: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2DDD5] bg-white text-[#1A1817] focus:outline-none focus:border-[#C99C4B] transition shadow-2xs cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              )}
            </div>

            {/* Questions & Answers Sub-Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#1A1817] uppercase tracking-wider">
                    Questions & Answers ({form.subs?.length || 0})
                  </h4>
                  <p className="text-[11px] text-[#8C8275]">Add Q&A pairs for this FAQ topic</p>
                </div>

                <button
                  type="button"
                  onClick={handleAddSub}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DDD7CD] bg-[#FAF8F5] hover:bg-[#EFECE6] text-xs font-semibold text-[#4A443D] transition shadow-2xs cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 text-[#9E7432]" />
                  <span>Add Question</span>
                </button>
              </div>

              {/* Sub Items List */}
              <div className="space-y-3.5">
                {(form.subs || []).map((sub, index) => (
                  <div
                    key={sub.id || index}
                    className="p-4 rounded-xl border border-[#E8E3DA] bg-white shadow-2xs relative space-y-3"
                  >
                    {/* Sub Item Header */}
                    <div className="flex items-center justify-between border-b border-[#F0ECE3] pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FBF4E8] text-[#9E7432] font-mono text-[11px] font-bold">
                          {index + 1}
                        </span>
                        <span className="text-xs font-medium text-[#78716C]">
                          Question #{index + 1}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {editingId && (
                          <select
                            value={sub.faq_status || 'Active'}
                            onChange={(e) => handleSubChange(index, 'faq_status', e.target.value)}
                            className="px-2 py-0.5 text-[11px] rounded-md border border-[#E2DDD5] bg-[#FAF8F5] text-[#5C554B] cursor-pointer"
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
                              title="Remove Question"
                              className="p-1 rounded-md text-[#8C8275] hover:text-[#9A2D2D] hover:bg-[#FDF0F0] transition cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              title="At least 1 question is required"
                              className="p-1 rounded-md text-[#CDC6BA] cursor-not-allowed opacity-40"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Optional Section Heading */}
                    <div>
                      <label className="block text-[11px] font-medium text-[#78716C] mb-1">
                        Optional Subsection Heading
                      </label>
                      <input
                        type="text"
                        value={sub.faq_heading || ''}
                        onChange={(e) => handleSubChange(index, 'faq_heading', e.target.value)}
                        placeholder="Enter subsection heading"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] transition"
                      />
                    </div>

                    {/* Question (faq_que) */}
                    <div>
                      <label className="block text-xs font-semibold text-[#3D372E] mb-1">
                        Question <span className="text-[#9A2D2D]">*</span>
                      </label>
                      <input
                        type="text"
                        value={sub.faq_que || ''}
                        onChange={(e) => handleSubChange(index, 'faq_que', e.target.value)}
                        placeholder="Enter question..."
                        required
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2DDD5] bg-white text-[#1A1817] focus:outline-none focus:border-[#C99C4B] transition shadow-2xs"
                      />
                    </div>

                    {/* Answer (faq_ans) */}
                    <div>
                      <label className="block text-xs font-semibold text-[#3D372E] mb-1">
                        Answer <span className="text-[#9A2D2D]">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={sub.faq_ans || ''}
                        onChange={(e) => handleSubChange(index, 'faq_ans', e.target.value)}
                        placeholder="Enter detailed answer..."
                        required
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2DDD5] bg-white text-[#1A1817] focus:outline-none focus:border-[#C99C4B] transition shadow-2xs resize-y"
                      />
                    </div>

                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddSub}
                className="w-full py-2.5 rounded-xl border border-dashed border-[#DDD7CD] hover:border-[#C99C4B] hover:bg-[#FBF7EE] text-xs font-semibold text-[#78716C] hover:text-[#9E7432] transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Another Question</span>
              </button>
            </div>

          </div>

          {/* Modal Footer */}
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
              <span>{submitting ? 'Saving...' : editingId ? 'Update FAQ Group' : 'Create FAQ Group'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
