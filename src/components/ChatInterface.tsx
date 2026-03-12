import { useState, useRef, useEffect } from 'react';
import { Send, Zap, Sparkles, Bot, User } from 'lucide-react';
import type { ChatMessage } from '../types';
import { cn } from '../utils/cn';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isProcessing: boolean;
  runtimeMode: 'local' | 'remote';
  onSendMessage: (message: string) => void;
}

const quickCommands = [
  { label: 'Wallet', command: 'Create a new wallet' },
  { label: 'Balance', command: 'What is my balance?' },
  { label: 'Send', command: 'Send 10 USDT to 0x8b2f0c0bf2920e6f1d4ee93e7db0ab17c1d4e002' },
  { label: 'Recurring', command: 'Pay 20 USDT every month to 0x4e7ac5519fd3b57f8c2fd269f92b5131aa8c2f10 for hosting' },
  { label: 'Limit', command: 'Set daily limit to 500 USDT' },
  { label: 'Scheduler', command: 'Run scheduler' },
  { label: 'Status', command: 'Show project status' },
];

function formatMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="bg-dark-800/80 px-1.5 py-0.5 rounded text-cyan-300 text-xs font-mono">{part.slice(1, -1)}</code>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function ChatInterface({ messages, isProcessing, runtimeMode, onSendMessage }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleQuickCommand = (command: string) => {
    if (!isProcessing) {
      onSendMessage(command);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-cyan-500/10 bg-dark-900/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Bot className="w-5 h-5 text-dark-950" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              AegisPay Agent
              <Sparkles className="w-4 h-4 text-amber-400" />
            </h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400">
                {runtimeMode === 'remote' ? 'API-backed runtime' : 'Local demo runtime'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={cn('flex gap-3 animate-slide-up', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'agent' && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400/20 to-teal-400/20 flex items-center justify-center shrink-0 mt-1">
                <Zap className="w-4 h-4 text-cyan-400" />
              </div>
            )}
            <div className={cn(
              'max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3',
              msg.role === 'user'
                ? 'bg-gradient-to-br from-cyan-500/20 to-teal-500/15 border border-cyan-500/20 text-white'
                : 'bg-dark-800/60 border border-cyan-500/5 text-slate-300'
            )}>
              <div className="text-sm leading-relaxed whitespace-pre-line">
                {msg.content.split('\n').map((line, i) => (
                  <span key={i}>
                    {formatMarkdown(line)}
                    {i < msg.content.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </div>
              <div className={cn('text-[10px] mt-2', msg.role === 'user' ? 'text-cyan-400/40 text-right' : 'text-slate-600')}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600/30 to-slate-700/30 flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4 text-slate-400" />
              </div>
            )}
          </div>
        ))}

        {isProcessing && (
          <div className="flex gap-3 animate-slide-up">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400/20 to-teal-400/20 flex items-center justify-center shrink-0 mt-1">
              <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
            </div>
            <div className="bg-dark-800/60 border border-cyan-500/5 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Agent is thinking</span>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 typing-dot" />
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 typing-dot" />
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 typing-dot" />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Commands */}
      <div className="px-4 sm:px-6 pb-2 shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {quickCommands.map((cmd, i) => (
            <button
              key={i}
              onClick={() => handleQuickCommand(cmd.command)}
              disabled={isProcessing}
              className="flex-none px-3 py-1.5 rounded-full text-xs font-medium bg-dark-800/60 border border-cyan-500/10 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {cmd.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-4 sm:px-6 pb-4 shrink-0">
        <form onSubmit={handleSubmit} className="relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell the agent what to do..."
            disabled={isProcessing}
            className="w-full pl-4 pr-12 py-3.5 rounded-2xl bg-dark-800/60 border border-cyan-500/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/30 focus:ring-1 focus:ring-cyan-500/20 transition-all text-sm disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-dark-950 hover:shadow-lg hover:shadow-cyan-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
