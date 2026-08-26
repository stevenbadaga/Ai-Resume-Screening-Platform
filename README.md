# RecruitAI — Enterprise AI Resume Screening & Talent ATS Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue?logo=postgresql)](https://neon.tech/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-teal?logo=prisma)](https://www.prisma.io/)
[![BullMQ](https://img.shields.io/badge/BullMQ-Redis-red?logo=redis)](https://bullmq.io/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-green?logo=openai)](https://openai.com/)

**RecruitAI** is a state-of-the-art, evidence-based AI talent acquisition platform and Applicant Tracking System (ATS). It bridges the gap between hiring teams and top talent through automated resume screening, explainable AI rubric assessments, real-time broadcast notifications, an interactive Kanban pipeline, and grounded customer support AI.

---

## 🌟 Key Platform Capabilities

### 1. 📢 LinkedIn-Style Job Discovery & In-App Apply
* **Explore Jobs Feed (`/jobs`)**: Filter live open requisitions across departments (*Engineering, Data & AI, Product, Design, Operations*) with AI-evaluated criteria badges.
* **1-Click Application Flow (`/jobs/[id]/apply`)**: Drag-and-drop resume upload (PDF, DOCX, TXT) with SHA-256 duplicate detection and GDPR consent.
* **Live In-App Notification Bell (`NotificationBell.tsx`)**: Real-time broadcast alerts when new positions are posted or candidate statuses advance.

### 2. ⚡ Explainable AI Screening & Split-Screen Review
* **Deterministic Rubric Scoring**: AI evaluates candidates against weighted job rubrics (Priority 1-Optional to 5-Critical).
* **Quoted Evidence Citations**: Every requirement is scored as `MATCH`, `PARTIAL`, or `NO_MATCH` alongside verbatim quote citations from the CV.
* **Split-Screen Document Viewer (`/candidates/[id]`)**: Searchable in-browser CV reader with **interactive live keyword highlighting** alongside the AI assessment.
* **Human-in-the-Loop Override**: Recruiters can recalibrate scores with mandatory justification logged to the immutable audit trail.

### 3. 📋 Interactive Kanban Pipeline & Multi-Candidate Tools
* **Kanban ATS Board (`/candidates`)**: Visual 5-stage pipeline (`AI Screened` ➔ `Shortlisted` ➔ `Interviewing` ➔ `Offered / Hired` ➔ `Rejected`) with 1-click status transitions.
* **Side-by-Side Candidate Comparison (`/candidates/compare`)**: Multi-candidate criteria and score matrix.
* **Duplicate Resolver (`/candidates/duplicates`)**: Cross-requisition duplicate detection and profile consolidation.
* **Interview Scorecards (`/candidates/[id]/interview`)**: Technical and cultural assessment grading.

### 4. 📊 Executive Analytics & Visual Hiring Funnels (`/dashboard`)
* **Hiring Pipeline Conversion Funnel**: Live progress conversion chart tracking candidates from application to hire.
* **AI Match Quality Distribution**: Visual histogram segmenting candidate quality (*Elite 85-100%*, *Strong 70-84%*, *Moderate 50-69%*, *Low <50%*).
* **Live Audit Activity Feed**: Real-time ticker of recruiter actions and system mutations.

### 5. 🚀 Candidate Milestone Stepper (`/dashboard/my-applications`)
* Transparent, 4-step progress stepper (*Submitted ➔ AI Screened ➔ Shortlisted ➔ Interview Stage*) keeping applicants informed.

### 6. 🤖 Grounded AI Customer Support Assistant (`/api/support`)
* **100% Platform Grounded**: Complete knowledge base of all RecruitAI workflows, features, rubrics, and roles.
* **Strict Domain Guardrails**: Politely refuses to answer questions outside the RecruitAI application domain.
* **Floating Interactive Widget (`SupportWidget.tsx`)**: Bottom-right launcher with starter prompt chips and markdown responses.

### 7. 🛡️ Enterprise Security & GDPR Compliance
* **Right to be Forgotten (`/privacy`)**: 1-click data export and permanent resume/profile erasure.
* **Tamper-Proof Audit Trail (`/audit`)**: Every stage transition, score override, and team invite is recorded.
* **Multi-Role RBAC**: Admin/Primary Owner, Recruiter, Hiring Manager, Interviewer, Auditor, and Candidate.

---

---

## 🛠️ Technology Stack

* **Frontend**: Next.js 16 (App Router), React 19, Vanilla CSS + Tailwind Glassmorphism
* **Backend**: Next.js Server Components, API Route Handlers, Server Actions
* **Database**: PostgreSQL (Neon Serverless) managed via Prisma ORM (v7.9)
* **Background Queue**: BullMQ + Redis (Upstash) for asynchronous resume parsing and AI evaluations
* **AI Engine**: OpenAI GPT-4o / GPT-4o-mini structured outputs
* **Authentication**: NextAuth.js (Auth.js) JWT with Role-Based Access Control

---

## 🚀 Quick Start Guide

### 1. Prerequisites
* Node.js 18+ and npm
* PostgreSQL database (Neon or local)
* Redis instance (Upstash or local)
* OpenAI API Key

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
DIRECT_URL="postgresql://user:password@host/dbname?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secure-nextauth-secret-32-characters"
OPENAI_API_KEY="sk-proj-your-openai-api-key"
REDIS_URL="redis://localhost:6379"
```

### 3. Installation & Database Sync
```bash
npm install
npx prisma generate
npx prisma db push
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

Run validation with `npm run typecheck` and tests with `npm test`.

---

## 🔒 Security & Ethical AI Notice
* AI outputs in RecruitAI are designed exclusively for **decision support**. Final candidate advancements and rejections require human recruiter confirmation.
* All AI evaluations cite verifiable quotes directly from submitted documents to eliminate hallucinations.
* Human overrides are permanently logged in the audit trail to ensure accountability and compliance with EU/EEOC hiring standards.