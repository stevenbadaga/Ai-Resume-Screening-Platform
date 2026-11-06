import { describe, expect, it } from 'vitest';
import {
  conversationAlreadyContains,
  findKnowledgeMatch,
  getFollowUpAck,
  getGroundedKnowledgeContext,
  getSafeFallback,
  resolveFollowUpQuery,
  sanitizeSupportMessages,
} from '@/lib/supportBrain';

describe('support brain', () => {
  it('matches multilingual questions without accent sensitivity', () => {
    const match = findKnowledgeMatch('Comment puis-je postuler à une offre ?');

    expect(match?.item.answers.fr).toContain('Pour postuler');
  });

  it('does not match short words embedded inside unrelated words', () => {
    // 'email delivery' is a real admin topic, so the negative fixture uses an
    // unrelated phrase to keep testing substring-boundary safety.
    expect(findKnowledgeMatch('Explain quantum computing')).toBeNull();
  });

  it('assists applicants with account, profile, and application help', () => {
    expect(findKnowledgeMatch('I forgot my password')?.item.answers.en).toContain('verification code');
    expect(findKnowledgeMatch('where do I update my CV?')?.item.answers.en).toContain('Profile');
    expect(findKnowledgeMatch('track my application')?.item.answers.en).toContain('My Applications');
  });

  it('covers interviewer, hiring-manager, and admin workflows', () => {
    expect(findKnowledgeMatch('how do I submit an interview scorecard?')?.item.answers.en).toContain('Scorecard');
    expect(findKnowledgeMatch('compare benchmark candidates')?.item.answers.en).toContain('Compare Benchmark');
    expect(findKnowledgeMatch('how do I invite a teammate?')?.item.answers.en).toContain('Team & RBAC');
  });

  it('matches two-word greetings and thanks as small talk', () => {
    expect(findKnowledgeMatch('hi there')?.item.answers.en).toContain('Hello');
    expect(findKnowledgeMatch('good morning')?.item.answers.en).toContain('Hello');
    expect(findKnowledgeMatch('thank you')?.item.answers.en).toContain('welcome');
    expect(findKnowledgeMatch('merci beaucoup')?.item.answers.fr).toContain('plaisir');
  });

  it('bounds and sanitizes conversation history', () => {
    const messages = Array.from({ length: 15 }, (_, index) => ({
      role: index === 0 ? 'system' : index % 2 === 0 ? 'user' : 'assistant',
      content: ` message ${index} `,
    }));

    const sanitized = sanitizeSupportMessages(messages as never);

    expect(sanitized).toHaveLength(12);
    expect(sanitized[0]?.role).toBe('assistant');
    expect(sanitized.every((message) => message.content === message.content.trim())).toBe(true);
  });

  it('builds grounded context in the requested language', () => {
    const context = getGroundedKnowledgeContext('de');

    expect(context).toContain('Verified answer:');
    expect(context).toContain('Um sich zu bewerben');
  });

  it('returns a localized safe fallback for unknown topics', () => {
    expect(getSafeFallback('rw')).toContain('RecruitAI');
  });

  it('points unknown topics to human support in the safe fallback', () => {
    expect(getSafeFallback('en')).toContain('human support');
    expect(getSafeFallback('de')).toContain('menschliches Support-Team');
  });
});

describe('conversational follow-ups', () => {
  it('resolves vague replies to the previous user query', () => {
    const history = [
      { role: 'assistant' as const, content: 'Hello!' },
      { role: 'user' as const, content: 'How does blind screening work?' },
      { role: 'assistant' as const, content: 'Blind Screening hides PII...' },
      { role: 'user' as const, content: 'tell me more' },
    ];

    expect(resolveFollowUpQuery(history)).toBe('How does blind screening work?');
  });

  it('ignores substantive questions and empty history', () => {
    const substantive = [
      { role: 'user' as const, content: 'Why is screening blind?' },
    ];

    expect(resolveFollowUpQuery(substantive)).toBeNull();
    expect(resolveFollowUpQuery([{ role: 'user', content: 'more' }])).toBeNull();
  });

  it('detects when a reply was already given in the conversation', () => {
    const history = [
      { role: 'user' as const, content: 'How does blind screening work?' },
      { role: 'assistant' as const, content: 'Blind Screening hides names, emails, and demographic details during initial evaluation to prevent unconscious bias.' },
      { role: 'user' as const, content: 'tell me more' },
    ];

    expect(
      conversationAlreadyContains(
        history,
        'Blind Screening hides names, emails, and demographic details during initial evaluation to prevent unconscious bias!'
      )
    ).toBe(true);
    expect(conversationAlreadyContains(history, 'A completely different answer.')).toBe(false);
  });

  it('returns a localized follow-up acknowledgement', () => {
    expect(getFollowUpAck('fr')).toContain('RecruitAI');
    expect(getFollowUpAck('en')).toContain('step by step');
  });
});
