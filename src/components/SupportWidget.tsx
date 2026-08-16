'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const STARTER_PROMPTS = [
  '⚡ How does AI screening work?',
  '📱 How do I track my applications?',
  '💼 How do I post a new job?',
  '👥 What can different roles do?',
  '🛡️ How does GDPR erasure work?'
];

export default function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        '👋 **Hello! I am your RecruitAI Support Assistant.**\n\nI have complete knowledge of the RecruitAI platform. How can I help you today? You can ask me about **AI screening**, **job applications**, **recruiter pipelines**, or **system roles**!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = textToSend || input;
    if (!messageContent.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: messageContent };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages })
      });

      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: '⚠️ I encountered a temporary error. Please ask your question again.'
          }
        ]);
      }
    } catch (err) {
      console.error('Support chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Network error. Please check your connection and try again.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content:
          '👋 Chat cleared! How else can I assist you with the **RecruitAI** platform?'
      }
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-full shadow-2xl shadow-indigo-600/50 hover:scale-105 transition-all duration-200 border border-indigo-400/30"
          aria-label="Open RecruitAI AI Customer Support"
        >
          <div className="relative">
            <span className="text-lg">🤖</span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full"></span>
          </div>
          <span className="text-xs font-bold tracking-wide">RecruitAI AI Support</span>
        </button>
      )}

      {/* Expanded Chat Window */}
      {isOpen && (
        <div className="w-[380px] sm:w-[420px] h-[580px] bg-slate-950/95 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-slate-900/90 border-b border-slate-800 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-lg">
                🤖
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <span>RecruitAI Support Agent</span>
                  <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 text-[10px] font-mono rounded">
                    100% Platform Grounded
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">Ask anything about workflows & features</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleClearChat}
                title="Clear Chat"
                className="text-slate-400 hover:text-white text-xs p-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                🔄
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close Window"
                className="text-slate-400 hover:text-white text-xs p-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs shrink-0 mt-0.5">
                    🤖
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-sm space-y-1.5'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs shrink-0">
                  🤖
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-indigo-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse delay-75"></span>
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse delay-150"></span>
                  <span className="text-[11px] text-slate-400">Consulting platform knowledge...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Starter Chips (Only shown if < 3 messages) */}
          {messages.length <= 2 && (
            <div className="px-4 py-2 border-t border-slate-900/80 bg-slate-950/80">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Suggested Questions:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {STARTER_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-indigo-300 hover:text-white hover:border-indigo-500/50 transition text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about RecruitAI features, screening, roles..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition shadow-md shadow-indigo-600/30 shrink-0"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}