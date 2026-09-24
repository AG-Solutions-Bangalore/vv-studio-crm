import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, Boxes, Save, Check } from 'lucide-react';
import { getActiveGroups } from '../../services/groupApi';
import { useAuthContext } from '../../context/AuthContext';

function extractList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.groups?.data)) return response.groups.data;
  if (Array.isArray(response?.groups)) return response.groups;
  return [];
}

export default function ContactModal({
  isOpen,
  onClose,
  onSubmit,
  form,
  setForm,
  editingId,
  submitting,
}) {
  const { hasEmail, hasWhatsApp } = useAuthContext();
  const [availableGroups, setAvailableGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  useEffect(() => {
    if (isOpen) {
      (async () => {
        setLoadingGroups(true);
        try {
          const res = await getActiveGroups();
          const list = extractList(res);
          setAvailableGroups(list);
        } catch (err) {
          // Fallback or empty
        } finally {
          setLoadingGroups(false);
        }
      })();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleGroupSelection = (groupId) => {
    const numId = Number(groupId);
    setForm((prev) => {
      const current = Array.isArray(prev.group_ids) ? prev.group_ids : [];
      const exists = current.includes(numId);
      const nextGroupIds = exists
        ? current.filter((id) => id !== numId)
        : [...current, numId];
      return { ...prev, group_ids: nextGroupIds };
    });
  };

  const isGroupSelected = (groupId) => {
    const current = Array.isArray(form.group_ids) ? form.group_ids : [];
    return current.includes(Number(groupId)) || current.includes(String(groupId));
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fade-in overflow-y-auto"
    >
      <div className="w-full max-w-lg rounded-2xl border border-[#E8E3DA] bg-[#FCFBFA] shadow-2xl relative my-auto flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E3DA] bg-[#FAF8F5] rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] flex items-center justify-center flex-shrink-0">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-[#1A1817] tracking-tight">
                {editingId ? 'Edit Contact' : 'Add New Contact'}
              </h3>
              <p className="text-xs text-[#78716C]">
                {editingId ? 'Update customer profile and assigned product groups' : 'Create a new contact and assign to target groups'}
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
            {/* Contact Name */}
            <div>
              <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                Contact Name <span className="text-[#9A2D2D]">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9C9488]" />
                <input
                  type="text"
                  name="contact_name"
                  value={form.contact_name || ''}
                  onChange={handleInputChange}
                  placeholder="e.g. John Doe, Rajesh Kumar"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs"
                />
              </div>
            </div>

            {/* Email & Mobile */}
            <div className={`grid grid-cols-1 ${hasEmail && hasWhatsApp ? 'sm:grid-cols-2' : ''} gap-3.5`}>
              {hasEmail && (
                <div>
                  <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                    Email Address {!hasWhatsApp && <span className="text-[#9A2D2D]">*</span>}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9C9488]" />
                    <input
                      type="email"
                      name="contact_email"
                      value={form.contact_email || ''}
                      onChange={handleInputChange}
                      placeholder="name@example.com"
                      required={!hasWhatsApp}
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs"
                    />
                  </div>
                </div>
              )}

              {hasWhatsApp && (
                <div>
                  <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                    Mobile / Phone <span className="text-[#9A2D2D]">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9C9488]" />
                    <input
                      type="tel"
                      name="contact_mobile"
                      value={form.contact_mobile || ''}
                      onChange={handleInputChange}
                      placeholder="9876543210"
                      required
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                Address / City
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-[#9C9488]" />
                <textarea
                  name="contact_address"
                  rows={2}
                  value={form.contact_address || ''}
                  onChange={handleInputChange}
                  placeholder="e.g. 123 MG Road, Indiranagar, Bangalore"
                  className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs resize-y"
                />
              </div>
            </div>

            {/* Group Multi-Select Pills */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#3D372E] flex items-center gap-1">
                  <Boxes className="h-3.5 w-3.5 text-[#9E7432]" />
                  <span>Assign Product Groups <span className="text-[#9A2D2D]">*</span></span>
                </label>
                <span className={`text-[11px] font-medium ${form.group_ids?.length > 0 ? 'text-[#1E7E34]' : 'text-[#9A2D2D]'}`}>
                  {form.group_ids?.length > 0
                    ? `${form.group_ids.length} selected`
                    : 'Required (select at least 1)'}
                </span>
              </div>

              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E3DA] min-h-[60px] max-h-36 overflow-y-auto">
                {loadingGroups ? (
                  <p className="text-xs text-[#8C8275] py-2 text-center">Loading groups...</p>
                ) : availableGroups.length === 0 ? (
                  <p className="text-xs text-[#8C8275] py-2 text-center">No groups available. You can add groups in the Groups section.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {availableGroups.map((group) => {
                      const selected = isGroupSelected(group.id);
                      const groupName = group.group_name || group.name;

                      return (
                        <button
                          key={group.id}
                          type="button"
                          onClick={() => toggleGroupSelection(group.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                            selected
                              ? 'bg-[#1A1817] text-[#FAF8F5] shadow-xs'
                              : 'bg-white text-[#4A443D] border border-[#DDD7CD] hover:bg-[#EFECE6]'
                          }`}
                        >
                          {selected && <Check className="h-3 w-3 text-[#C99C4B]" />}
                          <span>{groupName}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Status selector (Editing mode) */}
            {editingId && (
              <div>
                <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                  Contact Status
                </label>
                <select
                  name="contact_status"
                  value={form.contact_status || 'Active'}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            )}
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
              <span>{submitting ? 'Saving...' : editingId ? 'Update Contact' : 'Save Contact'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
