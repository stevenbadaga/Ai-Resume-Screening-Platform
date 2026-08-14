import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/auditLogger';

export async function sendMockEmail(to: string, template: string, context: any, relatedApplicationId?: string) {
  const content = generateEmailContent(template, context);
  
  // Simulate sending delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log(`[MOCK EMAIL SENT to ${to}]`);
  console.log(`Subject: ${content.subject}`);
  console.log(`Body: ${content.body}`);

  // Create communication record in database (Week 6 requirement)
  const comm = await prisma.communication.create({
    data: {
      template,

      recipient: to,
      contentVersion: 'v1.0',
      deliveryState: 'DELIVERED',
      applicationId: relatedApplicationId,
    }
  });

  await logAuditEvent({
    action: 'COMMUNICATION_SENT',
    actorId: 'SYSTEM_USER',
    affectedRecordId: comm.id,
    newValues: { template, to }
  });

  return comm;
}

function generateEmailContent(template: string, context: any) {
  switch (template) {
    case 'INTERVIEW_INVITATION':
      return {
        subject: `Interview Invitation for ${context.jobTitle}`,
        body: `Hello ${context.candidateName},\n\nYou have been invited to an interview for the position of ${context.jobTitle}.\n\nTime: ${context.schedule} (${context.timezone})\nDetails: ${context.details}\n\nWe look forward to speaking with you!`
      };
    case 'TEAM_INVITATION':
      return {
        subject: `Invitation to join ${context.inviterName}'s team`,
        body: `Hello,

You have been invited to join the organization as a ${context.role}.
Click here to join: ${context.joinLink}`
      };
    case 'REJECTION':
      return {
        subject: `Update on your application for ${context.jobTitle}`,
        body: `Hello ${context.candidateName},\n\nThank you for applying to the ${context.jobTitle} position. After careful review, we have decided not to move forward with your application at this time.\n\nWe wish you the best in your job search.`
      };
    default:
      return {
        subject: 'Notification from Codafriqa',
        body: 'You have a new message.'
      };
  }
}

