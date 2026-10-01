import prisma from '@/lib/prisma';

/**
 * Transactional email service (Resend).
 *
 * Design rule: there is NO "pretend it sent" fallback. If delivery fails or
 * the provider is not configured, the caller finds out and the failure is
 * recorded (see `sendRecordedEmail`) so authorized users can follow up —
 * per spec §6.9: messages must record delivery status and failure information.
 */

export type EmailTemplateType =
  | 'APPLICATION_CONFIRMATION'
  | 'INTERVIEW_INVITATION'
  | 'INTERVIEW_RESCHEDULED'
  | 'INTERVIEW_CANCELLED'
  | 'OFFER_LETTER'
  | 'REJECTION_FEEDBACK'
  | 'TEAM_INVITATION'
  | 'PASSWORD_RESET'
  | 'EMAIL_VERIFICATION'
  | 'EMAIL_VERIFICATION_CODE';

export interface EmailPayload {
  to: string;
  template: EmailTemplateType;
  data: {
    candidateName?: string;
    /** 6-digit verification code for EMAIL_VERIFICATION_CODE emails. */
    verificationCode?: string;
    jobTitle?: string;
    schedule?: string;
    timezone?: string;
    meetingLink?: string;
    joinLink?: string;
    offerDetails?: {
      salary: string;
      startDate: string;
      equity?: string;
    };
    feedback?: string;
  };
  applicationId?: string;
}

const SUBJECT_MAP: Record<EmailTemplateType, (data: EmailPayload['data']) => string> = {
  APPLICATION_CONFIRMATION: (d) => `Application Received: ${d.jobTitle ?? ''} — RecruitAI`,
  INTERVIEW_INVITATION: (d) => `Interview Invitation: ${d.jobTitle ?? ''} — RecruitAI`,
  INTERVIEW_RESCHEDULED: (d) => `Interview Rescheduled: ${d.jobTitle ?? ''} — RecruitAI`,
  INTERVIEW_CANCELLED: (d) => `Interview Cancelled: ${d.jobTitle ?? ''} — RecruitAI`,
  OFFER_LETTER: (d) => `Official Job Offer: ${d.jobTitle ?? ''} — RecruitAI 🎉`,
  REJECTION_FEEDBACK: (d) => `Update regarding your application for ${d.jobTitle ?? ''} — RecruitAI`,
  TEAM_INVITATION: () => `You have been invited to join a team on RecruitAI`,
  PASSWORD_RESET: () => `Reset your RecruitAI password`,
  EMAIL_VERIFICATION: () => `Verify your email address — RecruitAI`,
  EMAIL_VERIFICATION_CODE: (d) => `Your verification code: ${d.verificationCode ?? ''} — RecruitAI`,
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderEmailHtml(template: EmailTemplateType, data: EmailPayload['data']): string {
  const name = escapeHtml(data.candidateName ?? 'there');
  const jobTitle = escapeHtml(data.jobTitle ?? '');
  const safe = (v?: string) => escapeHtml(v ?? '');

  let body = `<p>Dear <strong>${name}</strong>,</p>`;

  switch (template) {
    case 'APPLICATION_CONFIRMATION':
      body += `<p>This confirms we have received your application for <strong>${jobTitle}</strong>. Our team will review it and get back to you.</p>`;
      break;
    case 'INTERVIEW_INVITATION':
      body += `<p>You are invited to an interview for <strong>${jobTitle}</strong>.</p>
        ${data.schedule ? `<p><strong>Schedule:</strong> ${safe(data.schedule)} (${safe(data.timezone) || 'CAT'})</p>` : ''}
        ${data.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${safe(data.meetingLink)}">${safe(data.meetingLink)}</a></p>` : ''}`;
      break;
    case 'INTERVIEW_RESCHEDULED':
      body += `<p>The interview for <strong>${jobTitle}</strong> has been rescheduled.</p>
        ${data.schedule ? `<p><strong>New schedule:</strong> ${safe(data.schedule)} (${safe(data.timezone) || 'CAT'})</p>` : ''}
        ${data.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${safe(data.meetingLink)}">${safe(data.meetingLink)}</a></p>` : ''}`;
      break;
    case 'INTERVIEW_CANCELLED':
      body += `<p>The interview for <strong>${jobTitle}</strong> has been cancelled.</p>
        <p>The hiring team will contact you about next steps. We apologize for any inconvenience.</p>`;
      break;
    case 'OFFER_LETTER':
      body += `<p>We are pleased to offer you the position of <strong>${jobTitle}</strong>.</p>
        ${data.offerDetails ? `<p><strong>Salary:</strong> ${safe(data.offerDetails.salary)}<br/>
        <strong>Start date:</strong> ${safe(data.offerDetails.startDate)}${data.offerDetails.equity ? `<br/><strong>Equity:</strong> ${safe(data.offerDetails.equity)}` : ''}</p>` : ''}`;
      break;
    case 'REJECTION_FEEDBACK':
      body += `<p>Thank you for applying for <strong>${jobTitle}</strong>. After careful review, we have decided not to move forward with your application at this time.</p>
        <p>We wish you the best in your job search.</p>`;
      break;
    case 'TEAM_INVITATION':
      body += `<p>You have been invited to join a recruitment workspace on RecruitAI.</p>
        ${data.joinLink ? `<p><a href="${safe(data.joinLink)}">Click here to accept the invitation and create your account</a></p>` : ''}`;
      break;
    case 'EMAIL_VERIFICATION':
      body += `<p>Please confirm your email address to activate your account.</p>
        ${data.joinLink ? `<p><a href="${safe(data.joinLink)}">Verify my email address</a></p>` : ''}`;
      break;
    case 'EMAIL_VERIFICATION_CODE':
      body += `<p>Your verification code is:</p>
        <p style="font-size: 32px; letter-spacing: 8px; font-weight: 700; font-family: monospace; color: #0f766e;">${safe(data.verificationCode)}</p>
        <p>This code expires in 10 minutes and can be used once. Enter it on the
        verification screen to continue. If you did not request it, you can
        safely ignore this email.</p>`;
      break;
  }

  return `<div style="font-family: sans-serif; padding: 24px; color: #1e293b; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px;">
    <h2 style="color: #4f46e5;">RecruitAI</h2>
    ${body}
    <p style="margin-top: 24px; font-size: 12px; color: #64748b;">Powered by RecruitAI.</p>
  </div>`;
}

export function generateCalendarICS(
  candidateName: string,
  jobTitle: string,
  scheduleDate: Date,
  meetingLink: string
): string {
  const startDateStr = scheduleDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const endDate = new Date(scheduleDate.getTime() + 45 * 60000); // 45 min duration
  const endDateStr = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//RecruitAI//Talent ATS//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${Date.now()}@recruitai.com
DTSTAMP:${startDateStr}
DTSTART:${startDateStr}
DTEND:${endDateStr}
SUMMARY:Technical Interview: ${candidateName} — ${jobTitle}
DESCRIPTION:RecruitAI Technical Interview Session.\\nJoin Meeting: ${meetingLink}
LOCATION:${meetingLink}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
}

/**
 * Turns provider rejections into actionable hints appended to the thrown error
 * (which lands in server logs and Communication.failureInfo). Brevo accounts
 * with IP allowlisting enabled reject EVERY request from an unknown IP with a
 * 401 — from the outside that is indistinguishable from "email never sends",
 * so the fix must be discoverable from the failure record itself.
 */
function providerFailureHint(provider: 'Brevo' | 'Resend', status: number, data: unknown): string {
  const detail = JSON.stringify(data ?? {}).toLowerCase();
  if (provider === 'Brevo') {
    if (status === 401 && detail.includes('ip')) {
      return (
        ' Hint: this Brevo account restricts API access to authorized IPs. Add this ' +
          "server's IP at https://app.brevo.com/security/authorised_ips (or disable IP " +
          'restrictions in Brevo security settings), then retry the send.'
      );
    }
    if (status === 401) {
      return (
        ' Hint: check that BREVO_API_KEY is valid and that this server\'s IP is ' +
          'authorized at https://app.brevo.com/security/authorised_ips.'
      );
    }
  }
  if (provider === 'Resend' && status === 401) {
    return ' Hint: check that RESEND_API_KEY is valid and belongs to this Resend account.';
  }
  if (status === 403) {
    return (
      ' Hint: the EMAIL_FROM address may not be verified/allowed to send with this provider ' +
        '(verify the sender or domain in the provider dashboard).'
    );
  }
  return '';
}

/**
 * Sends an email through the configured provider. Throws on misconfiguration or
 * delivery failure — callers decide how to surface it. NO console.log fake-send path.
 *
 * Providers (first configured one wins):
 *  - Resend  — RESEND_API_KEY; EMAIL_FROM must be a Resend-verified domain or
 *              'onboarding@resend.dev' (sandbox: delivers only to your own account email).
 *  - Brevo   — BREVO_API_KEY; EMAIL_FROM must be a sender address verified in the
 *              Brevo dashboard (Senders & IP -> single-sender verification via
 *              confirmation email — no domain/DNS needed, 300 emails/day free).
 */
// One-time warning: a gmail.com/googlemail.com sender cannot be
// authenticated (SPF/DKIM belong to Google), and since Google's Feb-2024
// sender rules, third-party providers sending "from" such addresses are
// treated as spoofing — mail lands in spam or is silently dropped. Warn at
// send time so the fix (own domain + Brevo DKIM/SPF, or the Gmail SMTP path
// below) is discoverable.
let gmailSenderWarned = false;

/**
 * Gmail SMTP path (GMAIL_USER + GMAIL_APP_PASSWORD).
 *
 * The ONLY way to send authenticated mail from a @gmail.com address: instead
 * of a third-party provider spoofing "from: someone@gmail.com", the app logs
 * in to Google's own SMTP servers (smtp.gmail.com:465) with a Gmail App
 * Password. Google signs the message with proper SPF/DKIM — inbox delivery,
 * no domain needed. Limits: 500 emails/day (Google's app-password cap).
 *
 * Setup: Google Account → Security → 2-Step Verification ON, then
 * myaccount.google.com/apppasswords → create → paste the 16-char password
 * into GMAIL_APP_PASSWORD.
 */
async function sendViaGmailSmtp(
  subject: string,
  html: string,
  to: string
): Promise<{ success: true; id: string }> {
  const { createTransport } = await import('nodemailer');
  const transporter = createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, ''),
    },
  });
  try {
    const info = await transporter.sendMail({
      from: `RecruitAI <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return { success: true, id: String(info.messageId ?? 'unknown') };
  } finally {
    transporter.close();
  }
}

function gmailSmtpConfigured(): boolean {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

export async function sendTransactionalEmail(
  payload: EmailPayload,
  customHtmlBody?: string
): Promise<{ success: true; id: string }> {
  const fromEnv = (process.env.EMAIL_FROM || '').toLowerCase();
  if (!gmailSenderWarned && !gmailSmtpConfigured() && /@(gmail|googlemail)\.com["']?$/.test(fromEnv)) {
    gmailSenderWarned = true;
    console.warn(
      '[email] WARNING: EMAIL_FROM is a Gmail address sent through a third-party provider. ' +
        'Google treats this as spoofing — messages may land in spam or be silently rejected. ' +
        'Fix: set GMAIL_USER + GMAIL_APP_PASSWORD (authenticated Gmail SMTP, no domain needed) ' +
        'OR use a sender on a domain you own with Brevo DKIM/SPF authentication.'
    );
  }

  const subject = SUBJECT_MAP[payload.template](payload.data);
  const html = customHtmlBody
    ? `<div style="font-family: sans-serif; padding: 24px; color: #1e293b; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px;">
    <h2 style="color: #4f46e5;">RecruitAI</h2>
    ${customHtmlBody}
    <p style="margin-top: 24px; font-size: 12px; color: #64748b;">Powered by RecruitAI.</p>
  </div>`
    : renderEmailHtml(payload.template, payload.data);

  // Provider priority: authenticated Gmail SMTP beats Brevo/Resend when
  // configured — it is the only provider that produces properly signed mail
  // from a @gmail.com address (the common small-team setup).
  if (gmailSmtpConfigured()) {
    return sendViaGmailSmtp(subject, html, payload.to);
  }

  const brevoApiKey = process.env.BREVO_API_KEY;
  if (brevoApiKey) {
    const from = process.env.EMAIL_FROM;
    if (!from || !from.includes('@')) {
      throw new Error(
        'BREVO_API_KEY is set but EMAIL_FROM is missing/invalid. Set EMAIL_FROM to a sender ' +
          'address verified in your Brevo dashboard (Senders & IP).'
      );
    }
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': brevoApiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { email: from.replace(/.*<|>.*/g, '') || from, name: 'RecruitAI' },
        to: [{ email: payload.to }],
        subject,
        htmlContent: html,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        `Email delivery failed (Brevo HTTP ${res.status}): ${JSON.stringify(data)}` +
          providerFailureHint('Brevo', res.status, data)
      );
    }
    return { success: true, id: String(data.messageId ?? 'unknown') };
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new Error(
      'No email provider configured — set GMAIL_USER + GMAIL_APP_PASSWORD, BREVO_API_KEY, ' +
        'or RESEND_API_KEY. Email delivery is unavailable.'
    );
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'RecruitAI <notifications@recruitai.com>',
      to: payload.to,
      subject,
      html
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `Email delivery failed (Resend HTTP ${res.status}): ${JSON.stringify(data)}` +
        providerFailureHint('Resend', res.status, data)
    );
  }
  return { success: true, id: String(data.id ?? 'unknown') };
}

export interface RecordedEmailInput {
  to: string;
  template: EmailTemplateType;
  data: EmailPayload['data'];
  applicationId?: string;
  jobId?: string;
  senderId?: string;
}

export interface RecordedEmailResult {
  delivered: boolean;
  communicationId?: string;
  error?: string;
}

/**
 * Sends an email AND records the attempt in the Communication table with an
 * honest delivery state (SENT / FAILED) and failure information, so admins
 * can see and follow up on failed notifications (spec §6.9).
 *
 * `customHtmlBody` (optional) replaces the template-rendered body — used by
 * flows like password reset whose email content lives next to their token
 * logic (src/lib/passwordReset.ts).
 */
export async function sendRecordedEmail(
  input: RecordedEmailInput,
  customHtmlBody?: string
): Promise<RecordedEmailResult> {
  // The verification code exists ONLY inside the emailed message and as a
  // SHA-256 hash in the database — snapshotting it in plaintext here would
  // hand anyone with DB read access a live 2FA/activation code. Codes are
  // single-use and expire in 10 minutes, so a retry never re-sends one;
  // everything else in the payload stays snapshotted for faithful retries.
  const snapshotData: Record<string, unknown> = { ...(input.data as Record<string, unknown>) };
  if ('verificationCode' in snapshotData) snapshotData.verificationCode = '[REDACTED — single-use code]';

  const comm = await prisma.communication.create({
    data: {
      applicationId: input.applicationId,
      jobId: input.jobId,
      senderId: input.senderId,
      recipient: input.to,
      template: input.template,
      contentVersion: 'v1.0',
      deliveryState: 'PENDING',
      // §6.9: snapshot the exact template payload so a later safe retry can
      // re-render faithful content (schedule, meeting link, offer details…).
      payloadSnapshot: JSON.stringify(snapshotData)
    }
  });

  try {
    await sendTransactionalEmail(
      {
        to: input.to,
        template: input.template,
        data: input.data,
        applicationId: input.applicationId,
      },
      customHtmlBody
    );
    await prisma.communication.update({
      where: { id: comm.id },
      data: { deliveryState: 'SENT' }
    });
    return { delivered: true, communicationId: comm.id, error: undefined };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Email delivery FAILED (${input.template} to ${input.to}):`, message);
    await prisma.communication.update({
      where: { id: comm.id },
      data: { deliveryState: 'FAILED', failureInfo: message.slice(0, 2000) }
    });
    return { delivered: false, communicationId: comm.id, error: message };
  }
}
