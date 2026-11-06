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
    const parts = candidateName.split(/\s+/).filter(Boolean);
    parts.forEach((part) => {
      if (part.length > 2) {
        const regex = new RegExp(`\\b${part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        text = text.replace(regex, '[NAME_REDACTED]');
      }
    });
  }

  if (candidateEmail) {
    const emailRegex = new RegExp(candidateEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    text = text.replace(emailRegex, '[EMAIL_REDACTED]');
  }

  if (candidatePhone) {
    const phoneRegex = new RegExp(candidatePhone.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    text = text.replace(phoneRegex, '[PHONE_REDACTED]');
  }

  text = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]');
  text = text.replace(/(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3}[\s.-]?\d{3,4}/g, '[PHONE_REDACTED]');
  text = text.replace(/\b(?:full\s+name|candidate\s+name|name)\s*[:\-]?\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b/gi, '[NAME_REDACTED]');
  text = text.replace(/(?<!\b(?:Senior|Junior|Lead|Principal|Manager|Engineer|Developer|Designer|Architect|Analyst|Consultant|Specialist|Associate|Intern|Backend|Frontend|Fullstack|Software|Data|Product)\s)(?<![A-Za-z])(?!(?:Senior|Junior|Lead|Principal|Manager|Engineer|Developer|Designer|Architect|Analyst|Consultant|Specialist|Associate|Intern|Backend|Frontend|Fullstack|Software|Data|Product)\b)([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b/g, '[NAME_REDACTED]');
  text = text.replace(/\b(?:University\s+of|College\s+of|Institute\s+of)\s+[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*/gi, '[INSTITUTION_REDACTED]');
  text = text.replace(/\b(?:\d+\s+)?[A-Z][A-Za-z.\-]+(?:\s+[A-Z][A-Za-z.\-]+)*\s+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Place|Pl|Way|Court|Ct|Circle|Cir|Parkway|Pkwy|Square|Sq|Terrace|Ter|Highway|Hwy)\b/gi, '[ADDRESS_REDACTED]');
  text = text.replace(/\b(?:graduated|class\s+of|batch\s+of)\s+(?:in\s+)?(?:19|20)\d{2}\b/gi, '[YEAR_REDACTED]');
  text = text.replace(/\b(?:Nairobi|Kigali|Kampala|Lagos|Accra|Johannesburg|Dar\s+es\s+Salaam|Mombasa|Cairo|Addis\s+Ababa|Kisumu|Nakuru)\b/gi, '[CITY_REDACTED]');
  text = text.replace(/\b(he\/him|she\/her|he|him|his|she|her|hers|mr\.|mrs\.|ms\.)\b/gi, '[ANONYMIZED]');

  return text;
}