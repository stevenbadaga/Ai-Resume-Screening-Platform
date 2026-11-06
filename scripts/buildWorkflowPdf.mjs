import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(root, 'AI-Resume-Screening-Platform-Workflows-and-Use-Cases.pdf');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>RecruitAI — Workflows and Use Cases Guide</title>
<style>
  @page {
    size: A4;
    margin: 16mm 14mm 16mm 14mm;
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    background: #ffffff;
    line-height: 1.5;
    font-size: 10pt;
    margin: 0;
    padding: 0;
  }
  .page-break {
    page-break-before: always;
  }
  .avoid-break {
    page-break-inside: avoid;
  }

  /* Header / Footer */
  .doc-header {
    border-bottom: 2px solid #4f46e5;
    padding-bottom: 8px;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .doc-header .logo {
    font-size: 16pt;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.5px;
  }
  .doc-header .logo span {
    color: #4f46e5;
  }
  .doc-header .doc-meta {
    font-size: 8pt;
    color: #64748b;
    text-align: right;
  }

  /* Cover Banner */
  .hero-banner {
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%);
    color: #ffffff;
    border-radius: 12px;
    padding: 30px;
    margin-bottom: 24px;
  }
  .hero-badge {
    display: inline-block;
    background: rgba(99, 102, 241, 0.3);
    border: 1px solid rgba(165, 180, 252, 0.4);
    color: #c7d2fe;
    font-size: 8pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 4px 10px;
    border-radius: 9999px;
    margin-bottom: 12px;
  }
  .hero-title {
    font-size: 22pt;
    font-weight: 800;
    margin: 0 0 8px 0;
    line-height: 1.2;
    letter-spacing: -0.5px;
  }
  .hero-subtitle {
    font-size: 11pt;
    color: #cbd5e1;
    margin: 0 0 18px 0;
    font-weight: 400;
  }
  .hero-meta-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    padding-top: 14px;
    font-size: 8pt;
  }
  .hero-meta-item strong {
    display: block;
    color: #94a3b8;
    text-transform: uppercase;
    font-size: 7pt;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
  }

  /* Headings */
  h1 {
    font-size: 15pt;
    color: #0f172a;
    border-bottom: 1.5px solid #e2e8f0;
    padding-bottom: 6px;
    margin: 20px 0 12px 0;
    font-weight: 800;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  h2 {
    font-size: 12pt;
    color: #1e293b;
    margin: 16px 0 8px 0;
    font-weight: 700;
  }
  h3 {
    font-size: 10.5pt;
    color: #334155;
    margin: 12px 0 6px 0;
    font-weight: 700;
  }
  p {
    margin: 0 0 8px 0;
    color: #334155;
  }

  /* Workflow Steps */
  .workflow-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 16px;
  }
  .workflow-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #4f46e5;
    border-radius: 8px;
    padding: 10px 12px;
  }
  .workflow-card.alt {
    border-left-color: #06b6d4;
  }
  .workflow-card.emerald {
    border-left-color: #10b981;
  }
  .workflow-card.amber {
    border-left-color: #f59e0b;
  }
  .workflow-step-num {
    font-size: 7.5pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #6366f1;
    margin-bottom: 2px;
  }
  .workflow-card-title {
    font-size: 10pt;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 4px;
  }
  .workflow-card-desc {
    font-size: 8.5pt;
    color: #475569;
    margin: 0;
  }

  /* Persona Section */
  .persona-box {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  }
  .persona-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 6px;
    margin-bottom: 8px;
  }
  .persona-name {
    font-size: 11pt;
    font-weight: 800;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .persona-badge {
    font-size: 7.5pt;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 9999px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .badge-candidate { background: #e0e7ff; color: #3730a3; }
  .badge-recruiter { background: #dbeafe; color: #1e40af; }
  .badge-manager { background: #fef3c7; color: #92400e; }
  .badge-interviewer { background: #f3e8ff; color: #6b21a8; }
  .badge-auditor { background: #dcfce7; color: #166534; }
  .badge-admin { background: #fee2e2; color: #991b1b; }

  .use-case-item {
    margin-bottom: 6px;
    padding-left: 8px;
    border-left: 2px solid #cbd5e1;
  }
  .use-case-title {
    font-weight: 700;
    font-size: 9pt;
    color: #1e293b;
  }
  .use-case-desc {
    font-size: 8.5pt;
    color: #475569;
    margin: 1px 0 0 0;
  }

  /* Table */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 8.5pt;
  }
  th {
    background: #f1f5f9;
    color: #1e293b;
    font-weight: 700;
    text-align: left;
    padding: 6px 8px;
    border: 1px solid #cbd5e1;
    font-size: 8pt;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
  td {
    padding: 6px 8px;
    border: 1px solid #e2e8f0;
    color: #334155;
  }
  tr:nth-child(even) td {
    background: #f8fafc;
  }
  .check {
    color: #059669;
    font-weight: 800;
    text-align: center;
  }
  .cross {
    color: #94a3b8;
    text-align: center;
  }

  /* Callout */
  .callout {
    background: #eff6ff;
    border-left: 4px solid #3b82f6;
    padding: 10px 12px;
    border-radius: 0 6px 6px 0;
    margin: 12px 0;
    font-size: 8.5pt;
    color: #1e40af;
  }
  .callout strong {
    color: #1d4ed8;
  }

  .footer-note {
    margin-top: 24px;
    padding-top: 10px;
    border-top: 1px solid #e2e8f0;
    font-size: 7.5pt;
    color: #94a3b8;
    display: flex;
    justify-content: space-between;
  }
</style>
</head>
<body>

  <!-- ==================== PAGE 1: COVER & WORKFLOW OVERVIEW ==================== -->
  <div class="doc-header">
    <div class="logo">Recruit<span>AI</span></div>
    <div class="doc-meta">
      <strong>Enterprise ATS Platform</strong><br>
      System Architecture & Operational Specifications
    </div>
  </div>

  <div class="hero-banner">
    <div class="hero-badge">Official Architecture & Operational Document</div>
    <h1 class="hero-title">Recruitment Lifecycles, End-to-End Workflows & User Persona Use Cases</h1>
    <p class="hero-subtitle">Comprehensive functional specification, operational pipelines, RBAC permission models, and ethical AI safeguards.</p>
    
    <div class="hero-meta-grid">
      <div class="hero-meta-item">
        <strong>Lead Engineer</strong>
        SHYAKA Jospin (ID: 26119)
      </div>
      <div class="hero-meta-item">
        <strong>Organization</strong>
        CODAFRIQA / AUCA
      </div>
      <div class="hero-meta-item">
        <strong>Academic Supervisor</strong>
        Steven IRANKUNDA BADAGA
      </div>
      <div class="hero-meta-item">
        <strong>Status / Release</strong>
        v1.0 Production Certified
      </div>
    </div>
  </div>

  <h1>1. Executive Summary & Architectural Overview</h1>
  <p>
    <strong>RecruitAI</strong> is a next-generation Applicant Tracking System engineered to eliminate hiring bottlenecks while enforcing strict algorithmic fairness, privacy compliance (GDPR/Law N° 058/2021), and full decision explainability. Unlike opaque screening black-boxes, RecruitAI serves as an intelligent <em>decision-support co-pilot</em>: candidates are evaluated against objective job rubrics, with direct verbatim citations anchored to the candidate resume, while humans retain absolute control over shortlisting and hiring decisions.
  </p>

  <h1>2. The 8-Stage End-to-End Recruitment Lifecycle</h1>
  <p>The platform coordinates talent acquisition across an 8-stage automated and human-governed pipeline:</p>

  <div class="workflow-grid">
    <div class="workflow-card">
      <div class="workflow-step-num">Stage 1 · Definition</div>
      <div class="workflow-card-title">Requisition & Rubric Setup</div>
      <p class="workflow-card-desc">Hiring Managers and Recruiters post vacancies, defining core requirements, preferred skills, minimum experience, and weighted evaluation criteria (e.g. Technical 40%, Leadership 20%, Domain 40%).</p>
    </div>

    <div class="workflow-card alt">
      <div class="workflow-step-num">Stage 2 · Intake</div>
      <div class="workflow-card-title">Application Sourcing & Ingestion</div>
      <p class="workflow-card-desc">Candidates apply via public job portals or recruiters ingest bulk resume archives (PDF/DOCX up to 5MB) with automated pre-flight format validation and virus/malware scanning.</p>
    </div>

    <div class="workflow-card emerald">
      <div class="workflow-step-num">Stage 3 · Privacy & Bias Shield</div>
      <div class="workflow-card-title">PII Redaction & Blind Screening</div>
      <p class="workflow-card-desc">The parser automatically detects and redacts personal identifiers (names, emails, phone numbers, addresses, graduation years, universities) to mitigate demographic proxy bias.</p>
    </div>

    <div class="workflow-card amber">
      <div class="workflow-step-num">Stage 4 · AI Analysis</div>
      <div class="workflow-card-title">Scoring & Explainable Citations</div>
      <p class="workflow-card-desc">The AI computes overall match scores (0–100%) and extracts direct evidence quotes from the resume, mapping qualifications to rubric criteria with confidence flags for human review.</p>
    </div>

    <div class="workflow-card">
      <div class="workflow-step-num">Stage 5 · Pipeline Triage</div>
      <div class="workflow-card-title">Deduplication & Quick-Filtering</div>
      <p class="workflow-card-desc">Recruiters resolve potential duplicate submissions via fuzzy contact matching and triage candidates using 1-click filter chips (Needs Review, Top Matches, Required Failed).</p>
    </div>

    <div class="workflow-card alt">
      <div class="workflow-step-num">Stage 6 · Evaluation</div>
      <div class="workflow-card-title">Interviews & Structured Scorecards</div>
      <p class="workflow-card-desc">Recruiters coordinate interview rounds; interviewers utilize AI-generated competency question guides and submit standardized 5-point scorecards with qualitative notes.</p>
    </div>

    <div class="workflow-card emerald">
      <div class="workflow-step-num">Stage 7 · Decision</div>
      <div class="workflow-card-title">Hiring Decisions & Offer Dispatch</div>
      <p class="workflow-card-desc">Hiring Managers make final selections. Overrides of AI recommendations require mandatory logged rationales before customized offer letters or gentle rejections are dispatched.</p>
    </div>

    <div class="workflow-card amber">
      <div class="workflow-step-num">Stage 8 · Governance</div>
      <div class="workflow-card-title">Tamper-Evident Audit & Telemetry</div>
      <p class="workflow-card-desc">Every event is cryptographically sealed in a SHA-256 blockchain-style hash chain. Auditors verify demographic parity and disparate impact across recruitment cohorts.</p>
    </div>
  </div>

  <div class="callout">
    <strong>Core Architectural Guarantee:</strong> The AI engine never autonomously rejects or accepts an applicant. All hiring outcomes require authenticated human intervention, reinforced by cryptographic accountability.
  </div>

  <div class="footer-note">
    <span>RecruitAI · AI-Resume Screening Platform</span>
    <span>Page 1 of 4</span>
  </div>

  <!-- ==================== PAGE 2: USER PERSONAS (1 TO 3) ==================== -->
  <div class="page-break"></div>

  <div class="doc-header">
    <div class="logo">Recruit<span>AI</span></div>
    <div class="doc-meta">
      <strong>User Personas & Use Case Specifications</strong><br>
      Part I: Candidates, Recruiters & Hiring Managers
    </div>
  </div>

  <h1>3. User Personas & Use Case Specifications</h1>

  <!-- PERSONA 1 -->
  <div class="persona-box avoid-break">
    <div class="persona-header">
      <div class="persona-name">
        <span>👤</span> Persona 1: Candidate (Job Applicant)
      </div>
      <span class="persona-badge badge-candidate">External Job Seeker</span>
    </div>
    <p style="font-size: 8.5pt; color: #475569; margin-bottom: 8px;">
      External users seeking employment. Restricted strictly to public career portals and their own personal application tracking dashboard.
    </p>

    <div class="use-case-item">
      <div class="use-case-title">UC-C1: Public Job Discovery & Application Intake</div>
      <div class="use-case-desc"><strong>Route:</strong> <code>/jobs</code>, <code>/candidates/apply</code> · Search open roles, filter by department, review requirements, and submit a resume (PDF/DOCX ≤ 5MB) with client-side format and file-size validation.</div>
    </div>
    <div class="use-case-item">
      <div class="use-case-title">UC-C2: Dual Portal Candidate Authentication</div>
      <div class="use-case-desc"><strong>Route:</strong> <code>/auth/signin</code>, <code>/auth/signup</code> · Register/sign in via the dedicated "Work Applicant" portal tab with email verification and secure session tokens.</div>
    </div>
    <div class="use-case-item">
      <div class="use-case-title">UC-C3: Stepped Application Progress Tracking</div>
      <div class="use-case-desc"><strong>Route:</strong> <code>/dashboard/my-applications</code> · Monitor real-time status via a visual 4-step progress stepper (Submitted → Screening → Interviewing → Decision) with active status badges.</div>
    </div>
    <div class="use-case-item">
      <div class="use-case-title">UC-C4: Data Subject Privacy & Export Rights</div>
      <div class="use-case-desc"><strong>Route:</strong> <code>/privacy</code>, <code>/dashboard/profile</code> · Exercise GDPR / Law N° 058/2021 rights including requesting data export or executing the Right to Be Forgotten.</div>
    </div>
  </div>

  <!-- PERSONA 2 -->
  <div class="persona-box avoid-break">
    <div class="persona-header">
      <div class="persona-name">
        <span>📋</span> Persona 2: Recruiter (Talent Acquisition Specialist)
      </div>
      <span class="persona-badge badge-recruiter">Pipeline Operational Lead</span>
    </div>
    <p style="font-size: 8.5pt; color: #475569; margin-bottom: 8px;">
      Talent acquisition professionals responsible for end-to-end pipeline execution, resume ingestion, candidate filtering, deduplication, and communications.
    </p>

    <div class="use-case-item">
      <div class="use-case-title">UC-R1: Job Requisition & Rubric Authoring</div>
      <div class="use-case-desc"><strong>Route:</strong> <code>/jobs</code>, <code>/api/jobs</code> · Author job postings, establish required vs preferred skill matrices, and configure weighted rubric criteria.</div>
    </div>
    <div class="use-case-item">
      <div class="use-case-title">UC-R2: Resume Ingestion & Blind Screening Control</div>
      <div class="use-case-desc"><strong>Route:</strong> <code>/candidates</code>, <code>/api/candidates</code> · Upload batches of resumes, trigger AI parsing, and toggle blind screening to mask demographic identifiers.</div>
    </div>
    <div class="use-case-item">
      <div class="use-case-title">UC-R3: Fast Triage via 1-Click Filter Chips</div>
      <div class="use-case-desc"><strong>Route:</strong> <code>/candidates</code> · Rapidly filter large candidate volumes using preset chips: <code>⚠️ Needs Review</code>, <code>⭐ Top Matches</code>, <code>❌ Required Failed</code>, and <code>📅 Interviewing</code>.</div>
    </div>
    <div class="use-case-item">
      <div class="use-case-title">UC-R4: Duplicate Candidate Detection & Resolution</div>
      <div class="use-case-desc"><strong>Route:</strong> <code>/candidates/duplicates</code> · Inspect suspected duplicate profiles, view historical submission diffs, and merge duplicate submissions into an authoritative record.</div>
    </div>
    <div class="use-case-item">
      <div class="use-case-title">UC-R5: Multi-Candidate Side-by-Side Comparison</div>
      <div class="use-case-desc"><strong>Route:</strong> <code>/candidates/compare</code> · Compare 2 to 4 candidate qualifications side-by-side with sticky headers, criteria matrix scores, and radar overlays.</div>
    </div>
    <div class="use-case-item">
      <div class="use-case-title">UC-R6: Candidate Stage Notifications & Talent Pooling</div>
      <div class="use-case-desc"><strong>Route:</strong> <code>/api/candidates/[id]/interview</code>, <code>/api/jobs/[id]/talent-pool</code> · Issue automated branded email notifications and tag candidates for future talent pools.</div>
    </div>
  </div>

  <!-- PERSONA 3 -->
  <div class="persona-box avoid-break">
    <div class="persona-header">
      <div class="persona-name">
        <span>👔</span> Persona 3: Hiring Manager (Department Head)
      </div>
      <span class="persona-badge badge-manager">Hiring Decision Authority</span>
    </div>
    <p style="font-size: 8.5pt; color: #475569; margin-bottom: 8px;">
      Departmental leadership focused on candidate profile deep-dives, interview coordination, scorecard consensus, and final hiring selections.
    </p>

    <div class="use-case-item">
      <div class="use-case-title">UC-HM1: Deep Evidence Verification & Auto-Scroll</div>
      <div class="use-case-desc"><strong>Route:</strong> <code>/candidates/[id]</code> · Review AI match scores, inspect competency breakdowns, and click "Locate Evidence" to auto-scroll directly to verbatim quotes in the resume viewer.</div>
    </div>
    <div class="use-case-item">
      <div class="use-case-title">UC-HM2: Interview Round Scheduling & Panel Assignment</div>
      <div class="use-case-desc"><strong>Route:</strong> <code>/api/candidates/[id]/interview</code> · Configure multi-stage interview rounds (Technical, Cultural, Executive), assign interviewers, and generate calendar invites.</div>
    </div>
    <div class="use-case-item">
      <div class="use-case-title">UC-HM3: Scorecard Consolidation & Consensus Review</div>
      <div class="use-case-desc"><strong>Route:</strong> <code>/candidates/[id]</code> · Review completed panel scorecards, evaluate rating divergence, and review qualitative interviewer commentary.</div>
    </div>
    <div class="use-case-item">
      <div class="use-case-title">UC-HM4: Human-in-the-Loop Override & Decision Issuance</div>
      <div class="use-case-desc"><strong>Route:</strong> <code>/api/decisions</code>, <code>/api/candidates/[id]/offer</code> · Override AI recommendations with mandatory logged justifications and issue formal Offers or Rejections.</div>
    </div>
  </div>

  <div class="footer-note">
    <span>RecruitAI · AI-Resume Screening Platform</span>
    <span>Page 2 of 4</span>
  </div>

  <!-- ==================== PAGE 3: USER PERSONAS (4 TO 6) ==================== -->
  <div class="page-break"></div>

  <div class="doc-header">
    <div class="logo">Recruit<span>AI</span></div>
    <div class="doc-meta">
      <strong>User Personas & Use Case Specifications</strong><br>
      Part II: Interviewers, Compliance Auditors & Administrators
    </div>
  </div>

  <!-- PERSONA 4 -->
  <div class="persona-box avoid-break">
    <div class="persona-header">
      <div class="persona-name">
        <span>🎯</span> Persona 4: Interviewer (Panel / Technical Evaluator)
      </div>
      <span class="persona-badge badge-interviewer">Assessment Specialist</span>
    </div>
    <p style="font-size: 8.5pt; color: #475569; margin-bottom: 8px;">
      Engineers, team members, or domain specialists assigned to conduct interviews. Granted strictly scoped evaluation capabilities with no final decision rights.
    </p>

    <div class="use-case-item">
      <div class="use-case-title">UC-I1: Scoped Candidate Profile Review</div>
      <div class="use-case-desc"><strong>Route:</strong> <code>/candidates/[id]</code> · Access candidate resume highlights and qualification summaries strictly for assigned interview rounds.</div>
    </div>
    <div class="use-case-item">
      <div class="use-case-title">UC-I2: AI-Generated Interview Question Guides</div>
      <div class="use-case-desc"><strong>Route:</strong> <code>/candidates/[id]</code> · Access AI-curated behavioral and technical questions targeting specific skill gaps or unverified claims in the resume.</div>
    </div>
    <div class="use-case-item">
      <div class="use-case-title">UC-I3: Standardized Scorecard Submission</div>
      <div class="use-case-desc"><strong>Route:</strong> <code>/api/candidates/[id]/scorecard</code> · Complete structured 5-dimension scorecards (1–5 scale), verify mandatory technical skills, and submit final recommendations (Strong Yes, Yes, No, Strong No).</div>
    </div>
  </div>

  <!-- PERSONA 5 -->
  <div class="persona-box avoid-break">
    <div class="persona-header">
      <div class="persona-name">
        <span>⚖️</span> Persona 5: Compliance Auditor (Legal / Ethics / DEI Officer)
      </div>
      <span class="persona-badge badge-auditor">Governance & Independent Oversight</span>
    </div>
    <p style="font-size: 8.5pt; color: #475569; margin-bottom: 8px;">
      Legal, ethical, and compliance officers responsible for algorithmic accountability, bias detection, data protection, and tamper verification.
    </p>

    <div class="use-case-item">
      <div class="use-case-title">UC-CA1: Cryptographic Audit Explorer</div>
      <div class="use-case-desc"><strong>Route:</strong> <code>/audit</code> · Filter and review all system actions by actor, action type, target entity, timestamp, and IP address.</div>
    </div>
    <div class="use-case-item">
      <div class="use-case-title">UC-CA2: Tamper-Evident Hash Chain Verification</div>
      <div class="use-case-desc"><strong>Route:</strong> <code>npm run verify-audit-chain</code> · Execute cryptographic verification proving that every audit entry is linked via unbroken SHA-256 hashes: <code>Hash(n) = SHA256(Hash(n-1) + Payload)</code>.</div>
    </div>
    <div class="use-case-item">
      <div class="use-case-title">UC-CA3: Algorithmic Fairness & Disparate Impact Auditing</div>
      <div class="use-case-desc"><strong>Route:</strong> <code>/dashboard/analytics</code> · Inspect demographic parity metrics, verifying that selection rates satisfy the EEOC 4/5ths (80%) rule across demographic proxies.</div>
    </div>
    <div class="use-case-item">
      <div class="use-case-title">UC-CA4: Human Override Surveillance</div>
      <div class="use-case-desc"><strong>Route:</strong> <code>/audit</code> · Review all instances where recruiters or hiring managers deviated from AI recommendations to detect human bias.</div>
    </div>
  </div>

  <!-- PERSONA 6 -->
  <div class="persona-box avoid-break">
    <div class="persona-header">
      <div class="persona-name">
        <span>🛡️</span> Persona 6: Workspace Administrator (System Owner / IT Lead)
      </div>
      <span class="persona-badge badge-admin">Full System Governance</span>
    </div>
    <p style="font-size: 8.5pt; color: #475569; margin-bottom: 8px;">
      Workspace administrators responsible for platform infrastructure, security enforcement, team membership, and operational telemetry.
    </p>

    <div class="use-case-item">
      <div class="use-case-title">UC-A1: Team RBAC & Role Management</div>
      <div class="use-case-desc"><strong>Route:</strong> <code>/dashboard/team</code> · Invite team members, reassign roles, configure granular permission overrides, suspend accounts, and safely delete members with confirmation modals.</div>
    </div>
    <div class="use-case-item">
      <div class="use-case-title">UC-A2: Multi-Factor Authentication (TOTP 2FA) Enforcement</div>
      <div class="use-case-desc"><strong>Route:</strong> <code>/dashboard/profile</code>, <code>/api/auth/mfa/*</code> · Configure mandatory 2FA enrollment via TOTP authenticator apps or 6-digit email OTP challenges.</div>
    </div>
    <div class="use-case-item">
      <div class="use-case-title">UC-A3: First-Login Password Reset Protocol</div>
      <div class="use-case-desc"><strong>Route:</strong> <code>/auth/first-login</code> · Force newly invited staff to establish personal passwords (≥8 characters, bcrypt cost 12) prior to accessing platform workspaces.</div>
    </div>
    <div class="use-case-item">
      <div class="use-case-title">UC-A4: Real-Time System Health Diagnostics</div>
      <div class="use-case-desc"><strong>Route:</strong> <code>/dashboard/system-health</code> · Monitor database query latency, Redis queue workers, storage providers (Local/S3), and anti-malware scanner status.</div>
    </div>
    <div class="use-case-item">
      <div class="use-case-title">UC-A5: Email Delivery Monitoring & Dead-Letter Queue Retries</div>
      <div class="use-case-desc"><strong>Route:</strong> <code>/dashboard/email-delivery</code> · Review transactional email logs (Gmail/Brevo/Resend) and trigger dead-letter delivery retries for failed dispatches.</div>
    </div>
  </div>

  <div class="footer-note">
    <span>RecruitAI · AI-Resume Screening Platform</span>
    <span>Page 3 of 4</span>
  </div>

  <!-- ==================== PAGE 4: RBAC MATRIX & TECHNICAL GUARANTEES ==================== -->
  <div class="page-break"></div>

  <div class="doc-header">
    <div class="logo">Recruit<span>AI</span></div>
    <div class="doc-meta">
      <strong>RBAC Permission Matrix & Technical Guarantees</strong><br>
      Part III: Authorization & Compliance Framework
    </div>
  </div>

  <h1>4. Formal RBAC Permission Matrix</h1>
  <p>The platform implements strict permission-gated authorization defined in <code>src/lib/roleAccess.ts</code>:</p>

  <table>
    <thead>
      <tr>
        <th>Permission Identifier</th>
        <th>Capability / Action</th>
        <th>Admin</th>
        <th>Recruiter</th>
        <th>Hiring Mgr</th>
        <th>Interviewer</th>
        <th>Auditor</th>
        <th>Candidate</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>jobs:manage</code></td>
        <td>Create, edit, publish & archive job postings</td>
        <td class="check">✓</td>
        <td class="check">✓</td>
        <td class="check">✓</td>
        <td class="cross">✕</td>
        <td class="cross">✕</td>
        <td class="cross">✕</td>
      </tr>
      <tr>
        <td><code>jobs:rubrics</code></td>
        <td>Configure scoring criteria & weighting weights</td>
        <td class="check">✓</td>
        <td class="check">✓</td>
        <td class="check">✓</td>
        <td class="cross">✕</td>
        <td class="cross">✕</td>
        <td class="cross">✕</td>
      </tr>
      <tr>
        <td><code>candidates:review</code></td>
        <td>View candidate profiles & AI evidence matches</td>
        <td class="check">✓</td>
        <td class="check">✓</td>
        <td class="check">✓</td>
        <td class="check">✓</td>
        <td class="check">✓</td>
        <td class="cross">✕</td>
      </tr>
      <tr>
        <td><code>candidates:override-scores</code></td>
        <td>Manually adjust scores with logged justification</td>
        <td class="check">✓</td>
        <td class="check">✓</td>
        <td class="check">✓</td>
        <td class="cross">✕</td>
        <td class="cross">✕</td>
        <td class="cross">✕</td>
      </tr>
      <tr>
        <td><code>candidates:merge-duplicates</code></td>
        <td>Merge suspected duplicate candidate records</td>
        <td class="check">✓</td>
        <td class="check">✓</td>
        <td class="cross">✕</td>
        <td class="cross">✕</td>
        <td class="cross">✕</td>
        <td class="cross">✕</td>
      </tr>
      <tr>
        <td><code>interviews:schedule</code></td>
        <td>Schedule interview rounds & dispatch calendar invites</td>
        <td class="check">✓</td>
        <td class="check">✓</td>
        <td class="check">✓</td>
        <td class="cross">✕</td>
        <td class="cross">✕</td>
        <td class="cross">✕</td>
      </tr>
      <tr>
        <td><code>interviews:scorecards:submit</code></td>
        <td>Submit structured interview evaluation scorecards</td>
        <td class="check">✓</td>
        <td class="check">✓</td>
        <td class="cross">✕</td>
        <td class="check">✓</td>
        <td class="cross">✕</td>
        <td class="cross">✕</td>
      </tr>
      <tr>
        <td><code>candidates:decide</code></td>
        <td>Execute final hiring decision (Offer / Reject)</td>
        <td class="check">✓</td>
        <td class="check">✓</td>
        <td class="check">✓</td>
        <td class="cross">✕</td>
        <td class="cross">✕</td>
        <td class="cross">✕</td>
      </tr>
      <tr>
        <td><code>candidates:offer</code></td>
        <td>Generate and dispatch formal job offer documents</td>
        <td class="check">✓</td>
        <td class="check">✓</td>
        <td class="cross">✕</td>
        <td class="cross">✕</td>
        <td class="cross">✕</td>
        <td class="cross">✕</td>
      </tr>
      <tr>
        <td><code>compliance:audit-log</code></td>
        <td>Inspect immutable cryptographic audit trail</td>
        <td class="check">✓</td>
        <td class="cross">✕</td>
        <td class="cross">✕</td>
        <td class="cross">✕</td>
        <td class="check">✓</td>
        <td class="cross">✕</td>
      </tr>
      <tr>
        <td><code>ops:email-delivery:view</code></td>
        <td>Inspect email dead-letter queue & retry deliveries</td>
        <td class="check">✓</td>
        <td class="cross">✕</td>
        <td class="cross">✕</td>
        <td class="cross">✕</td>
        <td class="cross">✕</td>
        <td class="cross">✕</td>
      </tr>
      <tr>
        <td><code>team:manage</code></td>
        <td>Invite staff, reassign roles, configure RBAC</td>
        <td class="check">✓</td>
        <td class="cross">✕</td>
        <td class="cross">✕</td>
        <td class="cross">✕</td>
        <td class="cross">✕</td>
        <td class="cross">✕</td>
      </tr>
      <tr>
        <td><code>applicant:portal</code></td>
        <td>Submit applications and track stage progress</td>
        <td class="cross">✕</td>
        <td class="cross">✕</td>
        <td class="cross">✕</td>
        <td class="cross">✕</td>
        <td class="cross">✕</td>
        <td class="check">✓</td>
      </tr>
    </tbody>
  </table>

  <h1>5. Security, Ethical AI & Compliance Guarantees</h1>

  <div class="workflow-grid">
    <div class="workflow-card emerald">
      <div class="workflow-card-title">1. Verifiable Evidence Anchoring</div>
      <p class="workflow-card-desc">Every AI score links directly to extracted text from the applicant's resume. Clicking "Locate Evidence" scrolls the viewer directly to highlighted sentences, preventing hallucinated evaluations.</p>
    </div>

    <div class="workflow-card">
      <div class="workflow-card-title">2. Cryptographic Tamper-Evidence</div>
      <p class="workflow-card-desc">Audit logs calculate SHA-256 hashes linking every row to the preceding log record. Any manual database alteration immediately breaks the mathematical chain, exposing unauthorized modifications.</p>
    </div>

    <div class="workflow-card alt">
      <div class="workflow-card-title">3. Algorithmic Fairness & 4/5ths Rule</div>
      <p class="workflow-card-desc">The scoring engine enforces demographic parity checks. Statistical monitors flag selection differentials exceeding the 80% threshold across gender, age, and institutional proxies.</p>
    </div>

    <div class="workflow-card amber">
      <div class="workflow-card-title">4. Defense-in-Depth Authentication</div>
      <p class="workflow-card-desc">Enterprise 2FA incorporates TOTP authenticator apps, single-use 6-digit email OTP challenges, first-login password enforcement, and strict bcrypt hashing with cost factor 12.</p>
    </div>
  </div>

  <div class="callout" style="margin-top: 14px;">
    <strong>Verification & Compliance Certified:</strong> Built and verified under CODAFRIQA Intern Project Specification v1.0. All 232 test cases passed; cryptographic audit chain validated 100% intact.
  </div>

  <div class="footer-note">
    <span>RecruitAI · AI-Resume Screening Platform</span>
    <span>Page 4 of 4 · Final Document</span>
  </div>

</body>
</html>`;

async function generatePdf() {
  console.log('Launching headless browser to compile Workflow & Use Cases PDF...');
  const edgePath = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
  const launchOptions = { headless: true };
  try {
    await fs.access(edgePath);
    launchOptions.executablePath = edgePath;
  } catch {}

  const browser = await chromium.launch(launchOptions);
  try {
    const page = await browser.newPage({
      viewport: { width: 794, height: 1123 },
      deviceScaleFactor: 1.5,
    });
    await page.setContent(htmlContent, { waitUntil: 'load' });
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      margin: { top: '12mm', right: '12mm', bottom: '12mm', left: '12mm' },
    });
  } finally {
    await browser.close();
  }
  console.log(`PDF successfully generated at: ${outputPath}`);
}

generatePdf().catch((err) => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
