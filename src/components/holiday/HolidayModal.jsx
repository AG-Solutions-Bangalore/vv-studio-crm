import React from 'react';
import { X, CalendarDays, Save, Calendar as CalendarIcon } from 'lucide-react';

export default function HolidayModal({
  isOpen,
  onClose,
  onSubmit,
  form,
  onChange,
  setForm,
  editingId,
  submitting,
}) {
  if (!isOpen) return null;

  const setDateShortcut = (daysFromToday) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromToday);
    const isoString = d.toISOString().split('T')[0];
    setForm((prev) => ({ ...prev, holiday_date: isoString }));
  };

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
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] flex items-center justify-center flex-shrink-0">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-[#1A1817] tracking-tight">
                {editingId ? 'Edit Holiday' : 'Add Official Holiday'}
              </h3>
              <p className="text-xs text-[#78716C]">
                {editingId ? 'Update holiday date or label' : 'Mark non-working days on the system calendar'}
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

        <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {/* Holiday Date */}
            <div>
              <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                Holiday Date <span className="text-[#9A2D2D]">*</span>
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9C9488]" />
                <input
                  type="date"
                  name="holiday_date"
                  value={form.holiday_date || ''}
                  onChange={onChange}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition-all shadow-2xs"
                />
              </div>

              {/* Quick date chips */}
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[11px] text-[#8C8275]">Quick select:</span>
                <button
                  type="button"
                  onClick={() => setDateShortcut(0)}
                  className="text-[11px] px-2 py-0.5 rounded-md border border-[#E2DDD5] bg-white hover:bg-[#F5EFE3] text-[#5C554B] transition cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setDateShortcut(1)}
                  className="text-[11px] px-2 py-0.5 rounded-md border border-[#E2DDD5] bg-white hover:bg-[#F5EFE3] text-[#5C554B] transition cursor-pointer"
                >
                  Tomorrow
                </button>
              </div>
            </div>

            {/* Optional Holiday Name / Description */}
            <div>
              <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                Holiday Name / Reason
              </label>
              <input
                type="text"
                name="holiday_name"
                value={form.holiday_name || ''}
                onChange={onChange}
                placeholder="e.g. Diwali Festival, National Day, Annual Maintenance"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="px-6 py-3.5 bg-[#FAF8F5] border-t border-[#E8E3DA] flex items-center justify-end gap-3 rounded-b-2xl flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#DDD7CD] bg-white hover:bg-[#EFECE6] text-xs font-medium text-[#4A443D] transition cursor-pointer shadow-2xs"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-xs font-semibold shadow-xs transition active:scale-95 disabled:bg-[#A39C91] cursor-pointer"
            >
              <Save className="h-3.5 w-3.5 text-[#C99C4B]" />
              <span>{submitting ? 'Saving...' : editingId ? 'Update Holiday' : 'Add Holiday'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
