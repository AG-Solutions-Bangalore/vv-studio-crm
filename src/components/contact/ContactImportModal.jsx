import React, { useState, useRef } from 'react';
import { X, FileSpreadsheet, Download, Upload, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { importContacts, CONTACT_TEMPLATE_URL } from '../../services/contactApi';

export default function ContactImportModal({
  isOpen,
  onClose,
  onSuccess,
}) {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;

    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileName = selectedFile.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValid) {
      setErrorMsg('Please select a valid Excel or CSV file (.xlsx, .xls, .csv).');
      return;
    }

    if (selectedFile.size > 20 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 20MB limit.');
      return;
    }

    setErrorMsg('');
    setFile(selectedFile);
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

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Please choose an Excel file to upload.');
      return;
    }

    setUploading(true);
    setErrorMsg('');

    try {
      const res = await importContacts(file);
      toast.success(res?.message || 'Contacts imported successfully!');
      setFile(null);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to import contacts. Please check file format.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fade-in overflow-y-auto"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#E8E3DA] bg-[#FCFBFA] shadow-2xl relative my-auto flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E3DA] bg-[#FAF8F5] rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#EBF7EE] text-[#1E7E34] border border-[#C3E6CB] flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-[#1A1817] tracking-tight">
                Import Contacts
              </h3>
              <p className="text-xs text-[#78716C]">
                Bulk import customer contacts via Excel spreadsheet
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

        <form onSubmit={handleUploadSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {/* Download Template Banner */}
            <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E8E3DA] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#1A1817]">Download Excel Template</p>
                <p className="text-[11px] text-[#8C8275] truncate">Use the official format to prepare your contacts</p>
              </div>
              <a
                href={CONTACT_TEMPLATE_URL}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-[#DDD7CD] hover:bg-[#EFECE6] text-xs font-semibold text-[#4A443D] shadow-2xs transition cursor-pointer flex-shrink-0"
              >
                <Download className="h-3.5 w-3.5 text-[#9E7432]" />
                <span>Download</span>
              </a>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0])}
            />

            {file ? (
              <div className="p-4 rounded-xl border border-[#C3E6CB] bg-[#EBF7EE]/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="h-5 w-5 text-[#1E7E34] flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#1A1817] truncate">{file.name}</p>
                    <p className="text-[10px] text-[#8C8275]">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="p-1 rounded-md text-[#8C8275] hover:text-[#9A2D2D] hover:bg-white transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
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
                    ? 'border-[#1E7E34] bg-[#EBF7EE]/30'
                    : 'border-[#DDD7CD] bg-[#FAF8F5] hover:border-[#1E7E34] hover:bg-[#F7F4EE]'
                }`}
              >
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#EBF7EE] text-[#1E7E34] mb-2.5">
                  <Upload className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-[#1A1817]">
                  Click to browse or drag & drop Excel file
                </p>
                <p className="text-[11px] text-[#8C8275] mt-0.5">
                  Supported formats: .xlsx, .xls, .csv (Max 20MB)
                </p>
              </div>
            )}

            {errorMsg && (
              <div className="flex items-center gap-1.5 p-3 rounded-xl bg-[#FDF0F0] border border-[#F6C8C8] text-[#9A2D2D] text-xs">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errorMsg}</span>
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
              disabled={uploading || !file}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-xs font-semibold shadow-xs transition active:scale-95 disabled:bg-[#A39C91] cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5 text-[#C99C4B]" />
              <span>{uploading ? 'Importing...' : 'Upload & Import'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
