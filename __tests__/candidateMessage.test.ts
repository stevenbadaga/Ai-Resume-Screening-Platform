import { describe, expect, it } from 'vitest';
import {
  extractInternalNoteStrings,
  findMessageSafetyIssues,
  renderMessageBody,
} from '@/lib/candidateMessage';

const NOTE = 'Strong React skills but the client rejected the previous agency contract twice.';

describe('candidate message safety (spec §6.9)', () => {
  it('accepts an ordinary, safe message', () => {
    const issues = findMessageSafetyIssues({
      subject: 'Interview availability',
      body: 'Hi Jane, we would like to schedule a technical interview for the Platform Engineer role next week.',
      internalNotes: JSON.stringify([{ note: NOTE }]),
    });
    expect(issues).toEqual([]);
  });

  it('rejects a message that quotes internal reviewer notes', () => {
    const issues = findMessageSafetyIssues({
      subject: 'Update',
      body: `Hello. Internal context: ${NOTE} Anyway, thank you for applying.`,
      internalNotes: NOTE,
    });
    expect(issues.map((i) => i.code)).toContain('INTERNAL_NOTE_LEAK');
  });

  it('rejects claims that AI made the employment decision', () => {
    for (const body of [
      'Your application was rejected solely by AI.',
      'The AI decided not to move forward with your candidacy.',
      'You were automatically rejected because our system did not select you.',
    ]) {
      const issues = findMessageSafetyIssues({ subject: 'Update', body });
      expect(issues.map((i) => i.code)).toContain('AI_DECISION_CLAIM');
    }
  });

  it('rejects prompts, assessment internals and model identifiers', () => {
    const issues = findMessageSafetyIssues({
      subject: 'Update',
      body: 'See the system prompt and criterionId values from the screening run for details.',
    });
    expect(issues.map((i) => i.code)).toContain('CONFIDENTIAL_TECHNICAL_CONTENT');
  });

  it('extracts note strings from JSON and free-text blobs only when substantial', () => {
    expect(extractInternalNoteStrings(JSON.stringify([{ text: NOTE }]))).toEqual([NOTE]);
    expect(extractInternalNoteStrings('short')).toEqual([]);
    expect(extractInternalNoteStrings('')).toEqual([]);
    expect(extractInternalNoteStrings(null)).toEqual([]);
  });

  it('renders approved placeholders for preview', () => {
    expect(renderMessageBody('Dear {{candidateName}}, role: {{jobTitle}}.', {
      candidateName: 'Jane',
      jobTitle: 'Engineer',
    })).toBe('Dear Jane, role: Engineer.');
  });
});
