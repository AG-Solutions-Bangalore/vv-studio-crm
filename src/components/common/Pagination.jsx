import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalCount = 0,
  perPage = 10,
  onPageChange,
  from,
  to,
}) {
  const effectiveTotalPages = Math.max(1, totalPages || 1);
  const startEntry = from ?? (totalCount > 0 ? (currentPage - 1) * perPage + 1 : totalCount === 0 ? 0 : 1);
  const endEntry = to ?? (totalCount > 0 ? Math.min(currentPage * perPage, totalCount) : 0);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (effectiveTotalPages <= maxVisible) {
      for (let i = 1; i <= effectiveTotalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(effectiveTotalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < effectiveTotalPages - 2) pages.push('...');
      pages.push(effectiveTotalPages);
    }

    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 bg-[#FAF8F5]/90 border-t border-[#E8E3DA] text-xs text-[#6B6357]">
      
      {/* Entry counter text */}
      <div className="font-medium text-xs text-[#78716C]">
        Showing <span className="font-semibold text-[#1A1817]">{startEntry}</span> to{' '}
        <span className="font-semibold text-[#1A1817]">{endEntry}</span> of{' '}
        <span className="font-semibold text-[#1A1817]">{totalCount}</span> entries
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1.5">
        {/* Previous page button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          title="Previous Page"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E2DDD5] bg-white text-[#5C554B] hover:text-[#1A1817] hover:bg-[#FAF8F5] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs text-[11px] font-medium"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Previous</span>
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((num, idx) => {
          if (num === '...') {
            return (
              <span key={`dots-${idx}`} className="px-1.5 text-xs text-[#8C8275]">
                ...
              </span>
            );
          }

          const isActive = num === currentPage;
          return (
            <button
              key={num}
              type="button"
              onClick={() => onPageChange(num)}
              className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                isActive
                  ? 'bg-[#1A1817] text-[#FAF8F5] shadow-xs border border-[#1A1817]'
                  : 'text-[#5C554B] hover:text-[#1A1817] hover:bg-[#FAF8F5] bg-white border border-[#E2DDD5] shadow-2xs'
              }`}
            >
              {num}
            </button>
          );
        })}

        {/* Next page button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= effectiveTotalPages}
          title="Next Page"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E2DDD5] bg-white text-[#5C554B] hover:text-[#1A1817] hover:bg-[#FAF8F5] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs text-[11px] font-medium"
        >
          <span>Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

    </div>
  );
}
