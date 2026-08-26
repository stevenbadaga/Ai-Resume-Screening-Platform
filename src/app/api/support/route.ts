import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import {
  RECRUIT_AI_SYSTEM_PROMPT,
  RECRUIT_AI_MULTILINGUAL_KNOWLEDGE
} from '@/lib/supportKnowledge';
import { supportMessageSchema, validateBody, safeErrorResponse } from '@/lib/validation';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '@/lib/rateLimit';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key',
});

type LangCode = 'en' | 'fr' | 'es' | 'de' | 'rw';

export async function POST(req: Request) {
  try {
    // Rate limiting to prevent chatbot abuse
    const rateLimitKey = getRateLimitKey(req, 'support');
    const rateCheck = checkRateLimit(rateLimitKey, RATE_LIMITS.support);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment before sending another message.' },
        { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) } }
      );
    }

    const body = await req.json();

    // Validate input with Zod
    const { data, error } = validateBody(supportMessageSchema, body);
    if (error) return error;

    const language: LangCode = data.language as LangCode;
    let userMessage = '';
    let messageList: any[] = [];

    if (data.message && typeof data.message === 'string') {
      userMessage = data.message.trim();
      messageList = [{ role: 'user', content: userMessage }];
    } else if (Array.isArray(data.messages) && data.messages.length > 0) {
      messageList = data.messages;
      userMessage = String(messageList[messageList.length - 1]?.content || '').trim();
    }

    if (!userMessage) {
      const welcomeMap: Record<LangCode, string> = {
        en: "Hello! How can I assist you with RecruitAI today?",
        fr: "Bonjour ! Comment puis-je vous aider sur RecruitAI aujourd'hui ?",
        es: "¡Hola! ¿Cómo puedo ayudarte en RecruitAI hoy?",
        de: "Hallo! Wie kann ich Ihnen heute bei RecruitAI helfen?",
        rw: "Muraho! Nabafasha iki kuri RecruitAI uyu munsi?"
      };
      const welcome = welcomeMap[language] || welcomeMap.en;
      return NextResponse.json({ reply: welcome, message: welcome });
    }

    // 1. OpenAI Completion with Explicit Language Instruction
    if (
      process.env.OPENAI_API_KEY &&
      process.env.OPENAI_API_KEY !== 'dummy_key' &&
      !process.env.OPENAI_API_KEY.includes('placeholder') &&
      !process.env.OPENAI_API_KEY.includes('sk-proj-your')
    ) {
      try {
        const langInstructions: Record<LangCode, string> = {
          en: "Respond in clear, professional English.",
          fr: "Répondez impérativement en français avec un vocabulaire RH et technique authentique et soigné.",
          es: "Responde obligatoriamente en español con un vocabulario técnico y de recursos humanos preciso y formal.",
          de: "Antworten Sie auf Deutsch mit präzisem und professionellem HR- und IT-Fachvokabular.",
          rw: "Subiza mu Kinyarwanda cyumvikana kandi cyiza."
        };

        const systemWithLang = `${RECRUIT_AI_SYSTEM_PROMPT}\n\nTARGET LANGUAGE INSTRUCTION: ${langInstructions[language] || langInstructions.en}`;

        const formattedMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          { role: 'system', content: systemWithLang },
          ...messageList.map((m: any) => ({
            role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
            content: String(m.content || '')
          }))
        ];

        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          temperature: 0.3,
          messages: formattedMessages
        });

        const reply = response.choices[0]?.message?.content || 'I am here to help you navigate RecruitAI.';
        return NextResponse.json({ message: reply, reply });
      } catch (openAiErr: any) {
        console.warn('OpenAI Support API error, using intelligent multilingual fallback:', openAiErr.message);
      }
    }

    // 2. Multilingual Semantic Knowledge Matcher
    const queryLower = userMessage.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
    const queryTokens = queryLower.split(/\s+/).filter(Boolean);

    let bestMatch = null;
    let maxMatchScore = 0;

    for (const item of RECRUIT_AI_MULTILINGUAL_KNOWLEDGE) {
      let score = 0;
      for (const kw of item.keywords) {
        const kwLower = kw.toLowerCase();
        if (queryLower === kwLower) {
          score += 10;
        } else if (queryLower.includes(kwLower)) {
          score += 4;
        } else {
          for (const token of queryTokens) {
            if (token === kwLower && token.length > 2) {
              score += 2;
            }
          }
        }
      }

      if (score > maxMatchScore) {
        maxMatchScore = score;
        bestMatch = item;
      }
    }

    if (bestMatch && maxMatchScore >= 2) {
      const localizedAnswer = bestMatch.answers[language] || bestMatch.answers.en;
      return NextResponse.json({
        message: localizedAnswer,
        reply: localizedAnswer
      });
    }

    // Multilingual Default Guidance
    const defaultGuides: Record<LangCode, string> = {
      en: `I am here to help! 👋 You can ask me simple questions about job applications, candidate pipelines, rubrics, blind screening, or privacy.`,
      fr: `Je suis là pour vous aider ! 👋 Vous pouvez me poser des questions sur les candidatures, le suivi des profils, les grilles de compétences ou le criblage anonymisé.`,
      es: `¡Estoy aquí para ayudarte! 👋 Puedes preguntarme sobre cómo postularte, el pipeline de candidatos, las rúbricas de evaluación o la criba a ciegas.`,
      de: `Ich bin hier, um Ihnen zu helfen! 👋 Fragen Sie mich gerne zu Bewerbungen, der Kandidaten-Pipeline, Bewertungsrubriken oder Blind Screening.`,
      rw: `Niteguye kubafasha! 👋 Mumbaze ibijyanye no gusaba akazi, gusesengura abakandida, ibipimo ngenderwaho, cyangwa umutekano w'amakuru.`
    };

    const fallbackReply = defaultGuides[language] || defaultGuides.en;
    return NextResponse.json({
      message: fallbackReply,
      reply: fallbackReply
    });
  } catch (error: any) {
    console.error('Support route error:', error);
    return safeErrorResponse('Failed to process support request');
  }
}