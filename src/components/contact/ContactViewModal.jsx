import React from 'react';
import { X, User, Mail, Phone, MapPin, Boxes, Edit2, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';

export default function ContactViewModal({
  isOpen,
  onClose,
  item,
  onEdit,
}) {
  const { hasEmail, hasWhatsApp } = useAuthContext();
  if (!isOpen || !item) return null;

  const name = item.contact_name || item.name || 'Contact';
  const email = item.contact_email || item.email || '';
  const mobile = item.contact_mobile || item.mobile || item.phone || '';
  const address = item.contact_address || item.address || '';
  const status = item.contact_status || item.status || 'Active';
  const isActive = status === 'Active';
  const createdDate = item.created_at || item.createdDate || item.date;

  // Resolve groups list if present in item
  const groups = Array.isArray(item.groups)
    ? item.groups
    : Array.isArray(item.group)
    ? item.group
    : Array.isArray(item.group_ids)
    ? item.group_ids
    : [];

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
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1A1817] text-[#FAF8F5] text-base font-bold shadow-xs flex-shrink-0">
              {name[0]?.toUpperCase() || 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-bold text-[#1A1817] tracking-tight">
                  {name}
                </h3>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    isActive
                      ? 'bg-[#EBF7EE] text-[#1E7E34] border border-[#C3E6CB]'
                      : 'bg-[#FBEAEA] text-[#9A2D2D] border border-[#F5C6CB]'
                  }`}
                >
                  {isActive ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {status}
                </span>
              </div>
              <span className="font-mono text-[11px] text-[#8C8275]">
                Contact ID #{item.id}
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

        {/* Contact Info Body */}
        <div className="p-6 space-y-4">
          
          <div className={`grid grid-cols-1 ${hasEmail && hasWhatsApp ? 'sm:grid-cols-2' : ''} gap-3`}>
            {/* Phone */}
            {hasWhatsApp && (
              <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E8E3DA]">
                <span className="text-[10px] font-semibold tracking-wider text-[#8C8275] uppercase block mb-1">
                  Phone / Mobile
                </span>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#9E7432]" />
                  {mobile ? (
                    <a href={`tel:${mobile}`} className="text-xs font-semibold text-[#1A1817] hover:underline">
                      {mobile}
                    </a>
                  ) : (
                    <span className="text-xs text-[#8C8275]">—</span>
                  )}
                </div>
              </div>
            )}

            {/* Email */}
            {hasEmail && (
              <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E8E3DA]">
                <span className="text-[10px] font-semibold tracking-wider text-[#8C8275] uppercase block mb-1">
                  Email Address
                </span>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#9E7432]" />
                  {email ? (
                    <a href={`mailto:${email}`} className="text-xs font-semibold text-[#1A1817] hover:underline truncate">
                      {email}
                    </a>
                  ) : (
                    <span className="text-xs text-[#8C8275]">—</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Address */}
          {address && (
            <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E8E3DA]">
              <span className="text-[10px] font-semibold tracking-wider text-[#8C8275] uppercase block mb-1">
                Address / Location
              </span>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-[#9E7432] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#3D372E] leading-relaxed">{address}</p>
              </div>
            </div>
          )}

          {/* Assigned Groups */}
          {groups.length > 0 && (
            <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E8E3DA]">
              <span className="text-[10px] font-semibold tracking-wider text-[#8C8275] uppercase block mb-2">
                Assigned Product Groups
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

          {/* Timestamp */}
          {createdDate && (
            <div className="flex items-center gap-1.5 text-[11px] text-[#8C8275] pt-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                Created on{' '}
                {(() => {
                  try {
                    const d = new Date(createdDate);
                    if (isNaN(d.getTime())) return String(createdDate);
                    const day = String(d.getDate()).padStart(2, '0');
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    return `${day}/${month}/${d.getFullYear()}`;
                  } catch {
                    return String(createdDate);
                  }
                })()}
              </span>
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
              <span>Edit Contact</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
