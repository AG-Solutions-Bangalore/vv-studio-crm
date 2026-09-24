import React, { useState } from 'react';
import { X, Mail, Calendar, Users, FileText, CheckCircle2, ShieldAlert, Trash2, Loader2, Sparkles, Send, Clock } from 'lucide-react';
import { deleteEmailCampaignSub } from '../../services/emailCampaignApi';
import toast from 'react-hot-toast';

export default function EmailCampaignViewModal({
  isOpen,
  onClose,
  campaign,
  onSubDeleted,
}) {
  const [deletingSubId, setDeletingSubId] = useState(null);

  if (!isOpen || !campaign) return null;

  const name = campaign.email_campaign_name || campaign.name || 'Unnamed Campaign';
  const subject = campaign.email_campaign_subject || campaign.subject || 'No Subject';
  const date = campaign.email_campaign_date || campaign.date || '—';
  const holiday = campaign.email_campaign_holiday || campaign.holiday || 'Yes';
  const status = campaign.email_campaign_status || campaign.status || 'Pending';
  const templateName = campaign.template?.template_name || campaign.template_name || campaign.email_campaign_template_id || '—';
  const groups = campaign.groups || campaign.email_campaign_group || [];
  const subs = campaign.subs || campaign.recipients || campaign.contacts || [];

  const getStatusBadge = (st) => {
    const val = String(st || '').toLowerCase();
    if (val === 'sent') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#EBF3EC] px-2.5 py-1 text-xs font-semibold text-[#2D5A34]">
          <CheckCircle2 className="h-3 w-3" /> Sent
        </span>
      );
    }
    if (val === 'hold') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#FBF0EA] px-2.5 py-1 text-xs font-semibold text-[#8F4E24]">
          <ShieldAlert className="h-3 w-3" /> Hold
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#F3EFE6] px-2.5 py-1 text-xs font-semibold text-[#6E5D4B]">
        <Clock className="h-3 w-3" /> Pending
      </span>
    );
  };

  const handleDeleteSubItem = async (subId) => {
    if (!window.confirm('Are you sure you want to remove this contact from the campaign?')) {
      return;
    }

    setDeletingSubId(subId);
    try {
      await deleteEmailCampaignSub(subId);
      toast.success('Contact removed from campaign execution.');
      if (onSubDeleted) onSubDeleted(subId);
    } catch (err) {
      console.error('Delete sub failed:', err);
      toast.error('Failed to remove contact from campaign.');
    } finally {
      setDeletingSubId(null);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-[#FAF8F5] shadow-2xl border border-[#E8E3DA] flex flex-col max-h-[90vh] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8E3DA] px-6 py-4 bg-white/60 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1A1817] text-[#C99C4B] shadow-2xs flex-shrink-0">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#1A1817]">{name}</h2>
                {getStatusBadge(status)}
              </div>
              <p className="text-xs text-[#8C8275]">Email Campaign Overview & Execution Details</p>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Subject banner */}
          <div className="rounded-xl border border-[#E8E3DA] bg-white p-4 shadow-2xs">
            <p className="text-[11px] font-semibold tracking-wide uppercase text-[#8C8275]">Subject Line</p>
            <p className="mt-1 text-sm font-semibold text-[#1A1817]">{subject}</p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-[#E8E3DA] bg-white p-3.5 shadow-2xs">
              <div className="flex items-center gap-2 text-[#8C8275] mb-1">
                <Calendar className="h-3.5 w-3.5 text-[#C99C4B]" />
                <span className="text-[11px] font-semibold uppercase tracking-wider">Scheduled Date</span>
              </div>
              <p className="text-xs font-semibold text-[#1A1817]">{date}</p>
            </div>

            <div className="rounded-xl border border-[#E8E3DA] bg-white p-3.5 shadow-2xs">
              <div className="flex items-center gap-2 text-[#8C8275] mb-1">
                <FileText className="h-3.5 w-3.5 text-[#C99C4B]" />
                <span className="text-[11px] font-semibold uppercase tracking-wider">Template</span>
              </div>
              <p className="text-xs font-semibold text-[#1A1817] truncate">{templateName}</p>
            </div>

            <div className="rounded-xl border border-[#E8E3DA] bg-white p-3.5 shadow-2xs">
              <div className="flex items-center gap-2 text-[#8C8275] mb-1">
                <ShieldAlert className="h-3.5 w-3.5 text-[#C99C4B]" />
                <span className="text-[11px] font-semibold uppercase tracking-wider">Holiday Rule</span>
              </div>
              <p className="text-xs font-semibold text-[#1A1817]">
                {holiday === 'Yes' ? 'Skip on Holiday' : 'Ignore Holiday'}
              </p>
            </div>
          </div>

          {/* Target Groups */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8C8275] mb-2.5">
              Assigned Contact Groups
            </h3>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(groups) && groups.length > 0 ? (
                groups.map((grp, idx) => {
                  const grpName = typeof grp === 'object' ? (grp.group_name || grp.name) : grp;
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8E3DA] bg-white px-3 py-1.5 text-xs font-medium text-[#1A1817] shadow-2xs"
                    >
                      <Users className="h-3.5 w-3.5 text-[#C99C4B]" />
                      {grpName}
                    </span>
                  );
                })
              ) : (
                <p className="text-xs text-[#8C8275] italic">No specific groups listed.</p>
              )}
            </div>
          </div>

          {/* Sub Execution / Recipient Items if available */}
          {subs && subs.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8C8275]">
                  Campaign Recipients ({subs.length})
                </h3>
              </div>

              <div className="rounded-xl border border-[#E8E3DA] bg-white divide-y divide-[#E8E3DA] max-h-56 overflow-y-auto">
                {subs.map((subItem) => (
                  <div key={subItem.id} className="flex items-center justify-between px-3.5 py-2.5 hover:bg-[#FAF8F5] transition">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#1A1817] truncate">
                        {subItem.contact_name || subItem.name || subItem.email_campaign_sub_name || `Recipient #${subItem.id}`}
                      </p>
                      <p className="text-[11px] text-[#8C8275] truncate">
                        {subItem.contact_email || subItem.email || subItem.email_campaign_sub_email || '—'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubItem(subItem.id)}
                      disabled={deletingSubId === subItem.id}
                      title="Remove contact from this campaign"
                      className="p-1.5 text-[#8C8275] hover:text-[#9A2D2D] hover:bg-[#FBEAEA] rounded-lg transition cursor-pointer disabled:opacity-50"
                    >
                      {deletingSubId === subItem.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-[#9A2D2D]" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-[#E8E3DA] px-6 py-4 bg-white/60">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#1A1817] px-5 py-2 text-xs font-semibold text-[#FAF8F5] hover:bg-[#2E2A27] transition shadow-xs cursor-pointer"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
}

function ClockIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
