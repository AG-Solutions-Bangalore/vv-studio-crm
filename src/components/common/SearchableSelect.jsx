import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, Tag, RefreshCw } from 'lucide-react';

export default function SearchableSelect({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  loading = false,
  icon: Icon = Tag,
  error = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize options to standard { value, label } format
  const normalizedOptions = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return {
        value: opt.value ?? opt.url ?? opt.id ?? '',
        label: opt.label ?? opt.name ?? opt.title ?? opt.page_name ?? opt.url ?? '',
      };
    });
  }, [options]);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => String(opt.value) === String(value));
  }, [normalizedOptions, value]);

  // Filter options by search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return normalizedOptions;
    const q = searchTerm.toLowerCase().trim();
    return normalizedOptions.filter((opt) =>
      opt.label.toLowerCase().includes(q) || String(opt.value).toLowerCase().includes(q)
    );
  }, [normalizedOptions, searchTerm]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  const handleSelect = (val) => {
    onChange?.(val);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.('');
    setSearchTerm('');
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs rounded-xl border transition-all text-left shadow-2xs cursor-pointer ${
          error
            ? 'border-[#E05252] bg-[#FFF5F5] ring-1 ring-[#E05252]'
            : isOpen
            ? 'border-[#C99C4B] bg-white ring-2 ring-[#C99C4B]/20'
            : 'border-[#E2DDD5] bg-[#FAF8F5] hover:bg-white hover:border-[#C99C4B]'
        } ${disabled || loading ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          {Icon && (
            <Icon className={`h-4 w-4 flex-shrink-0 ${selectedOption ? 'text-[#9E7432]' : 'text-[#9C9488]'}`} />
          )}
          <span className={`truncate ${selectedOption ? 'font-medium text-[#1A1817]' : 'text-[#8C8275]'}`}>
            {loading ? 'Loading options...' : selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {loading ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#9E7432]" />
          ) : (
            <>
              {selectedOption && !disabled && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={handleClear}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleClear(e); }}
                  className="p-0.5 rounded-full hover:bg-[#EFECE6] text-[#8C8275] hover:text-[#1A1817] transition cursor-pointer"
                  title="Clear selection"
                >
                  <X className="h-3.5 w-3.5" />
                </span>
              )}
              <ChevronDown
                className={`h-4 w-4 text-[#9C9488] transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-[#1A1817]' : ''
                }`}
              />
            </>
          )}
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white border border-[#E8E3DA] rounded-xl shadow-xl overflow-hidden animate-fade-in max-h-64 flex flex-col">
          {/* Search Box */}
          <div className="p-2 border-b border-[#F0ECE3] bg-[#FAF8F5] sticky top-0 z-10">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9C9488] pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type to search pages..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#E2DDD5] bg-white text-[#1A1817] focus:outline-none focus:border-[#C99C4B] transition shadow-2xs placeholder-[#9C9488]"
                onClick={(e) => e.stopPropagation()}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-[#8C8275] hover:text-[#1A1817]"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto p-1 max-h-48 divide-y divide-[#FAF8F5]">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-[#8C8275]">
                No pages match &ldquo;{searchTerm}&rdquo;
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition text-left cursor-pointer ${
                      isSelected
                        ? 'bg-[#FBF4E8] text-[#9E7432] font-semibold'
                        : 'text-[#1A1817] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <span className="truncate pr-2">{opt.label}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-[#9E7432] flex-shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
