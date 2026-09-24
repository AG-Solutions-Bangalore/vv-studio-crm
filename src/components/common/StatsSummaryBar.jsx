import React from 'react';

/**
 * Exact replica of the user's requested card design with left vertical accent bar,
 * vertical separator, and circular icon badge.
 * 
 * @param {Array<{ label: string, value: number|string, icon: React.ComponentType, color?: 'emerald'|'amber'|'rose'|'blue'|'purple', filterValue?: string, subtext?: string }>} stats
 * @param {string} [activeFilter] - Current active filter to highlight active card
 * @param {Function} [onSelectFilter] - Callback when card is clicked to filter
 */
export default function StatsSummaryBar({ stats = [], activeFilter, onSelectFilter, className = '' }) {
  if (!stats || stats.length === 0) return null;

  // Preset theme mappings to match user's custom design
  const themes = {
    emerald: {
      cardBg: 'bg-[#F2F8F4] hover:bg-[#EBF5EE]',
      border: 'border-[#DCEDE0]',
      leftBorder: 'border-l-[#1E6B34]',
      circleBg: 'bg-[#DCF0E2] text-[#1E6B34]',
      divider: 'bg-[#CBE4D2]',
      activePill: 'bg-[#1E6B34] text-white',
    },
    amber: {
      cardBg: 'bg-[#FCF9F2] hover:bg-[#F9F5EC]',
      border: 'border-[#F2E8D5]',
      leftBorder: 'border-l-[#C99C4B]',
      circleBg: 'bg-[#E3F4E8] text-[#1E7E34]',
      divider: 'bg-[#EADDC5]',
      activePill: 'bg-[#C99C4B] text-white',
    },
    rose: {
      cardBg: 'bg-[#FDF4F4] hover:bg-[#FBEAEA]',
      border: 'border-[#F8DADA]',
      leftBorder: 'border-l-[#D9383A]',
      circleBg: 'bg-[#FDE2E2] text-[#DC2626]',
      divider: 'bg-[#F3C5C5]',
      activePill: 'bg-[#D9383A] text-white',
    },
    blue: {
      cardBg: 'bg-[#F2F7FC] hover:bg-[#EAF3FA]',
      border: 'border-[#D9E7F6]',
      leftBorder: 'border-l-[#2563EB]',
      circleBg: 'bg-[#DBEAFE] text-[#2563EB]',
      divider: 'bg-[#CBDFF4]',
      activePill: 'bg-[#2563EB] text-white',
    },
    purple: {
      cardBg: 'bg-[#F8F4FD] hover:bg-[#F3ECFB]',
      border: 'border-[#EBE0F8]',
      leftBorder: 'border-l-[#7C3AED]',
      circleBg: 'bg-[#EDE9FE] text-[#7C3AED]',
      divider: 'bg-[#E0D2F4]',
      activePill: 'bg-[#7C3AED] text-white',
    },
  };

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3.5 ${className}`}>
      {stats.map((stat, idx) => {
        // Automatically default first card to emerald, second to amber, third to rose if not explicitly specified
        const defaultColor = idx === 0 ? 'emerald' : idx === 1 ? 'amber' : 'rose';
        const colorKey = stat.color || defaultColor;
        const theme = themes[colorKey] || themes.amber;

        const isClickable = Boolean(onSelectFilter && stat.filterValue);
        const isCurrentlyActive =
          Boolean(activeFilter && stat.filterValue) &&
          String(activeFilter).toLowerCase() === String(stat.filterValue).toLowerCase();
        const IconComponent = stat.icon;

        return (
          <div
            key={stat.label || idx}
            onClick={() => {
              if (isClickable) {
                onSelectFilter(stat.filterValue);
              }
            }}
            className={`group relative overflow-hidden rounded-xl border border-l-4 p-2.5 sm:px-3.5 sm:py-2.5 shadow-2xs transition-all duration-200 ${
              theme.cardBg
            } ${theme.border} ${theme.leftBorder} ${
              isClickable ? 'cursor-pointer hover:shadow-xs select-none' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              {/* Left Side: Label & Number */}
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] md:text-[10.5px] font-bold uppercase tracking-wider text-[#5C554B]">
                    {stat.label}
                  </span>
                  {isCurrentlyActive && (
                    <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${theme.activePill}`}>
                      Active
                    </span>
                  )}
                </div>

                <div className="flex items-baseline">
                  <span className="text-xl md:text-2xl font-bold text-[#1A1817] tracking-tight">
                    {stat.value ?? 0}
                  </span>
                </div>
              </div>

              {/* Middle vertical divider */}
              <div className={`h-6 w-[1.5px] ${theme.divider} rounded-full shrink-0 mx-2 sm:mx-2.5`} />

              {/* Right Side: Circular Icon Badge */}
              {IconComponent && (
                <div
                  className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-2xs ${theme.circleBg}`}
                >
                  <IconComponent className="w-4 h-4" strokeWidth={2.2} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
