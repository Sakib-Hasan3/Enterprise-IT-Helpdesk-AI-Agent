import { useState, useRef, type KeyboardEvent } from 'react';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const handleInput = (value: string) => {
    setText(value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 160) + 'px';
    }
  };

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text);
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3">
      <div className="max-w-3xl mx-auto flex items-end gap-2 bg-gray-50 border border-gray-200 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100 rounded-2xl px-3 py-2 transition">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask your IT question..."
          rows={1}
          disabled={disabled}
          className="flex-1 resize-none bg-transparent border-none focus:outline-none text-sm text-gray-800 placeholder-gray-400 py-2 max-h-40"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          className="shrink-0 w-9 h-9 rounded-full bg-brand-500 hover:bg-brand-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white flex items-center justify-center transition"
          aria-label="Send"
        >
          ➤
        </button>
      </div>
      <p className="text-[10px] text-center text-gray-400 mt-2">
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}