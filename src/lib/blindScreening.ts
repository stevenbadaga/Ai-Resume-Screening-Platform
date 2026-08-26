/**
 * Utility for Anti-Bias PII Redaction & Blind Screening Mode
 * Compliant with EU AI Act High-Risk Employment AI and EEOC Standards
 */

export interface AnonymizedCandidate {
  anonymousId: string;
  sanitizedText: string;
}

export function anonymizeCandidateId(candidateId: string): string {
  const hash = candidateId.slice(-4).toUpperCase();
  return `Candidate #${hash || 'ANON'}`;
}

export function redactPII(
  rawText: string,
  candidateName?: string,
  candidateEmail?: string,
  candidatePhone?: string
): string {
  let text = rawText;

  if (candidateName) {
    const parts = candidateName.split(' ');
    parts.forEach((part) => {
      if (part.length > 2) {
        const regex = new RegExp(`\\b${part}\\b`, 'gi');
        text = text.replace(regex, '[REDACTED NAME]');
      }
    });
  }

  if (candidateEmail) {
    const emailRegex = new RegExp(candidateEmail.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
    text = text.replace(emailRegex, '[REDACTED EMAIL]');
  }

  if (candidatePhone) {
    const phoneRegex = new RegExp(candidatePhone.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
    text = text.replace(phoneRegex, '[REDACTED PHONE]');
  }

  // General email pattern
  text = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED EMAIL]');

  // Phone number patterns
  text = text.replace(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[REDACTED PHONE]');

  // Gendered pronouns and salutations
  text = text.replace(/\b(he\/him|she\/her|he|him|his|she|her|hers|mr\.|mrs\.|ms\.)\b/gi, '[ANONYMIZED]');

  // Specific graduation year patterns (e.g., Graduated 2012 -> Graduated [REDACTED YEAR])
  text = text.replace(/\b(graduated|class of|batch of)\s+(19\d{2}|20\d{2})\b/gi, '$1 [REDACTED YEAR]');

  return text;
}