import React from 'react';
import { Trash2 } from 'lucide-react';

function DeleteConfirmModal({ isOpen, onClose, onConfirm, title = 'Delete Item', message = 'Are you sure you want to delete this item? This action cannot be undone.', submitting = false }) {
  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fade-in"
    >
      <div className="w-full max-w-sm rounded-2xl border border-[#E8E3DA] bg-[#FCFBFA] p-6 shadow-2xl text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FDF0F0] text-[#9A2D2D] border border-[#F6C8C8]">
          <Trash2 className="h-5 w-5" />
        </div>

        <h3 className="font-display text-lg font-bold text-[#1A1817] tracking-tight">{title}</h3>
        <p className="mt-1.5 text-xs text-[#7A7369] leading-relaxed">
          {message}
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={onConfirm}
            className="flex-1 rounded-full bg-[#9A2D2D] hover:bg-[#822424] py-2.5 text-xs font-semibold text-white shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Deleting...' : 'Delete'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-[#DDD7CD] bg-[#FAF8F5] hover:bg-[#EFECE6] py-2.5 text-xs font-semibold text-[#4A443D] shadow-2xs transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;

