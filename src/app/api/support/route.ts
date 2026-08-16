import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { RECRUIT_AI_SYSTEM_PROMPT, RECRUIT_AI_FALLBACK_KNOWLEDGE } from '@/lib/supportKnowledge';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key',
});

// Guardrail keywords for topics strictly outside RecruitAI domain
const OUT_OF_DOMAIN_PATTERNS = [
  /capital of/i,
  /who is the president/i,
  /tell me a joke/i,
  /recipe for/i,
  /weather in/i,
  /write (a|me) python (script|code) for fibonacci/i,
  /how to make a cake/i,
  /who won the world cup/i,
  /stock price of/i,
  /write an essay on/i
];

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const latestUserMessage = messages[messages.length - 1]?.content || '';

    // 1. Direct Guardrail Check
    const isOutOfDomain = OUT_OF_DOMAIN_PATTERNS.some((pattern) => pattern.test(latestUserMessage));
    if (isOutOfDomain) {
      return NextResponse.json({
        message:
          'I am the **RecruitAI Support Assistant**, specialized exclusively in helping you navigate and use the **RecruitAI** platform. I cannot assist with topics outside our recruitment and talent screening system.\n\nHow can I help you with **job posting**, **candidate screening**, **application tracking**, or **GDPR privacy** today?'
      });
    }

    // 2. Attempt OpenAI Completion with Grounded System Prompt
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy_key' && !process.env.OPENAI_API_KEY.includes('placeholder')) {
      try {
        const formattedMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          { role: 'system', content: RECRUIT_AI_SYSTEM_PROMPT },
          ...messages.map((m: any) => ({
            role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
            content: String(m.content || '')
          }))
        ];

        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          temperature: 0.2, // Low temperature for high factual grounding
          messages: formattedMessages
        });

        const reply = response.choices[0]?.message?.content || 'I could not generate a response. Please ask again.';
        return NextResponse.json({ message: reply });
      } catch (openAiErr: any) {
        console.warn('OpenAI Support API error, falling back to local grounded knowledge:', openAiErr.message);
      }
    }

    // 3. Intelligent Semantic Fallback Knowledge Matcher
    const queryLower = latestUserMessage.toLowerCase();
    let bestMatch = null;
    let maxMatchCount = 0;

    for (const item of RECRUIT_AI_FALLBACK_KNOWLEDGE) {
      let matchCount = 0;
      for (const kw of item.keywords) {
        if (queryLower.includes(kw.toLowerCase())) {
          matchCount++;
        }
      }
      if (matchCount > maxMatchCount) {
        maxMatchCount = matchCount;
        bestMatch = item;
      }
    }

    if (bestMatch && maxMatchCount >= 1) {
      return NextResponse.json({
        message: bestMatch.answer
      });
    }

    // Default In-Domain Guidance
    return NextResponse.json({
      message: `I am here to help you with anything on **RecruitAI**! 

Here are some quick topics you can ask me about:
* **⚡ AI Resume Screening**: How criteria rubrics and match percentages are calculated.
* **📄 Job Applications**: How candidates apply in-app and track status on \`/dashboard/my-applications\`.
* **💼 Posting Roles**: How employers post requisitions and set weighted criteria on \`/jobs\`.
* **📋 Candidate Pipeline**: Using the Kanban board and Table view on \`/candidates\`.
* **🛡️ GDPR Privacy**: Requesting data exports or executing Right to be Forgotten on \`/privacy\`.
* **👥 Roles & Permissions**: Admin, Recruiter, Hiring Manager, Interviewer, and Auditor capabilities.`
    });
  } catch (error: any) {
    console.error('Support route error:', error);
    return NextResponse.json({ error: 'Failed to process support request' }, { status: 500 });
  }
}