import React, { useState, useEffect, useRef } from 'react';
import { X, Image as ImageIcon, Upload, Save, AlertCircle, Plus, Trash2, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function GalleryModal({
  isOpen,
  onClose,
  onSubmit,
  form,
  setForm,
  submitting,
  isEditing = false,
}) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedPreviews, setSelectedPreviews] = useState([]);
  const [fileError, setFileError] = useState('');

  // Synchronize previews when modal opens or form changes
  useEffect(() => {
    if (isOpen) {
      setFileError('');
      if (Array.isArray(form.gallery_images) && form.gallery_images.length > 0) {
        const previews = form.gallery_images.map((file) => ({
          file,
          id: `${file.name}-${file.lastModified}-${Math.random()}`,
          url: URL.createObjectURL(file),
          name: file.name,
          size: (file.size / 1024).toFixed(0),
        }));
        setSelectedPreviews(previews);

        return () => {
          previews.forEach((p) => URL.revokeObjectURL(p.url));
        };
      } else if (form.gallery_image instanceof File) {
        const singleObj = {
          file: form.gallery_image,
          id: `${form.gallery_image.name}-${form.gallery_image.lastModified}`,
          url: URL.createObjectURL(form.gallery_image),
          name: form.gallery_image.name,
          size: (form.gallery_image.size / 1024).toFixed(0),
        };
        setSelectedPreviews([singleObj]);
        return () => URL.revokeObjectURL(singleObj.url);
      } else {
        setSelectedPreviews([]);
      }
    } else {
      setSelectedPreviews([]);
      setFileError('');
    }
  }, [isOpen, form.gallery_image, form.gallery_images]);

  if (!isOpen) return null;

  const validateAndAddFiles = (fileList) => {
    if (!fileList || fileList.length === 0) return;

    const validFiles = [];
    let hasInvalidType = false;
    let hasOversized = false;

    Array.from(fileList).forEach((file) => {
      const isWebp = file.type === 'image/webp' || file.name.toLowerCase().endsWith('.webp');
      if (!isWebp) {
        hasInvalidType = true;
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        hasOversized = true;
        return;
      }
      validFiles.push(file);
    });

    if (hasInvalidType) {
      setFileError('Only WEBP images (.webp) are supported.');
    } else if (hasOversized) {
      setFileError('Some files exceed the 10MB limit and were skipped.');
    } else {
      setFileError('');
    }

    if (validFiles.length === 0) return;

    setForm((prev) => {
      const currentList = Array.isArray(prev.gallery_images) ? prev.gallery_images : [];
      const merged = isEditing ? [validFiles[0]] : [...currentList, ...validFiles];
      return {
        ...prev,
        gallery_images: merged,
        gallery_image: merged[0] || null,
      };
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (indexToRemove) => {
    setForm((prev) => {
      const currentList = Array.isArray(prev.gallery_images) ? prev.gallery_images : [];
      const updated = currentList.filter((_, idx) => idx !== indexToRemove);
      return {
        ...prev,
        gallery_images: updated,
        gallery_image: updated[0] || null,
      };
    });
  };

  const handleClearAll = () => {
    setForm((prev) => ({
      ...prev,
      gallery_images: [],
      gallery_image: null,
    }));
    setSelectedPreviews([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!isEditing) {
      const count = Array.isArray(form.gallery_images) ? form.gallery_images.length : form.gallery_image ? 1 : 0;
      if (count === 0) {
        setFileError('Please select at least one WEBP image to upload.');
        return;
      }
    }
    onSubmit(e);
  };

  const totalSelectedCount = Array.isArray(form.gallery_images) ? form.gallery_images.length : (form.gallery_image ? 1 : 0);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fade-in overflow-y-auto"
    >
      <div className="w-full max-w-xl rounded-2xl border border-[#E8E3DA] bg-[#FCFBFA] shadow-2xl relative my-auto flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E3DA] bg-[#FAF8F5] rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] flex items-center justify-center flex-shrink-0">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-[#1A1817] tracking-tight">
                {isEditing ? 'Edit Gallery Photo' : 'Upload Gallery Photos'}
              </h3>
              <p className="text-xs text-[#78716C]">
                {isEditing ? 'View photo details or replace with a new WEBP image' : 'Select and upload high-resolution WEBP photos'}
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

        <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/webp,.webp"
            multiple={!isEditing}
            className="hidden"
            onChange={(e) => validateAndAddFiles(e.target.files)}
          />

          {/* EDIT MODE: Show Existing Photo + Replacement Option */}
          {isEditing && (
            <div className="space-y-4">
              
              {/* Existing Photo Display */}
              <div>
                <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                  Current Gallery Photo
                </label>
                <div className="p-3 rounded-xl border border-[#E8E3DA] bg-white flex flex-col sm:flex-row items-center gap-4 shadow-2xs">
                  {form.existingImage ? (
                    <img
                      src={form.existingImage}
                      alt="Current Gallery Item"
                      className="h-28 w-36 object-cover rounded-lg border border-[#E8E3DA] flex-shrink-0 shadow-2xs"
                    />
                  ) : (
                    <div className="h-28 w-36 rounded-lg bg-[#FAF8F5] border border-dashed border-[#DDD7CD] flex items-center justify-center text-[#9C9488]">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 text-xs space-y-2">
                    <div>
                      <span className="text-[11px] text-[#8C8275] block">File Name / Identifier</span>
                      <p className="font-semibold text-[#1A1817] truncate">{form.fileName || 'Gallery Image'}</p>
                    </div>

                    <div>
                      <span className="text-[11px] text-[#8C8275] block mb-1">Status</span>
                      <select
                        value={form.gallery_status || 'Active'}
                        onChange={(e) => setForm((prev) => ({ ...prev, gallery_status: e.target.value }))}
                        className="px-3 py-1.5 text-xs rounded-lg border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] transition cursor-pointer font-medium"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Replacement Section */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#3D372E]">
                    Replace Photo
                  </label>
                  {selectedPreviews.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="text-xs text-[#9A2D2D] hover:underline cursor-pointer font-medium"
                    >
                      Cancel Replacement • Keep Original
                    </button>
                  )}
                </div>

                {selectedPreviews.length > 0 ? (
                  <div className="p-3 rounded-xl border-2 border-emerald-200 bg-emerald-50/40 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={selectedPreviews[0].url}
                        alt="New replacement preview"
                        className="h-16 w-20 object-cover rounded-lg border border-emerald-300 shadow-2xs flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mb-1">
                          <CheckCircle2 className="h-3 w-3" />
                          New Replacement Selected
                        </span>
                        <p className="text-xs font-medium text-[#1A1817] truncate">{selectedPreviews[0].name}</p>
                        <p className="text-[10px] text-[#78716C]">{selectedPreviews[0].size} KB</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#DDD7CD] bg-white hover:bg-[#F2EFEB] text-xs font-medium text-[#3D372E] transition cursor-pointer shadow-2xs flex-shrink-0"
                    >
                      <RefreshCw className="h-3.5 w-3.5 text-[#8C6527]" />
                      <span>Change</span>
                    </button>
                  </div>
                ) : (
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                      dragActive
                        ? 'border-[#C99C4B] bg-[#FBF7EE]'
                        : 'border-[#DDD7CD] bg-[#FAF8F5] hover:border-[#C99C4B] hover:bg-[#F7F4EE]'
                    }`}
                  >
                    <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#F5EFE3] text-[#9E7432] mb-1.5 shadow-2xs">
                      <Upload className="h-4 w-4" />
                    </div>
                    <p className="text-xs font-semibold text-[#1A1817]">
                      Click to browse or drag and drop replacement WEBP photo
                    </p>
                    <p className="text-[10px] text-[#8C8275] mt-0.5">
                      Leave empty to keep the existing photo and just update details
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* CREATE MODE: Upload Photos */}
          {!isEditing && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#3D372E]">
                  Select Photos <span className="text-[#9A2D2D]">*</span>
                </label>
                {selectedPreviews.length > 0 && (
                  <span className="text-xs font-medium text-[#8C6527] bg-[#FBF4E8] px-2.5 py-0.5 rounded-full border border-[#F2E4C9]">
                    {selectedPreviews.length} {selectedPreviews.length === 1 ? 'photo' : 'photos'} selected
                  </span>
                )}
              </div>

              {selectedPreviews.length > 0 ? (
                <div className="space-y-3">
                  {/* Thumbnails Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-2 rounded-xl border border-[#E2DDD5] bg-[#F7F4EE]">
                    {selectedPreviews.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="relative group rounded-xl border border-[#E8E3DA] bg-white overflow-hidden shadow-2xs"
                      >
                        <div className="h-28 w-full bg-[#EDE8DF] flex items-center justify-center overflow-hidden">
                          <img
                            src={item.url}
                            alt={item.name}
                            className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        </div>
                        <div className="p-2 flex items-center justify-between text-[11px] bg-white">
                          <div className="min-w-0 pr-1">
                            <p className="font-medium text-[#1A1817] truncate">{item.name}</p>
                            <p className="text-[10px] text-[#8C8275]">{item.size} KB</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            className="p-1 rounded-md text-[#9C9488] hover:text-[#9A2D2D] hover:bg-[#FDF0F0] transition cursor-pointer flex-shrink-0"
                            title="Remove photo"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Multi-action toolbar */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DDD7CD] bg-white hover:bg-[#EFECE6] text-xs font-semibold text-[#3D372E] transition cursor-pointer shadow-2xs"
                    >
                      <Plus className="h-3.5 w-3.5 text-[#8C6527]" />
                      <span>Add More Photos</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="text-xs text-[#9A2D2D] hover:underline cursor-pointer font-medium"
                    >
                      Clear all
                    </button>
                  </div>
                </div>
              ) : (
                /* Empty Dropzone */
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    dragActive
                      ? 'border-[#C99C4B] bg-[#FBF7EE]'
                      : 'border-[#DDD7CD] bg-[#FAF8F5] hover:border-[#C99C4B] hover:bg-[#F7F4EE]'
                  }`}
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F5EFE3] text-[#9E7432] mb-3 shadow-2xs">
                    <Upload className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold text-[#1A1817]">
                    Click to browse or drag and drop WEBP photos
                  </p>
                  <p className="text-[11px] text-[#8C8275] mt-1">
                    Select one or multiple photos (WEBP only, up to 10MB each)
                  </p>
                </div>
              )}
            </div>
          )}

          {fileError && (
            <div className="flex items-center gap-1.5 text-xs text-[#9A2D2D] bg-[#FDF0F0] border border-[#F6C8C8] p-2.5 rounded-xl">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{fileError}</span>
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
              <span>
                {submitting
                  ? (isEditing ? 'Updating...' : 'Uploading...')
                  : isEditing
                  ? 'Update Photo'
                  : totalSelectedCount > 1
                  ? `Upload ${totalSelectedCount} Photos`
                  : 'Upload Photo'}
              </span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
