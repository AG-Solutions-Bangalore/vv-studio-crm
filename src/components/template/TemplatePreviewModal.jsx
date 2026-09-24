import React, { useState } from 'react';
import { X, Mail, MessageSquare, ExternalLink, Smartphone, Monitor, CheckCheck, Edit2, Calendar, CheckCircle2, XCircle } from 'lucide-react';

export default function TemplatePreviewModal({
  isOpen,
  onClose,
  item,
  onEdit,
}) {
  const [deviceView, setDeviceView] = useState('desktop'); // 'desktop' | 'mobile'

  if (!isOpen || !item) return null;

  const isEmail = (item.template_type || 'Email') === 'Email';
  const name = item.template_name || item.name || 'Untitled Template';
  const templateId = item.template_id || item.id;
  const status = item.template_status || item.status || 'Active';
  const isActive = status === 'Active';
  const url = item.template_url || '';
  const design = item.template_design || '';

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fade-in overflow-y-auto"
    >
      <div className="w-full max-w-3xl rounded-2xl border border-[#E8E3DA] bg-[#FCFBFA] shadow-2xl relative my-auto flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E3DA] bg-[#FAF8F5] rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isEmail
                  ? 'bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9]'
                  : 'bg-[#EBF7EE] text-[#1E7E34] border border-[#C3E6CB]'
              }`}
            >
              {isEmail ? <Mail className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-bold text-[#1A1817] tracking-tight truncate max-w-sm">
                  {name}
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
              <span className="font-mono text-[11px] text-[#8C8275]">
                ID: {templateId} • {item.template_type}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEmail && (
              <div className="inline-flex rounded-lg border border-[#E2DDD5] bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setDeviceView('desktop')}
                  title="Desktop View"
                  className={`p-1.5 rounded-md transition cursor-pointer ${
                    deviceView === 'desktop' ? 'bg-[#1A1817] text-[#FAF8F5]' : 'text-[#5C554B]'
                  }`}
                >
                  <Monitor className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceView('mobile')}
                  title="Mobile View"
                  className={`p-1.5 rounded-md transition cursor-pointer ${
                    deviceView === 'mobile' ? 'bg-[#1A1817] text-[#FAF8F5]' : 'text-[#5C554B]'
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="p-2 rounded-xl text-[#78716C] hover:text-[#1A1817] hover:bg-[#EFECE6] border border-[#E2DDD5] bg-white transition cursor-pointer shadow-2xs flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#F7F4EE] flex items-center justify-center min-h-[350px]">
          {isEmail ? (
            /* Email Preview Frame */
            <div
              className={`bg-white rounded-2xl shadow-md border border-[#E8E3DA] overflow-hidden transition-all duration-300 ${
                deviceView === 'mobile' ? 'w-[360px] h-[520px]' : 'w-full h-[520px]'
              }`}
            >
              {design ? (
                <iframe
                  title="Email HTML Preview"
                  srcDoc={design}
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin"
                />
              ) : url ? (
                <iframe
                  title="Email URL Preview"
                  src={url}
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-[#8C8275]">
                  No HTML design code or URL provided.
                </div>
              )}
            </div>
          ) : (
            /* WhatsApp Chat Bubble Mockup */
            <div className="w-full max-w-sm rounded-2xl bg-[#EFEAE2] p-4 border border-[#DDD7CD] shadow-md space-y-3 font-sans">
              <div className="flex items-center gap-2 pb-2 border-b border-[#D1CBC1] text-xs font-semibold text-[#1A1817]">
                <div className="h-6 w-6 rounded-full bg-[#25D366] text-white flex items-center justify-center text-[10px]">
                  WA
                </div>
                <span>EMWA Official WhatsApp</span>
              </div>

              <div className="bg-white rounded-xl rounded-tl-none p-3.5 shadow-xs text-xs text-[#1A1817] space-y-2 relative border border-black/5">
                <p className="whitespace-pre-line leading-relaxed">
                  {design ? (
                    design
                  ) : (
                    <span className="text-[#5C554B]">
                      WhatsApp Template ID: <strong className="font-mono text-[#1A1817]">{templateId}</strong>
                    </span>
                  )}
                </p>
                <div className="flex items-center justify-end gap-1 text-[10px] text-[#8C8275]">
                  <span>10:45 AM</span>
                  <CheckCheck className="h-3.5 w-3.5 text-[#53BDEB]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info & link */}
        <div className="px-6 py-3.5 bg-[#FAF8F5] border-t border-[#E8E3DA] flex items-center justify-between text-xs text-[#78716C] flex-shrink-0">
          <div className="flex items-center gap-2 truncate max-w-md">
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#9E7432] hover:underline font-medium truncate"
              >
                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{url}</span>
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
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
                <span>Edit Template</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
