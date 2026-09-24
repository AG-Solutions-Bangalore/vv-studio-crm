import React, { useState } from 'react';
import { X, HelpCircle, ChevronDown, ChevronUp, Edit2, Calendar, CheckCircle2, XCircle } from 'lucide-react';

export default function FaqViewModal({
  isOpen,
  onClose,
  item,
  onEdit,
}) {
  const [expandedIndex, setExpandedIndex] = useState(0);

  if (!isOpen || !item) return null;

  const faqFor = item.faq_for || item.title || item.category || 'General FAQ';
  const status = item.faq_status || item.status || 'Active';
  const isActive = status === 'Active';
  const subs = item.subs || item.sub || item.faq_subs || [];

  const toggleExpand = (idx) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fade-in overflow-y-auto"
    >
      <div className="w-full max-w-2xl rounded-2xl border border-[#E8E3DA] bg-[#FCFBFA] shadow-2xl relative my-auto flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E3DA] bg-[#FAF8F5] rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] flex items-center justify-center flex-shrink-0">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base sm:text-lg font-bold text-[#1A1817] tracking-tight">
                  {faqFor}
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
              <p className="text-xs text-[#78716C]">
                {subs.length} {subs.length === 1 ? 'question' : 'questions'} in this FAQ section
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

        {/* Accordion Questions List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {subs.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#8C8275]">
              No questions found under this FAQ section.
            </div>
          ) : (
            subs.map((sub, idx) => {
              const isExpanded = expandedIndex === idx;
              const subStatus = sub.faq_status || 'Active';
              const isSubActive = subStatus === 'Active';

              return (
                <div
                  key={sub.id || idx}
                  className="rounded-xl border border-[#E8E3DA] bg-white overflow-hidden shadow-2xs transition"
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(idx)}
                    className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#FAF8F5] transition cursor-pointer gap-3"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FBF4E8] text-[#9E7432] font-mono text-[11px] font-bold flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div>
                        {sub.faq_heading && (
                          <span className="text-[10px] font-semibold text-[#8C8275] uppercase tracking-wider block">
                            {sub.faq_heading}
                          </span>
                        )}
                        <h4 className="text-xs font-semibold text-[#1A1817] tracking-tight">
                          {sub.faq_que || 'Untitled Question'}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          isSubActive ? 'bg-[#EBF7EE] text-[#1E7E34]' : 'bg-[#FBEAEA] text-[#9A2D2D]'
                        }`}
                      >
                        {subStatus}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-[#8C8275]" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-[#8C8275]" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-[#F0ECE3] bg-[#FCFBFA] text-xs text-[#4A443D] leading-relaxed whitespace-pre-line pl-10">
                      {sub.faq_ans || 'No answer content provided.'}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#FAF8F5] border-t border-[#E8E3DA] flex items-center justify-end gap-2.5 rounded-b-2xl flex-shrink-0">
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
              <span>Edit FAQ</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
