import { useState } from 'react';
import type { Citation } from '../types/chat';

export function CitationList({ citations }: { citations: Citation[] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-3 border-t border-gray-100 pt-2.5">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 hover:text-brand-600 transition group py-1 cursor-pointer"
      >
        <span className="flex items-center gap-1.5 uppercase tracking-wide text-[11px]">
          📚 {citations.length} Document Source{citations.length > 1 ? 's' : ''}
        </span>
        <span className="text-[11px] text-gray-400 group-hover:text-brand-600 font-medium">
          {isOpen ? 'Hide sources ▲' : 'View sources ▼'}
        </span>
      </button>

      {isOpen && (
        <ul className="mt-2 space-y-2">
          {citations.map((c, i) => (
            <li
              key={i}
              className="text-xs bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 transition hover:border-slate-300"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-medium text-slate-800 flex items-center gap-1">
                  📄 {c.file} <span className="text-slate-400">·</span> Page {c.page}
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-semibold px-1.5 py-0.5 rounded">
                  {Math.round(c.relevance * 100)}% match
                </span>
              </div>
              <p className="text-slate-600 italic text-[11px] leading-relaxed line-clamp-3 bg-white p-2 rounded border border-slate-100">
                "{c.snippet}"
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}