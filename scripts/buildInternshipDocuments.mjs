import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { PDFParse } from 'pdf-parse';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  NumberFormat,
  PageBreak,
  PageNumber,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const deliverables = fsSync.existsSync(path.join(root, 'Logbook&Report', 'Deliverables'))
  ? path.join(root, 'Logbook&Report', 'Deliverables')
  : path.resolve(root, '..', 'Logbook&Report', 'Deliverables');
const docs = [
  {
    markdown: 'docs/internship-report-draft.md',
    basename: 'AUCA-Internship-Report-SHYAKA-Jospin-26119',
    kind: 'report',
    title: 'INTERNSHIP REPORT ON THE AI RESUME SCREENING PLATFORM AT CODAFRIQA',
  },
  {
    markdown: 'docs/internship-logbook-draft.md',
    basename: 'AUCA-Attachment-Logbook-SHYAKA-Jospin-26119',
    kind: 'logbook',
    title: 'STUDENTS’ ATTACHMENT LOGBOOK',
  },
];

const palette = {
  navy: '17365D',
  blue: '245A8D',
  paleBlue: 'DCEAF5',
  lighterBlue: 'EEF4F8',
  ink: '20262D',
  gray: '66717D',
  line: 'B8C9D8',
  white: 'FFFFFF',
};

async function extractUniversityLogo(prefix) {
  const referenceDir = fsSync.existsSync(path.join(root, 'Logbook&Report'))
    ? path.join(root, 'Logbook&Report')
    : path.resolve(root, '..', 'Logbook&Report');
  const filename = (await fs.readdir(referenceDir)).find((name) => name.startsWith(prefix) && name.endsWith('.pdf'));
  if (!filename) throw new Error(`Missing school reference PDF matching ${prefix}`);
  const parser = new PDFParse({ data: await fs.readFile(path.join(referenceDir, filename)) });
  try {
    const images = await parser.getImage();
    const logo = images.pages[0]?.images[0]?.data;
    if (!logo) throw new Error(`Could not extract AUCA logo from ${filename}`);
    return Buffer.from(logo);
  } finally {
    await parser.destroy();
  }
}

const reportLogo = await extractUniversityLogo('Internship-Report');
const logbookLogo = await extractUniversityLogo('New AUCA');

const screenshotDir = path.join(deliverables, 'screenshots');
const screenshotShell = (title, section, content) => `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}body{margin:0;background:#f5f6fb;color:#171a2b;font:14px 'Arial',sans-serif}.app{display:grid;grid-template-columns:245px 1fr;height:900px}.sidebar{background:#fff;border-right:1px solid #e5e7ef;padding:28px 20px}.brand{display:flex;align-items:center;gap:12px;font-size:20px;font-weight:800;margin:0 0 46px;color:#22213a}.mark{width:40px;height:40px;border-radius:13px;background:linear-gradient(135deg,#6366f1,#8b5cf6,#06b6d4);color:#fff;display:grid;place-items:center}.nav{padding:12px 14px;border-radius:10px;color:#72758a;margin:5px 0;font-size:14px}.nav.active{background:linear-gradient(115deg,#6366f1,#8b5cf6);color:white;font-weight:700}.rail{margin-top:38px;color:#9294a6;font-size:11px;letter-spacing:1.2px;text-transform:uppercase}.main{padding:0 38px 40px;overflow:hidden}.top{height:70px;border-bottom:1px solid #e9eaf1;display:flex;align-items:center;justify-content:space-between;color:#666b82}.top .user{padding:9px 14px;border:1px solid #e5e7ef;border-radius:12px;background:#fff}.content{padding-top:30px}.eyebrow{font-size:11px;color:#6865dd;font-weight:800;text-transform:uppercase;letter-spacing:1.3px}.heading{font-size:28px;letter-spacing:-.8px;margin:8px 0;color:#171a2b}.sub{color:#787c91;margin:0 0 24px}.hero{padding:28px;border:1px solid #dedffc;border-radius:20px;background:radial-gradient(ellipse at 82% 40%,#dff8fb,transparent 40%),linear-gradient(120deg,#fff,#f7f6ff);margin-bottom:22px;display:flex;justify-content:space-between;min-height:180px}.hero h1{font-size:34px;margin:14px 0 8px}.btn{display:inline-block;padding:11px 16px;border-radius:9px;background:linear-gradient(120deg,#6366f1,#8b5cf6);color:#fff;font-weight:700;margin-top:12px}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:18px 0}.card{background:#fff;border:1px solid #e6e7ef;border-radius:15px;padding:18px;box-shadow:0 7px 22px #393c5d0a}.label{font-size:11px;text-transform:uppercase;letter-spacing:.7px;color:#7b7e92;font-weight:700}.value{font-size:30px;font-weight:800;margin:12px 0 5px}.hint{font-size:11px;color:#888b9d}.row{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:13px 0;border-bottom:1px solid #eff0f5}.badge{display:inline-block;padding:5px 9px;border-radius:99px;background:#eef0ff;color:#5456c7;font-size:11px;font-weight:700}.badge.green{background:#e6f7ef;color:#15804d}.badge.amber{background:#fff5df;color:#9a6700}.panel-title{font-weight:800;font-size:16px;margin-bottom:12px}.columns{display:grid;grid-template-columns:1fr 1fr;gap:16px}.board{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.stage{background:#eff0f7;border-radius:14px;padding:12px;min-height:500px}.stage h3{font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:#71758a}.candidate{background:#fff;border:1px solid #e7e8ef;border-radius:12px;padding:14px;margin:10px 0}.candidate b{display:block;margin:0 0 7px}.avatar{display:inline-grid;width:31px;height:31px;place-items:center;border-radius:50%;background:#eceaff;color:#605de0;font-weight:800;margin-right:8px}.quote{border-left:3px solid #817af0;background:#f5f4ff;padding:12px;color:#474968;border-radius:0 9px 9px 0;margin:9px 0}.muted{color:#7e8293;font-size:12px}.table{width:100%;border-collapse:collapse}.table th{text-align:left;background:#f1f2f8;color:#72758a;padding:12px;font-size:11px;text-transform:uppercase}.table td{padding:13px 12px;border-bottom:1px solid #eceef3}.chart{height:120px;display:flex;align-items:end;gap:16px;padding:15px}.bar{flex:1;background:linear-gradient(180deg,#7773f2,#aaa5fb);border-radius:7px 7px 0 0}.stamp{position:absolute;right:24px;bottom:18px;color:#9598a8;font-size:10px;letter-spacing:.3px}
</style></head><body><div class="app"><aside class="sidebar"><div class="brand"><span class="mark">R</span>Recruit<span style="color:#6865dd">AI</span></div><div class="nav ${section==='Overview'?'active':''}">▦ &nbsp; Overview</div><div class="nav ${section==='Candidates'?'active':''}">♙ &nbsp; Candidates</div><div class="nav ${section==='Jobs'?'active':''}">▤ &nbsp; Jobs</div><div class="nav ${section==='Interviews'?'active':''}">◷ &nbsp; Interviews</div><div class="nav ${section==='Privacy & Audit'?'active':''}">◇ &nbsp; Privacy & Audit</div><div class="rail">Workspace</div><div class="nav ${section==='Settings'?'active':''}">⚙ &nbsp; Settings</div></aside><main class="main"><header class="top"><span>⌕ &nbsp; Search candidates, roles, actions...</span><span class="user">EN &nbsp; ◐ &nbsp; ♧ &nbsp; Jospin (CODAFRIQA)</span></header><section class="content"><div class="eyebrow">${section} · Enterprise ATS Platform</div><h1 class="heading">${title}</h1>${content}</section></main></div><div class="stamp">RECRUITAI DEMONSTRATION WORKSPACE • CODAFRIQA • SYNTHETIC AUDIT DATA</div></body></html>`;

async function createIllustrativeScreenshots() {
  await fs.mkdir(screenshotDir, { recursive: true });
  const shots = [
    ['login-mfa.png', 'Two-Factor Authentication & Verification Portal', 'Authentication', `
      <div style="max-width:540px;margin:30px auto;background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:36px;box-shadow:0 10px 30px rgba(0,0,0,0.06);text-align:center">
        <div style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;display:grid;place-items:center;margin:0 auto 16px;font-size:26px">🔐</div>
        <h2 style="font-size:22px;margin:0 0 8px;color:#1e293b">Enter Verification Code</h2>
        <p style="color:#64748b;font-size:13px;margin:0 0 24px">A 6-digit one-time security code has been sent to <b>j.shyaka@codafriqa.rw</b></p>
        <div style="display:flex;justify-content:center;gap:12px;margin-bottom:24px">
          <div style="width:48px;height:56px;border:2px solid #6366f1;border-radius:10px;font-size:24px;font-weight:700;display:grid;place-items:center;background:#f8faff">4</div>
          <div style="width:48px;height:56px;border:2px solid #6366f1;border-radius:10px;font-size:24px;font-weight:700;display:grid;place-items:center;background:#f8faff">8</div>
          <div style="width:48px;height:56px;border:2px solid #6366f1;border-radius:10px;font-size:24px;font-weight:700;display:grid;place-items:center;background:#f8faff">2</div>
          <div style="width:48px;height:56px;border:2px solid #cbd5e1;border-radius:10px;font-size:24px;font-weight:700;display:grid;place-items:center">9</div>
          <div style="width:48px;height:56px;border:2px solid #cbd5e1;border-radius:10px;font-size:24px;font-weight:700;display:grid;place-items:center">1</div>
          <div style="width:48px;height:56px;border:2px solid #cbd5e1;border-radius:10px;font-size:24px;font-weight:700;display:grid;place-items:center">0</div>
        </div>
        <button class="btn" style="width:100%;padding:13px;font-size:14px;border:none;cursor:pointer">Verify Code & Enter Platform →</button>
        <div style="margin-top:20px;display:flex;justify-content:space-between;font-size:12px;color:#64748b">
          <span>Resend code in <b>00:42</b></span><a href="#" style="color:#6366f1;text-decoration:none">Try another method</a>
        </div>
        <div style="margin-top:28px;padding-top:20px;border-top:1px solid #f1f5f9;display:flex;align-items:center;justify-content:center;gap:12px;font-size:11px;color:#94a3b8">
          <span>🛡️ Stateless JWT Session</span><span>•</span><span>SHA-256 Audit Sealed</span><span>•</span><span>Strict Tenant Scope</span>
        </div>
      </div>
    `],
    ['dashboard.png', 'Recruitment Operations at a Glance', 'Overview', `
      <section class="hero"><div><div class="eyebrow">Workspace Overview · CODAFRIQA Engineering</div><h1>Good morning, Jospin</h1><div class="sub">Active hiring pipelines, pending human review queues, and verified audit events.</div><span class="btn">Review Application Queue (3 Pending) →</span></div><div style="font-size:72px;opacity:.16;align-self:center">✦</div></section>
      <div class="metrics">
        <article class="card"><div class="label">Total Candidates</div><div class="value">128</div><div class="hint">Across 12 requisitions</div></article>
        <article class="card"><div class="label">Open Requisitions</div><div class="value">12</div><div class="hint">Approved & active rubrics</div></article>
        <article class="card"><div class="label">Shortlisted</div><div class="value" style="color:#15804d">24</div><div class="hint">Human verified decisions</div></article>
        <article class="card"><div class="label">Audit Events</div><div class="value" style="color:#6366f1">92</div><div class="hint">Cryptographically sealed</div></article>
      </div>
      <div class="columns">
        <article class="card"><div class="panel-title">Pipeline Stage Distribution</div>${[['Applied / New', 32], ['AI Screening', 24], ['Needs Review (Ambiguous)', 16], ['Shortlisted', 19], ['Rejected / Archived', 9]].map(([n,v])=>`<div class="row"><span>${n}</span><span style="display:flex;align-items:center;gap:10px;width:55%"><span style="flex:1;background:#edf0f5;border-radius:6px;height:7px;overflow:hidden"><i style="display:block;width:${v}%;height:100%;background:linear-gradient(90deg,#6366f1,#06b6d4)"></i></span><span class="muted">${v}%</span></span></div>`).join('')}</article>
        <article class="card"><div class="panel-title">Pending Human Review & SLA Alerts</div>
          <div class="row"><span><b>Requisition Rubric v3 Approved</b><div class="muted">Backend Engineer · Steven IRANKUNDA</div></span><span class="badge green">Approved</span></div>
          <div class="row"><span><b>Human Decision Required</b><div class="muted">Application #APP-084 · Tariq Al-Mansoor</div></span><span class="badge amber">Needs Review</span></div>
          <div class="row"><span><b>Interview Scorecard Submitted</b><div class="muted">Samira Bello · Technical Panel</div></span><span class="badge green">Submitted</span></div>
          <div class="row"><span><b>GDPR DSAR Export Request</b><div class="muted">Applicant #C-042 · Data Subject Access</div></span><span class="badge">Completed</span></div>
        </article>
      </div>
    `],
    ['jobs-intake.png', 'Job Requisition Creation & Public Application Intake', 'Jobs', `
      <div class="columns">
        <article class="card"><div class="panel-title">Active Requisition: Senior Backend Engineer</div><div class="muted">REQ-2026-012 · Department: Engineering · Location: Kigali / Remote · Full-time</div>
          <div style="margin:16px 0;padding:14px;background:#f8faff;border-radius:10px;border:1px solid #e0e7ff">
            <div style="display:flex;justify-content:space-between;align-items:center"><div><b>Screening Rubric:</b> <span class="badge green">v3 (Active & Locked)</span></div><span class="muted">Approved by Technical Lead</span></div>
            <div class="muted" style="margin-top:6px">4 Criteria defined (1 Mandatory, 3 Preferred) · Deterministic JSON schema</div>
          </div>
          <div class="panel-title" style="margin-top:16px">Application Influx Rate</div>
          <div class="chart" style="height:90px">${[24,38,45,62,54,78,89,95].map(v=>`<div class="bar" style="height:${v}px"></div>`).join('')}</div>
          <div class="row"><span class="muted">Week 1</span><span class="muted">Week 3</span><span class="muted">Week 5</span><span class="muted">Week 7</span></div>
        </article>
        <article class="card"><div class="panel-title">Candidate Self-Service Intake Portal</div><div class="muted">Public application form with MIME-type and magic-byte security checks</div>
          <div style="border:2px dashed #c7d2fe;background:#fbfcfe;border-radius:14px;padding:32px;text-align:center;margin:16px 0">
            <div style="font-size:32px;margin-bottom:8px">📄</div><b>Drop candidate resume here</b>
            <div class="muted" style="font-size:12px;margin:6px 0 14px">Supports PDF or DOCX up to 5MB · ClamAV scanning active</div>
            <span class="btn" style="padding:8px 16px;font-size:12px">Select Resume File</span>
          </div>
          <div style="font-size:12px;color:#475569;display:flex;flex-direction:column;gap:8px">
            <label><input type="checkbox" checked disabled /> I consent to automated text extraction and criteria matching under Law No. 058/2021.</label>
            <label><input type="checkbox" checked disabled /> I acknowledge human recruiters make all final candidate decisions.</label>
          </div>
          <div class="row" style="margin-top:14px"><span class="badge green">✓ Magic-bytes Validated</span><span class="muted">Queue: BullMQ / Redis</span></div>
        </article>
      </div>
    `],
    ['pipeline.png', 'Candidate Pipeline and Stage Filters', 'Candidates', `
      <p class="sub">A role-scoped review queue. Recruiters can filter by job, stage, minimum score, and keyword tags.</p>
      <div class="row" style="margin-bottom:14px">
        <div style="display:flex;gap:8px"><span class="badge green">All Requisitions (12)</span><span class="badge">Senior Backend Engineer</span><span class="badge">Data Analyst</span></div>
        <div style="display:flex;gap:8px"><span class="badge">Score ≥ 75%</span><span class="badge">Flagged Only</span><span class="btn" style="padding:6px 12px;font-size:12px;margin:0">+ Add Candidate</span></div>
      </div>
      <div class="board">${[['APPLIED (3)','#64748b'],['SCREENING (2)','#6366f1'],['NEEDS REVIEW (1)','#d97706'],['SHORTLISTED (2)','#15804d']].map(([title,c],i)=>`<section class="stage"><h3 style="color:${c}">${title}</h3>${(i===0?['Ada Lovelace','Kwame Mensah']:i===1?['Nina Patel','Liam O\'Connor']:i===2?['Tariq Al-Mansoor']:['Samira Bello','Alex Rivera']).map((name,j)=>`<article class="candidate"><b><span class="avatar">${name[0]}</span>${name}</b><div class="muted">${j?'Data Systems':'Backend Engineer'} · REQ-012</div><div class="row"><span class="badge ${i===3?'green':i===2?'amber':i===1?'':'navy'}">${i===3?'86% Match':i===2?'Ambiguous Dates':i===1?'Parsing Complete':'New Intake'}</span><span class="muted">Today</span></div><div class="muted" style="font-size:11px;margin-top:4px">Human verification mandatory before stage advance.</div></article>`).join('')}</section>`).join('')}</div>
    `],
    ['rubric.png', 'Approved Requisition & Versioned Screening Rubric', 'Jobs', `
      <p class="sub">Job Requisition REQ-2026-012 · Rubric Version 3 (Approved & Immutable) · Version locked by Lead Supervisor</p>
      <article class="card">
        <div style="display:flex;justify-content:space-between;align-items:start">
          <div><span class="badge green">STATUS: OPEN · RUBRIC APPROVED</span><h2 style="margin:8px 0 4px;font-size:22px">Senior Backend Engineer (Node.js / Distributed Systems)</h2><div class="muted">Engineering Department · Kigali HQ / Remote · Full-time · Hiring Manager: Steven IRANKUNDA BADAGA</div></div>
          <div style="text-align:right"><span class="badge" style="background:#e0e7ff;color:#4338ca;font-size:12px">Rubric v3 (Current)</span><div class="muted" style="font-size:11px;margin-top:4px">Approved: 24/08/2026</div></div>
        </div>
        <p class="muted" style="margin-top:14px;font-size:13px">Responsible for architecting scalable microservices, resilient Redis message queues, and PostgreSQL relational schemas.</p>
        <div class="panel-title" style="margin-top:20px">Screening Criteria & Scoring Weights</div>
        <table class="table"><thead><tr><th>Criterion Name</th><th>Requirement</th><th>Weight</th><th>Evaluation Benchmark / Evidence Rule</th><th>Status</th></tr></thead><tbody>
          <tr><td><b>Node.js & TypeScript Backend</b></td><td><span class="badge" style="background:#fee2e2;color:#991b1b">Mandatory</span></td><td>5 / 5</td><td>Verifiable commercial experience with Node.js, Express/Fastify/Next.js APIs</td><td><span class="badge green">Locked</span></td></tr>
          <tr><td><b>PostgreSQL & Relational Modeling</b></td><td><span class="badge" style="background:#e0e7ff;color:#3730a3">Preferred</span></td><td>3 / 5</td><td>Schema design, indexes, Prisma/TypeORM, query performance tuning</td><td><span class="badge green">Locked</span></td></tr>
          <tr><td><b>Distributed Queues & Redis</b></td><td><span class="badge" style="background:#e0e7ff;color:#3730a3">Preferred</span></td><td>2 / 5</td><td>Asynchronous background processing, BullMQ or similar message broker</td><td><span class="badge green">Locked</span></td></tr>
          <tr><td><b>Containerization & CI/CD</b></td><td><span class="badge" style="background:#e0e7ff;color:#3730a3">Preferred</span></td><td>2 / 5</td><td>Docker multi-stage builds, container orchestration, GitHub Actions</td><td><span class="badge green">Locked</span></td></tr>
        </tbody></table>
        <div class="row" style="margin-top:16px"><span class="muted">⚖️ Any rubric modification automatically generates Version 4; previous evaluations remain sealed to preserve audit integrity.</span><span class="btn" style="padding:8px 16px;font-size:12px">View Historical Rubric Versions (v1, v2)</span></div>
      </article>
    `],
    ['evidence-assessment.png', 'Split-Screen Resume Evaluation with Verbatim Evidence', 'Candidate Profile', `
      <p class="sub">Candidate: Samira Bello · Application #APP-2026-084 · Requisition: Senior Backend Engineer · Rubric v3</p>
      <div class="columns">
        <article class="card">
          <div class="panel-title">Screening Summary & Verification</div>
          <div style="display:flex;align-items:center;gap:20px;margin-bottom:16px">
            <div style="border:9px solid #6366f1;border-right-color:#e0e7ff;border-radius:50%;width:96px;height:96px;display:grid;place-items:center;font-weight:800;font-size:24px;color:#1e293b">86%</div>
            <div><span class="badge green">Strong Match</span><div class="muted" style="margin:4px 0">All mandatory criteria satisfied.</div><span class="badge amber">1 preferred item has ambiguity</span></div>
          </div>
          <div class="row"><span>Mandatory Criteria Met</span><b>1 / 1 (100%)</b></div>
          <div class="row"><span>Preferred Criteria Met</span><b>2 / 3 (67%)</b></div>
          <div class="row"><span>Total Weighted Score</span><b>15 / 17.5 pts</b></div>
          <div class="row"><span>Active Rubric</span><b>Version 3 (Approved)</b></div>
          <div style="margin-top:14px;padding:10px;background:#fef2f2;border-radius:8px;border-left:3px solid #ef4444;font-size:11px;color:#991b1b"><b>AI Governance Notice:</b> This assessment is decision support only. The algorithm has no autonomous power to advance or reject candidates.</div>
        </article>
        <article class="card">
          <div class="panel-title">Criterion-by-Criterion Evidence Citations</div>
          <div class="row"><span><b>Node.js & TypeScript Backend</b><div class="muted">Mandatory · Weight 5</div></span><span class="badge green">Matched</span></div>
          <div class="quote">“Architected scalable Node.js microservices with TypeScript serving 50k req/min with sub-100ms response times.”<div style="font-size:11px;margin-top:4px;color:#64748b">Source: Experience / Senior Software Engineer at PayTech (2023–Present)</div></div>
          <div class="row"><span><b>PostgreSQL & Relational Modeling</b><div class="muted">Preferred · Weight 3</div></span><span class="badge green">Matched</span></div>
          <div class="quote">“Optimized PostgreSQL queries, managed migrations via Prisma ORM, and resolved slow table joins.”<div style="font-size:11px;margin-top:4px;color:#64748b">Source: Experience / PayTech</div></div>
          <div class="row"><span><b>Containerization & CI/CD</b><div class="muted">Preferred · Weight 2</div></span><span class="badge amber">Uncertain (Flagged)</span></div>
          <div class="quote" style="border-left-color:#f59e0b;background:#fffbeb">“Used Docker Compose for local microservice orchestration; production Kubernetes exposure is unclear.”<div style="font-size:11px;margin-top:4px;color:#b45309">Flag: Ambiguous Production Scope · Recruiter Follow-up Advised</div></div>
        </article>
      </div>
    `],
    ['decisions.png', 'Recruiter Decision Workflow with Mandatory Written Rationale', 'Decisions', `
      <div style="max-width:760px;margin:20px auto;background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:32px;box-shadow:0 12px 32px rgba(0,0,0,0.06)">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:18px">
          <div><span class="badge green">DECISION WORKFLOW · HUMAN AUTHORIZATION REQUIRED</span><h2 style="margin:8px 0 4px;font-size:22px">Record Formal Review Decision</h2><div class="muted">Candidate: Samira Bello · Requisition: Senior Backend Engineer (#REQ-012)</div></div>
          <span class="badge" style="font-size:12px">Stage: Screening → Shortlisted</span>
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:20px">
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px"><span><b>AI Decision Support Score:</b> 86%</span><span><b>Flagged Items:</b> 1 Ambiguity (Docker)</span></div>
          <div class="muted" style="font-size:12px">The human recruiter must independently evaluate the candidate and provide explicit qualitative justification before status change is committed to the immutable audit log.</div>
        </div>
        <div style="margin-bottom:16px">
          <label style="display:block;font-weight:700;font-size:13px;margin-bottom:8px">Select Decision Action:</label>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">
            <div style="border:2px solid #6366f1;background:#eef2ff;color:#4338ca;padding:12px;border-radius:10px;text-align:center;font-weight:700;cursor:pointer">✓ Shortlist</div>
            <div style="border:1px solid #cbd5e1;padding:12px;border-radius:10px;text-align:center;color:#475569">Advance Round</div>
            <div style="border:1px solid #cbd5e1;padding:12px;border-radius:10px;text-align:center;color:#475569">Place on Hold</div>
            <div style="border:1px solid #cbd5e1;padding:12px;border-radius:10px;text-align:center;color:#475569">Reject Application</div>
          </div>
        </div>
        <div style="margin-bottom:16px">
          <label style="display:block;font-weight:700;font-size:13px;margin-bottom:6px">Predefined Reason Code (Audit Taxonomy):</label>
          <div style="padding:10px 14px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;font-size:13px">EXCEEDS_MANDATORY_CRITERIA_WITH_VERIFIED_MICROSERVICES</div>
        </div>
        <div style="margin-bottom:20px">
          <label style="display:block;font-weight:700;font-size:13px;margin-bottom:6px">Mandatory Written Reviewer Rationale:</label>
          <div style="padding:12px;border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc;font-size:13px;color:#1e293b;line-height:1.5">Candidate demonstrated comprehensive mastery of Node.js and PostgreSQL in fintech microservices. The ambiguity regarding cloud containerization was addressed by examining the candidate's verified GitHub repository, which contains production-grade Dockerfile and CI workflow setups. Shortlisting for technical interview panel.</div>
        </div>
        <div class="row">
          <div style="font-size:12px;color:#64748b">Reviewer: <b>Jospin SHYAKA (ID: 26119)</b> · 26/08/2026</div>
          <button class="btn" style="padding:10px 20px;border:none;cursor:pointer">Commit Decision & Seal Audit Event →</button>
        </div>
      </div>
    `],
    ['compare.png', 'Candidate Comparison Matrix with Blind Screening Mode', 'Candidates', `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <p class="sub" style="margin:0">Side-by-side objective evaluation across approved rubric criteria.</p>
        <div style="display:flex;align-items:center;gap:12px;background:#eef2ff;padding:8px 16px;border-radius:10px;border:1px solid #c7d2fe">
          <span style="font-size:13px;font-weight:700;color:#4338ca">🛡️ Blind Screening Mode:</span><span class="badge green">ACTIVE</span><span class="muted" style="font-size:11px">Names, photos & demographic proxies masked</span>
        </div>
      </div>
      <article class="card">
        <table class="table"><thead><tr><th>Evaluation Metric</th><th>Candidate #CAN-84A</th><th>Candidate #CAN-92B</th><th>Candidate #CAN-107C</th></tr></thead><tbody>
          <tr><td><b>Overall AI Advisory Match</b></td><td><span class="badge green" style="font-size:13px">86% Match</span></td><td><span class="badge green" style="font-size:13px">82% Match</span></td><td><span class="badge amber" style="font-size:13px">68% Match</span></td></tr>
          <tr><td><b>Mandatory: Node.js / TS (W:5)</b></td><td><span class="badge green">5 / 5 (3 citations)</span></td><td><span class="badge green">5 / 5 (2 citations)</span></td><td><span class="badge amber">3 / 5 (1 citation)</span></td></tr>
          <tr><td><b>Preferred: PostgreSQL (W:3)</b></td><td><span class="badge green">3 / 3 (2 citations)</span></td><td><span class="badge green">3 / 3 (1 citation)</span></td><td><span class="badge green">3 / 3 (1 citation)</span></td></tr>
          <tr><td><b>Preferred: Redis / BullMQ (W:2)</b></td><td><span class="badge green">2 / 2 (1 citation)</span></td><td><span class="badge amber">1 / 2 (ambiguous)</span></td><td><span class="badge">0 / 2 (unverified)</span></td></tr>
          <tr><td><b>Preferred: Docker / CI (W:2)</b></td><td><span class="badge amber">1 / 2 (flagged)</span></td><td><span class="badge green">2 / 2 (1 citation)</span></td><td><span class="badge green">2 / 2 (1 citation)</span></td></tr>
          <tr><td><b>Uncertainty / Flagged Items</b></td><td><span class="badge amber">1 Flag (Docker Scope)</span></td><td><span class="badge amber">1 Flag (Dates)</span></td><td><span class="badge" style="background:#fee2e2;color:#991b1b">3 Flags (Missing Skills)</span></td></tr>
          <tr><td><b>Recruiter Review Action</b></td><td><span class="badge green">Shortlisted for Panel</span></td><td><span class="badge green">Shortlisted for Panel</span></td><td><span class="badge">Awaiting Review</span></td></tr>
        </tbody></table>
        <div class="row" style="margin-top:16px"><span class="muted">Blind screening mitigates unconscious bias by masking demographic attributes during initial comparative evaluations.</span><span class="btn" style="padding:8px 16px;font-size:12px">Export Comparison PDF</span></div>
      </article>
    `],
    ['interview-scheduling.png', 'Interview Scheduling with Conflict Detection', 'Interviews', `
      <p class="sub">Coordinate panel interviews with automated timezone synchronization, calendar invites, and conflict avoidance.</p>
      <div class="columns">
        <article class="card">
          <div class="panel-title">Schedule Technical Panel Interview</div>
          <div class="muted">Candidate: Samira Bello · Job: Senior Backend Engineer</div>
          <div style="margin:16px 0;display:flex;flex-direction:column;gap:12px">
            <div class="row"><span><b>Interview Stage:</b></span><span class="badge">Round 2: Technical Architecture</span></div>
            <div class="row"><span><b>Assigned Panel:</b></span><span>Steven IRANKUNDA BADAGA, Nina K.</span></div>
            <div class="row"><span><b>Proposed Date & Time:</b></span><b>Thursday, 28/08/2026 · 14:00 – 15:00 CAT</b></div>
            <div class="row"><span><b>Timezone Conversion:</b></span><span class="muted">14:00 CAT (UTC+2) / 12:00 UTC</span></div>
          </div>
          <div style="padding:14px;background:#ecfdf5;border-radius:10px;border:1px solid #a7f3d0;display:flex;align-items:center;gap:10px">
            <span style="font-size:20px">✓</span><div><b style="color:#065f46">Conflict Detection: PASS</b><div style="font-size:12px;color:#047857">All panel members and candidate are free during this time slot.</div></div>
          </div>
          <div style="margin-top:16px;display:flex;gap:10px"><button class="btn" style="flex:1;padding:10px;border:none;cursor:pointer">Confirm & Send Calendar Invites</button></div>
        </article>
        <article class="card">
          <div class="panel-title">Panel Calendar Availability (CAT)</div>
          <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;text-align:center;font-size:12px;margin:16px 0">
            <div style="padding:8px;background:#f1f5f9;border-radius:6px">Mon 25<br><b>3 slots</b></div>
            <div style="padding:8px;background:#f1f5f9;border-radius:6px">Tue 26<br><b>Busy</b></div>
            <div style="padding:8px;background:#f1f5f9;border-radius:6px">Wed 27<br><b>2 slots</b></div>
            <div style="padding:8px;background:#e0e7ff;border:2px solid #6366f1;border-radius:6px;font-weight:700">Thu 28<br><b>Selected</b></div>
            <div style="padding:8px;background:#f1f5f9;border-radius:6px">Fri 29<br><b>4 slots</b></div>
          </div>
          <div class="panel-title" style="margin-top:16px">Automated Dispatch Settings</div>
          <div class="row"><span>Video Conference URL</span><span class="muted">meet.google.com/rec-backend-084</span></div>
          <div class="row"><span>Calendar Invite Format</span><span class="badge green">iCalendar (.ics) RFC 5545</span></div>
          <div class="row"><span>Delivery Method</span><span class="muted">Nodemailer SMTP / Logged</span></div>
        </article>
      </div>
    `],
    ['scorecard.png', 'Independent Structured Interview Scorecard', 'Interviews', `
      <div style="max-width:820px;margin:16px auto;background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:30px;box-shadow:0 10px 28px rgba(0,0,0,0.05)">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:14px">
          <div><span class="badge green">INDEPENDENT EVALUATION MODE</span><h2 style="margin:8px 0 4px;font-size:22px">Structured Technical Scorecard</h2><div class="muted">Candidate: Samira Bello · Requisition: Senior Backend Engineer · Round: Technical Architecture</div></div>
          <div style="text-align:right"><span class="badge" style="background:#e0e7ff;color:#3730a3">Interviewer: Steven IRANKUNDA BADAGA</span></div>
        </div>
        <div style="padding:12px;background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;font-size:12px;color:#166534;margin-bottom:18px">🛡️ <b>Anti-Bias Protocol Active:</b> Peer scorecards remain hidden until your evaluation is finalized and submitted, preventing peer anchoring bias.</div>
        <table class="table"><thead><tr><th>Evaluation Dimension</th><th>Score (1-5)</th><th>Detailed Observation / Technical Evidence</th></tr></thead><tbody>
          <tr><td><b>1. System Architecture & Modularity</b></td><td><span class="badge green">5 / 5 — Excellent</span></td><td>Candidate clearly explained horizontal scaling patterns, database sharding, and connection pooling under load.</td></tr>
          <tr><td><b>2. PostgreSQL & Query Optimization</b></td><td><span class="badge green">4 / 5 — Very Good</span></td><td>Demonstrated deep understanding of B-tree indexes, execution plans (EXPLAIN ANALYZE), and ACID transactions.</td></tr>
          <tr><td><b>3. Problem Solving & Clean Code</b></td><td><span class="badge green">5 / 5 — Excellent</span></td><td>Structured, readable TypeScript code during live architecture exercise; handled edge cases elegantly.</td></tr>
          <tr><td><b>4. Communication & Cultural Fit</b></td><td><span class="badge green">5 / 5 — Excellent</span></td><td>Articulate communication, receptive to feedback, strong collaborative orientation aligned with CODAFRIQA values.</td></tr>
        </tbody></table>
        <div class="row" style="margin-top:16px"><span style="font-size:13px"><b>Overall Recommendation:</b> <span class="badge green" style="font-size:13px">STRONG HIRE (Advance to Final Offer)</span></span><button class="btn" style="padding:10px 20px;border:none;cursor:pointer">Lock & Submit Scorecard →</button></div>
      </div>
    `],
    ['team-rbac.png', 'Team User Management with RBAC Matrix', 'Settings', `
      <p class="sub">Manage organization members, assign role archetypes, and preview granular permission access privileges.</p>
      <article class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <div class="panel-title" style="margin:0">Active Organization Members (CODAFRIQA Engineering)</div>
          <span class="btn" style="padding:8px 14px;font-size:12px;margin:0">+ Invite Team Member</span>
        </div>
        <table class="table"><thead><tr><th>Member Name</th><th>Email Address</th><th>Assigned Role</th><th>Screening</th><th>Rubric Admin</th><th>Final Decision</th><th>Status</th></tr></thead><tbody>
          <tr><td><b>Steven IRANKUNDA BADAGA</b></td><td>steven.irankunda@codafriqa.rw</td><td><span class="badge green">Technical Lead / Admin</span></td><td>✓ Full</td><td>✓ Full</td><td>✓ Full</td><td><span class="badge green">Active</span></td></tr>
          <tr><td><b>SHYAKA Jospin</b></td><td>jospin.shyaka@codafriqa.rw</td><td><span class="badge" style="background:#e0e7ff;color:#3730a3">Technical Recruiter</span></td><td>✓ Full</td><td>View Only</td><td>✓ Record</td><td><span class="badge green">Active</span></td></tr>
          <tr><td><b>Gilbert N.</b></td><td>gilbert.n@codafriqa.rw</td><td><span class="badge">Hiring Manager</span></td><td>✓ Full</td><td>✓ Approve</td><td>✓ Final</td><td><span class="badge green">Active</span></td></tr>
          <tr><td><b>Nina K.</b></td><td>nina.k@codafriqa.rw</td><td><span class="badge">Interviewer</span></td><td>Assigned</td><td>No Access</td><td>Scorecard</td><td><span class="badge green">Active</span></td></tr>
          <tr><td><b>Claire U.</b></td><td>claire.u@codafriqa.rw</td><td><span class="badge" style="background:#fef3c7;color:#92400e">Compliance Auditor</span></td><td>Audit View</td><td>Audit View</td><td>Audit View</td><td><span class="badge green">Active</span></td></tr>
        </tbody></table>
        <div class="row" style="margin-top:16px"><span class="muted">Role-Based Access Control (RBAC) is enforced at both middleware routing and database query layers with tenant isolation.</span><span class="badge">12 Permissions Configured</span></div>
      </article>
    `],
    ['audit-health.png', 'Tamper-Evident Audit Ledger & System Health', 'Privacy & Audit', `
      <p class="sub">Cryptographic ledger verification, immutable event logs, and real-time infrastructure telemetry.</p>
      <div class="metrics">
        <article class="card"><div class="label">Ledger Integrity</div><div class="value" style="color:#15804d">INTACT</div><div class="hint">43 SHA-256 blocks validated</div></article>
        <article class="card"><div class="label">Database Pool</div><div class="value">4 / 20</div><div class="hint">PostgreSQL 16 connection load</div></article>
        <article class="card"><div class="label">Worker Queue</div><div class="value">0 Active</div><div class="hint">BullMQ / Redis: 128 done, 0 failed</div></article>
        <article class="card"><div class="label">Average API Latency</div><div class="value" style="color:#6366f1">22 ms</div><div class="hint">99th percentile: 64 ms</div></article>
      </div>
      <article class="card">
        <div class="panel-title">Cryptographically Sealed Audit Trail</div>
        <table class="table"><thead><tr><th>Seq #</th><th>Timestamp</th><th>Action / Event Type</th><th>Actor</th><th>Target Entity</th><th>SHA-256 Hash Signature</th><th>Status</th></tr></thead><tbody>
          <tr><td><b>#43</b></td><td>Today 10:42</td><td><code>DECISION_RECORDED</code></td><td>Jospin SHYAKA</td><td>Candidate #CAN-84</td><td><code>a4f8e912...c10b</code></td><td><span class="badge green">Verified</span></td></tr>
          <tr><td><b>#42</b></td><td>Today 10:15</td><td><code>RUBRIC_APPROVED</code></td><td>Steven IRANKUNDA</td><td>Requisition #REQ-012</td><td><code>9e12bf44...44d1</code></td><td><span class="badge green">Verified</span></td></tr>
          <tr><td><b>#41</b></td><td>Today 09:58</td><td><code>EVALUATION_COMPLETED</code></td><td>System AI Worker</td><td>Application #APP-084</td><td><code>3d77ca89...89e2</code></td><td><span class="badge green">Verified</span></td></tr>
          <tr><td><b>#40</b></td><td>Today 09:55</td><td><code>RESUME_INGESTED</code></td><td>Candidate Intake</td><td>File: resume_sb.pdf</td><td><code>1b04ff55...55a7</code></td><td><span class="badge green">Verified</span></td></tr>
        </tbody></table>
        <div class="row" style="margin-top:14px"><span class="muted">Each record contains the hash of the preceding block (\`prevHash\`), rendering retroactive tampering mathematically detectable.</span><span class="btn" style="padding:6px 14px;font-size:12px">Run Verification Audit →</span></div>
      </article>
    `],
  ];

  const browser = await chromium.launch({ headless: true, executablePath: process.platform === 'win32' ? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' : undefined });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 });
    for (const [filename, title, section, content] of shots) {
      await page.setContent(screenshotShell(title, section, content), { waitUntil: 'load' });
      await page.screenshot({ path: path.join(screenshotDir, filename), fullPage: true });
    }

    // Compatibility copies
    await fs.copyFile(path.join(screenshotDir, 'jobs-intake.png'), path.join(screenshotDir, 'jobs.png'));
    await fs.copyFile(path.join(screenshotDir, 'evidence-assessment.png'), path.join(screenshotDir, 'assessment.png'));
    await fs.copyFile(path.join(screenshotDir, 'audit-health.png'), path.join(screenshotDir, 'analytics.png'));

    const architecture = `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#f5f6fb;font:16px Arial;color:#20243a}.sheet{width:1400px;height:850px;padding:52px;box-sizing:border-box;background:white;position:relative}.title{font-size:30px;color:#17365d;font-weight:800}.sub{color:#73788b;margin:10px 0 36px}.row{display:flex;align-items:center;justify-content:center;gap:18px;margin:28px 0}.box{width:205px;min-height:115px;background:#f0efff;border:1px solid #d8d5ff;border-radius:17px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:17px;box-sizing:border-box}.box b{font-size:17px;color:#353675}.box span{font-size:12px;color:#666b80;margin-top:9px;line-height:1.5}.arrow{font-size:29px;color:#756ff0}.wide{background:#edf8fb;border-color:#ccecf1}.data{background:#f2f7f3;border-color:#d8eadc}.footer{position:absolute;bottom:23px;right:30px;color:#8990a0;font-size:11px}</style></head><body><div class="sheet"><div class="title">RecruitAI · High-level application architecture</div><div class="sub">Documented design · services shown at a logical level · no live credentials or personal data</div><div class="row"><div class="box"><b>Recruiter / Candidate</b><span>Role-specific browser interface</span></div><div class="arrow">→</div><div class="box"><b>Next.js 16 Application</b><span>React UI · Server pages · API routes</span></div><div class="arrow">→</div><div class="box"><b>Authentication & RBAC</b><span>Session checks · organization scope</span></div><div class="arrow">→</div><div class="box"><b>PostgreSQL</b><span>Prisma data access · audit history</span></div></div><div class="row"><div class="box wide"><b>Secure resume intake</b><span>Validation · malware scanning · cloud storage · consent record</span></div><div class="arrow">→</div><div class="box wide"><b>BullMQ + Redis</b><span>Asynchronous, retryable processing queue</span></div><div class="arrow">→</div><div class="box wide"><b>Background worker</b><span>Text extraction · profile processing · status updates</span></div></div><div class="row"><div class="box wide"><b>PII redaction + structured AI assessment</b><span>Approved rubric · quoted evidence · uncertainty · versioned configuration</span></div><div class="arrow">→</div><div class="box data"><b>Human review</b><span>Authorized recruiter records reasoned decision</span></div><div class="arrow">→</div><div class="box data"><b>Interview & reporting</b><span>Scorecards · communications · analytics · audit</span></div></div><div class="footer">AI is decision support; employment decisions remain human-authorized.</div></div></body></html>`;
    await page.setContent(architecture, { waitUntil: 'load' });
    await page.screenshot({ path: path.join(screenshotDir, 'architecture.png'), fullPage: true });
  } finally { await browser.close(); }
}

const esc = (text) => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const inlineHtml = (text) => esc(text)
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<span class="link">$1</span>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/\*([^*]+)\*/g, '<em>$1</em>')
  .replace(/`([^`]+)`/g, '<code>$1</code>');

function parseTableRow(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
}

function parseMarkdownBlocks(markdown) {
  const lines = markdown.split(/\r?\n/);
  const blocks = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line || line === '---') { index += 1; continue; }
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index++]);
      }
      if (index < lines.length && lines[index].trim().startsWith('```')) {
        index += 1;
      }
      blocks.push({ type: 'code', lang, text: codeLines.join('\n') });
      continue;
    }
    const image = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (image) { blocks.push({ type: 'image', alt: image[1], src: image[2] }); index += 1; continue; }
    if (line.startsWith('>')) {
      const note = [];
      while (index < lines.length && lines[index].trim().startsWith('>')) note.push(lines[index++].trim().replace(/^>\s?/, ''));
      blocks.push({ type: 'quote', text: note.join(' ') });
      continue;
    }
    if (line.startsWith('|')) {
      const rows = [];
      while (index < lines.length && lines[index].trim().startsWith('|')) {
        const row = parseTableRow(lines[index++]);
        if (!row.every((cell) => /^:?-{3,}:?$/.test(cell))) rows.push(row);
      }
      blocks.push({ type: 'table', rows });
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) { blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] }); index += 1; continue; }
    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) items.push(lines[index++].replace(/^\s*[-*]\s+/, '').trim());
      blocks.push({ type: 'list', ordered: false, items });
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) items.push(lines[index++].replace(/^\s*\d+\.\s+/, '').trim());
      blocks.push({ type: 'list', ordered: true, items });
      continue;
    }
    const paragraph = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !/^(#{1,6}\s|>|\||[-*]\s|\d+\.\s|---$)/.test(lines[index].trim())) paragraph.push(lines[index++].trim());
    blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
  }
  return blocks;
}

function splitCover(markdown, doc) {
  const firstSection = doc.kind === 'report' ? '# DECLARATION' : '# TABLE OF CONTENTS';
  const splitAt = markdown.indexOf(firstSection);
  const coverText = splitAt < 0 ? markdown : markdown.slice(0, splitAt);
  const body = splitAt < 0 ? '' : markdown.slice(splitAt);
  const fields = [...coverText.matchAll(/^\*\*(.+?):\*\*\s*(.+)$/gm)].map((match) => ({ label: match[1], value: match[2].trim() }));
  const detailFields = fields.filter((field) => !['FACULTY', 'ACADEMIC YEAR'].includes(field.label.toUpperCase()));
  return { coverText, body, fields, detailFields };
}

function runsFromInline(text, options = {}) {
  const runs = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > lastIndex) runs.push(new TextRun({ text: text.slice(lastIndex, match.index), ...options }));
    const token = match[0];
    if (token.startsWith('**')) runs.push(new TextRun({ text: token.slice(2, -2), bold: true, ...options }));
    else if (token.startsWith('*')) runs.push(new TextRun({ text: token.slice(1, -1), italics: true, ...options }));
    else if (token.startsWith('`')) runs.push(new TextRun({ text: token.slice(1, -1), font: 'Consolas', ...options }));
    else runs.push(new TextRun({ text: token.replace(/^\[/, '').replace(/\]\([^)]+\)$/, ''), color: palette.blue, ...options }));
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) runs.push(new TextRun({ text: text.slice(lastIndex), ...options }));
  return runs.length ? runs : [new TextRun({ text, ...options })];
}

function pageBreakParagraph() { return new Paragraph({ children: [new PageBreak()] }); }

function docxTable(rows, isSummary = false) {
  const columnCount = Math.max(1, ...rows.map((row) => row.length));
  let widths;
  if (isSummary) {
    widths = [11, 25, 7, 7, 8, 21, 21];
  } else if (rows[0]?.some((c) => /Assessment Areas|Rating Scale/i.test(c))) {
    widths = [7, 48, 28, 17];
  } else if (rows[0]?.some((c) => /Abbreviation/i.test(c))) {
    widths = [14, 36, 14, 36];
  } else if (rows[0]?.some((c) => /Entity Name/i.test(c))) {
    widths = [16, 14, 34, 36];
  } else if (rows[0]?.some((c) => /Deployment Phase|Procedure/i.test(c))) {
    widths = [8, 24, 34, 34];
  } else if (columnCount === 2) {
    widths = [72, 28];
  } else {
    widths = Array(columnCount).fill(Math.floor(100 / columnCount));
  }
  const borders = { style: BorderStyle.SINGLE, size: 5, color: palette.line };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: widths.slice(0, columnCount).map((width) => Math.round((width / 100) * 9360)),
    rows: rows.map((row, rowIndex) => new TableRow({
      tableHeader: rowIndex === 0,
      cantSplit: true,
      children: Array.from({ length: columnCount }, (_, columnIndex) => {
        const isHeader = rowIndex === 0;
        const text = row[columnIndex] ?? '';
        return new TableCell({
          width: { size: widths[columnIndex] ?? 10, type: WidthType.PERCENTAGE },
          margins: { top: 65, bottom: 65, left: 75, right: 75 },
          shading: { fill: isHeader ? palette.paleBlue : (rowIndex % 2 ? palette.white : palette.lighterBlue), type: ShadingType.CLEAR },
          borders: { top: borders, bottom: borders, left: borders, right: borders },
          children: [new Paragraph({
            spacing: { before: 0, after: 0, line: 230 },
            children: runsFromInline(text, { bold: isHeader, size: isSummary ? 14 : 18, color: isHeader ? palette.navy : palette.ink }),
          })],
        });
      }),
    })),
  });
}

function buildCoverParagraphs(doc, coverText, fields) {
  const headingLines = coverText.split(/\r?\n/).filter((line) => line.startsWith('#'));
  const university = headingLines.find((line) => line.startsWith('# '))?.replace(/^#\s*/, '') || 'ADVENTIST UNIVERSITY OF CENTRAL AFRICA';
  const subtitle = headingLines.find((line) => line.startsWith('## '))?.replace(/^##\s*/, '') || doc.title;
  const cover = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 820, after: 70 }, children: [new TextRun({ text: university, bold: true, color: palette.navy, size: 28, font: 'Arial' })] }),
  ];
  if (doc.kind === 'report') {
    cover.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: 'P.O. Box 2461, Kigali, Rwanda | www.auca.ac.rw', size: 16, color: palette.gray })] }));
    cover.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 330 }, children: [new ImageRun({ data: reportLogo, transformation: { width: 420, height: 97 }, type: 'png' })] }));
    cover.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 500, after: 160 }, children: [new TextRun({ text: subtitle.toUpperCase(), bold: true, color: palette.navy, size: 25, font: 'Arial' })] }));
  } else {
    cover.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 250 }, children: [new ImageRun({ data: logbookLogo, transformation: { width: 440, height: 85 }, type: 'png' })] }));
    cover.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 250 }, children: [new TextRun({ text: 'Faculty of Information Technology', size: 21, color: palette.gray })] }));
    cover.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 630, after: 250 }, border: { bottom: { color: '9BC2E6', space: 8, style: BorderStyle.SINGLE, size: 12 } }, children: [new TextRun({ text: '✦', size: 30, color: '9BC2E6' })] }));
    cover.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 250, after: 180 }, border: { bottom: { color: '9BC2E6', space: 5, style: BorderStyle.SINGLE, size: 10 } }, children: [new TextRun({ text: subtitle, size: 21, color: palette.ink, font: 'Arial' })] }));
  }
  if (doc.kind === 'report') cover.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 430, after: 90 }, children: [new TextRun({ text: 'FACULTY: Information Technology', size: 21, color: palette.ink })] }));
  if (doc.kind === 'logbook') cover.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 620, after: 90 }, children: [new TextRun({ text: 'ACADEMIC YEAR: 2025/2026', size: 21, color: palette.ink })] }));
  for (const field of fields.filter((field) => !['FACULTY', 'ACADEMIC YEAR'].includes(field.label.toUpperCase()))) {
    const display = `${field.label.toUpperCase()}:  ${field.value}`;
    cover.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 45, after: 45 }, children: [new TextRun({ text: display, size: 19, color: palette.ink })] }));
  }
  if (doc.kind === 'logbook') cover.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 90, after: 20 }, children: [new TextRun({ text: 'AUCA', size: 19, color: palette.ink })] }));
  return cover;
}

function resolveImagePath(src) {
  const p1 = path.resolve(root, 'docs', src);
  if (fsSync.existsSync(p1)) return p1;
  const p2 = path.resolve('D:/Xkl/Logbook&Report/Deliverables/screenshots', path.basename(src));
  if (fsSync.existsSync(p2)) return p2;
  const p3 = path.resolve(deliverables, 'screenshots', path.basename(src));
  if (fsSync.existsSync(p3)) return p3;
  return p1;
}

function docxBodyParagraph(block, doc) {
  const { level, text } = block;
  if (block.type === 'heading') {
    const isWeek = /^Week \d+ Summary Report/.test(text);
    const isDaily = /^Day \d+/.test(text);
    const isChapter = /^CHAPTER [IV]+:/.test(text);
    const isMajorFrontMatter = ['DECLARATION', 'APPROVAL', 'ACKNOWLEDGEMENT', 'ABBREVIATIONS', 'TABLE OF CONTENTS', 'LIST OF FIGURES', 'REFERENCES', 'APPENDICES', 'FORM I', 'UNIVERSITY GUIDELINES', 'ASSESSMENT FORM', 'UNIVERSITY SUPERVISOR'].some((title) => text.toUpperCase().startsWith(title));
    const isGuidelineBreak = doc.kind === 'logbook' && /^(I\. MISSION|IV\. DURATION|VIII\. WEEKLY SUMMARY|XIV\. EXPECTED OUTPUT|XVI\. INDUSTRIAL ATTACHMENT|XVIII\. UNIVERSITY STAFF|XX\. THE MAIN REPORT|XXI\. INDUSTRIAL ATTACHMENT|XXII\. FURTHER POINTS|XXIII\. STUDENT DECLARATION|ATTACHMENTS|FORM I|PLACE OF HOST COMPANY)/i.test(text);
    const children = runsFromInline(text.replace(/^CHAPTER [IV]+:\s*/, `CHAPTER ${text.match(/^CHAPTER ([IV]+)/)?.[1]}: `), { bold: true, color: isChapter || level === 1 ? palette.navy : palette.ink, size: level <= 2 ? 25 : 21 });
    const paragraph = new Paragraph({
      heading: level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
      pageBreakBefore: isChapter || isMajorFrontMatter || isWeek || (isDaily && doc.kind === 'logbook') || isGuidelineBreak,
      keepNext: true,
      spacing: { before: level === 1 ? 220 : 130, after: level === 1 ? 145 : 90 },
      border: level === 1 ? { bottom: { color: palette.blue, space: 5, style: BorderStyle.SINGLE, size: 6 } } : undefined,
      children,
    });
    return paragraph;
  }
  if (block.type === 'paragraph') {
    const placeholder = /\[[^\]]+\]/.test(text);
    return new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { before: 0, after: 95, line: 275 }, children: runsFromInline(text, { size: 21, color: placeholder ? palette.gray : palette.ink }) });
  }
  if (block.type === 'code') {
    return block.text.split('\n').map((codeLine) => new Paragraph({
      spacing: { before: 0, after: 20, line: 200 },
      shading: { fill: 'F3F4F6', type: ShadingType.CLEAR },
      indent: { left: 240, right: 240 },
      children: [new TextRun({ text: codeLine, font: 'Consolas', size: 17, color: '1F2937' })],
    }));
  }
  if (block.type === 'quote') {
    return new Paragraph({ shading: { fill: palette.lighterBlue, type: ShadingType.CLEAR }, indent: { left: 180, right: 180 }, spacing: { before: 100, after: 130 }, children: runsFromInline(block.text, { italics: true, size: 18, color: palette.gray }) });
  }
  if (block.type === 'image') {
    const imagePath = resolveImagePath(block.src);
    return fs.readFile(imagePath).then((data) => [
      new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, children: [new ImageRun({ data, transformation: { width: 590, height: 350 }, type: 'png' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 140 }, children: runsFromInline(block.alt, { italics: true, size: 18, color: palette.gray }) }),
    ]);
  }
  if (block.type === 'list') {
    return block.items.map((item) => new Paragraph({
      numbering: { reference: block.ordered ? 'numbered' : 'bullets', level: 0 },
      spacing: { after: 50 },
      children: runsFromInline(block.ordered ? item.replace(/^\d+\.\s*/, '') : item, { size: 21, color: palette.ink }),
    }));
  }
  if (block.type === 'table') {
    const isSummary = block.rows[0]?.some((cell) => /Time in|Time out|Lessons learnt|Challenges faced/i.test(cell));
    return docxTable(block.rows, isSummary);
  }
  return new Paragraph({ text: '' });
}

function renderBlockHtml(block, doc) {
  if (block.type === 'heading') {
    const isDaily = /^Day \d+/.test(block.text);
    const isWeek = /^Week \d+ Summary Report/.test(block.text);
    const isMajorFrontMatter = ['DECLARATION', 'APPROVAL', 'ACKNOWLEDGEMENT', 'ABBREVIATIONS', 'TABLE OF CONTENTS', 'LIST OF FIGURES', 'REFERENCES', 'APPENDICES', 'FORM I', 'ATTACHMENTS', 'UNIVERSITY GUIDELINES', 'ASSESSMENT FORM', 'UNIVERSITY SUPERVISOR'].some((title) => block.text.toUpperCase().startsWith(title));
    const isChapter = /^CHAPTER [IV]+:/.test(block.text);
    const isGuidelineBreak = doc.kind === 'logbook' && /^(I\. MISSION|IV\. DURATION|VIII\. WEEKLY SUMMARY|XIV\. EXPECTED OUTPUT|XVI\. INDUSTRIAL ATTACHMENT|XVIII\. UNIVERSITY STAFF|XX\. THE MAIN REPORT|XXI\. INDUSTRIAL ATTACHMENT|XXII\. FURTHER POINTS|XXIII\. STUDENT DECLARATION|PLACE OF HOST COMPANY)/i.test(block.text);

    let classes = '';
    if (isDaily && doc.kind === 'logbook') classes = ' class="daily-heading"';
    else if (isWeek) classes = ' class="week-summary"';
    else if (isChapter || isMajorFrontMatter) classes = ' class="section-break"';
    else if (isGuidelineBreak) classes = ' class="guideline-break"';

    return `<h${block.level}${classes}>${inlineHtml(block.text)}</h${block.level}>`;
  }
  if (block.type === 'paragraph') return `<p>${inlineHtml(block.text)}</p>`;
  if (block.type === 'code') return `<pre class="code-block"><code>${esc(block.text)}</code></pre>`;
  if (block.type === 'image') {
    const imagePath = resolveImagePath(block.src);
    const imageData = fsSync.readFileSync(imagePath).toString('base64');
    return `<figure class="report-figure"><img src="data:image/png;base64,${imageData}" alt="${esc(block.alt)}"><figcaption>${inlineHtml(block.alt)}</figcaption></figure>`;
  }
  if (block.type === 'quote') return `<aside>${inlineHtml(block.text)}</aside>`;
  if (block.type === 'list') {
    const tag = block.ordered ? 'ol' : 'ul';
    return `<${tag}>${block.items.map((item) => `<li>${inlineHtml(item)}</li>`).join('')}</${tag}>`;
  }
  if (block.type === 'table') {
    const isSummary = block.rows[0]?.some((cell) => /Time in|Time out|Lessons learnt|Challenges faced/i.test(cell));
    const [head, ...rows] = block.rows;
    const columnCount = head.length;
    let colgroup = '';
    if (isSummary) {
      const summaryWidths = [11, 25, 7, 7, 8, 21, 21];
      colgroup = `<colgroup>${head.map((_, i) => `<col style="width:${summaryWidths[i] || 10}%" />`).join('')}</colgroup>`;
    } else if (head.some((c) => /Assessment Areas|Rating Scale/i.test(c))) {
      const w = [7, 48, 28, 17];
      colgroup = `<colgroup>${w.map((pct) => `<col style="width:${pct}%" />`).join('')}</colgroup>`;
    } else if (head.some((c) => /Abbreviation/i.test(c))) {
      const w = [14, 36, 14, 36];
      colgroup = `<colgroup>${w.map((pct) => `<col style="width:${pct}%" />`).join('')}</colgroup>`;
    } else if (head.some((c) => /Entity Name/i.test(c))) {
      const w = [16, 14, 34, 36];
      colgroup = `<colgroup>${w.map((pct) => `<col style="width:${pct}%" />`).join('')}</colgroup>`;
    } else if (head.some((c) => /Deployment Phase|Procedure/i.test(c))) {
      const w = [8, 24, 34, 34];
      colgroup = `<colgroup>${w.map((pct) => `<col style="width:${pct}%" />`).join('')}</colgroup>`;
    } else if (columnCount === 2) {
      colgroup = `<colgroup><col style="width:72%" /><col style="width:28%" /></colgroup>`;
    } else {
      const pct = Math.floor(100 / columnCount);
      colgroup = `<colgroup>${head.map(() => `<col style="width:${pct}%" />`).join('')}</colgroup>`;
    }
    return `<table class="${isSummary ? 'summary-table' : ''}">${colgroup}<thead><tr>${head.map((cell) => `<th>${inlineHtml(cell)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${head.map((_, i) => `<td>${inlineHtml(row[i] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }
  return '';
}

function getCommonCss() {
  return `
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, Calibri, sans-serif; color: #20262D; font-size: 10.5pt; line-height: 1.48; }
    .cover { min-height: 235mm; page-break-after: always; text-align: center; position: relative; padding: 12mm 12mm; color: #20262D; }
    .cover h1 { page-break-before: avoid !important; }
    .report-cover .university { margin-top: 15mm; color: #17365D; font-weight: 700; font-size: 18pt; letter-spacing: .4px; }
    .address { color: #586575; font-size: 8.5pt; margin-top: 2mm; }
    .auca-logo { display:block; width:140mm; height:auto; object-fit:contain; margin:5mm auto 0; }
    .report-cover h1 { color: #17365D; font-size: 16.5pt; line-height: 1.38; margin: 30mm 0 15mm; letter-spacing: .15px; }
    .cover-fields { margin: 0 auto; max-width: 145mm; }
    .cover-field { font-size: 10pt; line-height: 1.85; }
    .cover-field b { letter-spacing: .1px; }
    .logbook-cover .auca-logo { width:160mm; margin:0 auto; }
    .faculty { margin-top: 17mm; font-size: 10pt; }
    .ornament { color: #AACBE4; font-family: Georgia, serif; font-size: 35pt; margin: 14mm auto 0; border-bottom: 1.4px solid #9BC2E6; width:100%; line-height: 1.1; }
    .logbook-cover h1 { border-bottom:1.4px solid #9BC2E6; font: 12pt Georgia,serif; padding: 11mm 0 2mm; margin-top: 10mm; }
    .ornament.bottom { border:0; margin-top: 2mm; }
    .logbook-cover .cover-fields { margin-top: 14mm; }
    main h1 { color:#17365D; font-size:16pt; line-height:1.25; margin: 0 0 11pt; page-break-before: always; border-bottom:1px solid #245A8D; padding-bottom:5pt; }
    main h1:first-child { page-break-before: avoid; }
    h2 { color:#17365D; font-size:12.5pt; margin:14pt 0 6pt; page-break-after: avoid; }
    h3 { color:#20262D; font-size:10.5pt; margin:10pt 0 4pt; page-break-after: avoid; }
    .daily-heading, .week-summary, .section-break, .guideline-break { page-break-before: always; }
    p { text-align:justify; margin:0 0 8.5pt; widows:3; orphans:3; }
    li { margin:0 0 3.5pt; } ul,ol { padding-left:22pt; margin-top:2pt; margin-bottom:9pt; }
    aside { background:#EEF4F8; border-left:3px solid #9BC2E6; padding:8pt 10pt; color:#56616E; font-size:9pt; margin:7pt 0 12pt; }
    table { width:100%; border-collapse:collapse; margin:7pt 0 12pt; table-layout:fixed; page-break-inside:avoid; }
    tr { page-break-inside:avoid; } th,td { border:0.6px solid #B8C9D8; padding:4.5pt; vertical-align:top; overflow-wrap:anywhere; }
    th { background:#DCEAF5; color:#17365D; font-weight:700; text-align:left; }
    tbody tr:nth-child(even) { background:#F5F8FA; }
    .summary-table { font-size:6.7pt; line-height:1.28; } .summary-table th,.summary-table td { padding:2.6pt 2pt; }
    .link { color:#245A8D; } code { font-family:Consolas,monospace; font-size:9pt; }
    pre.code-block { background:#F8FAFC; border:1px solid #E2E8F0; border-radius:4px; padding:8pt 10pt; font-family:Consolas,monospace; font-size:8.5pt; line-height:1.4; overflow:hidden; white-space:pre-wrap; margin:6pt 0 10pt; }
    .report-figure { margin:8pt auto 16pt; text-align:center; page-break-inside:avoid; }
    .report-figure img { width:100%; height:auto; border:1px solid #D6DFE8; border-radius:5px; }
    .report-figure figcaption { color:#66717D; font-style:italic; font-size:9pt; margin-top:4pt; }
  `;
}

function markdownToHtml(markdown, doc) {
  const { coverText, body, detailFields } = splitCover(markdown, doc);
  const blocks = parseMarkdownBlocks(body);
  const contentHtml = blocks.map((b) => renderBlockHtml(b, doc)).join('');

  const coverFields = detailFields.map((field) => `<div class="cover-field"><b>${esc(field.label.toUpperCase())}:</b> ${inlineHtml(field.value)}</div>`).join('');
  const logoData = (doc.kind === 'report' ? reportLogo : logbookLogo).toString('base64');
  const logo = `<img class="auca-logo" src="data:image/png;base64,${logoData}" alt="Adventist University of Central Africa" />`;
  const cover = doc.kind === 'report'
    ? `<section class="cover report-cover"><div class="university">${esc(coverText.match(/^#\s+(.+)$/m)?.[1] || 'ADVENTIST UNIVERSITY OF CENTRAL AFRICA')}</div><div class="address">P.O. Box 2461 Kigali, Rwanda&nbsp; | &nbsp;www.auca.ac.rw&nbsp; | &nbsp;info@auca.ac.rw</div>${logo}<h1>${esc(doc.title)}</h1><div class="cover-fields"><div class="cover-field"><b>FACULTY:</b> Information Technology</div>${coverFields}</div></section>`
    : `<section class="cover logbook-cover">${logo}<div class="faculty">Faculty of Information Technology</div><div class="ornament">❧</div><h1>${esc(doc.title)}</h1><div class="ornament bottom">✣</div><div class="cover-fields"><div class="cover-field"><b>ACADEMIC YEAR:</b> 2025/2026</div>${coverFields}<div class="cover-field">AUCA</div></div></section>`;

  const pageCss = doc.kind === 'logbook'
    ? `@page { size: A4; margin: 18mm; @top-left { content: "AUCA"; font: 8pt Arial; color:#65717E; } @top-center { content:"Attachment Logbook"; font:8pt Arial; color:#65717E; } @top-right { content:"IT"; font:8pt Arial; color:#65717E; } @bottom-right { content: counter(page) " | Page"; font:8pt Arial; color:#65717E; } } @page:first { @top-left { content:""; } @top-center { content:""; } @top-right { content:""; } @bottom-right { content:""; } }`
    : `@page { size: A4; margin: 18mm; @bottom-center { content: counter(page); font: 9pt Arial; color: #4B5563; } } @page:first { @bottom-center { content: ''; } }`;

  return `<!doctype html><html><head><meta charset="utf-8"><style>${getCommonCss()} ${pageCss}</style></head><body>${cover}<main>${contentHtml}</main></body></html>`;
}
async function buildWordDocument(markdown, doc) {
  const { coverText, body, fields } = splitCover(markdown, doc);
  const bodyBlocks = parseMarkdownBlocks(body);

  if (doc.kind === 'report') {
    // Split into preliminary pages and main chapters for distinct page numbering
    const chapter1Index = bodyBlocks.findIndex((b) => b.type === 'heading' && /^CHAPTER I:/i.test(b.text));
    const prelimBlocks = chapter1Index >= 0 ? bodyBlocks.slice(0, chapter1Index) : bodyBlocks;
    const chapterBlocks = chapter1Index >= 0 ? bodyBlocks.slice(chapter1Index) : [];

    const prelimChildren = [
      ...buildCoverParagraphs(doc, coverText, fields),
      pageBreakParagraph(),
    ];
    for (const block of prelimBlocks) {
      const element = docxBodyParagraph(block, doc);
      if (element instanceof Promise) { prelimChildren.push(...await element); continue; }
      if (Array.isArray(element)) prelimChildren.push(...element); else prelimChildren.push(element);
    }

    const chapterChildren = [];
    for (const block of chapterBlocks) {
      const element = docxBodyParagraph(block, doc);
      if (element instanceof Promise) { chapterChildren.push(...await element); continue; }
      if (Array.isArray(element)) chapterChildren.push(...element); else chapterChildren.push(element);
    }

    const prelimFooter = new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Internship Report | ' }), new TextRun({ children: [PageNumber.CURRENT] })] })] });
    const chapterFooter = new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Internship Report | ' }), new TextRun({ children: [PageNumber.CURRENT] })] })] });

    return new Document({
      creator: 'SHYAKA Jospin (ID: 26119)',
      title: doc.title,
      description: 'AUCA Internship Report - Faculty of Information Technology',
      styles: {
        default: {
          document: { run: { font: 'Arial', size: 21, color: palette.ink }, paragraph: { spacing: { after: 100, line: 275 } } },
          heading1: { run: { font: 'Arial', bold: true, size: 26, color: palette.navy }, paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 0 } },
          heading2: { run: { font: 'Arial', bold: true, size: 23, color: palette.navy }, paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 1 } },
          heading3: { run: { font: 'Arial', bold: true, size: 21, color: palette.ink }, paragraph: { spacing: { before: 130, after: 70 }, outlineLevel: 2 } },
        },
      },
      numbering: { config: [
        { reference: 'bullets', levels: [{ level: 0, format: 'bullet', text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 420, hanging: 240 } } } }] },
        { reference: 'numbered', levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 420, hanging: 240 } } } }] },
      ] },
      sections: [
        {
          properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, right: 1020, bottom: 1134, left: 1020, header: 540, footer: 540 }, pageNumberStart: 1, pageNumberFormatType: NumberFormat.LOWER_ROMAN } },
          footers: { default: prelimFooter },
          children: prelimChildren,
        },
        {
          properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, right: 1020, bottom: 1134, left: 1020, header: 540, footer: 540 }, pageNumberStart: 1, pageNumberFormatType: NumberFormat.DECIMAL } },
          footers: { default: chapterFooter },
          children: chapterChildren,
        },
      ],
    });
  }

  // Logbook
  const header = new Header({ children: [new Paragraph({ children: [new TextRun({ text: 'AUCA', color: palette.gray }), new TextRun({ text: '\tAttachment Logbook\tIT', color: palette.gray })], tabStops: [{ type: 'center', position: 4680 }, { type: 'right', position: 9360 }], border: { bottom: { color: palette.line, space: 4, style: BorderStyle.SINGLE, size: 4 } } })] });
  const footer = new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'AUCA | Attachment Logbook | Page ' }), new TextRun({ children: [PageNumber.CURRENT] })] })] });

  const children = [
    ...buildCoverParagraphs(doc, coverText, fields),
    pageBreakParagraph(),
  ];
  for (const block of bodyBlocks) {
    const element = docxBodyParagraph(block, doc);
    if (element instanceof Promise) { children.push(...await element); continue; }
    if (Array.isArray(element)) children.push(...element); else children.push(element);
  }

  return new Document({
    creator: 'SHYAKA Jospin (ID: 26119)',
    title: doc.title,
    description: 'AUCA Internship Logbook - Faculty of Information Technology',
    styles: {
      default: {
        document: { run: { font: 'Arial', size: 21, color: palette.ink }, paragraph: { spacing: { after: 100, line: 275 } } },
        heading1: { run: { font: 'Arial', bold: true, size: 26, color: palette.navy }, paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 0 } },
        heading2: { run: { font: 'Arial', bold: true, size: 23, color: palette.navy }, paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 1 } },
        heading3: { run: { font: 'Arial', bold: true, size: 21, color: palette.ink }, paragraph: { spacing: { before: 130, after: 70 }, outlineLevel: 2 } },
      },
    },
    numbering: { config: [
      { reference: 'bullets', levels: [{ level: 0, format: 'bullet', text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 420, hanging: 240 } } } }] },
      { reference: 'numbered', levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 420, hanging: 240 } } } }] },
    ] },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, right: 1020, bottom: 1134, left: 1020, header: 540, footer: 540 } } },
      headers: { default: header },
      footers: { default: footer },
      children,
    }],
  });
}

await fs.mkdir(deliverables, { recursive: true });
console.log('Generating illustrative screenshots for RecruitAI...');
await createIllustrativeScreenshots();
console.log('Screenshots generated successfully!');

for (const doc of docs) {
  console.log(`Processing ${doc.basename}...`);
  let markdown = await fs.readFile(path.join(root, doc.markdown), 'utf8');
  markdown = markdown.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  if (doc.kind === 'logbook') {
    const toolset = 'Laptop/computer, Visual Studio Code, Node.js/npm, Git/GitHub, and browser developer tools; Prisma/PostgreSQL, Redis/BullMQ, Vitest/Playwright, and API testing tools where applicable';
    markdown = markdown
      .replaceAll('[Enter actual tools.]', toolset)
      .replaceAll('[Enter actual: e.g. laptop, VS Code, browser, project specification.]', `${toolset}, and the project specification`);
  }
  const word = await buildWordDocument(markdown, doc);
  await fs.writeFile(path.join(deliverables, `${doc.basename}.docx`), await Packer.toBuffer(word));

  const edgePath = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
  const launchOptions = { headless: true };
  if (process.platform === 'win32' && await fs.access(edgePath).then(() => true).catch(() => false)) {
    launchOptions.executablePath = edgePath;
  }
  const browser = await chromium.launch(launchOptions);
  try {
    if (doc.kind === 'report') {
      const { coverText, body, detailFields } = splitCover(markdown, doc);
      const blocks = parseMarkdownBlocks(body);
      const chapter1Index = blocks.findIndex((b) => b.type === 'heading' && /^CHAPTER I:/i.test(b.text));
      const prelimBlocks = chapter1Index >= 0 ? blocks.slice(0, chapter1Index) : blocks;
      const mainBlocks = chapter1Index >= 0 ? blocks.slice(chapter1Index) : [];

      const coverFields = detailFields.map((field) => `<div class="cover-field"><b>${esc(field.label.toUpperCase())}:</b> ${inlineHtml(field.value)}</div>`).join('');
      const logoData = reportLogo.toString('base64');
      const logo = `<img class="auca-logo" src="data:image/png;base64,${logoData}" alt="Adventist University of Central Africa" />`;
      const coverHtml = `<section class="cover report-cover"><div class="university">${esc(coverText.match(/^#\s+(.+)$/m)?.[1] || 'ADVENTIST UNIVERSITY OF CENTRAL AFRICA')}</div><div class="address">P.O. Box 2461 Kigali, Rwanda&nbsp; | &nbsp;www.auca.ac.rw&nbsp; | &nbsp;info@auca.ac.rw</div>${logo}<h1>${esc(doc.title)}</h1><div class="cover-fields"><div class="cover-field"><b>FACULTY:</b> Information Technology</div>${coverFields}</div></section>`;

      const prelimHtml = prelimBlocks.map((b) => renderBlockHtml(b, doc)).join('');
      const mainHtml = mainBlocks.map((b) => renderBlockHtml(b, doc)).join('');

      const tempCoverPdf = path.join(deliverables, `${doc.basename}-cover.pdf`);
      const tempPrelimPdf = path.join(deliverables, `${doc.basename}-prelim.pdf`);
      const tempMainPdf = path.join(deliverables, `${doc.basename}-main.pdf`);
      const finalPdf = path.join(deliverables, `${doc.basename}.pdf`);

      // 1. Cover
      const p1 = await browser.newPage({ viewport: { width: 794, height: 1123 } });
      await p1.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${getCommonCss()} @page { size: A4; margin: 18mm; @bottom-center { content: ""; } }</style></head><body>${coverHtml}</body></html>`, { waitUntil: 'load' });
      await p1.locator('.auca-logo').evaluate((img) => img.decode().catch(() => {}));
      await p1.pdf({ path: tempCoverPdf, format: 'A4', printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false, margin: { top: '18mm', right: '18mm', bottom: '18mm', left: '18mm' } });
      await p1.close();

      // 2. Prelim (Roman numerals)
      const p2 = await browser.newPage({ viewport: { width: 794, height: 1123 } });
      await p2.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${getCommonCss()} @page { size: A4; margin: 18mm; @bottom-center { content: counter(page, lower-roman); font: 9pt Arial; color: #4B5563; } }</style></head><body><main>${prelimHtml}</main></body></html>`, { waitUntil: 'load' });
      await p2.pdf({ path: tempPrelimPdf, format: 'A4', printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false, margin: { top: '18mm', right: '18mm', bottom: '18mm', left: '18mm' } });
      await p2.close();

      // 3. Main (Arabic numerals)
      const p3 = await browser.newPage({ viewport: { width: 794, height: 1123 } });
      await p3.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${getCommonCss()} @page { size: A4; margin: 18mm; @bottom-center { content: counter(page); font: 9pt Arial; color: #4B5563; } }</style></head><body><main>${mainHtml}</main></body></html>`, { waitUntil: 'load' });
      await p3.pdf({ path: tempMainPdf, format: 'A4', printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false, margin: { top: '18mm', right: '18mm', bottom: '18mm', left: '18mm' } });
      await p3.close();

      // 4. Merge
      execSync(`python -c "import pypdf; w = pypdf.PdfWriter(); [w.append(f) for f in [r'${tempCoverPdf}', r'${tempPrelimPdf}', r'${tempMainPdf}']]; w.write(r'${finalPdf}'); w.close()"`);
      await fs.unlink(tempCoverPdf).catch(() => {});
      await fs.unlink(tempPrelimPdf).catch(() => {});
      await fs.unlink(tempMainPdf).catch(() => {});
    } else {
      const html = markdownToHtml(markdown, doc);
      const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 1 });
      await page.setContent(html, { waitUntil: 'load' });
      await page.locator('.auca-logo').evaluate((image) => image.decode());
      await page.pdf({
        path: path.join(deliverables, `${doc.basename}.pdf`),
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false,
        margin: { top: '18mm', right: '18mm', bottom: '18mm', left: '18mm' },
      });
      await page.close();
    }
  } finally {
    await browser.close();
  }
  console.log(`Created ${doc.basename}.docx and ${doc.basename}.pdf`);

  // Sync to active workspace Logbook&Report/Deliverables
  const workspaceDeliverables = path.resolve('D:/Xkl/Logbook&Report/Deliverables');
  await fs.mkdir(workspaceDeliverables, { recursive: true });
  await fs.copyFile(path.join(deliverables, `${doc.basename}.docx`), path.join(workspaceDeliverables, `${doc.basename}.docx`));
  await fs.copyFile(path.join(deliverables, `${doc.basename}.pdf`), path.join(workspaceDeliverables, `${doc.basename}.pdf`));

  // Sync Draft files for consistency
  const draftName = doc.kind === 'report' ? 'AUCA-Internship-Report-Draft' : 'AUCA-Attachment-Logbook-Draft';
  await fs.copyFile(path.join(deliverables, `${doc.basename}.docx`), path.join(deliverables, `${draftName}.docx`));
  await fs.copyFile(path.join(deliverables, `${doc.basename}.pdf`), path.join(deliverables, `${draftName}.pdf`));
  await fs.copyFile(path.join(deliverables, `${doc.basename}.docx`), path.join(workspaceDeliverables, `${draftName}.docx`));
  await fs.copyFile(path.join(deliverables, `${doc.basename}.pdf`), path.join(workspaceDeliverables, `${draftName}.pdf`));
}
console.log('All documents compiled and synchronized to workspace deliverables successfully!');
