import React, { useState, useEffect } from 'react';
import { X, Workflow, ArrowDown, Clock, LayoutTemplate, Edit2, CheckCircle2, XCircle, ChevronRight, RefreshCw } from 'lucide-react';
import { getPipelineById } from '../../services/pipelineApi';

export default function PipelineViewModal({
  isOpen,
  onClose,
  item,
  onEdit,
}) {
  const [pipelineData, setPipelineData] = useState(item || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && item?.id) {
      setPipelineData(item);
      const existingSubs = item.subs || item.sub || item.stages || item.steps || item.pipeline_subs || [];
      if (existingSubs.length === 0) {
        setLoading(true);
        (async () => {
          try {
            const res = await getPipelineById(item.id);
            const fresh = res?.data?.pipeline || res?.data?.data || res?.data || res?.pipeline || res;
            if (fresh) {
              setPipelineData(fresh);
            }
          } catch (err) {
            // keep existing
          } finally {
            setLoading(false);
          }
        })();
      }
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const activeItem = pipelineData || item;
  const name = activeItem.pipeline_name || activeItem.name || 'Marketing Pipeline';
  const status = activeItem.pipeline_status || activeItem.status || 'Active';
  const isActive = status === 'Active';
  const subs = activeItem.subs || activeItem.sub || activeItem.stages || activeItem.steps || activeItem.pipeline_subs || [];

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
              <Workflow className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base sm:text-lg font-bold text-[#1A1817] tracking-tight">
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
              <p className="text-xs text-[#78716C]">
                {subs.length} automated {subs.length === 1 ? 'stage' : 'stages'} in sequence
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

        {/* Visual Timeline Diagram */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-[#FAF8F5]">
          {loading ? (
            <div className="text-center py-12 text-xs text-[#8C8275] flex flex-col items-center justify-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-[#9E7432]" />
              <span>Loading sequence stages...</span>
            </div>
          ) : subs.length === 0 ? (
            <div className="text-center py-10 text-xs text-[#8C8275]">
              No sequence stages configured for this pipeline.
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E2DDD5]">
              {subs.map((sub, idx) => {
                const subName = sub.pipeline_sub_name || `Step #${idx + 1}`;
                const tplId = sub.pipeline_sub_template_id;
                const rawDelay = sub.pipeline_sub_time;
                const delay = rawDelay === 0 || rawDelay === '0' || String(rawDelay).toLowerCase() === 'immediate'
                  ? 'Immediate'
                  : `${parseInt(rawDelay, 10) || rawDelay} ${parseInt(rawDelay, 10) === 1 ? 'Day' : 'Days'}`;
                const subStatus = sub.pipeline_sub_status || 'Active';
                const isSubActive = subStatus === 'Active';

                return (
                  <div key={sub.id || idx} className="relative group">
                    {/* Node Dot */}
                    <div className="absolute -left-6 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#1A1817] text-[#FAF8F5] font-mono text-xs font-bold border-2 border-white shadow-xs">
                      {idx + 1}
                    </div>

                    {/* Step Card */}
                    <div className="bg-white rounded-xl border border-[#E8E3DA] p-4 shadow-2xs space-y-2 hover:border-[#C99C4B]/60 transition">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-[#1A1817]">
                          {subName}
                        </h4>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isSubActive ? 'bg-[#EBF7EE] text-[#1E7E34]' : 'bg-[#FBEAEA] text-[#9A2D2D]'
                          }`}
                        >
                          {subStatus}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {/* Delay */}
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FAF8F5] border border-[#E2DDD5] text-[11px] font-medium text-[#5C554B]">
                          <Clock className="h-3 w-3 text-[#9E7432]" />
                          <span>Delay: <strong>{delay}</strong></span>
                        </span>

                        {/* Template */}
                        {tplId ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FBF4E8] border border-[#F2E4C9] text-[11px] font-mono font-semibold text-[#9E7432]">
                            <LayoutTemplate className="h-3 w-3" />
                            <span>Template: {tplId}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#8C8275] italic">
                            No template attached
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#FAF8F5] border-t border-[#E8E3DA] flex items-center justify-end gap-2.5 flex-shrink-0">
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
              <span>Edit Pipeline</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
