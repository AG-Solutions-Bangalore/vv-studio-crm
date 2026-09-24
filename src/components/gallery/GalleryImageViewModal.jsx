import React from 'react';
import { X, CheckCircle2, XCircle } from 'lucide-react';

export default function GalleryImageViewModal({
  isOpen,
  onClose,
  item,
  imageUrl,
}) {
  if (!isOpen || !item) return null;

  const status = item.gallery_status || item.status || 'Active';
  const isActive = status === 'Active';

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 animate-fade-in overflow-y-auto"
    >
      <div className="w-full max-w-2xl rounded-2xl border border-[#E8E3DA] bg-[#FCFBFA] shadow-2xl overflow-hidden relative my-auto flex flex-col max-h-[90vh]">
        
        {/* Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E8E3DA] bg-[#FAF8F5] rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-semibold text-[#8C8275]">
              #{item.id}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                isActive
                  ? 'bg-[#EBF7EE] text-[#1E7E34] border border-[#C3E6CB]'
                  : 'bg-[#FBEAEA] text-[#9A2D2D] border border-[#F5C6CB]'
              }`}
            >
              {isActive ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
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

        {/* Image Display Area */}
        <div className="bg-[#121110] flex items-center justify-center p-4 min-h-[300px] max-h-[70vh] overflow-auto">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`Gallery item #${item.id}`}
              className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg"
            />
          ) : (
            <div className="text-center text-[#8C8275] py-12">
              <p className="text-xs">Image unavailable</p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 bg-[#FAF8F5] border-t border-[#E8E3DA] flex items-center justify-between text-xs text-[#78716C]">
          <span className="font-mono text-xs text-[#5C554B]">
            {item.gallery_image || `Photo #${item.id}`}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-[#DDD7CD] bg-white hover:bg-[#EFECE6] text-xs font-medium text-[#4A443D] transition cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
