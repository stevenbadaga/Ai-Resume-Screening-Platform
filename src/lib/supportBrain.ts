import { MultilingualKnowledgeItem, RECRUIT_AI_MULTILINGUAL_KNOWLEDGE } from './supportKnowledge';
import { CANONICAL_SKILL_NAMES, getSkillTaxonomy } from './skillNormalization';

type LangCode = 'en' | 'fr' | 'es' | 'de' | 'rw';
type SupportRole = 'user' | 'assistant';

export interface SupportMessage {
  role: SupportRole;
  content: string;
}

export interface KnowledgeMatch {
  item: MultilingualKnowledgeItem;
  score: number;
}

const MAX_HISTORY_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 2000;

export function normalizeSupportText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizeSupportMessages(messages: SupportMessage[]): SupportMessage[] {
  return messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, MAX_MESSAGE_LENGTH),
    }))
    .filter((message) => message.content.length > 0)
    .slice(-MAX_HISTORY_MESSAGES);
}

export function findKnowledgeMatch(query: string): KnowledgeMatch | null {
  const normalizedQuery = normalizeSupportText(query);
  if (!normalizedQuery) return null;

  const queryTokens = new Set(normalizedQuery.split(' '));
  let bestMatch: KnowledgeMatch | null = null;

  for (const item of RECRUIT_AI_MULTILINGUAL_KNOWLEDGE) {
    let score = 0;
    for (const keyword of item.keywords) {
      const normalizedKeyword = normalizeSupportText(keyword);
      if (!normalizedKeyword) continue;

      if (normalizedQuery === normalizedKeyword) {
        score += 12;
      } else if (normalizedQuery.includes(` ${normalizedKeyword} `) || normalizedQuery.startsWith(`${normalizedKeyword} `) || normalizedQuery.endsWith(` ${normalizedKeyword}`)) {
        score += normalizedKeyword.includes(' ') ? 8 : 5;
      } else if (!normalizedKeyword.includes(' ') && queryTokens.has(normalizedKeyword) && normalizedKeyword.length > 2) {
        score += 3;
      }
    }

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { item, score };
    }
  }

  return bestMatch && bestMatch.score >= 3 ? bestMatch : null;
}

export function getGroundedKnowledgeContext(language: LangCode): string {
  const knowledge = RECRUIT_AI_MULTILINGUAL_KNOWLEDGE
    .map((item) => {
      const answer = item.answers[language] || item.answers.en;
      return `Topic keywords: ${item.keywords.join(', ')}\nVerified answer: ${answer}`;
    })
    .join('\n\n');

  // The skill taxonomy is rendered from the same shared table the screening
  // engine uses (src/lib/skillNormalization.ts) — one source of truth, so the
  // copilot can never describe a skill list that diverges from what screening
  // actually normalizes (spec §6.6).
  const skillContext = renderSkillKnowledge();
  return skillContext ? `${knowledge}\n\n${skillContext}` : knowledge;
}

/**
 * Renders the shared skill taxonomy as copilot knowledge: a compact canonical
 * list plus the alias mappings, so users can ask "do you recognize k8s?" or
 * "which skills do you screen for?" and get answers consistent with screening.
 */
export function renderSkillKnowledge(): string {
  const taxonomy = getSkillTaxonomy();
  if (taxonomy.length === 0) return '';

  const aliasLines = taxonomy
    .map((entry) => {
      const aliases = entry.aliases.filter((a) => a !== entry.canonical.toLowerCase());
      return `- ${entry.canonical}${aliases.length > 0 ? ` (also recognized as: ${aliases.join(', ')})` : ''}`;
    })
    .join('\n');

  return [
    'Topic keywords: skills, skill list, skill matching, skill normalization, abbreviations, skill taxonomy',
    `Verified answer: RecruitAI screening recognizes ${CANONICAL_SKILL_NAMES.length} canonical skills and normalizes common abbreviations and variations (for example "JS" and "javascript" both map to JavaScript). The recognized skills and their aliases are:\n${aliasLines}`,]
    .join('\n');
}

export function getSafeFallback(language: LangCode): string {
  const fallback: Record<LangCode, string> = {
    en: 'I can help with RecruitAI jobs, applications, candidate review, rubrics, screening, interviews, notifications, and privacy. Please ask about one of those areas.',
    fr: 'Je peux vous aider avec les offres, les candidatures, les candidats, les grilles, le criblage, les entretiens, les notifications et la confidentialité dans RecruitAI. Posez une question sur l’un de ces sujets.',
    es: 'Puedo ayudarte con empleos, solicitudes, candidatos, rúbricas, selección, entrevistas, notificaciones y privacidad en RecruitAI. Pregunta por uno de esos temas.',
    de: 'Ich kann bei RecruitAI zu Stellen, Bewerbungen, Kandidaten, Bewertungsrubriken, Screening, Interviews, Benachrichtigungen und Datenschutz helfen. Fragen Sie bitte zu einem dieser Themen.',
    rw: 'Nshobora kubafasha ku myanya y’akazi, ubusabe, abakandida, bipimo ngenderwaho, isuzuma, ibibazo by’akazi, ubutumwa n’umutekano w’amakuru muri RecruitAI. Mumbaze kuri kimwe muri ibyo.',
  };
  return fallback[language] || fallback.en;
}
