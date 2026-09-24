import React, { useState, useEffect } from 'react';
import { X, Mail, MessageSquare, LayoutTemplate, Link, Save, AlertCircle } from 'lucide-react';
import TemplateCKEditor from './TemplateCKEditor';
import { useAuthContext } from '../../context/AuthContext';

export default function TemplateModal({
  isOpen,
  onClose,
  onSubmit,
  form,
  setForm,
  editingId,
  submitting,
}) {
  const { hasEmail, hasWhatsApp } = useAuthContext();
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      if (!editingId) {
        if (!hasEmail && hasWhatsApp && form.template_type !== 'WhatsApp') {
          setForm((prev) => ({
            ...prev,
            template_type: 'WhatsApp',
            template_url: null,
            template_design: null,
          }));
        } else if (hasEmail && !hasWhatsApp && form.template_type !== 'Email') {
          setForm((prev) => ({
            ...prev,
            template_type: 'Email',
            template_id: prev.template_name || '',
          }));
        }
      }
    }
  }, [isOpen, hasEmail, hasWhatsApp, editingId]);

  if (!isOpen) return null;

  const isEmail = form.template_type === 'Email';

  const handleTypeChange = (type) => {
    setForm((prev) => ({
      ...prev,
      template_type: type,
      // If switching to Email, auto sync template_id to template_name
      template_id: type === 'Email' ? prev.template_name : prev.template_id,
      template_url: type === 'WhatsApp' ? null : (prev.template_url || ''),
      template_design: type === 'WhatsApp' ? null : (prev.template_design || ''),
    }));
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setForm((prev) => ({
      ...prev,
      template_name: val,
      template_id: prev.template_type === 'Email' ? val : prev.template_id,
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.template_name?.trim()) {
      setErrorMsg('Please enter a template name.');
      return;
    }

    if (isEmail) {
      if (!form.template_url?.trim()) {
        setErrorMsg('Template URL is required for Email templates.');
        return;
      }
      if (!form.template_design?.trim()) {
        setErrorMsg('Template HTML design code is required for Email templates.');
        return;
      }
    } else {
      if (!form.template_id?.trim()) {
        setErrorMsg('WhatsApp Template ID is required for WhatsApp templates.');
        return;
      }
    }

    onSubmit(e);
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
              <LayoutTemplate className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-[#1A1817] tracking-tight">
                {editingId ? 'Edit Message Template' : 'Create Message Template'}
              </h3>
              <p className="text-xs text-[#78716C]">
                {editingId
                  ? 'Update template design and configuration'
                  : hasEmail && hasWhatsApp
                  ? 'Create reusable Email & WhatsApp campaign templates'
                  : hasEmail
                  ? 'Create reusable Email campaign templates'
                  : 'Create reusable WhatsApp campaign templates'}
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

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FDF0F0] border border-[#F6C8C8] text-[#9A2D2D] text-xs">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Template Type Selector */}
            {hasEmail && hasWhatsApp ? (
              <div>
                <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                  Template Type <span className="text-[#9A2D2D]">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('Email')}
                    className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                      isEmail
                        ? 'bg-[#1A1817] text-[#FAF8F5] border-[#1A1817] shadow-xs'
                        : 'bg-[#FAF8F5] text-[#5C554B] border-[#E2DDD5] hover:bg-[#F5EFE3]'
                    }`}
                  >
                    <Mail className={`h-4 w-4 ${isEmail ? 'text-[#C99C4B]' : 'text-[#8C8275]'}`} />
                    <span>Email Template</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeChange('WhatsApp')}
                    className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                      !isEmail
                        ? 'bg-[#1A1817] text-[#FAF8F5] border-[#1A1817] shadow-xs'
                        : 'bg-[#FAF8F5] text-[#5C554B] border-[#E2DDD5] hover:bg-[#F5EFE3]'
                    }`}
                  >
                    <MessageSquare className={`h-4 w-4 ${!isEmail ? 'text-[#25D366]' : 'text-[#8C8275]'}`} />
                    <span>WhatsApp Template</span>
                  </button>
                </div>
              </div>
            ) : null}

            {/* Template Name & ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                  Template Name <span className="text-[#9A2D2D]">*</span>
                </label>
                <input
                  type="text"
                  name="template_name"
                  value={form.template_name || ''}
                  onChange={handleNameChange}
                  placeholder={isEmail ? 'e.g. Wedding Welcome Email' : 'e.g. order_delivery_update'}
                  required
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                  Template ID {isEmail ? <span className="text-[11px] text-[#8C8275] font-normal">• Auto-synced with name</span> : <span className="text-[#9A2D2D]">*</span>}
                </label>
                <input
                  type="text"
                  name="template_id"
                  value={isEmail ? form.template_name || '' : form.template_id || ''}
                  onChange={handleInputChange}
                  readOnly={isEmail}
                  placeholder={isEmail ? 'Matches template name' : 'e.g. invitation_followup_v1'}
                  required={!isEmail}
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border transition shadow-2xs font-mono ${
                    isEmail
                      ? 'border-[#E8E3DA] bg-[#F0ECE3]/60 text-[#78716C] cursor-not-allowed'
                      : 'border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white'
                  }`}
                />
              </div>
            </div>

            {/* Email-Only Fields: Template URL & Template Design */}
            {isEmail && (
              <>
                {/* Template URL */}
                <div>
                  <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                    Template Preview / Webview URL <span className="text-[#9A2D2D]">*</span>
                  </label>
                  <div className="relative">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9C9488]" />
                    <input
                      type="url"
                      name="template_url"
                      value={form.template_url || ''}
                      onChange={handleInputChange}
                      placeholder="https://easemarketing.in/templates/sample-preview.html"
                      required={isEmail}
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs"
                    />
                  </div>
                </div>

                {/* Template Design Content (CKEditor for Email) */}
                <div>
                  <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                    Template Design & Content <span className="text-[#9A2D2D]">*</span>
                  </label>

                  <div className="space-y-1">
                    <TemplateCKEditor
                      value={form.template_design || ''}
                      onChange={(htmlContent) => {
                        setForm((prev) => ({ ...prev, template_design: htmlContent }));
                      }}
                      placeholder="Compose your rich email template design..."
                    />
                  </div>
                </div>
              </>
            )}

            {/* Status selector (Editing mode) */}
            {editingId && (
              <div>
                <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                  Template Status
                </label>
                <select
                  name="template_status"
                  value={form.template_status || 'Active'}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            )}

          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3.5 bg-[#FAF8F5] border-t border-[#E8E3DA] flex items-center justify-end gap-3 rounded-b-2xl flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#DDD7CD] bg-white hover:bg-[#EFECE6] text-xs font-medium text-[#4A443D] transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-xs font-semibold shadow-xs transition active:scale-95 disabled:bg-[#A39C91] cursor-pointer"
            >
              <Save className="h-3.5 w-3.5 text-[#C99C4B]" />
              <span>{submitting ? 'Saving...' : editingId ? 'Update Template' : 'Create Template'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
