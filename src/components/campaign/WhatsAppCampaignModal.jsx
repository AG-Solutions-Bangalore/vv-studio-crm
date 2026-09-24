import React, { useState, useEffect } from 'react';
import { X, Send, MessageSquare, Calendar, Workflow, Boxes, Save, AlertCircle, Check, ShieldAlert } from 'lucide-react';
import { getActivePipelines } from '../../services/pipelineApi';
import { getActiveGroups } from '../../services/groupApi';

function extractList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.pipelines?.data)) return response.pipelines.data;
  if (Array.isArray(response?.pipelines)) return response.pipelines;
  if (Array.isArray(response?.groups?.data)) return response.groups.data;
  if (Array.isArray(response?.groups)) return response.groups;
  return [];
}

export default function WhatsAppCampaignModal({
  isOpen,
  onClose,
  onSubmit,
  form,
  setForm,
  editingId,
  submitting,
}) {
  const [pipelines, setPipelines] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Today's date string in YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      (async () => {
        setLoadingOptions(true);
        try {
          const [pipesRes, groupsRes] = await Promise.all([
            getActivePipelines().catch(() => []),
            getActiveGroups().catch(() => []),
          ]);
          setPipelines(extractList(pipesRes));
          setGroups(extractList(groupsRes));
        } catch (err) {
          // Fallback
        } finally {
          setLoadingOptions(false);
        }
      })();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleGroupSelection = (groupId) => {
    const numId = Number(groupId);
    setForm((prev) => {
      let current = [];
      if (Array.isArray(prev.whats_app_campaign_group)) {
        current = prev.whats_app_campaign_group;
      } else if (typeof prev.whats_app_campaign_group === 'string' && prev.whats_app_campaign_group.trim()) {
        current = prev.whats_app_campaign_group.split(',').map((s) => Number(s.trim()) || s.trim());
      }
      const exists = current.includes(numId) || current.includes(String(groupId));
      const nextGroups = exists
        ? current.filter((id) => id !== numId && id !== String(groupId))
        : [...current, numId];
      return { ...prev, whats_app_campaign_group: nextGroups };
    });
  };

  const isGroupSelected = (groupId) => {
    const current = prevGroupArray(form.whats_app_campaign_group);
    return current.includes(Number(groupId)) || current.includes(String(groupId));
  };

  function prevGroupArray(val) {
    if (Array.isArray(val)) return val.map((v) => Number(v) || v);
    if (typeof val === 'string' && val.trim()) {
      return val.split(',').map((v) => Number(v.trim()) || v.trim());
    }
    return [];
  }

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.whats_app_campaign_name?.trim()) {
      setErrorMsg('Please enter a WhatsApp campaign name.');
      return;
    }
    if (!form.whats_app_campaign_pipeline_id) {
      setErrorMsg('Please select an automation pipeline.');
      return;
    }
    if (!form.whats_app_campaign_date) {
      setErrorMsg('Please schedule a campaign launch date.');
      return;
    }
    if (form.whats_app_campaign_date < todayStr) {
      setErrorMsg('Campaign date cannot be in the past. Please select today or a future date.');
      return;
    }
    const selectedGroupCount = prevGroupArray(form.whats_app_campaign_group).length;
    if (selectedGroupCount === 0) {
      setErrorMsg('Please select at least one target customer group.');
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
      <div className="w-full max-w-lg rounded-2xl border border-[#E8E3DA] bg-[#FCFBFA] shadow-2xl relative my-auto flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E3DA] bg-[#FAF8F5] rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#EBF7EE] text-[#1E7E34] border border-[#C3E6CB] flex items-center justify-center flex-shrink-0">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-[#1A1817] tracking-tight">
                {editingId ? 'Edit WhatsApp Campaign' : 'Create WhatsApp Campaign'}
              </h3>
              <p className="text-xs text-[#78716C]">
                {editingId ? 'Update scheduled broadcast settings' : 'Schedule automated WhatsApp broadcasts to target audience groups'}
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

        <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FDF0F0] border border-[#F6C8C8] text-[#9A2D2D] text-xs">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Campaign Name */}
          <div>
            <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
              Campaign Name <span className="text-[#9A2D2D]">*</span>
            </label>
            <input
              type="text"
              name="whats_app_campaign_name"
              value={form.whats_app_campaign_name || ''}
              onChange={handleInputChange}
              placeholder="e.g. Luxury Wedding Invitation Launch 2026"
              required
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs"
            />
          </div>

          {/* Pipeline Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-[#3D372E] mb-1.5 flex items-center justify-between">
              <span>Automation Pipeline <span className="text-[#9A2D2D]">*</span></span>
              {loadingOptions && <span className="text-[10px] text-[#8C8275]">Loading pipelines...</span>}
            </label>
            <div className="relative">
              <Workflow className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9C9488]" />
              <select
                name="whats_app_campaign_pipeline_id"
                value={form.whats_app_campaign_pipeline_id || ''}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs cursor-pointer"
              >
                <option value="">-- Select Active Pipeline --</option>
                {pipelines.map((pipe) => (
                  <option key={pipe.id} value={pipe.id}>
                    {pipe.pipeline_name || pipe.name} (#{pipe.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Schedule Date */}
          <div>
            <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
              Launch / Schedule Date <span className="text-[#9A2D2D]">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9C9488]" />
              <input
                type="date"
                name="whats_app_campaign_date"
                min={todayStr}
                value={form.whats_app_campaign_date || todayStr}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs"
              />
            </div>
          </div>

          {/* Target Groups Multi-Select */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#3D372E] flex items-center gap-1">
                <Boxes className="h-3.5 w-3.5 text-[#9E7432]" />
                <span>Target Customer Groups <span className="text-[#9A2D2D]">*</span></span>
              </label>
              <span className="text-[11px] text-[#8C8275]">
                {prevGroupArray(form.whats_app_campaign_group).length} selected
              </span>
            </div>

            <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E3DA] min-h-[60px] max-h-36 overflow-y-auto">
              {loadingOptions ? (
                <p className="text-xs text-[#8C8275] py-2 text-center">Loading groups...</p>
              ) : groups.length === 0 ? (
                <p className="text-xs text-[#8C8275] py-2 text-center">No active customer groups found.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {groups.map((group) => {
                    const selected = isGroupSelected(group.id);
                    const groupName = group.group_name || group.name;

                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => toggleGroupSelection(group.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                          selected
                            ? 'bg-[#1A1817] text-[#FAF8F5] shadow-xs'
                            : 'bg-white text-[#4A443D] border border-[#DDD7CD] hover:bg-[#EFECE6]'
                        }`}
                      >
                        {selected && <Check className="h-3 w-3 text-[#C99C4B]" />}
                        <span>{groupName}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Holiday Setting */}
          <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E8E3DA]">
            <label className="block text-xs font-semibold text-[#3D372E] mb-1">
              Skip Broadcast on Official Holidays?
            </label>
            <p className="text-[11px] text-[#8C8275] mb-2.5">
              If enabled, messages will automatically pause on days marked in the holiday calendar.
            </p>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-[#1A1817] cursor-pointer">
                <input
                  type="radio"
                  name="whats_app_campaign_holiday"
                  value="Yes"
                  checked={(form.whats_app_campaign_holiday || 'Yes') === 'Yes'}
                  onChange={handleInputChange}
                  className="accent-[#1A1817]"
                />
                <span>Yes</span>
              </label>

              <label className="inline-flex items-center gap-2 text-xs font-medium text-[#1A1817] cursor-pointer">
                <input
                  type="radio"
                  name="whats_app_campaign_holiday"
                  value="No"
                  checked={form.whats_app_campaign_holiday === 'No'}
                  onChange={handleInputChange}
                  className="accent-[#1A1817]"
                />
                <span>No</span>
              </label>
            </div>
          </div>

          {/* Status (Editing mode) */}
          {editingId && (
            <div>
              <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                Campaign Status
              </label>
              <select
                name="whats_app_campaign_status"
                value={form.whats_app_campaign_status || 'Pending'}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs cursor-pointer"
              >
                <option value="Pending">Pending</option>
                <option value="Sent">Sent</option>
                <option value="Hold">Hold</option>
              </select>
            </div>
          )}

          </div>

          {/* Sticky Footer */}
          <div className="px-6 py-3.5 bg-[#FAF8F5] border-t border-[#E8E3DA] flex items-center justify-end gap-3 rounded-b-2xl flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#DDD7CD] bg-white hover:bg-[#EFECE6] text-xs font-medium text-[#4A443D] transition cursor-pointer shadow-2xs"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-xs font-semibold shadow-xs transition active:scale-95 disabled:bg-[#A39C91] cursor-pointer"
            >
              <Save className="h-3.5 w-3.5 text-[#C99C4B]" />
              <span>{submitting ? 'Scheduling...' : editingId ? 'Update Campaign' : 'Schedule Campaign'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
