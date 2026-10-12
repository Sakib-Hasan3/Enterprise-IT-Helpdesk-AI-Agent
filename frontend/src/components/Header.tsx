export function Header({ onClear }: { onClear: () => void }) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white text-lg">
          🤖
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Enterprise IT Assistant
          </h1>
          <p className="text-xs text-gray-500">
            Powered by RAG · Ask about IT issues
          </p>
        </div>
      </div>
      <button
        onClick={onClear}
        className="text-sm text-gray-600 hover:text-brand-600 px-3 py-1.5 rounded-md hover:bg-gray-100 transition"
      >
        + New Chat
      </button>
    </header>
  );
}