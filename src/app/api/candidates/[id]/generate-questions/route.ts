import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import OpenAI from 'openai';
import { requireAuth } from '@/lib/auth';
import { safeErrorResponse } from '@/lib/validation';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key'
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // SECURITY: Require authentication
    const auth = await requireAuth(['Admin', 'Recruiter', 'HiringManager', 'Interviewer']);
    if (auth.error) return auth.error;

    const resolvedParams = await params;
    const applicationId = resolvedParams.id;

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        candidate: true,
        job: {
          include: {
            rubrics: {
              include: { criteria: true }
            }
          }
        },
        screeningRuns: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            assessments: {
              include: { criterion: true }
            }
          }
        }
      }
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.job.organizationId !== auth.user.organizationId) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const latestScreening = application.screeningRuns[0];
    const assessments = latestScreening?.assessments || [];

    // Find gap skills (PARTIAL or MISSING/NO_MATCH)
    const gaps = assessments.filter((a: any) => a.result === 'PARTIAL' || a.result === 'MISSING' || a.result === 'NO_MATCH');

    // If OpenAI is configured, generate dynamic tailored questions
    if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('placeholder')) {
      try {
        const prompt = `You are an expert technical interviewer for the role: "${application.job.title}".
A candidate showed specific skill gaps during AI screening:
${gaps.map((g: any) => `- Requirement: ${g.criterion?.name || 'Criterion'}, Result: ${g.result}, Evidence: ${g.supportingEvidence || 'None'}`).join('\n')}

Generate exactly 3 structured technical interview questions to test the candidate's depth in these gap areas.
Return a valid JSON array of objects with keys:
"skill": string,
"question": string,
"expectedAnswer": string`;

        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          temperature: 0.3,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: 'You generate structured technical interview questions formatted as JSON: { "questions": [...] }' },
            { role: 'user', content: prompt }
          ]
        });

        const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
        if (parsed.questions && Array.isArray(parsed.questions)) {
          return NextResponse.json({ questions: parsed.questions });
        }
      } catch (openAiErr) {
        console.warn('OpenAI question generation failed, using intelligent fallback:', openAiErr);
      }
    }

    // Intelligent Deterministic Fallback Questions based on gaps
    const fallbackQuestions = gaps.length > 0 ? gaps.slice(0, 3).map((g: any) => ({
      skill: g.criterion?.name || 'Core Technical Requirement',
      question: `Can you walk us through a real-world scenario where you utilized ${g.criterion?.name || 'this technology'} in production, and how you handled unexpected system failures?`,
      expectedAnswer: `Candidate should demonstrate hands-on architectural understanding, debugging methodologies, and production best practices for ${g.criterion?.name || 'the required skill'}.`
    })) : [
      {
        skill: application.job.title,
        question: `Can you describe your most challenging engineering project related to ${application.job.title} and how you measured its success?`,
        expectedAnswer: 'Demonstrates clear system design principles, quantitative impact, and team leadership.'
      },
      {
        skill: 'Architecture & Scaling',
        question: 'How do you approach performance optimization and bottleneck resolution in high-throughput applications?',
        expectedAnswer: 'Explains profiling, database indexing, caching strategies, and concurrency handling.'
      }
    ];

    return NextResponse.json({ questions: fallbackQuestions });
  } catch (error: any) {
    console.error('Question generator error:', error);
    return safeErrorResponse('Failed to generate interview questions');
  }
}