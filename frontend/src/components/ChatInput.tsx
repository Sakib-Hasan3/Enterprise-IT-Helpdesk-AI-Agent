import { useState, useRef, type KeyboardEvent } from 'react';
import { SendIcon, SparklesIcon } from './Icons';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = (value: string) => {
    setText(value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 180) + 'px';
    }
  };

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-slate-200/80 bg-white/95 backdrop-blur-md px-4 py-3 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Floating Input Dock */}
        <div className="relative rounded-2xl bg-slate-50/90 border border-slate-200 focus-within:border-brand-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-500/10 transition duration-200 shadow-xs">
          <div className="flex items-end p-2.5 sm:p-3 gap-2">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => handleInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask an IT question or anything general (e.g. incident resolution, network setup, code)..."
              rows={1}
              disabled={disabled}
              className="flex-1 resize-none bg-transparent border-0 focus:outline-none text-sm text-slate-800 placeholder-slate-400 py-1.5 px-2 max-h-44 leading-relaxed"
            />

            <button
              type="button"
              onClick={handleSend}
              disabled={disabled || !text.trim()}
              className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:from-slate-200 disabled:to-slate-200 disabled:cursor-not-allowed text-white flex items-center justify-center transition shadow-xs group cursor-pointer"
              aria-label="Send question"
            >
              <SendIcon className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>

          {/* Bottom Dock Utility Bar */}
          <div className="px-3 pb-2 pt-0 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-slate-500 flex items-center gap-1">
                <SparklesIcon className="w-3 h-3 text-brand-500" />
                Dual-Engine: Docs Search + ChatGPT
              </span>
            </div>

            <span className="hidden sm:inline text-slate-400">
              Press <kbd className="font-mono bg-white border border-slate-200 px-1 py-0.2 rounded text-[10px] text-slate-500">Enter ↵</kbd> to send
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}