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

// Single-word replies that carry no topic on their own ("more", "yes", "and…").
const VAGUE_SINGLE_WORDS = new Set([
  'more', 'and', 'why', 'how', 'yes', 'yeah', 'yep', 'ok', 'okay', 'sure',
  'no', 'nope', 'details', 'detail', 'example', 'examples', 'continue',
  'elaborate', 'anything', 'please',
]);

// Short conversational phrases that ask to expand on the previous answer.
const FOLLOW_UP_PHRASES =
  /^(tell me more|tell me everything|go on|go ahead|keep going|what else|anything else|explain more|more info|more information|more details|expand on that|and then|how so|why is that)\b/;

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

/**
 * Detects short conversational follow-ups ("more", "tell me more", "why?")
 * and returns the previous user query that carries the actual topic, so the
 * knowledge matcher can answer in context instead of falling back.
 */
export function resolveFollowUpQuery(messages: SupportMessage[]): string | null {
  const last = messages[messages.length - 1];
  if (!last || last.role !== 'user') return null;

  const normalized = normalizeSupportText(last.content);
  if (!normalized) return null;

  const tokens = normalized.split(' ').filter(Boolean);
  const isVague =
    (tokens.length === 1 && VAGUE_SINGLE_WORDS.has(tokens[0])) ||
    FOLLOW_UP_PHRASES.test(normalized);
  if (!isVague) return null;

  for (let i = messages.length - 2; i >= 0; i -= 1) {
    if (messages[i].role === 'user' && messages[i].content.trim()) {
      return messages[i].content;
    }
  }
  return null;
}

/**
 * True when the exact reply was already given in this conversation, so a
 * vague follow-up does not just repeat the same paragraph verbatim.
 */
export function conversationAlreadyContains(messages: SupportMessage[], reply: string): boolean {
  const normalizedReply = normalizeSupportText(reply);
  if (!normalizedReply) return false;
  return messages
    .filter((message) => message.role === 'assistant')
    .some((message) => normalizeSupportText(message.content).includes(normalizedReply));
}

export function getFollowUpAck(language: LangCode): string {
  const ack: Record<LangCode, string> = {
    en: 'Happy to keep going! Ask me a specific question about this topic — or about any other RecruitAI feature — and I will walk you through it step by step.',
    fr: 'Avec plaisir ! Posez-moi une question précise sur ce sujet — ou sur une autre fonctionnalité de RecruitAI — et je vous guiderai pas à pas.',
    es: '¡Con gusto! Hazme una pregunta concreta sobre este tema — o sobre cualquier otra función de RecruitAI — y te lo explico paso a paso.',
    de: 'Sehr gern! Stellen Sie mir eine konkrete Frage zu diesem Thema — oder zu einer anderen RecruitAI-Funktion — und ich erkläre Ihnen alles Schritt für Schritt.',
    rw: 'Ni byiza! Mumbaze ikibazo gihariye kuri iyi ngingo — cyangwa ku kindi gice cya RecruitAI — nzakubigishaho intambwe ku yandi.',
  };
  return ack[language] || ack.en;
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
    `Verified answer: RecruitAI screening recognizes ${CANONICAL_SKILL_NAMES.length} canonical skills and normalizes common abbreviations and variations (for example "JS" and "javascript" both map to JavaScript). The recognized skills and their aliases are:\n${aliasLines}`,
  ]
    .join('\n');
}

export function getSafeFallback(language: LangCode): string {
  const fallback: Record<LangCode, string> = {
    en: 'I can help every RecruitAI user — applicants (applying, tracking, profile & resume), recruiters (pipeline, rubrics, offers), hiring managers (departments, compare), interviewers (scorecards, scheduling), auditors (audit trail), and admins (team, settings, analytics). Ask me about any of those areas. For topics beyond the platform, our human support team is happy to help.',
    fr: 'J’aide tous les utilisateurs de RecruitAI — candidats (postuler, suivi, profil & CV), recruteurs (pipeline, grilles, offres), managers recruteurs (départements, comparaison), évaluateurs (fiches d’entretien, planification), auditeurs (journal d’audit) et administrateurs (équipe, paramètres, analytique). Posez une question sur l’un de ces sujets. Pour tout ce qui dépasse la plateforme, notre équipe humaine se fera un plaisir de vous aider.',
    es: 'Puedo ayudar a todos los usuarios de RecruitAI — postulantes (postularse, seguimiento, perfil y CV), reclutadores (pipeline, rúbricas, ofertas), gerentes de contratación (departamentos, comparación), entrevistadores (evaluaciones, programación), auditores (registro de auditoría) y administradores (equipo, ajustes, analítica). Pregunta por uno de esos temas. Para temas fuera de la plataforma, nuestro equipo humano estará encantado de ayudarte.',
    de: 'Ich helfe allen RecruitAI-Nutzern — Bewerbern (Bewerbung, Status, Profil & Lebenslauf), Recruitern (Pipeline, Rubriken, Angebote), Hiring Managern (Abteilungen, Vergleich), Interviewern (Bewertungsbögen, Planung), Auditoren (Audit-Protokoll) und Admins (Team, Einstellungen, Analytik). Fragen Sie zu einem dieser Themen. Für Themen außerhalb der Plattform hilft Ihnen unser menschliches Support-Team gerne weiter.',
    rw: 'Nshobora gufasha abakoresha bose ba RecruitAI — abasaba akazi (gusaba, kurikirana, umwirondoro na CV), abashakisha abakozi (pipeline, ibipimo, itangazo), abayobozi b’ishami (impanya, kugereranya), abakora ibizamini (urupapuro rw’ikizamini), abagenzuzi (igenzura) n’abayobozi (abakozi, igenamiterere, imibare). Mumbaze kuri kimwe muri ibyo. Ku bindi bidakora na RecruitAI, itsinda ryacu ry’abantu rirashobora kubafasha.',
  };
  return fallback[language] || fallback.en;
}
