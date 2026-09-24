import React from 'react';
import { X, MessageSquare, Globe, Tag } from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';

function getStatusBadge(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'completed') {
    return 'bg-[#EDF7EE] text-[#1E6B34] border-[#C6E6CC]';
  }
  if (s === 'processing') {
    return 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]';
  }
  if (s === 'cancel' || s === 'cancelled') {
    return 'bg-[#FDF0F0] text-[#9A2D2D] border-[#F6C8C8]';
  }
  return 'bg-[#FEF6E9] text-[#9A6218] border-[#FAD8A5]';
}

export default function EnquiryDetailsModal({ isOpen, onClose, enquiry, loading }) {
  const { hasEmail, hasWhatsApp } = useAuthContext();
  if (!isOpen) return null;

  const id = enquiry?.id;
  const status = enquiry?.enquiryStatus || enquiry?.enquiry_status || enquiry?.status || 'Pending';
  const name = enquiry?.enquiryFullName || enquiry?.full_name || enquiry?.fullName || enquiry?.name || 'N/A';
  const mobile = enquiry?.enquiryMobile || enquiry?.mobile || 'N/A';
  const email = enquiry?.enquiryEmail || enquiry?.email || 'N/A';
  const service = enquiry?.enquiryService || enquiry?.service || enquiry?.service_name || 'N/A';
  const enquiryFrom = enquiry?.enquiryFrom || enquiry?.enquiry_from || '';
  const message = enquiry?.enquiryMessage || enquiry?.message || 'No message provided.';
  const utmMedium = enquiry?.utm_medium || '';
  const utmSource = enquiry?.utm_source || '';
  const utmCampaign = enquiry?.utm_campaign || '';

  const hasUtm = Boolean(utmSource || utmMedium || utmCampaign);

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
            <div className="h-10 w-10 rounded-xl bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] flex items-center justify-center flex-shrink-0">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-[#1A1817] tracking-tight">
                Enquiry #{id || ''}
              </h3>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border mt-0.5 ${getStatusBadge(status)}`}>
                {status}
              </span>
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

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          {loading ? (
            <div className="py-12 text-center text-[#78716C]">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1A1817] border-t-transparent mx-auto mb-2" />
              <span className="text-xs">Fetching enquiry details...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E3DA]">
                  <span className="text-xs uppercase font-semibold text-[#8C8275] block mb-1">Full Name</span>
                  <span className="font-semibold text-[#1A1817] text-sm">{name}</span>
                </div>

                {hasWhatsApp && (
                  <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E3DA]">
                    <span className="text-xs uppercase font-semibold text-[#8C8275] block mb-1">Mobile</span>
                    <span className="font-semibold text-[#1A1817] text-sm font-mono">{mobile}</span>
                  </div>
                )}

                {hasEmail && (
                  <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E3DA]">
                    <span className="text-xs uppercase font-semibold text-[#8C8275] block mb-1">Email</span>
                    <span className="font-semibold text-[#1A1817] text-sm break-all">{email}</span>
                  </div>
                )}

                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E3DA]">
                  <span className="text-xs uppercase font-semibold text-[#8C8275] block mb-1">Service</span>
                  <span className="font-semibold text-[#1A1817] text-sm">{service}</span>
                </div>
              </div>

              {enquiryFrom && (
                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E3DA]">
                  <span className="text-xs uppercase font-semibold text-[#8C8275] block mb-1 flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-[#9E7432]" />
                    <span>Enquiry From</span>
                  </span>
                  <p className="text-[#3D372E] text-xs font-medium leading-relaxed break-all bg-white p-2 rounded-lg border border-[#E8E3DA]">
                    {enquiryFrom}
                  </p>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E3DA]">
                <span className="text-xs uppercase font-semibold text-[#8C8275] block mb-1">Message</span>
                <p className="text-[#3D372E] text-sm leading-relaxed whitespace-pre-wrap">{message}</p>
              </div>

              {hasUtm && (
                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E3DA] space-y-2">
                  <span className="text-xs uppercase font-semibold text-[#8C8275] block flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-[#9E7432]" />
                    <span>Campaign & Tracking (UTM)</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <div className="bg-white p-2.5 rounded-lg border border-[#E8E3DA]">
                      <span className="text-[10px] uppercase font-bold text-[#8C8275] block">Source</span>
                      <span className="text-xs font-medium text-[#1A1817] font-mono">{utmSource || '—'}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-[#E8E3DA]">
                      <span className="text-[10px] uppercase font-bold text-[#8C8275] block">Medium</span>
                      <span className="text-xs font-medium text-[#1A1817] font-mono">{utmMedium || '—'}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-[#E8E3DA]">
                      <span className="text-[10px] uppercase font-bold text-[#8C8275] block">Campaign</span>
                      <span className="text-xs font-medium text-[#1A1817] font-mono">{utmCampaign || '—'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="px-6 py-3.5 bg-[#FAF8F5] border-t border-[#E8E3DA] flex justify-end rounded-b-2xl flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-[#DDD7CD] bg-white hover:bg-[#EFECE6] text-xs font-medium text-[#4A443D] transition cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
