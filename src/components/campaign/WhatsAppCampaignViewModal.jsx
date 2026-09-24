import React from 'react';
import { X, Send, Calendar, Workflow, Boxes, ShieldAlert, Edit2, CheckCircle2, Clock, PauseCircle } from 'lucide-react';

export default function WhatsAppCampaignViewModal({
  isOpen,
  onClose,
  item,
  onEdit,
}) {
  if (!isOpen || !item) return null;

  const name = item.whats_app_campaign_name || item.name || 'WhatsApp Campaign';
  const pipeline = item.pipeline?.pipeline_name || item.pipeline_name || `Pipeline #${item.whats_app_campaign_pipeline_id}`;
  const date = item.whats_app_campaign_date || item.date || '—';
  const status = item.whats_app_campaign_status || item.status || 'Pending';
  const holiday = item.whats_app_campaign_holiday || 'Yes';

  // Group parsing
  let groups = [];
  if (Array.isArray(item.groups)) groups = item.groups;
  else if (Array.isArray(item.group)) groups = item.group;
  else if (typeof item.whats_app_campaign_group === 'string' && item.whats_app_campaign_group.trim()) {
    groups = item.whats_app_campaign_group.split(',');
  }

  const getStatusBadge = (st) => {
    if (st === 'Sent') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EBF7EE] text-[#1E7E34] border border-[#C3E6CB]">
          <CheckCircle2 className="h-3 w-3" />
          Sent
        </span>
      );
    }
    if (st === 'Hold') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FDF0F0] text-[#9A2D2D] border border-[#F6C8C8]">
          <PauseCircle className="h-3 w-3" />
          On Hold
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFF9E6] text-[#9E7432] border border-[#FCE8AE]">
        <Clock className="h-3 w-3" />
        Pending
      </span>
    );
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fade-in overflow-y-auto"
    >
      <div className="w-full max-w-lg rounded-2xl border border-[#E8E3DA] bg-[#FCFBFA] shadow-2xl relative my-auto flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E3DA] bg-[#FAF8F5] rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#EBF7EE] text-[#1E7E34] border border-[#C3E6CB] flex items-center justify-center flex-shrink-0">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-bold text-[#1A1817] tracking-tight truncate max-w-[220px] sm:max-w-xs">
                  {name}
                </h3>
                {getStatusBadge(status)}
              </div>
              <p className="text-[11px] text-[#78716C] mt-0.5">
                WhatsApp Automated Broadcast
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

        {/* Content Body */}
        <div className="p-6 space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Pipeline */}
            <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E8E3DA]">
              <span className="text-[10px] font-semibold tracking-wider text-[#8C8275] uppercase block mb-1">
                Connected Pipeline
              </span>
              <div className="flex items-center gap-2">
                <Workflow className="h-4 w-4 text-[#9E7432]" />
                <span className="text-xs font-semibold text-[#1A1817] truncate">{pipeline}</span>
              </div>
            </div>

            {/* Scheduled Date */}
            <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E8E3DA]">
              <span className="text-[10px] font-semibold tracking-wider text-[#8C8275] uppercase block mb-1">
                Launch / Send Date
              </span>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#9E7432]" />
                <span className="text-xs font-semibold text-[#1A1817]">{date}</span>
              </div>
            </div>
          </div>

          {/* Holiday Rule */}
          <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E8E3DA] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-[#9E7432]" />
              <span className="text-xs font-semibold text-[#1A1817]">Pause on Official Holidays</span>
            </div>
            <span className="text-xs font-bold text-[#1A1817] bg-white px-2 py-0.5 rounded border border-[#E2DDD5]">
              {holiday === 'Yes' ? 'Enabled (Yes)' : 'Disabled (No)'}
            </span>
          </div>

          {/* Target Groups */}
          {groups.length > 0 && (
            <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E8E3DA]">
              <span className="text-[10px] font-semibold tracking-wider text-[#8C8275] uppercase block mb-2">
                Target Customer Groups
              </span>
              <div className="flex flex-wrap gap-1.5">
                {groups.map((g, idx) => {
                  const gName = typeof g === 'object' ? (g.group_name || g.name || `#${g.id}`) : `Group #${g}`;
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#DDD7CD] text-xs font-medium text-[#4A443D]"
                    >
                      <Boxes className="h-3 w-3 text-[#9E7432]" />
                      <span>{gName}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#FAF8F5] border-t border-[#E8E3DA] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#DDD7CD] bg-white hover:bg-[#EFECE6] text-xs font-medium text-[#4A443D] transition cursor-pointer"
          >
            Close
          </button>

          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(item);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Edit2 className="h-3.5 w-3.5 text-[#C99C4B]" />
              <span>Edit Campaign</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
