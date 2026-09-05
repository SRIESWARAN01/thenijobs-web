'use client';

interface ChipScrollerProps {
  /** Optional leading label, e.g. "Popular:" */
  label?: string;
  items: string[];
  isActive: (item: string) => boolean;
  onSelect: (item: string) => void;
  className?: string;
}

/**
 * Canonical horizontally-scrolling chip row — same pill visual language used for the
 * Business directory's category chips and the Jobs page's popular-search chips.
 */
export default function ChipScroller({ label, items, isActive, onSelect, className = '' }: ChipScrollerProps) {
  return (
    <div className={`-mx-4 sm:mx-0 overflow-x-auto no-scrollbar px-4 sm:px-0 ${className}`}>
      <div className="flex w-max items-center gap-2">
        {label && <span className="text-slate-500 shrink-0 font-semibold text-[11px] mr-0.5">{label}</span>}
        {items.map(item => {
          const active = isActive(item);
          return (
            <button
              key={item}
              type="button"
              onClick={() => onSelect(item)}
              className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap border transition-all ${
                active ? 'text-white border-transparent' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
              style={active ? { background: '#2563EB' } : {}}
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}
