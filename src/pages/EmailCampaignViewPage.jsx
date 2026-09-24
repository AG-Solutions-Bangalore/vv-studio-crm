import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import {
  Mail,
  Calendar,
  Users,
  FileText,
  ShieldAlert,
  Edit3,
  Trash2,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Clock,
  PauseCircle,
  RefreshCw,
  Boxes,
  AlertCircle,
  Send,
  ChevronRight,
  UserCheck,
  UserX,
} from 'lucide-react';
import {
  getEmailCampaignById,
  deleteEmailCampaign,
  deleteEmailCampaignSub,
} from '../services/emailCampaignApi';
import { getActiveGroups } from '../services/groupApi';
import toast from 'react-hot-toast';

export default function EmailCampaignViewPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [campaign, setCampaign] = useState(null);
  const [subs, setSubs] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingSubId, setDeletingSubId] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingCampaign, setDeletingCampaign] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const [res, groupsRes] = await Promise.allSettled([
        getEmailCampaignById(id),
        getActiveGroups(),
      ]);

      let groupList = [];
      if (groupsRes.status === 'fulfilled') {
        const rawG = groupsRes.value;
        groupList = Array.isArray(rawG)
          ? rawG
          : rawG?.data || rawG?.groups || [];
        setAllGroups(groupList);
      }

      if (res.status === 'fulfilled') {
        const responseData = res.value;
        const campObj =
          responseData?.data?.email_campaign ||
          responseData?.email_campaign ||
          responseData?.data?.campaign ||
          responseData?.campaign ||
          responseData?.data ||
          responseData ||
          {};

        setCampaign(campObj);

        // Robust extraction of subs / recipient contacts
        const extractedSubs = extractSubs(responseData, campObj);
        setSubs(extractedSubs);
      } else {
        toast.error('Failed to load email campaign details.');
      }
    } catch (err) {
      console.error('Failed to load campaign overview:', err);
      toast.error('Failed to load campaign overview.');
    } finally {
      setLoading(false);
    }
  };

  const extractSubs = (res, camp) => {
    let candidate =
      camp?.subs ||
      camp?.sub ||
      camp?.email_campaign_subs ||
      camp?.email_campaign_sub ||
      camp?.email_subs ||
      camp?.email_sub ||
      camp?.recipients ||
      camp?.contacts ||
      res?.subs ||
      res?.sub ||
      res?.email_campaign_subs ||
      res?.email_campaign_sub ||
      res?.email_subs ||
      res?.email_sub ||
      res?.data?.subs ||
      res?.data?.sub ||
      res?.data?.email_campaign_subs ||
      res?.data?.email_campaign_sub ||
      res?.data?.recipients ||
      res?.data?.contacts ||
      [];

    if (Array.isArray(candidate)) return candidate;
    if (typeof candidate === 'string' && candidate.trim()) {
      try {
        const parsed = JSON.parse(candidate);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // Not JSON
      }
    }
    if (typeof candidate === 'object' && candidate !== null) {
      if (Array.isArray(candidate.data)) return candidate.data;
      return Object.values(candidate);
    }
    return [];
  };

  useEffect(() => {
    if (id) {
      fetchDetails();
    }
  }, [id]);

  const handleDeleteSubItem = async (subId) => {
    if (!window.confirm('Are you sure you want to remove this contact from the campaign broadcast?')) {
      return;
    }

    setDeletingSubId(subId);
    try {
      await deleteEmailCampaignSub(subId);
      toast.success('Recipient removed from campaign.');
      setSubs((prev) => prev.filter((s) => s.id !== subId));
    } catch (err) {
      console.error('Delete sub failed:', err);
      toast.error('Failed to remove recipient from campaign.');
    } finally {
      setDeletingSubId(null);
    }
  };

  const handleDeleteCampaign = async () => {
    setDeletingCampaign(true);
    try {
      await deleteEmailCampaign(id);
      toast.success('Email campaign deleted successfully.');
      navigate('/email-campaign');
    } catch (err) {
      console.error('Delete campaign error:', err);
      toast.error('Failed to delete email campaign.');
    } finally {
      setDeletingCampaign(false);
      setDeleteConfirmOpen(false);
    }
  };

  const name = campaign?.email_campaign_name || campaign?.name || 'Unnamed Campaign';
  const subject = campaign?.email_campaign_subject || campaign?.subject || '—';
  const date = campaign?.email_campaign_date || campaign?.date || '—';
  const holiday = campaign?.email_campaign_holiday || campaign?.holiday || 'Yes';
  const status = campaign?.email_campaign_status || campaign?.status || 'Pending';
  const templateName =
    campaign?.template?.template_name ||
    campaign?.template_name ||
    (campaign?.email_campaign_template_id ? `Template #${campaign.email_campaign_template_id}` : '—');

  // Resolve Assigned Groups
  const rawGroupVal =
    campaign?.groups ||
    campaign?.group ||
    campaign?.email_campaign_group ||
    [];

  let groupNames = [];
  if (Array.isArray(rawGroupVal)) {
    groupNames = rawGroupVal.map((g) => {
      if (typeof g === 'object' && g !== null) {
        return g.group_name || g.name || `Group #${g.id}`;
      }
      const matched = allGroups.find((ag) => String(ag.id) === String(g));
      return matched ? matched.group_name || matched.name : `Group #${g}`;
    });
  } else if (typeof rawGroupVal === 'string' && rawGroupVal.trim()) {
    const ids = rawGroupVal.split(',').map((s) => s.trim()).filter(Boolean);
    groupNames = ids.map((gid) => {
      const matched = allGroups.find((ag) => String(ag.id) === String(gid));
      return matched ? matched.group_name || matched.name : `Group #${gid}`;
    });
  }

  const getStatusBadge = (st) => {
    const val = String(st || '').toLowerCase();
    if (val === 'sent') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EBF7EE] text-[#1E7E34] border border-[#C3E6CB]">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Sent
        </span>
      );
    }
    if (val === 'hold') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FDF0F0] text-[#9A2D2D] border border-[#F6C8C8]">
          <PauseCircle className="h-3.5 w-3.5" />
          On Hold
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF9E6] text-[#9E7432] border border-[#FCE8AE]">
        <Clock className="h-3.5 w-3.5" />
        Pending
      </span>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Email Campaign Overview" />

        <main className="flex-1 p-4 sm:p-6 max-w-6xl w-full mx-auto">
          {/* Top Breadcrumbs & Actions */}
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
              <span className="font-semibold text-[#1A1817]">Campaign #{id}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchDetails}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2DDD5] bg-white hover:bg-[#F7F4EE] text-xs font-medium text-[#4A443D] shadow-2xs transition cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={() => setDeleteConfirmOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FBEAEA] hover:bg-[#F8D7DA] text-xs font-semibold text-[#9A2D2D] border border-[#F5C6CB] transition cursor-pointer shadow-2xs"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-16 text-center shadow-2xs">
              <Loader2 className="h-8 w-8 animate-spin text-[#C99C4B] mx-auto mb-3" />
              <p className="text-xs font-semibold text-[#1A1817]">Loading campaign overview...</p>
              <p className="text-[11px] text-[#8C8275] mt-0.5">Fetching execution status and recipient data</p>
            </div>
          ) : !campaign ? (
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-16 text-center shadow-2xs">
              <AlertCircle className="h-10 w-10 text-[#9A2D2D] mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#1A1817]">Campaign Not Found</h3>
              <p className="text-xs text-[#8C8275] mt-1 mb-4">
                The requested email campaign could not be loaded or has been deleted.
              </p>
              <Link
                to="/email-campaign"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1A1817] text-[#FAF8F5] text-xs font-semibold shadow-xs"
              >
                Back to Campaigns List
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Campaign Header Card */}
              <div className="bg-white rounded-2xl border border-[#E8E3DA] p-5 sm:p-6 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-[#1A1817] text-[#C99C4B] flex items-center justify-center shadow-2xs flex-shrink-0">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h1 className="text-lg font-bold text-[#1A1817] tracking-tight">{name}</h1>
                        {getStatusBadge(status)}
                      </div>
                      <p className="text-xs text-[#8C8275] mt-1">
                        Campaign ID: <span className="font-mono text-[#1A1817]">#{id}</span> • Email Broadcast Execution
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subject Line & Quick Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Subject */}
                <div className="md:col-span-2 bg-white rounded-2xl border border-[#E8E3DA] p-4 sm:p-5 shadow-2xs">
                  <div className="flex items-center gap-2 text-[#8C8275] mb-1.5">
                    <Mail className="h-3.5 w-3.5 text-[#C99C4B]" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider">
                      Subject Line
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#1A1817] leading-relaxed">{subject}</p>
                </div>

                {/* Scheduled Date */}
                <div className="bg-white rounded-2xl border border-[#E8E3DA] p-4 sm:p-5 shadow-2xs">
                  <div className="flex items-center gap-2 text-[#8C8275] mb-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[#C99C4B]" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider">
                      Scheduled Date
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#1A1817]">{date}</p>
                </div>

                {/* Holiday Handling */}
                <div className="bg-white rounded-2xl border border-[#E8E3DA] p-4 sm:p-5 shadow-2xs">
                  <div className="flex items-center gap-2 text-[#8C8275] mb-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 text-[#C99C4B]" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider">
                      Holiday Rule
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#1A1817]">
                    {holiday === 'Yes' ? 'Skip on Holiday' : 'Send Regardless'}
                  </p>
                </div>
              </div>

              {/* Template, Target Groups & Email Routing Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Template Info */}
                <div className="bg-white rounded-2xl border border-[#E8E3DA] p-5 shadow-2xs">
                  <div className="flex items-center gap-2 text-[#8C8275] mb-3">
                    <FileText className="h-4 w-4 text-[#9E7432]" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider">
                      Connected Template
                    </h3>
                  </div>
                  <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E3DA]">
                    <p className="text-xs font-bold text-[#1A1817]">{templateName}</p>
                    <p className="text-[11px] text-[#8C8275] mt-0.5">Template ID: #{campaign?.email_campaign_template_id || '—'}</p>
                  </div>
                </div>

                {/* Assigned Groups */}
                <div className="bg-white rounded-2xl border border-[#E8E3DA] p-5 shadow-2xs">
                  <div className="flex items-center justify-between text-[#8C8275] mb-3">
                    <div className="flex items-center gap-2">
                      <Boxes className="h-4 w-4 text-[#9E7432]" />
                      <h3 className="text-xs font-semibold uppercase tracking-wider">
                        Target Groups
                      </h3>
                    </div>
                    <span className="text-[11px] font-medium text-[#1A1817]">
                      {groupNames.length} {groupNames.length === 1 ? 'Group' : 'Groups'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {groupNames.length > 0 ? (
                      groupNames.map((gName, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E8E3DA] bg-[#FAF8F5] text-xs font-medium text-[#1A1817] shadow-2xs"
                        >
                          <Users className="h-3 w-3 text-[#C99C4B]" />
                          {gName}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-[#8C8275] italic py-2">No contact groups assigned.</p>
                    )}
                  </div>
                </div>

                {/* Email Routing Info (Reply-To & CC) */}
                <div className="bg-white rounded-2xl border border-[#E8E3DA] p-5 shadow-2xs">
                  <div className="flex items-center gap-2 text-[#8C8275] mb-3">
                    <Mail className="h-4 w-4 text-[#9E7432]" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider">
                      Email Routing
                    </h3>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8C8275]">Reply-To:</span>
                      <span className="font-medium text-[#1A1817] truncate max-w-[140px]">
                        {campaign?.email_campaign_reply_to || '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8C8275]">CC:</span>
                      <span className="font-medium text-[#1A1817] truncate max-w-[140px]">
                        {campaign?.email_campaign_cc || '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recipients & Execution Sub-Items Card ("subs") */}
              <div className="bg-white rounded-2xl border border-[#E8E3DA] shadow-2xs overflow-hidden">
                <div className="px-5 sm:px-6 py-4 border-b border-[#E8E3DA] bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-semibold text-[#1A1817] flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#C99C4B]" />
                      <span>Campaign Recipients & Execution Sub-List ({subs.length})</span>
                    </h2>
                    <p className="text-[11px] text-[#8C8275]">
                      Individual recipient contacts queued and dispatched for this email broadcast
                    </p>
                  </div>

                  {subs.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FAF8F5] text-[#1A1817] border border-[#E8E3DA]">
                      <span className="h-2 w-2 rounded-full bg-[#C99C4B]" />
                      {subs.length} {subs.length === 1 ? 'Recipient Queued' : 'Recipients Queued'}
                    </span>
                  )}
                </div>

                {subs.length === 0 ? (
                  <div className="p-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FAF8F5] text-[#8C8275] border border-[#E8E3DA] mb-3">
                      <Users className="h-6 w-6" />
                    </div>
                    <h3 className="text-xs font-semibold text-[#1A1817]">No Recipient Sub-Entries Found</h3>
                    <p className="text-[11px] text-[#8C8275] max-w-md mx-auto mt-1">
                      Recipients are automatically populated from the assigned contact groups (
                      {groupNames.join(', ') || 'selected groups'}).
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#E8E3DA] bg-[#FAF8F5] font-semibold text-[#5C554B]">
                          <th className="px-5 py-3 w-16 text-center">Sl.No</th>
                          <th className="px-5 py-3">Recipient Email</th>
                          <th className="px-5 py-3">Group</th>
                          <th className="px-5 py-3">Scheduled Date</th>
                          <th className="px-5 py-3">Execution Status</th>
                          <th className="px-5 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0ECE3]">
                        {subs.map((subItem, index) => {
                          const subId = subItem.id || subItem.email_campaign_sub_id || index;
                          const subEmail =
                            subItem.email_sub_campaign_email ||
                            subItem.email ||
                            subItem.contact_email ||
                            subItem.email_campaign_sub_email ||
                            subItem.sub_email ||
                            '—';
                          const subDate =
                            subItem.email_sub_campaign_date ||
                            subItem.date ||
                            date;
                          const subStatus =
                            subItem.email_sub_campaign_status ||
                            subItem.status ||
                            status;

                          // Resolve group name for this sub if available
                          const subGroupId = subItem.group_id;
                          const matchedGroup = subGroupId
                            ? allGroups.find((ag) => String(ag.id) === String(subGroupId))
                            : null;
                          const groupDisplayName = matchedGroup
                            ? matchedGroup.group_name || matchedGroup.name
                            : subGroupId
                            ? `Group #${subGroupId}`
                            : '—';

                          return (
                            <tr key={subId} className="hover:bg-[#FAF8F5] transition">
                              {/* Row Index */}
                              <td className="px-5 py-3.5 font-mono text-xs text-[#9C9488] text-center">
                                {index + 1}
                              </td>

                              {/* Recipient Email */}
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FAF8F5] border border-[#E8E3DA] text-[#9E7432] flex-shrink-0">
                                    <Mail className="h-3.5 w-3.5" />
                                  </div>
                                  <span className="font-semibold text-xs text-[#1A1817]">{subEmail}</span>
                                </div>
                              </td>

                              {/* Target Group */}
                              <td className="px-5 py-3.5">
                                <span className="inline-flex items-center gap-1 text-xs text-[#5C554B]">
                                  <Users className="h-3 w-3 text-[#9C9488]" />
                                  {groupDisplayName}
                                </span>
                              </td>

                              {/* Scheduled Date */}
                              <td className="px-5 py-3.5 font-mono text-xs text-[#5C554B]">
                                {subDate}
                              </td>

                              {/* Status Badge */}
                              <td className="px-5 py-3.5">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                    String(subStatus).toLowerCase() === 'sent'
                                      ? 'bg-[#EBF7EE] text-[#1E7E34] border border-[#C3E6CB]'
                                      : String(subStatus).toLowerCase() === 'hold'
                                      ? 'bg-[#FDF0F0] text-[#9A2D2D] border border-[#F6C8C8]'
                                      : 'bg-[#FFF9E6] text-[#9E7432] border border-[#FCE8AE]'
                                  }`}
                                >
                                  {subStatus}
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="px-5 py-3.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubItem(subItem.id)}
                                  disabled={deletingSubId === subItem.id}
                                  title="Remove recipient from campaign"
                                  className="p-1.5 text-[#8C8275] hover:text-[#9A2D2D] hover:bg-[#FBEAEA] rounded-lg transition cursor-pointer disabled:opacity-50"
                                >
                                  {deletingSubId === subItem.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-[#9A2D2D]" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteConfirmOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="relative w-full max-w-sm rounded-2xl bg-[#FAF8F5] p-6 shadow-2xl border border-[#E8E3DA]">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FBEAEA] text-[#9A2D2D] mb-4">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-[#1A1817]">Delete Email Campaign?</h3>
                <p className="mt-1.5 text-xs text-[#8C8275] leading-relaxed">
                  Are you sure you want to delete this email campaign? All execution logs and recipient dispatches will be cancelled.
                </p>
                <div className="mt-6 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmOpen(false)}
                    disabled={deletingCampaign}
                    className="rounded-xl border border-[#E8E3DA] bg-white px-4 py-2 text-xs font-semibold text-[#5C554B] hover:bg-[#FAF8F5] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteCampaign}
                    disabled={deletingCampaign}
                    className="flex items-center gap-2 rounded-xl bg-[#9A2D2D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7D2424] transition shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {deletingCampaign ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
