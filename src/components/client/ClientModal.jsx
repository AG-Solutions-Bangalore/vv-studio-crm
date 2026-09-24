import React, { useState, useEffect, useRef } from 'react';
import { X, Building2, Upload, Save, AlertCircle, RefreshCw } from 'lucide-react';

export default function ClientModal({
  isOpen,
  onClose,
  onSubmit,
  form,
  setForm,
  editingId,
  submitting,
}) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileError, setFileError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFileError('');
      if (form.clients_image instanceof File) {
        const objectUrl = URL.createObjectURL(form.clients_image);
        setPreviewUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
      } else if (form.existing_image_url) {
        setPreviewUrl(form.existing_image_url);
      } else {
        setPreviewUrl(null);
      }
    } else {
      setPreviewUrl(null);
      setFileError('');
    }
  }, [isOpen, form.clients_image, form.existing_image_url]);

  if (!isOpen) return null;

  const handleFileChange = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFileError('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFileError('Logo file size must be less than 10MB.');
      return;
    }

    setFileError('');
    setForm((prev) => ({
      ...prev,
      clients_image: file,
    }));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleClearImage = () => {
    setForm((prev) => ({
      ...prev,
      clients_image: null,
      existing_image_url: null,
    }));
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!form.clients_name?.trim()) {
      setFileError('Please enter the client or partner company name.');
      return;
    }
    if (!editingId && !form.clients_image) {
      setFileError('Please select a client logo image.');
      return;
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
      <div className="w-full max-w-lg rounded-2xl border border-[#E8E3DA] bg-[#FCFBFA] shadow-2xl relative my-auto flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E3DA] bg-[#FAF8F5] rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] flex items-center justify-center flex-shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-[#1A1817] tracking-tight">
                {editingId ? 'Edit Client Logo' : 'Add Client / Partner'}
              </h3>
              <p className="text-xs text-[#78716C]">
                {editingId ? 'Update partner details or brand logo' : 'Add client brand logo to your showcase partners section'}
              </p>
            </div>
          </div>

          {/* Prominent Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-[#78716C] hover:text-[#1A1817] hover:bg-[#EFECE6] border border-[#E2DDD5] bg-white transition cursor-pointer shadow-2xs flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            
            {/* Client Name */}
            <div>
              <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                Client / Partner Name <span className="text-[#9A2D2D]">*</span>
              </label>
              <input
                type="text"
                name="clients_name"
                value={form.clients_name || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, clients_name: e.target.value }))}
                placeholder="Enter client or partner company name"
                required
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs"
              />
            </div>

            {/* Logo Upload Dropzone */}
            <div>
              <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                Client Logo Image {!editingId && <span className="text-[#9A2D2D]">*</span>}
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0])}
              />

              {previewUrl ? (
                <div className="relative rounded-xl border border-[#E2DDD5] bg-[#F7F4EE] p-3 overflow-hidden group">
                  <div className="flex items-center justify-center h-36 rounded-lg bg-white p-4 border border-[#E8E3DA]">
                    <img
                      src={previewUrl}
                      alt="Client Logo Preview"
                      className="max-h-28 max-w-full object-contain"
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-[#78716C] truncate max-w-[220px]">
                      {form.clients_image instanceof File ? form.clients_image.name : 'Current Logo'}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#DDD7CD] bg-white hover:bg-[#EFECE6] text-[11px] font-medium text-[#4A443D] transition cursor-pointer"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={handleClearImage}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#F6C8C8] bg-[#FDF0F0] hover:bg-[#FBEAEA] text-[11px] font-medium text-[#9A2D2D] transition cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-7 text-center cursor-pointer transition-all ${
                    dragActive
                      ? 'border-[#C99C4B] bg-[#FBF7EE]'
                      : 'border-[#DDD7CD] bg-[#FAF8F5] hover:border-[#C99C4B] hover:bg-[#F7F4EE]'
                  }`}
                >
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#F5EFE3] text-[#9E7432] mb-2.5">
                    <Upload className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold text-[#1A1817]">
                    Click to browse or drag and drop logo
                  </p>
                  <p className="text-[11px] text-[#8C8275] mt-0.5">
                    Recommended: PNG or SVG with transparent background
                  </p>
                </div>
              )}

              {fileError && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-[#9A2D2D]">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{fileError}</span>
                </div>
              )}
            </div>

            {/* Status selector (Editing mode) */}
            {editingId && (
              <div>
                <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                  Display Status
                </label>
                <select
                  name="clients_status"
                  value={form.clients_status || 'Active'}
                  onChange={(e) => setForm((prev) => ({ ...prev, clients_status: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            )}

          </div>

          {/* Sticky Modal Footer */}
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
              <span>{submitting ? 'Saving...' : editingId ? 'Update Client' : 'Add Client'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
