import { useState, useEffect } from 'react';
import {
  BotIcon,
  BookOpenIcon,
  DocumentTextIcon,
  PlusIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  LayersIcon,
} from './Icons';
import { fetchDocuments, checkHealth } from '../api/client';
import type { DocumentInfo, HealthInfo } from '../types/chat';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSelectPrompt: (prompt: string) => void;
  username?: string | null;
  onLogout?: () => void;
}

export function Sidebar({ isOpen, onClose, onNewChat, onSelectPrompt, username, onLogout }: SidebarProps) {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const loadData = async () => {
    setLoadingDocs(true);
    try {
      const [docsRes, healthRes] = await Promise.all([
        fetchDocuments().catch(() => ({ total: 0, documents: [] })),
        checkHealth().catch(() => null),
      ]);
      setDocuments(docsRes.documents);
      setHealth(healthRes);
    } catch {
      // ignore
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-72 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              <BotIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                IT Copilot
                <span className="text-[10px] font-semibold text-brand-300 bg-brand-950/80 border border-brand-800/60 px-1.5 py-0.2 rounded">
                  v2.4
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Enterprise AI & RAG</p>
            </div>
          </div>
        </div>

        {/* Action Button: New Chat */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center justify-between bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl shadow-md shadow-brand-900/40 transition group cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <PlusIcon className="w-4 h-4 transition-transform group-hover:rotate-90" />
              New Conversation
            </span>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white/90 font-mono">
              ⌘K
            </span>
          </button>
        </div>

        {/* Scrollable Center Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5">
          {/* Knowledge Base Documents */}
          <div>
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <BookOpenIcon className="w-3.5 h-3.5 text-brand-400" />
                Knowledge Base ({documents.length})
              </span>
              <button
                onClick={loadData}
                disabled={loadingDocs}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
                title="Refresh documents"
              >
                <ArrowPathIcon className={`w-3.5 h-3.5 ${loadingDocs ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-1.5">
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 hover:border-slate-600 transition group"
                  >
                    <DocumentTextIcon className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-200 truncate group-hover:text-white">
                        {doc.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Indexed & Active
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-4 border border-dashed border-slate-800 rounded-lg text-slate-400 text-xs">
                  {loadingDocs ? 'Loading documents...' : 'No documents indexed'}
                </div>
              )}
            </div>
          </div>

          {/* Quick Guidance Prompts */}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-1 mb-2 block flex items-center gap-1.5">
              <LayersIcon className="w-3.5 h-3.5 text-indigo-400" />
              Quick Prompts
            </span>
            <div className="space-y-1">
              {[
                { label: 'Incident Management Guide', prompt: 'What is incident management?' },
                { label: 'FitSM Core Processes', prompt: 'What are the key processes in IT service management?' },
                { label: 'Service System Setup', prompt: 'How do I implement a service management system?' },
                { label: 'ChatGPT: Troubleshoot DNS', prompt: 'How do I troubleshoot DNS resolution issues on Linux and Windows?' },
                { label: 'ChatGPT: Server Health Script', prompt: 'Write a bash script to monitor high CPU and disk usage.' },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSelectPrompt(item.prompt);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className="w-full text-left text-xs text-slate-300 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition truncate cursor-pointer flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-brand-400 transition" />
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* System Status Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2">
          <div className="bg-slate-900 rounded-xl p-3 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1.5">
                <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                Vector DB
              </span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {health?.qdrant === 'connected' ? 'Qdrant Ready' : 'Connected'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">LLM Mode</span>
              <span className="text-brand-300 font-medium">Hybrid RAG + AI</span>
            </div>
          </div>

          {/* User info + Logout */}
          {username && (
            <div className="flex items-center justify-between bg-slate-900 rounded-xl px-3 py-2.5 border border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">
                  {username[0].toUpperCase()}
                </div>
                <span className="text-[11px] text-slate-300 font-medium">{username}</span>
              </div>
              <button
                onClick={onLogout}
                title="Sign out"
                className="text-slate-500 hover:text-red-400 transition p-1 rounded cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
