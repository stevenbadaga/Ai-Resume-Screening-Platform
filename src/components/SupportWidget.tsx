'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  outOfScope?: boolean;
}

export default function SupportWidget() {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
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
  }, [messages, isOpen, loading]);

  const quickPrompts = [
    { label: t('qp_apply_track'), prompt: 'How do I apply for a job and track my application status?' },
    { label: t('qp_match_score'), prompt: 'How does AI calculate rubric match scores and percentages?' },
    { label: t('qp_roles'), prompt: 'What are the exact permissions for each user role in the platform?' },
    { label: t('qp_blind_screening'), prompt: 'How does Blind Screening and PII Anonymization eliminate bias?' },
    { label: t('qp_create_rubric'), prompt: 'How do I post a job requisition and build weighted rubric criteria?' },
    { label: t('qp_questions'), prompt: 'How does the AI generate tailored interview questions from skill gaps?' }
  ];

  // Conversational follow-up chips offered after each answer.
  const followUpChips = [
    { label: t('copilot_chip_more'), prompt: 'tell me more' },
    { label: t('copilot_chip_apply'), prompt: 'How do I apply for a job?' },
    { label: t('copilot_chip_track'), prompt: 'Where can I track my applications?' },
    { label: t('copilot_chip_permissions'), prompt: 'What are the exact permissions for each user role?' }
  ];

  const sendQuery = async (queryText: string) => {
    if (!queryText.trim() || loading) return;

    const userMessage = queryText.trim();
    setInput('');

    // Send recent conversation context so the copilot stays aware of the
    // thread. The API accepts at most 50 messages and grounds its answer on
    // the last 12, so the newest 20 are always enough.
    const history: ChatMessage[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(history);
    const recentHistory = history.slice(-20);
    setLoading(true);

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: recentHistory.map(({ role, content }) => ({ role, content })),
          language
        })
      });

      if (res.ok) {
        const data = await res.json();
        const responseText = data.reply || data.message || t('copilot_acknowledge');
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: responseText, outOfScope: Boolean(data.outOfScope) }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: t('copilot_error_service') }
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: t('copilot_error_network') }
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

  const dismissHandoff = () => {
    setMessages((prev) =>
      prev.map((m, i) => (i === prev.length - 1 ? { ...m, outOfScope: false } : m))
    );
  };

  // Helper to extract quick navigation actions if the message mentions sections
  const getActionLinks = (content: string) => {
    const actions: { title: string; href: string }[] = [];
    const lower = content.toLowerCase();

    if (lower.includes('explore open jobs') || lower.includes('job requisitions') || lower.includes('offres') || lower.includes('puestos') || lower.includes('stellenangebote') || lower.includes('imyanya')) {
      actions.push({ title: t('nav_jobs'), href: '/jobs' });
    }
    if (lower.includes('my applications') || lower.includes('candidatures') || lower.includes('solicitudes') || lower.includes('bewerbungen') || lower.includes('ubusabe')) {
      actions.push({ title: t('nav_my_applications'), href: '/dashboard/my-applications' });
    }
    if (lower.includes('candidates') || lower.includes('candidats') || lower.includes('candidatos') || lower.includes('kandidaten') || lower.includes('abakandida')) {
      actions.push({ title: t('nav_candidates'), href: '/candidates' });
    }
    if (lower.includes('data privacy') || lower.includes('rgpd') || lower.includes('privacidad') || lower.includes('datenschutz') || lower.includes('umutekano')) {
      actions.push({ title: t('nav_privacy'), href: '/privacy' });
    }
    if (lower.includes('audit') || lower.includes('journal') || lower.includes('registro') || lower.includes('igenzura')) {
      actions.push({ title: t('nav_audit'), href: '/audit' });
    }
    if (lower.includes('team') || lower.includes('rbac') || lower.includes('equipo') || lower.includes('inshingano')) {
      actions.push({ title: t('nav_team'), href: '/dashboard/team' });
    }

    return actions;
  };

  const lastMessage = messages[messages.length - 1];
  const showFollowUpChips =
    !loading && lastMessage?.role === 'assistant' && messages.length > 1;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="px-3.5 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-xl shadow-indigo-500/20 flex items-center gap-2 text-xs font-semibold transition transform hover:scale-105 active:scale-95"
          title={t('copilot_title')}
        >
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span>{t('copilot_title')}</span>
        </button>
      )}

      {isOpen && (
        <div className="w-84 sm:w-[420px] h-[520px] dark:bg-[#11141D] bg-white dark:border-white/10 border-slate-200 border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-150 text-xs">
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center text-xs">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-xs leading-none">{t('copilot_title')}</h3>
                <span className="text-[9px] text-indigo-100 font-mono">{t('copilot_subtitle')}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleClearChat}
                className="text-[10px] px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white/90 transition font-mono"
                title={t('copilot_reset_title')}
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
          <div className="p-2 dark:bg-[#0D1017] bg-slate-50 dark:border-white/10 border-slate-100 border-b flex items-center gap-1.5 overflow-x-auto text-[10px] scrollbar-none">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => sendQuery(qp.prompt)}
                disabled={loading}
                className="px-2 py-1 rounded-md dark:bg-[#181E2C] bg-white dark:hover:bg-white/10 hover:bg-slate-100 border dark:border-white/10 border-slate-200 dark:text-slate-300 text-slate-700 font-medium whitespace-nowrap transition shrink-0"
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
                    className={`p-3 rounded-xl max-w-[90%] leading-relaxed whitespace-pre-wrap ${m.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none text-xs font-medium'
                        : 'dark:bg-slate-900 bg-slate-100 dark:text-slate-200 text-slate-800 border dark:border-slate-800 border-slate-200 rounded-bl-none text-xs'
                      }`}
                  >
                    {m.content}

                    {/* Out-of-scope handoff note */}
                    {m.role === 'assistant' && m.outOfScope && (
                      <div className="mt-2.5 pt-2 border-t dark:border-slate-800 border-slate-200/80">
                        <p className="text-[10px] italic dark:text-slate-400 text-slate-500">
                          {t('copilot_handoff_note')}
                        </p>
                        <button
                          onClick={dismissHandoff}
                          className="mt-1.5 px-2 py-0.5 rounded-md border dark:border-slate-700 border-slate-300 dark:text-slate-300 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-[10px] font-medium"
                        >
                          {t('copilot_acknowledge')}
                        </button>
                      </div>
                    )}

                    {/* Render Helpful 1-Click Navigation Buttons */}
                    {actionLinks.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t dark:border-slate-800 border-slate-200/80 flex flex-wrap gap-1.5">
                        {actionLinks.map((act, actIdx) => (
                          <Link
                            key={actIdx}
                            href={act.href}
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[10px] transition shadow-xs"
                          >
                            <span>{act.title} &rarr;</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Follow-up suggestion chips after the latest reply */}
                  {i === messages.length - 1 && showFollowUpChips && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5 max-w-[90%]">
                      {followUpChips.map((chip, chipIdx) => (
                        <button
                          key={chipIdx}
                          onClick={() => sendQuery(chip.prompt)}
                          className="px-2 py-1 rounded-full border dark:border-slate-700 border-slate-300 dark:text-slate-300 text-slate-600 dark:hover:bg-slate-800 hover:bg-slate-100 text-[10px] font-medium transition whitespace-nowrap"
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-1.5 p-2.5 rounded-lg dark:bg-slate-900 bg-slate-100 dark:text-slate-400 text-slate-500 text-[11px] w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-100"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-200"></span>
                <span className="ml-1 font-mono text-[10px]">{t('copilot_thinking')}</span>
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
              aria-label={t('copilot_input_label')}
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
