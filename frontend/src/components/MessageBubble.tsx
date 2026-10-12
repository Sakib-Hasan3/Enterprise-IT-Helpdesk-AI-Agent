import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '../types/chat';
import { CitationList } from './CitationList';
import { TypingIndicator } from './TypingIndicator';

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const hasCitations = Boolean(message.citations && message.citations.length > 0);
  const isDocSource = hasCitations || message.sourceType === 'knowledge_base';

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm shrink-0 mt-1 shadow-sm">
          🤖
        </div>
      )}

      <div
        className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-sm ${
          isUser
            ? 'bg-brand-500 text-white rounded-tr-sm'
            : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm'
        }`}
      >
        {message.isLoading ? (
          <TypingIndicator />
        ) : (
          <>
            {!isUser && (
              <div className="mb-2">
                {isDocSource ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/70 rounded-full px-2.5 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    📚 Verified from Documents
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/70 rounded-full px-2.5 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    ✨ AI Assistant (ChatGPT mode)
                  </span>
                )}
              </div>
            )}

            <div className={`text-sm leading-relaxed ${isUser ? 'text-white' : 'text-gray-800'}`}>
              {isUser ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                <div className="space-y-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>p]:mb-2 [&>p:last-child]:mb-0 [&_strong]:font-semibold [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              )}
            </div>

            {!isUser && hasCitations && (
              <CitationList citations={message.citations!} />
            )}
          </>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 text-sm shrink-0 mt-1">
          👤
        </div>
      )}
    </div>
  );
}