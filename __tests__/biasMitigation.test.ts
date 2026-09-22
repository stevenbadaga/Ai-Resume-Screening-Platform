import { describe, it, expect } from 'vitest';
import { redactPII } from '@/lib/resumeProcessor';

describe('Bias Mitigation (PII Redaction)', () => {
  it('redacts email addresses successfully', () => {
    const rawText = "Contact me at candidate.name123@gmail.com for an interview.";
    const result = redactPII(rawText);
    expect(result).toBe("Contact me at [EMAIL_REDACTED] for an interview.");
    expect(result).not.toContain("candidate.name123@gmail.com");
  });

  it('redacts standard phone numbers successfully', () => {
    const rawText = "My phone number is (123) 456-7890. Call me!";
    const result = redactPII(rawText);
    expect(result).toBe("My phone number is [PHONE_REDACTED]. Call me!");
    expect(result).not.toContain("(123) 456-7890");
  });

  it('redacts international phone numbers successfully', () => {
    const rawText = "Call me: +1 555 123 4567 anytime.";
    const result = redactPII(rawText);
    expect(result).toBe("Call me: [PHONE_REDACTED] anytime.");
    expect(result).not.toContain("+1 555 123 4567");
  });

  it('handles multiple pieces of PII in the same text', () => {
    const rawText = "John Doe | john.doe@email.com | 555-555-5555";
    const result = redactPII(rawText);
    expect(result).toContain("[EMAIL_REDACTED]");
    expect(result).toContain("[PHONE_REDACTED]");
    expect(result).not.toContain("john.doe@email.com");
    expect(result).not.toContain("555-555-5555");
  });
});
