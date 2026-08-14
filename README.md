# RecruitAI - Enterprise AI Resume Screening Platform

An evidence-based recruitment and candidate screening platform built with Next.js 16, PostgreSQL, Prisma, BullMQ, Upstash Redis, and OpenAI `gpt-4o`.

## Key Features
- **Multi-Tenant Architecture**: Secure multi-tenant organization boundaries and immutable Primary Owner protection.
- **Explainable AI Matching**: PII-redacted structured profile extraction and weighted rubric evaluation (Weights 1-5).
- **Recruiter Feedback Loop**: Recruiter score overrides with mandatory rationale capture.
- **Audit & Compliance**: Searchable, immutable audit logging (`/audit`) for all critical actions.
- **Privacy Self-Service**: GDPR / CCPA candidate "Right to be Forgotten" self-service portal (`/privacy`).
- **Resilient AI Worker**: BullMQ queue with exponential backoff retries and Dead-Letter Queue (DLQ).

## Pre-Seeded Default Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin (Primary Owner)** | `admin@codafriqa.rw` | `password123` |
| **Lead Recruiter** | `recruiter@codafriqa.rw` | `password123` |
| **Hiring Manager** | `manager@codafriqa.rw` | `password123` |
| **Interviewer** | `interviewer@codafriqa.rw` | `password123` |
| **Compliance Auditor** | `auditor@codafriqa.rw` | `password123` |

## Quick Start

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment:**
   Copy `.env.example` to `.env` and provide your database credentials.

3. **Seed Database:**
   ```bash
   npx tsx scripts/seed.ts
   ```

4. **Start Web Application:**
   ```bash
   npm run dev
   ```

5. **Start Background AI Processing Worker:**
   ```bash
   npx tsx src/lib/worker.ts
   ```