import React, { useState, useEffect } from 'react';
import { X, Workflow, Plus, Trash2, Save, AlertCircle, Clock, LayoutTemplate, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { deletePipelineSub } from '../../services/pipelineApi';
import { getActiveTemplates, getTemplates } from '../../services/templateApi';

const emptySubStep = (index = 1) => ({
  pipeline_sub_name: `Step ${index} - Automated Message`,
  pipeline_sub_template_id: '',
  pipeline_sub_time: index === 1 ? 0 : (index - 1) * 2,
  pipeline_sub_status: 'Active',
});

function extractList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.templates?.data)) return response.templates.data;
  if (Array.isArray(response?.templates)) return response.templates;
  return [];
}

const timingPresets = [
  'Immediate',
  '1 Hour',
  '6 Hours',
  '1 Day',
  '2 Days',
  '3 Days',
  '5 Days',
  '7 Days',
  '14 Days',
  '30 Days',
];

export default function PipelineModal({
  isOpen,
  onClose,
  onSubmit,
  form,
  setForm,
  editingId,
  submitting,
}) {
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [deletingSubId, setDeletingSubId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      if (!form.subs || form.subs.length === 0) {
        setForm((prev) => ({
          ...prev,
          subs: [emptySubStep(1)],
        }));
      }

      // Fetch templates for dropdown selection (filter WhatsApp only)
      (async () => {
        try {
          let list = [];
          try {
            const res = await getActiveTemplates('WhatsApp');
            list = extractList(res);
          } catch {
            const res = await getTemplates({ per_page: 100 });
            list = extractList(res);
          }
          const whatsappOnly = list.filter(
            (tpl) => String(tpl.template_type || tpl.type || '').trim().toLowerCase() === 'whatsapp'
          );
          setAvailableTemplates(whatsappOnly.length > 0 ? whatsappOnly : list);
        } catch (err) {
          // Fallback
        }
      })();
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
      subs: [...prev.subs, emptySubStep(prev.subs.length + 1)],
    }));
  };

  const handleRemoveSub = async (index) => {
    const targetSub = form.subs[index];

    if (targetSub?.id) {
      if (form.subs.length <= 1) {
        toast.error('A pipeline must have at least one stage/step.');
        return;
      }

      if (!window.confirm('Are you sure you want to remove this step from the pipeline?')) {
        return;
      }

      try {
        setDeletingSubId(targetSub.id);
        await deletePipelineSub(targetSub.id);
        toast.success('Pipeline step deleted successfully.');
      } catch (err) {
        toast.error('Failed to delete pipeline step.');
        setDeletingSubId(null);
        return;
      } finally {
        setDeletingSubId(null);
      }
    }

    setForm((prev) => {
      const nextSubs = prev.subs.filter((_, i) => i !== index);
      return {
        ...prev,
        subs: nextSubs.length > 0 ? nextSubs : [emptySubStep(1)],
      };
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.pipeline_name?.trim()) {
      setErrorMsg('Please enter a pipeline name.');
      return;
    }

    const invalidSub = (form.subs || []).find((s) => !s.pipeline_sub_name?.trim());
    if (invalidSub) {
      setErrorMsg('Please give a title/name to all steps in the pipeline.');
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
      <div className="w-full max-w-2xl rounded-2xl border border-[#E8E3DA] bg-[#FCFBFA] shadow-2xl relative my-auto flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E3DA] bg-[#FAF8F5] rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] flex items-center justify-center flex-shrink-0">
              <Workflow className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-[#1A1817] tracking-tight">
                {editingId ? 'Edit Marketing Pipeline' : 'Create Marketing Pipeline'}
              </h3>
              <p className="text-xs text-[#78716C]">
                {editingId ? 'Configure sequence steps, template triggers, and delays' : 'Set up multi-step automated drip campaign sequences'}
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

        {/* Scrollable Form */}
        <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FDF0F0] border border-[#F6C8C8] text-[#9A2D2D] text-xs">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Pipeline Header Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-[#FAF8F5] p-4 rounded-xl border border-[#E8E3DA]">
              <div className={editingId ? 'sm:col-span-2' : 'sm:col-span-3'}>
                <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                  Pipeline Name <span className="text-[#9A2D2D]">*</span>
                </label>
                <input
                  type="text"
                  value={form.pipeline_name || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, pipeline_name: e.target.value }))}
                  placeholder="e.g. Wedding Cards Drip Sequence, New Lead Onboarding"
                  required
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-[#E2DDD5] bg-white text-[#1A1817] focus:outline-none focus:border-[#C99C4B] transition shadow-2xs"
                />
              </div>

              {editingId && (
                <div>
                  <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                    Pipeline Status
                  </label>
                  <select
                    value={form.pipeline_status || 'Active'}
                    onChange={(e) => setForm((prev) => ({ ...prev, pipeline_status: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2DDD5] bg-white text-[#1A1817] focus:outline-none focus:border-[#C99C4B] transition shadow-2xs cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              )}
            </div>

            {/* Steps & Stages List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#1A1817] uppercase tracking-wider">
                    Automation Steps ({form.subs?.length || 0})
                  </h4>
                  <p className="text-[11px] text-[#8C8275]">Configure the sequence of messages and delays</p>
                </div>

                <button
                  type="button"
                  onClick={handleAddSub}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DDD7CD] bg-[#FAF8F5] hover:bg-[#EFECE6] text-xs font-semibold text-[#4A443D] transition shadow-2xs cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 text-[#9E7432]" />
                  <span>Add Step</span>
                </button>
              </div>

              {/* Step Cards */}
              <div className="space-y-3.5">
                {(form.subs || []).map((sub, index) => (
                  <div
                    key={sub.id || index}
                    className="p-4 rounded-xl border border-[#E8E3DA] bg-white shadow-2xs space-y-3 relative"
                  >
                    {/* Step Card Header */}
                    <div className="flex items-center justify-between border-b border-[#F0ECE3] pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1A1817] text-[#FAF8F5] font-mono text-[11px] font-bold">
                          {index + 1}
                        </span>
                        <span className="text-xs font-bold text-[#1A1817]">
                          Stage #{index + 1}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {editingId && (
                          <select
                            value={sub.pipeline_sub_status || 'Active'}
                            onChange={(e) => handleSubChange(index, 'pipeline_sub_status', e.target.value)}
                            className="px-2 py-0.5 text-[11px] rounded-md border border-[#E2DDD5] bg-[#FAF8F5] text-[#5C554B] cursor-pointer"
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveSub(index)}
                          disabled={deletingSubId === sub.id}
                          title="Remove Step"
                          className="p-1 rounded-md text-[#8C8275] hover:text-[#9A2D2D] hover:bg-[#FDF0F0] transition cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Step Name */}
                    <div>
                      <label className="block text-xs font-semibold text-[#3D372E] mb-1">
                        Step Name / Title <span className="text-[#9A2D2D]">*</span>
                      </label>
                      <input
                        type="text"
                        value={sub.pipeline_sub_name || ''}
                        onChange={(e) => handleSubChange(index, 'pipeline_sub_name', e.target.value)}
                        placeholder="e.g. Day 0 - Welcome & Catalog Intro"
                        required
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] transition shadow-2xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Template Selector */}
                      <div>
                        <label className="block text-xs font-semibold text-[#3D372E] mb-1">
                          WhatsApp Template <span className="text-[#9A2D2D]">*</span>
                        </label>
                        <select
                          value={sub.pipeline_sub_template_id || ''}
                          onChange={(e) => handleSubChange(index, 'pipeline_sub_template_id', e.target.value)}
                          required
                          className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2DDD5] bg-white text-[#1A1817] focus:outline-none focus:border-[#C99C4B] transition shadow-2xs cursor-pointer"
                        >
                          <option value="">-- Select WhatsApp Template --</option>
                          {availableTemplates.map((tpl) => {
                            const templateName = tpl.template_name || tpl.name || tpl.template_id || String(tpl.id);
                            return (
                              <option key={tpl.id || templateName} value={templateName}>
                                {templateName}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* Trigger Timing / Delay (Integer Days) */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-[#3D372E]">
                            Trigger Delay in Days
                          </label>
                          <span className="text-[10px] text-[#8C8275]">0 = Immediate</span>
                        </div>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9C9488]" />
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={sub.pipeline_sub_time !== undefined && sub.pipeline_sub_time !== null ? sub.pipeline_sub_time : 0}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                              handleSubChange(index, 'pipeline_sub_time', isNaN(val) ? 0 : val);
                            }}
                            placeholder="0 for Immediate, 1 for 1 Day..."
                            className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-[#E2DDD5] bg-white text-[#1A1817] focus:outline-none focus:border-[#C99C4B] transition shadow-2xs"
                          />
                        </div>

                        {/* Timing preset chips */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {[
                            { label: 'Immediate (0d)', value: 0 },
                            { label: '1 Day', value: 1 },
                            { label: '3 Days', value: 3 },
                            { label: '7 Days', value: 7 },
                            { label: '14 Days', value: 14 },
                          ].map((preset) => (
                            <button
                              key={preset.value}
                              type="button"
                              onClick={() => handleSubChange(index, 'pipeline_sub_time', preset.value)}
                              className={`text-[10px] px-2 py-0.5 rounded border transition cursor-pointer font-medium ${
                                Number(sub.pipeline_sub_time) === preset.value
                                  ? 'bg-[#1A1817] text-[#FAF8F5] border-[#1A1817]'
                                  : 'bg-[#FAF8F5] border-[#E2DDD5] text-[#5C554B] hover:bg-[#F5EFE3]'
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
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
                <span>Add Another Sequence Step</span>
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
              <span>{submitting ? 'Saving...' : editingId ? 'Update Pipeline' : 'Create Pipeline'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
