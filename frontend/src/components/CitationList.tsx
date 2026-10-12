import { useState } from 'react';
import type { Citation } from '../types/chat';
import { BookOpenIcon, ChevronDownIcon, DocumentTextIcon } from './Icons';

interface CitationListProps {
  citations: Citation[];
}

export function CitationList({ citations }: CitationListProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-3.5 pt-3 border-t border-slate-100">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left py-1 px-2 rounded-lg bg-slate-50/80 hover:bg-slate-100/90 border border-slate-200/60 transition group cursor-pointer"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <BookOpenIcon className="w-3.5 h-3.5 text-brand-600" />
          <span>
            {citations.length} Verified Document Source{citations.length > 1 ? 's' : ''}
          </span>
        </span>

        <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500 group-hover:text-brand-600 transition">
          <span>{isOpen ? 'Collapse' : 'Inspect'}</span>
          <ChevronDownIcon
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </span>
      </button>

      {isOpen && (
        <div className="mt-2.5 space-y-2 animate-slide-up">
          {citations.map((c, i) => {
            const matchPercent = Math.min(Math.round(c.relevance * 100), 100);
            return (
              <div
                key={i}
                className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs hover:border-slate-300 transition"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 truncate">
                    <DocumentTextIcon className="w-4 h-4 text-brand-600 shrink-0" />
                    <span className="truncate">{c.file}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded font-normal text-[11px]">
                      Page {c.page}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-500" />
                    {matchPercent}% relevance
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/80 border-l-2 border-brand-500 rounded-r-lg p-2.5 italic">
                  "{c.snippet}"
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}