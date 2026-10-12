import type { Citation } from '../types/chat';

export function CitationList({ citations }: { citations: Citation[] }) {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-3 border-t border-gray-200 pt-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        📚 Sources
      </p>
      <ul className="space-y-2">
        {citations.map((c, i) => (
          <li
            key={i}
            className="text-xs bg-gray-50 border border-gray-200 rounded-md p-2"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-700">
                {c.file} · Page {c.page}
              </span>
              <span className="text-[10px] bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded">
                {c.relevance.toFixed(2)}
              </span>
            </div>
            <p className="text-gray-500 italic line-clamp-2">
              "{c.snippet}"
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}