import { SidebarIcon, TrashIcon, SparklesIcon, BookOpenIcon } from './Icons';

interface HeaderProps {
  onClear: () => void;
  onToggleSidebar: () => void;
  messageCount: number;
}

export function Header({ onClear, onToggleSidebar, messageCount }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-6 py-3 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        {/* Toggle Sidebar Button */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
          aria-label="Toggle Navigation Sidebar"
          title="Toggle Sidebar"
        >
          <SidebarIcon className="w-5 h-5" />
        </button>

        {/* Title & Capabilities Pill */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 items-center justify-center text-white shadow-xs">
            <SparklesIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Enterprise IT Copilot
              </h1>
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 bg-brand-50 border border-brand-200/60 rounded-full px-2 py-0.5">
                <BookOpenIcon className="w-3 h-3 text-brand-600" />
                Hybrid RAG
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Internal Knowledge Base + AI General Assistance
            </p>
          </div>
        </div>
      </div>

      {/* Header Right Actions */}
      <div className="flex items-center gap-2">
        {messageCount > 0 && (
          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {messageCount} message{messageCount > 1 ? 's' : ''}
          </span>
        )}

        <button
          onClick={onClear}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 px-3 py-1.5 rounded-xl hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition cursor-pointer"
          title="Clear current conversation"
        >
          <TrashIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear Chat</span>
        </button>
      </div>
    </header>
  );
}