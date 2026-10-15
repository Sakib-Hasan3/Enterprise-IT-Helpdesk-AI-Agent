import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '../types/chat';
import { CitationList } from './CitationList';
import { TypingIndicator } from './TypingIndicator';
import {
  BotIcon,
  UserIcon,
  SparklesIcon,
  BookOpenIcon,
  ClipboardIcon,
  CheckIcon,
} from './Icons';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const hasCitations = Boolean(message.citations && message.citations.length > 0);
  const isDocSource = hasCitations || message.sourceType === 'knowledge_base';

  const handleCopy = async () => {
    if (!message.content) return;
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const formatTime = (date: Date) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }).format(date);
    } catch {
      return '';
    }
  };

  return (
    <div
      className={`flex gap-3.5 items-start ${
        isUser ? 'justify-end' : 'justify-start'
      } animate-fade-in group`}
    >
      {/* Bot Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm mt-1 ring-2 ring-brand-100">
          <BotIcon className="w-4 h-4" />
        </div>
      )}

      {/* Bubble Container */}
      <div
        className={`relative max-w-[85%] sm:max-w-[78%] rounded-2xl shadow-xs transition-shadow ${
          isUser
            ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white px-4 py-3 rounded-tr-xs'
            : 'bg-white text-slate-800 border border-slate-200/90 px-5 py-4 rounded-tl-xs hover:border-slate-300'
        }`}
      >
        {/* Loading / Streaming state */}
        {message.isLoading ? (
          message.statusMessage && !message.content ? (
            // Status message before first token
            <div className="flex items-center gap-2 text-slate-400 text-sm py-1">
              <span className="flex gap-0.5">
                <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" />
              </span>
              <span className="text-xs text-slate-400 italic">{message.statusMessage}</span>
            </div>
          ) : (
            <TypingIndicator />
          )
        ) : (
          <>
            {/* Assistant Header: Badges & Copy button */}
            {!isUser && (
              <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2 flex-wrap">
                  {isDocSource ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 rounded-full px-2.5 py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <BookOpenIcon className="w-3 h-3 text-emerald-600" />
                      Document Grounded
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/70 rounded-full px-2.5 py-0.5">
                      <SparklesIcon className="w-3 h-3 text-indigo-500" />
                      AI Assistant (ChatGPT mode)
                    </span>
                  )}

                  {message.timestamp && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {formatTime(message.timestamp)}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  title="Copy response"
                  aria-label="Copy response"
                >
                  {copied ? (
                    <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <ClipboardIcon className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )}

            {/* Content Body */}
            <div
              className={`text-sm leading-relaxed ${
                isUser ? 'text-white' : 'text-slate-800'
              }`}
            >
              {isUser ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                <div className="space-y-3 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:space-y-1 [&>p]:leading-relaxed [&_strong]:font-semibold [&_strong]:text-slate-900 [&_code]:bg-slate-100 [&_code]:text-slate-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-3 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:text-inherit">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              )}
            </div>

            {/* Citations block */}
            {!isUser && hasCitations && (
              <CitationList citations={message.citations!} />
            )}
          </>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-xs mt-1 ring-2 ring-slate-100">
          <UserIcon className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}