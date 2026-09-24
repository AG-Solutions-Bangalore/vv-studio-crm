import React from 'react';
import { X, Building2, Edit2, CheckCircle2, XCircle } from 'lucide-react';

export default function ClientViewModal({
  isOpen,
  onClose,
  item,
  imageUrl,
  onEdit,
}) {
  if (!isOpen || !item) return null;

  const name = item.clients_name || item.client_name || item.name || 'Client Partner';
  const status = item.clients_status || item.status || 'Active';
  const isActive = status === 'Active';

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fade-in overflow-y-auto"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#E8E3DA] bg-[#FCFBFA] shadow-2xl relative my-auto flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E3DA] bg-[#FAF8F5] rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-2.5">
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

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-[#78716C] hover:text-[#1A1817] hover:bg-[#EFECE6] border border-[#E2DDD5] bg-white transition cursor-pointer shadow-2xs flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Logo Preview Box */}
        <div className="p-6 text-center space-y-4">
          <div className="flex items-center justify-center h-40 bg-[#F7F4EE] rounded-xl border border-[#E8E3DA] p-4">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                className="max-h-32 max-w-full object-contain"
              />
            ) : (
              <Building2 className="h-12 w-12 text-[#9E7432] opacity-50" />
            )}
          </div>

          <div>
            <h3 className="font-display text-lg font-bold text-[#1A1817] tracking-tight">
              {name}
            </h3>
          </div>
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
              <span>Edit Client</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
