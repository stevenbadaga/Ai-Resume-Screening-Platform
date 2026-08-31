import { describe, expect, it } from 'vitest';
import {
  findKnowledgeMatch,
  getGroundedKnowledgeContext,
  getSafeFallback,
  sanitizeSupportMessages,
} from '@/lib/supportBrain';

describe('support brain', () => {
  it('matches multilingual questions without accent sensitivity', () => {
    const match = findKnowledgeMatch('Comment puis-je postuler à une offre ?');

    expect(match?.item.answers.fr).toContain('Pour postuler');
  });

  it('does not match short words embedded inside unrelated words', () => {
    expect(findKnowledgeMatch('Explain email delivery')).toBeNull();
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
});
