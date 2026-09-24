import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import {
  Mail,
  Calendar,
  Users,
  FileText,
  Save,
  ArrowLeft,
  Loader2,
  Boxes,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronRight,
} from 'lucide-react';
import {
  createEmailCampaign,
  updateEmailCampaign,
  getEmailCampaignById,
} from '../services/emailCampaignApi';
import { getActiveTemplates, getTemplates } from '../services/templateApi';
import { getActiveGroups, getGroups } from '../services/groupApi';
import toast from 'react-hot-toast';

export default function EmailCampaignFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    email_campaign_name: '',
    email_campaign_template_id: '',
    email_campaign_date: today,
    email_campaign_holiday: 'Yes',
    email_campaign_group: [],
    email_campaign_subject: '',
    email_campaign_status: 'Pending',
  });

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [fetchingOptions, setFetchingOptions] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [groups, setGroups] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadOptions();
    if (isEditing) {
      loadCampaignDetails(id);
    }
  }, [id, isEditing]);

  const loadOptions = async () => {
    setFetchingOptions(true);
    try {
      // 1. Fetch active email templates
      let activeTmplList = [];
      try {
        const tmplRes = await getActiveTemplates('Email');
        activeTmplList = Array.isArray(tmplRes)
          ? tmplRes
          : tmplRes?.data || tmplRes?.templates || [];
      } catch {
        const fallbackRes = await getTemplates({ type: 'Email' });
        activeTmplList = Array.isArray(fallbackRes)
          ? fallbackRes
          : fallbackRes?.data || fallbackRes?.templates || [];
      }
      setTemplates(activeTmplList);

      // 2. Fetch active groups
      let activeGrpList = [];
      try {
        const grpRes = await getActiveGroups();
        activeGrpList = Array.isArray(grpRes)
          ? grpRes
          : grpRes?.data || grpRes?.groups || [];
      } catch {
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

  const loadCampaignDetails = async (campaignId) => {
    setFetchingData(true);
    try {
      const res = await getEmailCampaignById(campaignId);
      const camp =
        res?.data?.email_campaign ||
        res?.email_campaign ||
        res?.data?.campaign ||
        res?.campaign ||
        res?.data ||
        res ||
        {};

      // Parse group IDs
      let grpArr = [];
      const rawGroups =
        camp.email_campaign_group ||
        camp.groups ||
        camp.group ||
        [];

      if (Array.isArray(rawGroups)) {
        grpArr = rawGroups.map((g) =>
          typeof g === 'object' && g !== null
            ? String(g.id || g.group_id)
            : String(g)
        );
      } else if (typeof rawGroups === 'string' && rawGroups.trim()) {
        try {
          const parsed = JSON.parse(rawGroups);
          if (Array.isArray(parsed)) {
            grpArr = parsed.map((g) =>
              typeof g === 'object' && g !== null
                ? String(g.id || g.group_id)
                : String(g)
            );
          } else {
            grpArr = rawGroups.split(',').map((s) => s.trim()).filter(Boolean);
          }
        } catch {
          grpArr = rawGroups.split(',').map((s) => s.trim()).filter(Boolean);
        }
      }

      setFormData({
        email_campaign_name: camp.email_campaign_name || camp.name || '',
        email_campaign_template_id:
          camp.email_campaign_template_id || camp.template_id || '',
        email_campaign_date:
          camp.email_campaign_date || camp.date || today,
        email_campaign_holiday: camp.email_campaign_holiday || camp.holiday || 'Yes',
        email_campaign_group: grpArr,
        email_campaign_subject:
          camp.email_campaign_subject || camp.subject || '',
        email_campaign_status:
          camp.email_campaign_status || camp.status || 'Pending',
      });
    } catch (err) {
      console.error('Failed to load campaign data:', err);
      toast.error('Failed to load campaign details.');
    } finally {
      setFetchingData(false);
    }
  };

  const handleGroupToggle = (groupId) => {
    const sId = String(groupId);
    setFormData((prev) => {
      const exists = prev.email_campaign_group.includes(sId);
      const updated = exists
        ? prev.email_campaign_group.filter((gid) => gid !== sId)
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
      newErrors.email_campaign_subject = 'Email subject line is required.';
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
      if (isEditing) {
        await updateEmailCampaign(id, formData);
        toast.success('Email campaign updated successfully.');
      } else {
        await createEmailCampaign(formData);
        toast.success('Email campaign created successfully.');
      }
      navigate('/email-campaign');
    } catch (err) {
      console.error('Email campaign save error:', err);
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save email campaign.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title={isEditing ? 'Edit Email Campaign' : 'Create Email Campaign'} />

        <main className="flex-1 p-4 sm:p-6 max-w-5xl w-full mx-auto">
          {/* Top Breadcrumb Bar */}
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <Link
                to="/email-campaign"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E2DDD5] bg-white hover:bg-[#F7F4EE] text-[#4A443D] font-medium shadow-2xs transition"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-[#9E7432]" />
                <span>Back to Campaigns</span>
              </Link>
              <ChevronRight className="h-3.5 w-3.5 text-[#A8A29E]" />
              <span className="font-semibold text-[#1A1817]">
                {isEditing ? 'Edit Campaign' : 'New Campaign'}
              </span>
            </div>
          </div>

          {fetchingData ? (
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-16 text-center shadow-2xs">
              <Loader2 className="h-8 w-8 animate-spin text-[#C99C4B] mx-auto mb-3" />
              <p className="text-xs font-semibold text-[#1A1817]">Loading campaign details...</p>
              <p className="text-[11px] text-[#8C8275] mt-0.5">Please wait a moment</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Card 1: Campaign Overview & Identity */}
              <div className="bg-white rounded-2xl border border-[#E8E3DA] shadow-2xs overflow-hidden">
                <div className="px-5 sm:px-6 py-4 border-b border-[#E8E3DA] bg-[#FAF8F5] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#1A1817] text-[#C99C4B] flex items-center justify-center shadow-2xs">
                      <Mail className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-[#1A1817]">
                        {isEditing ? 'Edit Broadcast Campaign' : 'New Email Broadcast'}
                      </h2>
                      <p className="text-[11px] text-[#8C8275]">
                        Enter campaign details, subject line, and message template
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6 space-y-4">
                  {/* Campaign Name */}
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1817] mb-1.5">
                      Campaign Name <span className="text-[#9A2D2D]">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., September Product Launch Email"
                      value={formData.email_campaign_name}
                      onChange={(e) => {
                        setFormData({ ...formData, email_campaign_name: e.target.value });
                        if (errors.email_campaign_name) {
                          setErrors({ ...errors, email_campaign_name: null });
                        }
                      }}
                      className={`w-full rounded-xl border bg-[#FAF8F5] px-3.5 py-2.5 text-xs sm:text-sm text-[#1A1817] placeholder:text-[#8C8275]/60 outline-none transition focus:bg-white focus:ring-2 focus:ring-[#C99C4B]/20 focus:border-[#C99C4B] ${
                        errors.email_campaign_name ? 'border-[#9A2D2D]' : 'border-[#E8E3DA]'
                      }`}
                    />
                    {errors.email_campaign_name && (
                      <p className="mt-1 text-[11px] text-[#9A2D2D]">{errors.email_campaign_name}</p>
                    )}
                  </div>

                  {/* Subject Line */}
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1817] mb-1.5">
                      Email Subject Line <span className="text-[#9A2D2D]">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Exclusive 20% Discount Inside for You!"
                      value={formData.email_campaign_subject}
                      onChange={(e) => {
                        setFormData({ ...formData, email_campaign_subject: e.target.value });
                        if (errors.email_campaign_subject) {
                          setErrors({ ...errors, email_campaign_subject: null });
                        }
                      }}
                      className={`w-full rounded-xl border bg-[#FAF8F5] px-3.5 py-2.5 text-xs sm:text-sm text-[#1A1817] placeholder:text-[#8C8275]/60 outline-none transition focus:bg-white focus:ring-2 focus:ring-[#C99C4B]/20 focus:border-[#C99C4B] ${
                        errors.email_campaign_subject ? 'border-[#9A2D2D]' : 'border-[#E8E3DA]'
                      }`}
                    />
                    {errors.email_campaign_subject && (
                      <p className="mt-1 text-[11px] text-[#9A2D2D]">{errors.email_campaign_subject}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 2: Template, Scheduling & Rules */}
              <div className="bg-white rounded-2xl border border-[#E8E3DA] shadow-2xs overflow-hidden">
                <div className="px-5 sm:px-6 py-4 border-b border-[#E8E3DA] bg-[#FAF8F5] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] flex items-center justify-center">
                      <FileText className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-[#1A1817]">Template & Timing</h2>
                      <p className="text-[11px] text-[#8C8275]">
                        Choose the layout template and configure dispatch scheduling
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Template Selector */}
                    <div>
                      <label className="block text-xs font-semibold text-[#1A1817] mb-1.5">
                        Email Template <span className="text-[#9A2D2D]">*</span>
                      </label>
                      <select
                        value={formData.email_campaign_template_id}
                        onChange={(e) => {
                          setFormData({ ...formData, email_campaign_template_id: e.target.value });
                          if (errors.email_campaign_template_id) {
                            setErrors({ ...errors, email_campaign_template_id: null });
                          }
                        }}
                        className={`w-full rounded-xl border bg-[#FAF8F5] px-3.5 py-2.5 text-xs sm:text-sm text-[#1A1817] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#C99C4B]/20 focus:border-[#C99C4B] cursor-pointer ${
                          errors.email_campaign_template_id ? 'border-[#9A2D2D]' : 'border-[#E8E3DA]'
                        }`}
                      >
                        <option value="">-- Choose an Email Template --</option>
                        {templates.map((tmpl) => (
                          <option key={tmpl.id} value={tmpl.id}>
                            {tmpl.template_name || tmpl.name || `Template #${tmpl.id}`}
                          </option>
                        ))}
                      </select>
                      {errors.email_campaign_template_id && (
                        <p className="mt-1 text-[11px] text-[#9A2D2D]">
                          {errors.email_campaign_template_id}
                        </p>
                      )}
                    </div>

                    {/* Campaign Date */}
                    <div>
                      <label className="block text-xs font-semibold text-[#1A1817] mb-1.5">
                        Dispatch Date <span className="text-[#9A2D2D]">*</span>
                      </label>
                      <input
                        type="date"
                        min={today}
                        value={formData.email_campaign_date}
                        onChange={(e) => {
                          setFormData({ ...formData, email_campaign_date: e.target.value });
                          if (errors.email_campaign_date) {
                            setErrors({ ...errors, email_campaign_date: null });
                          }
                        }}
                        className={`w-full rounded-xl border bg-[#FAF8F5] px-3.5 py-2.5 text-xs sm:text-sm text-[#1A1817] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#C99C4B]/20 focus:border-[#C99C4B] cursor-pointer ${
                          errors.email_campaign_date ? 'border-[#9A2D2D]' : 'border-[#E8E3DA]'
                        }`}
                      />
                      {errors.email_campaign_date && (
                        <p className="mt-1 text-[11px] text-[#9A2D2D]">{errors.email_campaign_date}</p>
                      )}
                    </div>
                  </div>

                  {/* Holiday Behavior Rule */}
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1817] mb-1.5">
                      Holiday Handling Rule <span className="text-[#9A2D2D]">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label
                        className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                          formData.email_campaign_holiday === 'Yes'
                            ? 'border-[#C99C4B] bg-[#FAF6EE] shadow-2xs'
                            : 'border-[#E8E3DA] bg-[#FAF8F5] hover:bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="email_campaign_holiday"
                          value="Yes"
                          checked={formData.email_campaign_holiday === 'Yes'}
                          onChange={(e) =>
                            setFormData({ ...formData, email_campaign_holiday: e.target.value })
                          }
                          className="mt-0.5 text-[#C99C4B] focus:ring-[#C99C4B]"
                        />
                        <div>
                          <p className="text-xs font-semibold text-[#1A1817]">Skip on Holidays</p>
                          <p className="text-[11px] text-[#8C8275] mt-0.5">
                            Do not send emails if scheduled date is a declared company holiday
                          </p>
                        </div>
                      </label>

                      <label
                        className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                          formData.email_campaign_holiday === 'No'
                            ? 'border-[#C99C4B] bg-[#FAF6EE] shadow-2xs'
                            : 'border-[#E8E3DA] bg-[#FAF8F5] hover:bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="email_campaign_holiday"
                          value="No"
                          checked={formData.email_campaign_holiday === 'No'}
                          onChange={(e) =>
                            setFormData({ ...formData, email_campaign_holiday: e.target.value })
                          }
                          className="mt-0.5 text-[#C99C4B] focus:ring-[#C99C4B]"
                        />
                        <div>
                          <p className="text-xs font-semibold text-[#1A1817]">Send Regardless</p>
                          <p className="text-[11px] text-[#8C8275] mt-0.5">
                            Broadcast normally even on declared calendar holidays
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Target Contact Groups */}
              <div className="bg-white rounded-2xl border border-[#E8E3DA] shadow-2xs overflow-hidden">
                <div className="px-5 sm:px-6 py-4 border-b border-[#E8E3DA] bg-[#FAF8F5] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#EBF7EE] text-[#1E7E34] border border-[#C3E6CB] flex items-center justify-center">
                      <Boxes className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-[#1A1817]">
                        Target Contact Groups <span className="text-[#9A2D2D]">*</span>
                      </h2>
                      <p className="text-[11px] text-[#8C8275]">
                        Select which contact groups will receive this campaign
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
                      formData.email_campaign_group.length > 0
                        ? 'bg-[#EBF7EE] text-[#1E7E34] border border-[#C3E6CB]'
                        : 'bg-[#FBEAEA] text-[#9A2D2D] border border-[#F5C6CB]'
                    }`}
                  >
                    {formData.email_campaign_group.length > 0
                      ? `${formData.email_campaign_group.length} Selected`
                      : 'At least 1 required'}
                  </span>
                </div>

                <div className="p-5 sm:p-6">
                  {fetchingOptions ? (
                    <div className="py-6 text-center text-xs text-[#8C8275]">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-[#C99C4B] mb-2" />
                      Loading contact groups...
                    </div>
                  ) : groups.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-xs text-[#8C8275]">
                        No contact groups found. Please create groups under the Groups module.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {groups.map((grp) => {
                        const sId = String(grp.id);
                        const isSelected = formData.email_campaign_group.includes(sId);
                        const grpName = grp.group_name || grp.name || `Group #${grp.id}`;

                        return (
                          <button
                            key={grp.id}
                            type="button"
                            onClick={() => handleGroupToggle(grp.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                              isSelected
                                ? 'bg-[#1A1817] text-[#FAF8F5] shadow-xs ring-2 ring-[#C99C4B]/50'
                                : 'bg-[#FAF8F5] text-[#4A443D] border border-[#E8E3DA] hover:bg-white hover:border-[#C99C4B]/40'
                            }`}
                          >
                            {isSelected ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-[#C99C4B]" />
                            ) : (
                              <Users className="h-3.5 w-3.5 text-[#8C8275]" />
                            )}
                            <span>{grpName}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {errors.email_campaign_group && (
                    <p className="mt-2 text-[11px] text-[#9A2D2D]">
                      {errors.email_campaign_group}
                    </p>
                  )}
                </div>
              </div>

              {/* Card 4: Status (Editing mode) */}
              {isEditing && (
                <div className="bg-white rounded-2xl border border-[#E8E3DA] shadow-2xs overflow-hidden">
                  <div className="px-5 sm:px-6 py-4 border-b border-[#E8E3DA] bg-[#FAF8F5] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-[#FAF8F5] text-[#8C8275] border border-[#E8E3DA] flex items-center justify-center">
                        <Clock className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-semibold text-[#1A1817]">Campaign Status</h2>
                        <p className="text-[11px] text-[#8C8275]">
                          Update execution state (Pending, Sent, Hold)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    <select
                      value={formData.email_campaign_status}
                      onChange={(e) =>
                        setFormData({ ...formData, email_campaign_status: e.target.value })
                      }
                      className="w-full sm:w-64 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] px-3.5 py-2.5 text-xs sm:text-sm text-[#1A1817] outline-none transition focus:bg-white focus:border-[#C99C4B] cursor-pointer"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Sent">Sent</option>
                      <option value="Hold">Hold</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/email-campaign')}
                  disabled={loading}
                  className="rounded-xl border border-[#E8E3DA] bg-white px-5 py-2.5 text-xs font-semibold text-[#5C554B] hover:bg-[#FAF8F5] transition cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1A1817] px-6 py-2.5 text-xs font-semibold text-[#FAF8F5] hover:bg-[#2C2825] transition shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[#C99C4B]" />
                  ) : (
                    <Save className="h-4 w-4 text-[#C99C4B]" />
                  )}
                  <span>{isEditing ? 'Update Campaign' : 'Save & Schedule Campaign'}</span>
                </button>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
