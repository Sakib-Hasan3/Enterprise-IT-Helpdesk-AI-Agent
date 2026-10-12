import { SparklesIcon } from './Icons';

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/90 border border-slate-200/80">
        <SparklesIcon className="w-3.5 h-3.5 text-brand-600 animate-spin" />
        <span className="text-xs font-medium text-slate-600">
          Searching docs & synthesizing...
        </span>
      </div>

      <div className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" />
      </div>
    </div>
  );
}