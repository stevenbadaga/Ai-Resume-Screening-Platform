import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { resumeQueue } from '@/lib/queue';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const file: File | null = data.get('resume') as unknown as File;
    const firstName = data.get('firstName') as string;
    const lastName = data.get('lastName') as string;
    const email = data.get('email') as string;
    const consent = data.get('consent') === 'on';

    if (!file || !firstName || !lastName || !email) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Week 3 Requirement: Secure validation
    if (file.type !== 'application/pdf' && file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return NextResponse.json({ success: false, error: 'Only PDF or DOCX files are allowed' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return NextResponse.json({ success: false, error: 'File size exceeds 5MB limit' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to local storage for dev (simulating S3)
    const uploadDir = process.env.STORAGE_LOCAL_PATH || './uploads';
    await mkdir(uploadDir, { recursive: true });
    
    // Create unique safe filename
    const safeFilename = `${uuidv4()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const path = join(uploadDir, safeFilename);
    
    await writeFile(path, buffer);

    // 1. Duplicate Review & Candidate Creation
    let candidate = await prisma.candidate.findUnique({ where: { email } });
    if (!candidate) {
      candidate = await prisma.candidate.create({
        data: { firstName, lastName, email, consentGiven: consent }
      });
    }

    // Fetch a generic job for now since the UI doesn't pass one
    // In production, the apply form would be scoped to a jobId.
    let defaultJob = await prisma.jobRequisition.findFirst();
    if (!defaultJob) {
      const org = await prisma.organization.create({ data: { name: 'Default Org' } });
      const user = await prisma.user.create({ data: { email: 'admin@example.com', organizationId: org.id } });
      defaultJob = await prisma.jobRequisition.create({
        data: { title: 'General Application', description: 'General', organizationId: org.id, ownerId: user.id }
      });
    }

    // 2. Create Application
    const application = await prisma.application.create({
      data: {
        candidateId: candidate.id,
        jobId: defaultJob.id,
        stage: 'NEW'
      }
    });

    // 3. Create ResumeDocument with status QUEUED
    const resumeDoc = await prisma.resumeDocument.create({
      data: {
        applicationId: application.id,
        fileReference: path,
        processingStatus: 'QUEUED'
      }
    });

    // 4. Trigger background processing asynchronously via BullMQ Message Queue
    await resumeQueue.add('process-resume', {
      applicationId: application.id,
      resumeDocumentId: resumeDoc.id,
      filePath: path
    });

    return NextResponse.json({ 
      success: true, 
      message: 'File uploaded successfully and processing started',
      applicationId: application.id 
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: 'Server error during upload' }, { status: 500 });
  }
}
