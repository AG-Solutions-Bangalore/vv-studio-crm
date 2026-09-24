import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import {
  Workflow,
  Save,
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  AlertCircle,
  Clock,
  Layers,
  LayoutTemplate,
  CheckCircle2,
} from 'lucide-react';
import {
  getPipelineById,
  createPipeline,
  updatePipeline,
  deletePipelineSub,
} from '../services/pipelineApi';
import { getActiveTemplates, getTemplates } from '../services/templateApi';
import toast from 'react-hot-toast';

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

const initialForm = {
  pipeline_name: '',
  pipeline_status: 'Active',
  subs: [emptySubStep(1)],
};

export default function PipelineFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [form, setForm] = useState(initialForm);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [deletingSubId, setDeletingSubId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadTemplates();
    if (isEditing) {
      loadPipelineDetails(id);
    }
  }, [id, isEditing]);

  const loadTemplates = async () => {
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
      console.error('Failed to load WhatsApp templates:', err);
    }
  };

  const loadPipelineDetails = async (pipelineId) => {
    setFetchingData(true);
    try {
      const res = await getPipelineById(pipelineId);
      const data = res?.data?.pipeline || res?.data?.data || res?.data || res?.pipeline || res || {};

      const name = data?.pipeline_name || data?.name || data?.title || '';
      const rawSubs = data?.subs || data?.sub || data?.pipeline_subs || [];

      const formattedSubs = Array.isArray(rawSubs) && rawSubs.length > 0
        ? rawSubs.map((s, idx) => ({
            id: s.id,
            pipeline_sub_name: s.pipeline_sub_name || s.name || `Step ${idx + 1}`,
            pipeline_sub_template_id: s.pipeline_sub_template_id || s.template_id || '',
            pipeline_sub_time: s.pipeline_sub_time !== undefined && s.pipeline_sub_time !== null ? s.pipeline_sub_time : 0,
            pipeline_sub_status: (s.pipeline_sub_status === 0 || s.pipeline_sub_status === '0' || String(s.pipeline_sub_status).toLowerCase() === 'inactive') ? 'Inactive' : 'Active',
          }))
        : [emptySubStep(1)];

      setForm({
        pipeline_name: name,
        pipeline_status: data?.pipeline_status || data?.status || 'Active',
        subs: formattedSubs,
      });
    } catch (err) {
      console.error('Failed to load pipeline details:', err);
      toast.error('Could not load pipeline details.');
      navigate('/pipeline');
    } finally {
      setFetchingData(false);
    }
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
      subs: [...prev.subs, emptySubStep(prev.subs.length + 1)],
    }));
  };

  const handleRemoveSub = async (index) => {
    if ((form.subs || []).length <= 1) {
      toast.error('A pipeline must have at least one stage or step.');
      return;
    }

    const targetSub = form.subs[index];

    if (targetSub?.id) {
      if (!window.confirm('Are you sure you want to delete this pipeline step?')) {
        return;
      }

      try {
        setDeletingSubId(targetSub.id);
        await deletePipelineSub(targetSub.id);
        toast.success('Pipeline step deleted successfully.');
      } catch (err) {
        toast.error('Failed to delete pipeline step from server.');
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

  const validate = () => {
    setErrorMsg('');

    if (!form.pipeline_name?.trim()) {
      setErrorMsg('Please enter a pipeline name.');
      toast.error('Pipeline Name is required.');
      return false;
    }

    const invalidSub = (form.subs || []).find((s) => !s.pipeline_sub_name?.trim());
    if (invalidSub) {
      setErrorMsg('Please give a title/name to all steps in the pipeline.');
      toast.error('All steps must have a title.');
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
        const res = await updatePipeline(id, form);
        toast.success(res?.message || 'Pipeline updated successfully!');
      } else {
        const res = await createPipeline(form);
        toast.success(res?.message || 'Pipeline created successfully!');
      }
      navigate('/pipeline');
    } catch (err) {
      console.error('Failed to save pipeline:', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to save marketing pipeline.';
      toast.error(msg);
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header title={isEditing ? 'Edit Pipeline' : 'New Pipeline'} />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#9E7432] mx-auto" />
              <p className="text-sm font-medium text-[#78716C]">Loading pipeline configuration...</p>
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
        <Header title={isEditing ? 'Edit Marketing Pipeline' : 'Create Marketing Pipeline'} />

        <main className="flex-1 p-5 md:p-8 max-w-5xl w-full mx-auto space-y-6">
          
          {/* Top Bar Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Link
                to="/pipeline"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2DDD5] bg-white hover:bg-[#F7F4EE] text-xs font-semibold text-[#4A443D] shadow-2xs transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Pipelines</span>
              </Link>
              <div className="flex items-center gap-1.5 text-xs text-[#9C9488]">
                <span>/</span>
                <Link to="/pipeline" className="hover:text-[#1A1817]">Pipelines</Link>
                <span>/</span>
                <span className="text-[#1A1817] font-medium">
                  {isEditing ? `Edit: ${form.pipeline_name || 'Pipeline'}` : 'New Pipeline'}
                </span>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2.5 p-4 rounded-xl bg-[#FDF0F0] border border-[#F6C8C8] text-[#9A2D2D] text-xs shadow-2xs">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Section 1: Pipeline Overview Card */}
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-6 shadow-2xs space-y-5">
              <div className="flex items-center gap-2.5 pb-3 border-b border-[#F0ECE3]">
                <div className="h-9 w-9 rounded-xl bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] flex items-center justify-center">
                  <Workflow className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1A1817]">Pipeline Basic Information</h3>
                  <p className="text-xs text-[#8C8275]">Name and overall status of this marketing sequence</p>
                </div>
              </div>

              <div className={isEditing ? 'grid grid-cols-1 sm:grid-cols-3 gap-4' : 'space-y-4'}>
                <div className={isEditing ? 'sm:col-span-2' : ''}>
                  <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                    Pipeline Name <span className="text-[#9A2D2D]">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.pipeline_name || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, pipeline_name: e.target.value }))}
                    placeholder="e.g. Wedding Invitations Drip Sequence, New Customer Onboarding"
                    required
                    className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs"
                  />
                </div>

                {isEditing && (
                  <div>
                    <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                      Pipeline Status
                    </label>
                    <select
                      value={form.pipeline_status || 'Active'}
                      onChange={(e) => setForm((prev) => ({ ...prev, pipeline_status: e.target.value }))}
                      className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Stages & Sequence Steps Card */}
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-6 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F0ECE3]">
                <div>
                  <h3 className="text-sm font-bold text-[#1A1817] flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#9E7432]" />
                    <span>Automation Steps ({form.subs?.length || 0})</span>
                  </h3>
                  <p className="text-xs text-[#8C8275] mt-0.5">
                    Define the sequence of message templates and time delays in days
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddSub}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#DDD7CD] bg-[#FAF8F5] hover:bg-[#EFECE6] text-xs font-semibold text-[#4A443D] transition shadow-2xs cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="h-3.5 w-3.5 text-[#9E7432]" />
                  <span>Add Step</span>
                </button>
              </div>

              {/* Sub steps list */}
              <div className="space-y-4">
                {(form.subs || []).map((sub, index) => (
                  <div
                    key={sub.id || index}
                    className="p-4 sm:p-5 rounded-xl border border-[#E8E3DA] bg-[#FCFBFA] shadow-2xs relative space-y-3.5 hover:border-[#D8D2C6] transition"
                  >
                    {/* Item Header */}
                    <div className="flex items-center justify-between border-b border-[#F0ECE3] pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#1A1817] text-[#FAF8F5] font-mono text-xs font-bold shadow-2xs">
                          {index + 1}
                        </span>
                        <span className="text-xs font-bold text-[#1A1817]">
                          Stage #{index + 1}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isEditing && (
                          <select
                            value={sub.pipeline_sub_status || 'Active'}
                            onChange={(e) => handleSubChange(index, 'pipeline_sub_status', e.target.value)}
                            className="px-2.5 py-1 text-xs rounded-lg border border-[#E2DDD5] bg-white text-[#5C554B] cursor-pointer shadow-2xs"
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        )}

                        {form.subs?.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveSub(index)}
                            disabled={deletingSubId === sub.id}
                            title="Remove Step"
                            className="p-1.5 rounded-lg text-[#8C8275] hover:text-[#9A2D2D] hover:bg-[#FDF0F0] border border-transparent hover:border-[#F6C8C8] transition cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            title="At least 1 sequence step is required"
                            className="p-1.5 rounded-lg text-[#CDC6BA] border border-transparent cursor-not-allowed opacity-40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Step Title */}
                    <div>
                      <label className="block text-xs font-semibold text-[#3D372E] mb-1">
                        Step Name / Title <span className="text-[#9A2D2D]">*</span>
                      </label>
                      <input
                        type="text"
                        value={sub.pipeline_sub_name || ''}
                        onChange={(e) => handleSubChange(index, 'pipeline_sub_name', e.target.value)}
                        placeholder="e.g. Day 0 - Welcome & Introduction Message"
                        required
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E2DDD5] bg-white text-[#1A1817] focus:outline-none focus:border-[#C99C4B] transition shadow-2xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Campaign Template Selector */}
                      <div>
                        <label className="block text-xs font-semibold text-[#3D372E] mb-1">
                          WhatsApp Template <span className="text-[#9A2D2D]">*</span>
                        </label>
                        <select
                          value={sub.pipeline_sub_template_id || ''}
                          onChange={(e) => handleSubChange(index, 'pipeline_sub_template_id', e.target.value)}
                          required
                          className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E2DDD5] bg-white text-[#1A1817] focus:outline-none focus:border-[#C99C4B] transition shadow-2xs cursor-pointer"
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

                      {/* Trigger Timing / Delay in Days */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-[#3D372E]">
                            Trigger Delay in Days
                          </label>
                          <span className="text-[10px] text-[#8C8275]">0 = Immediate send</span>
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
                            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-[#E2DDD5] bg-white text-[#1A1817] focus:outline-none focus:border-[#C99C4B] transition shadow-2xs"
                          />
                        </div>

                        {/* Timing preset chips */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
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
                              className={`text-[10px] px-2.5 py-0.5 rounded-lg border transition cursor-pointer font-medium ${
                                Number(sub.pipeline_sub_time) === preset.value
                                  ? 'bg-[#1A1817] text-[#FAF8F5] border-[#1A1817]'
                                  : 'bg-white border-[#E2DDD5] text-[#5C554B] hover:bg-[#F5EFE3]'
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

              {/* Bottom Add Step Button */}
              <button
                type="button"
                onClick={handleAddSub}
                className="w-full py-3 rounded-xl border-2 border-dashed border-[#DDD7CD] hover:border-[#C99C4B] hover:bg-[#FBF7EE] text-xs font-semibold text-[#78716C] hover:text-[#9E7432] transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add Another Sequence Step</span>
              </button>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-between pt-2">
              <Link
                to="/pipeline"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#DDD7CD] bg-white hover:bg-[#F2EFEB] text-xs font-semibold text-[#4A443D] transition shadow-2xs"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Cancel</span>
              </Link>

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
                <span>{loading ? 'Saving Pipeline...' : isEditing ? 'Update Pipeline' : 'Create Pipeline'}</span>
              </button>
            </div>

          </form>

        </main>
      </div>
    </div>
  );
}
