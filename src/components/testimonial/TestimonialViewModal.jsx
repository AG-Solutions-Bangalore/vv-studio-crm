import React from 'react';
import { X, Star, Quote, Edit2, Calendar, CheckCircle2, XCircle, User, Tag } from 'lucide-react';

export default function TestimonialViewModal({
  isOpen,
  onClose,
  item,
  onEdit,
}) {
  if (!isOpen || !item) return null;

  const clientName = item.testimonial_client_name || item.client_name || item.name || 'Anonymous Client';
  const category = item.testimonial_for || item.category || 'General';
  const rating = Number(item.testimonial_rating || item.rating || 5);
  const description = item.testimonial_description || item.description || item.comment || '';
  const status = item.testimonial_status || item.status || 'Active';
  const isActive = status === 'Active';
  const createdDate = item.testimonial_created_date || item.created_at || item.createdDate || item.date;

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
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1A1817] text-[#FAF8F5] text-sm font-bold shadow-xs flex-shrink-0">
              {clientName[0]?.toUpperCase() || 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-bold text-[#1A1817] tracking-tight">
                  {clientName}
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
              <p className="text-[11px] text-[#78716C] flex items-center gap-1 mt-0.5">
                <Tag className="h-3 w-3 text-[#9E7432]" />
                <span>{category}</span>
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
          
          {/* Rating Stars Banner */}
          <div className="flex items-center justify-between bg-[#FAF8F5] p-3 rounded-xl border border-[#E8E3DA]">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= rating
                      ? 'fill-[#D4A038] text-[#D4A038]'
                      : 'text-[#DDD7CD] fill-transparent'
                  }`}
                />
              ))}
            </div>
            <span className="font-mono text-xs font-bold text-[#9E7432]">
              {rating}.0 / 5.0 Rating
            </span>
          </div>

          {/* Testimonial Quote */}
          <div className="relative bg-[#FCFBFA] p-4 rounded-xl border border-[#F0ECE3]">
            <Quote className="h-8 w-8 text-[#EADEC7] absolute -top-3 -left-1 transform -scale-x-100 opacity-60" />
            <p className="text-xs sm:text-sm text-[#3D372E] leading-relaxed italic relative z-10 whitespace-pre-line pl-4">
              "{description}"
            </p>
          </div>

          {/* Metadata */}
          {createdDate && (
            <div className="flex items-center gap-1.5 text-[11px] text-[#8C8275] pt-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                Submitted on{' '}
                {(() => {
                  try {
                    const d = new Date(createdDate);
                    if (isNaN(d.getTime())) return String(createdDate);
                    const day = String(d.getDate()).padStart(2, '0');
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const year = d.getFullYear();
                    return `${day}-${month}-${year}`;
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
              <span>Edit Review</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
