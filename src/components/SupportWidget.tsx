'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function SupportWidget() {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    {
      role: 'assistant',
      content: t('copilot_welcome')
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === 'assistant') {
        return [{ role: 'assistant', content: t('copilot_welcome') }];
      }
      return prev;
    });
  }, [language, t]);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const quickPrompts = [
    { label: t('qp_match_score'), prompt: 'How does AI calculate rubric match scores and percentages?' },
    { label: t('qp_roles'), prompt: 'What are the exact permissions for each user role in the platform?' },
    { label: t('qp_blind_screening'), prompt: 'How does Blind Screening and PII Anonymization eliminate bias?' },
    { label: t('qp_create_rubric'), prompt: 'How do I post a job requisition and build weighted rubric criteria?' },
    { label: t('qp_questions'), prompt: 'How does the AI generate tailored interview questions from skill gaps?' }
  ];

  const sendQuery = async (queryText: string) => {
    if (!queryText.trim() || loading) return;

    const userMessage = queryText.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, language })
      });

      if (res.ok) {
        const data = await res.json();
        const responseText = data.reply || data.message || 'I am here to assist you with RecruitAI.';
        setMessages((prev) => [...prev, { role: 'assistant', content: responseText }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Unable to reach support service. Please try again.' }
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Network error. Please verify your connection.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuery(input);
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: t('copilot_welcome')
      }
    ]);
  };

  // Helper to extract quick navigation actions if the message mentions sections
  const getActionLinks = (content: string) => {
    const actions: { title: string; href: string; icon: string }[] = [];
    const lower = content.toLowerCase();

    if (lower.includes('explore open jobs') || lower.includes('job requisitions') || lower.includes('offres') || lower.includes('puestos') || lower.includes('stellenangebote') || lower.includes('imyanya')) {
      actions.push({ title: t('nav_jobs'), href: '/jobs', icon: '💼' });
    }
    if (lower.includes('my applications') || lower.includes('candidatures') || lower.includes('solicitudes') || lower.includes('bewerbungen') || lower.includes('ubusabe')) {
      actions.push({ title: t('nav_my_applications'), href: '/dashboard/my-applications', icon: '📄' });
    }
    if (lower.includes('candidates') || lower.includes('candidats') || lower.includes('candidatos') || lower.includes('kandidaten') || lower.includes('abakandida')) {
      actions.push({ title: t('nav_candidates'), href: '/candidates', icon: '👥' });
    }
    if (lower.includes('data privacy') || lower.includes('rgpd') || lower.includes('privacidad') || lower.includes('datenschutz') || lower.includes('umutekano')) {
      actions.push({ title: t('nav_privacy'), href: '/privacy', icon: '🛡️' });
    }
    if (lower.includes('audit') || lower.includes('journal') || lower.includes('registro') || lower.includes('igenzura')) {
      actions.push({ title: t('nav_audit'), href: '/audit', icon: '📋' });
    }
    if (lower.includes('team') || lower.includes('rbac') || lower.includes('equipo') || lower.includes('inshingano')) {
      actions.push({ title: t('nav_team'), href: '/dashboard/team', icon: '👑' });
    }

    return actions;
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="px-3.5 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-indigo-500/25 flex items-center gap-2 text-xs font-semibold transition transform hover:scale-105"
          title={t('copilot_title')}
        >
          <span className="text-sm">✨</span>
          <span>{t('copilot_title')}</span>
        </button>
      )}

      {isOpen && (
        <div className="w-84 sm:w-[420px] h-[520px] dark:bg-[#0B0F19] bg-white dark:border-slate-800 border-slate-200 border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-150 text-xs">
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center text-xs">✨</div>
              <div>
                <h3 className="font-bold text-xs leading-none">{t('copilot_title')}</h3>
                <span className="text-[9px] text-indigo-100 font-mono">{t('copilot_subtitle')}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleClearChat}
                className="text-[10px] px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white/90 transition font-mono"
                title="Reset Conversation"
              >
                {t('copilot_clear_btn')}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="p-2 dark:bg-slate-950 bg-slate-50 dark:border-slate-800 border-slate-100 border-b flex items-center gap-1.5 overflow-x-auto text-[10px] scrollbar-none">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => sendQuery(qp.prompt)}
                disabled={loading}
                className="px-2 py-1 rounded-md dark:bg-slate-900 bg-white dark:hover:bg-slate-800 hover:bg-slate-100 border dark:border-slate-800 border-slate-200 dark:text-slate-300 text-slate-700 font-medium whitespace-nowrap transition shrink-0"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Message Thread */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3">
            {messages.map((m, i) => {
              const actionLinks = m.role === 'assistant' ? getActionLinks(m.content) : [];

              return (
                <div
                  key={i}
                  className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`p-3 rounded-xl max-w-[90%] leading-relaxed whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none text-xs font-medium'
                        : 'dark:bg-slate-900 bg-slate-100 dark:text-slate-200 text-slate-800 border dark:border-slate-800 border-slate-200 rounded-bl-none text-xs'
                    }`}
                  >
                    {m.content}

                    {/* Render Helpful 1-Click Navigation Buttons */}
                    {actionLinks.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t dark:border-slate-800 border-slate-200/80 flex flex-wrap gap-1.5">
                        {actionLinks.map((act, actIdx) => (
                          <Link
                            key={actIdx}
                            href={act.href}
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[10px] transition shadow-xs"
                          >
                            <span>{act.icon}</span>
                            <span>{act.title} &rarr;</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-1.5 p-2.5 rounded-lg dark:bg-slate-900 bg-slate-100 dark:text-slate-400 text-slate-500 text-[11px] w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-100"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-200"></span>
                <span className="ml-1 font-mono text-[10px]">...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* User Input Form */}
          <form onSubmit={handleFormSubmit} className="p-2.5 dark:border-slate-800 border-slate-100 border-t flex gap-1.5 dark:bg-slate-950/60 bg-white">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('copilot_input_placeholder')}
              className="flex-1 dark:bg-slate-900 bg-slate-50 border dark:border-slate-800 border-slate-200 rounded-lg px-3 py-1.5 dark:text-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 text-xs"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-semibold transition text-xs shadow-xs"
            >
              {t('copilot_ask_btn')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}