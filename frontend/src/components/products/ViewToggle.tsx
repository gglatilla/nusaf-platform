'use client';

import { LayoutGrid, List } from 'lucide-react';

export type ViewMode = 'grid' | 'table';

interface ViewToggleProps {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center border border-slate-300 rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => onChange('grid')}
        className={`
          p-2 transition-colors
          ${view === 'grid'
            ? 'bg-primary-600 text-white'
            : 'bg-white text-slate-600 hover:bg-slate-50'
          }
        `}
        aria-label="Grid view"
        title="Grid view"
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange('table')}
        className={`
          p-2 transition-colors border-l border-slate-300
          ${view === 'table'
            ? 'bg-primary-600 text-white'
            : 'bg-white text-slate-600 hover:bg-slate-50'
          }
        `}
        aria-label="Table view"
        title="Table view"
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
}
