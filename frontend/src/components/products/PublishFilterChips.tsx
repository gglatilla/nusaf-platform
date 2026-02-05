'use client';

export type PublishFilterValue = 'ALL' | 'PUBLISHED' | 'DRAFT';

interface PublishFilterChipsProps {
  selected: PublishFilterValue;
  onChange: (value: PublishFilterValue) => void;
}

const filterOptions: { value: PublishFilterValue; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'DRAFT', label: 'Drafts' },
];

export function PublishFilterChips({ selected, onChange }: PublishFilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filterOptions.map((option) => {
        const isSelected = selected === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`
              px-3 py-1.5 text-sm font-medium rounded-full transition-colors
              ${isSelected
                ? 'bg-primary-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }
            `}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
