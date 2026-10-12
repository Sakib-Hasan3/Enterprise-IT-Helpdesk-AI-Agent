import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../types/chat';
import { MessageBubble } from './MessageBubble';
import {
  SparklesIcon,
  BookOpenIcon,
  LayersIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
} from './Icons';

interface ChatWindowProps {
  messages: ChatMessage[];
  onSelectPrompt: (prompt: string) => void;
}

export function ChatWindow({ messages, onSelectPrompt }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-8 sm:py-12 flex items-center justify-center">
        <div className="max-w-3xl w-full mx-auto text-center space-y-8 animate-fade-in">
          {/* Hero Branding */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-semibold shadow-xs">
              <SparklesIcon className="w-3.5 h-3.5 text-brand-600" />
              <span>Next-Gen Enterprise IT Copilot</span>
              <span className="w-1 h-1 rounded-full bg-brand-400" />
              <span className="text-brand-600 font-normal">Hybrid RAG & Groq LLM</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              How can I assist you today?
            </h2>

            <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto leading-relaxed">
              Ask questions about your internal IT policies for cited answers, or ask any general technical question to get instant ChatGPT-style solutions.
            </p>
          </div>

          {/* Value Props Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <BookOpenIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Document Grounded</h4>
                <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                  Verifiable answers backed by exact page citations from your PDFs.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <SparklesIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">ChatGPT Fallback</h4>
                <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                  Unrestricted reasoning for general IT, troubleshooting, and code.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                <ShieldCheckIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">High Precision</h4>
                <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                  BGE-M3 embeddings + BGE reranking for zero irrelevant noise.
                </p>
              </div>
            </div>
          </div>

          {/* Suggestion Prompts Grid */}
          <div className="space-y-3 text-left">
            <div className="flex items-center gap-2 px-1">
              <LayersIcon className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Suggested Inquiries
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  title: 'What is incident management?',
                  category: 'Document Grounded',
                  color: 'text-emerald-700 bg-emerald-50 border-emerald-200/70',
                  prompt: 'What is incident management according to the ITSM guide?',
                },
                {
                  title: 'How to implement a service management system?',
                  category: 'Document Grounded',
                  color: 'text-emerald-700 bg-emerald-50 border-emerald-200/70',
                  prompt: 'How do I implement a service management system under FitSM?',
                },
                {
                  title: 'Troubleshoot slow Wi-Fi and network latency',
                  category: 'General AI Assistant',
                  color: 'text-indigo-700 bg-indigo-50 border-indigo-200/70',
                  prompt: 'How do I troubleshoot a slow Wi-Fi network and packet loss?',
                },
                {
                  title: 'Explain the difference between TCP and UDP',
                  category: 'General AI Assistant',
                  color: 'text-indigo-700 bg-indigo-50 border-indigo-200/70',
                  prompt: 'Explain the difference between TCP and UDP with real-world examples.',
                },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectPrompt(item.prompt)}
                  className="p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-brand-300 transition shadow-xs text-left group flex items-center justify-between cursor-pointer"
                >
                  <div className="space-y-1 pr-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.color}`}>
                      {item.category}
                    </span>
                    <p className="text-xs font-semibold text-slate-800 group-hover:text-brand-600 transition">
                      {item.title}
                    </p>
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-1 transition shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-5">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}