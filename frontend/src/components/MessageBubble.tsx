import type { ChatMessage } from '../types/chat';
import { CitationList } from './CitationList';
import { TypingIndicator } from './TypingIndicator';

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm shrink-0">
          🤖
        </div>
      )}

      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
          isUser
            ? 'bg-brand-500 text-white rounded-tr-sm'
            : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm'
        }`}
      >
        {message.isLoading ? (
          <TypingIndicator />
        ) : (
          <>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {message.content}
            </p>
            {!isUser && message.citations && (
              <CitationList citations={message.citations} />
            )}
          </>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 text-sm shrink-0">
          👤
        </div>
      )}
    </div>
  );
}