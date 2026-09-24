import React, { useState, useEffect } from 'react';
import { X, Loader2, Mail, Calendar, Users, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import { getActiveTemplates, getTemplates } from '../../services/templateApi';
import { getActiveGroups, getGroups } from '../../services/groupApi';
import toast from 'react-hot-toast';

export default function EmailCampaignModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isEditing = false,
}) {
  const [formData, setFormData] = useState({
    email_campaign_name: '',
    email_campaign_template_id: '',
    email_campaign_date: '',
    email_campaign_holiday: 'Yes',
    email_campaign_group: [],
    email_campaign_subject: '',
    email_campaign_status: 'Pending',
  });

  const [loading, setLoading] = useState(false);
  const [fetchingOptions, setFetchingOptions] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [groups, setGroups] = useState([]);
  const [errors, setErrors] = useState({});

  // Minimum date today (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (isOpen) {
      loadSelectOptions();
      if (initialData) {
        // Parse group IDs if comma-separated or array
        let grpArr = [];
        if (Array.isArray(initialData.email_campaign_group)) {
          grpArr = initialData.email_campaign_group.map((g) => (typeof g === 'object' ? String(g.id || g.group_id) : String(g)));
        } else if (typeof initialData.email_campaign_group === 'string' && initialData.email_campaign_group.trim()) {
          grpArr = initialData.email_campaign_group.split(',').map((s) => s.trim()).filter(Boolean);
        }

        setFormData({
          email_campaign_name: initialData.email_campaign_name || initialData.name || '',
          email_campaign_template_id: initialData.email_campaign_template_id || initialData.template_id || '',
          email_campaign_date: initialData.email_campaign_date || initialData.date || today,
          email_campaign_holiday: initialData.email_campaign_holiday || 'Yes',
          email_campaign_group: grpArr,
          email_campaign_subject: initialData.email_campaign_subject || initialData.subject || '',
          email_campaign_status: initialData.email_campaign_status || initialData.status || 'Pending',
        });
      } else {
        setFormData({
          email_campaign_name: '',
          email_campaign_template_id: '',
          email_campaign_date: today,
          email_campaign_holiday: 'Yes',
          email_campaign_group: [],
          email_campaign_subject: '',
          email_campaign_status: 'Pending',
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  const loadSelectOptions = async () => {
    setFetchingOptions(true);
    try {
      // 1. Load active templates (Email type)
      let activeTmplList = [];
      try {
        const tmplRes = await getActiveTemplates('Email');
        activeTmplList = Array.isArray(tmplRes)
          ? tmplRes
          : tmplRes?.data || tmplRes?.templates || [];
      } catch (tmplErr) {
        const fallbackRes = await getTemplates({ type: 'Email' });
        activeTmplList = Array.isArray(fallbackRes)
          ? fallbackRes
          : fallbackRes?.data || fallbackRes?.templates || [];
      }
      setTemplates(activeTmplList);

      // 2. Load active groups
      let activeGrpList = [];
      try {
        const grpRes = await getActiveGroups();
        activeGrpList = Array.isArray(grpRes)
          ? grpRes
          : grpRes?.data || grpRes?.groups || [];
      } catch (grpErr) {
        const fallbackGrp = await getGroups();
        activeGrpList = Array.isArray(fallbackGrp)
          ? fallbackGrp
          : fallbackGrp?.data || fallbackGrp?.groups || [];
      }
      setGroups(activeGrpList);
    } catch (err) {
      console.error('Failed to load campaign options:', err);
      toast.error('Could not load active templates or groups.');
    } finally {
      setFetchingOptions(false);
    }
  };

  const handleGroupToggle = (groupId) => {
    const sId = String(groupId);
    setFormData((prev) => {
      const exists = prev.email_campaign_group.includes(sId);
      const updated = exists
        ? prev.email_campaign_group.filter((id) => id !== sId)
        : [...prev.email_campaign_group, sId];
      return { ...prev, email_campaign_group: updated };
    });
    if (errors.email_campaign_group) {
      setErrors((prev) => ({ ...prev, email_campaign_group: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email_campaign_name.trim()) {
      newErrors.email_campaign_name = 'Campaign name is required.';
    }
    if (!formData.email_campaign_subject.trim()) {
      newErrors.email_campaign_subject = 'Email subject is required.';
    }
    if (!formData.email_campaign_template_id) {
      newErrors.email_campaign_template_id = 'Please select an email template.';
    }
    if (!formData.email_campaign_date) {
      newErrors.email_campaign_date = 'Target campaign date is required.';
    }
    if (!formData.email_campaign_holiday) {
      newErrors.email_campaign_holiday = 'Holiday setting is required.';
    }
    if (!formData.email_campaign_group || formData.email_campaign_group.length === 0) {
      newErrors.email_campaign_group = 'Please select at least one contact group.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please complete all required fields.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      console.error('Email campaign save error:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to save email campaign.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fade-in overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-[#FAF8F5] shadow-2xl border border-[#E8E3DA] flex flex-col max-h-[90vh] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8E3DA] px-6 py-4 bg-white/60 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1A1817] text-[#C99C4B] shadow-2xs flex-shrink-0">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#1A1817]">
                {isEditing ? 'Edit Email Campaign' : 'Create Email Campaign'}
              </h2>
              <p className="text-xs text-[#8C8275]">
                Configure email broadcast, template selection, and recipient groups
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

        {/* Content / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {fetchingOptions && (
            <div className="flex items-center gap-2 text-xs text-[#8C8275] bg-[#E8E3DA]/30 px-3 py-2 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin text-[#C99C4B]" />
              <span>Loading active templates and contact groups...</span>
            </div>
          )}

          {/* Campaign Name */}
          <div>
            <label className="block text-xs font-semibold text-[#1A1817] mb-1">
              Campaign Name <span className="text-[#9A2D2D]">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., September Product Launch Email"
              value={formData.email_campaign_name}
              onChange={(e) => {
                setFormData({ ...formData, email_campaign_name: e.target.value });
                if (errors.email_campaign_name) setErrors({ ...errors, email_campaign_name: null });
              }}
              className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs text-[#1A1817] placeholder:text-[#8C8275]/60 outline-none transition focus:ring-2 focus:ring-[#C99C4B]/20 focus:border-[#C99C4B] ${
                errors.email_campaign_name ? 'border-[#9A2D2D]' : 'border-[#E8E3DA]'
              }`}
            />
            {errors.email_campaign_name && (
              <p className="mt-1 text-[11px] text-[#9A2D2D]">{errors.email_campaign_name}</p>
            )}
          </div>

          {/* Subject Line */}
          <div>
            <label className="block text-xs font-semibold text-[#1A1817] mb-1">
              Email Subject Line <span className="text-[#9A2D2D]">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Exclusive 20% Discount Inside for You!"
              value={formData.email_campaign_subject}
              onChange={(e) => {
                setFormData({ ...formData, email_campaign_subject: e.target.value });
                if (errors.email_campaign_subject) setErrors({ ...errors, email_campaign_subject: null });
              }}
              className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs text-[#1A1817] placeholder:text-[#8C8275]/60 outline-none transition focus:ring-2 focus:ring-[#C99C4B]/20 focus:border-[#C99C4B] ${
                errors.email_campaign_subject ? 'border-[#9A2D2D]' : 'border-[#E8E3DA]'
              }`}
            />
            {errors.email_campaign_subject && (
              <p className="mt-1 text-[11px] text-[#9A2D2D]">{errors.email_campaign_subject}</p>
            )}
          </div>

          {/* Email Template Select & Campaign Date (2 Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email Template Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-[#1A1817] mb-1">
                Email Template <span className="text-[#9A2D2D]">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.email_campaign_template_id}
                  onChange={(e) => {
                    setFormData({ ...formData, email_campaign_template_id: e.target.value });
                    if (errors.email_campaign_template_id) setErrors({ ...errors, email_campaign_template_id: null });
                  }}
                  className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs text-[#1A1817] outline-none transition focus:ring-2 focus:ring-[#C99C4B]/20 focus:border-[#C99C4B] ${
                    errors.email_campaign_template_id ? 'border-[#9A2D2D]' : 'border-[#E8E3DA]'
                  }`}
                >
                  <option value="">-- Select Active Template --</option>
                  {templates.map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.template_name || tmpl.name} {tmpl.template_id ? `(${tmpl.template_id})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              {errors.email_campaign_template_id && (
                <p className="mt-1 text-[11px] text-[#9A2D2D]">{errors.email_campaign_template_id}</p>
              )}
            </div>

            {/* Campaign Date */}
            <div>
              <label className="block text-xs font-semibold text-[#1A1817] mb-1">
                Execution Date <span className="text-[#9A2D2D]">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  min={today}
                  value={formData.email_campaign_date}
                  onChange={(e) => {
                    setFormData({ ...formData, email_campaign_date: e.target.value });
                    if (errors.email_campaign_date) setErrors({ ...errors, email_campaign_date: null });
                  }}
                  className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs text-[#1A1817] outline-none transition focus:ring-2 focus:ring-[#C99C4B]/20 focus:border-[#C99C4B] ${
                    errors.email_campaign_date ? 'border-[#9A2D2D]' : 'border-[#E8E3DA]'
                  }`}
                />
              </div>
              {errors.email_campaign_date && (
                <p className="mt-1 text-[11px] text-[#9A2D2D]">{errors.email_campaign_date}</p>
              )}
            </div>
          </div>

          {/* Holiday Setting & Campaign Status (2 Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Holiday Skip Logic */}
            <div>
              <label className="block text-xs font-semibold text-[#1A1817] mb-1">
                Skip on Holidays <span className="text-[#9A2D2D]">*</span>
              </label>
              <select
                value={formData.email_campaign_holiday}
                onChange={(e) => setFormData({ ...formData, email_campaign_holiday: e.target.value })}
                className="w-full rounded-xl border border-[#E8E3DA] bg-white px-3.5 py-2.5 text-xs text-[#1A1817] outline-none transition focus:ring-2 focus:ring-[#C99C4B]/20 focus:border-[#C99C4B]"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
              <p className="mt-1 text-[11px] text-[#8C8275]">
                Default is set to <span className="font-semibold text-[#1A1817]">Yes</span>.
              </p>
            </div>

            {/* Status (if editing or custom) */}
            <div>
              <label className="block text-xs font-semibold text-[#1A1817] mb-1">
                Campaign Status
              </label>
              <select
                value={formData.email_campaign_status}
                onChange={(e) => setFormData({ ...formData, email_campaign_status: e.target.value })}
                className="w-full rounded-xl border border-[#E8E3DA] bg-white px-3.5 py-2.5 text-xs text-[#1A1817] outline-none transition focus:ring-2 focus:ring-[#C99C4B]/20 focus:border-[#C99C4B]"
              >
                <option value="Pending">Pending</option>
                <option value="Sent">Sent</option>
                <option value="Hold">Hold</option>
              </select>
            </div>
          </div>

          {/* Contact Groups Multiple Select */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#1A1817]">
                Target Contact Groups <span className="text-[#9A2D2D]">*</span>
              </label>
              <span className="text-[11px] font-medium text-[#8C8275]">
                Selected: {formData.email_campaign_group.length}
              </span>
            </div>

            <div className={`p-3 rounded-xl border bg-white max-h-48 overflow-y-auto space-y-1.5 ${
              errors.email_campaign_group ? 'border-[#9A2D2D]' : 'border-[#E8E3DA]'
            }`}>
              {groups.length === 0 ? (
                <p className="text-xs text-[#8C8275] italic py-2 text-center">
                  No active contact groups found.
                </p>
              ) : (
                groups.map((grp) => {
                  const grpId = String(grp.id);
                  const isChecked = formData.email_campaign_group.includes(grpId);
                  return (
                    <label
                      key={grp.id}
                      onClick={() => handleGroupToggle(grp.id)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition select-none ${
                        isChecked
                          ? 'bg-[#1A1817] text-[#FAF8F5]'
                          : 'bg-[#FAF8F5] text-[#1A1817] hover:bg-[#E8E3DA]/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Users className={`h-3.5 w-3.5 flex-shrink-0 ${isChecked ? 'text-[#C99C4B]' : 'text-[#8C8275]'}`} />
                        <span className="font-medium truncate">{grp.group_name || grp.name}</span>
                      </div>
                      <div className={`flex h-4 w-4 items-center justify-center rounded border transition ${
                        isChecked ? 'bg-[#C99C4B] border-[#C99C4B] text-black' : 'border-[#8C8275]/40 bg-white'
                      }`}>
                        {isChecked && <CheckCircle2 className="h-3 w-3 text-black" />}
                      </div>
                    </label>
                  );
                })
              )}
            </div>
            {errors.email_campaign_group && (
              <p className="mt-1 text-[11px] text-[#9A2D2D]">{errors.email_campaign_group}</p>
            )}
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-[#E8E3DA] px-6 py-4 bg-white/60">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-[#E8E3DA] bg-white px-4 py-2 text-xs font-semibold text-[#5C554B] hover:bg-[#FAF8F5] transition cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-[#1A1817] px-5 py-2 text-xs font-semibold text-[#FAF8F5] hover:bg-[#2E2A27] transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-[#C99C4B]" />
                <span>Saving...</span>
              </>
            ) : (
              <span>{isEditing ? 'Save Changes' : 'Create Email Campaign'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
