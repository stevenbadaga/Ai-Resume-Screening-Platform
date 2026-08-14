import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { resumeQueue } from '@/lib/queue';
import { logAuditEvent } from '@/lib/auditLogger';

import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const file: File | null = data.get('resume') as unknown as File;
    const firstName = data.get('firstName') as string;
    const lastName = data.get('lastName') as string;
    const email = data.get('email') as string;
    const jobId = data.get('jobId') as string;
    const consent = data.get('consent') === 'on';

    if (!file || !firstName || !lastName || !email || !jobId) {
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
    const existingCandidates = await prisma.candidate.findMany({ where: { email } });
    const isDuplicate = existingCandidates.length > 0;
    
    // Always create a new candidate record for the new application
    const candidate = await prisma.candidate.create({
      data: { 
        firstName, 
        lastName, 
        email, 
        consentGiven: consent,
        tags: isDuplicate ? ['POTENTIAL_DUPLICATE'] : []
      }
    });

    // Tag existing candidates as potential duplicates as well
    if (isDuplicate) {
      for (const existing of existingCandidates) {
        if (!existing.tags.includes('POTENTIAL_DUPLICATE')) {
          await prisma.candidate.update({
            where: { id: existing.id },
            data: { tags: { push: 'POTENTIAL_DUPLICATE' } }
          });
        }
      }
    }

    // 2. Malware Scanning Simulation (Week 3 Requirement)
    // In a real system, this would call an external AV scanner like ClamAV.
    const isMalware = file.name.toLowerCase().includes('malware') || file.name.toLowerCase().includes('virus');
    if (isMalware) {
      await logAuditEvent({
        action: 'MALWARE_DETECTED',
        actorId: 'SYSTEM_USER',
        affectedRecordId: candidate.id,
        newValues: { filename: file.name }
      });
      return NextResponse.json({ success: false, error: 'Upload rejected by security scanner. Malicious content detected.' }, { status: 403 });
    }

    // 3. Create Application
    const application = await prisma.application.create({
      data: {
        candidateId: candidate.id,
        jobId: jobId,
        stage: 'NEW'
      }
    });

    // 4. Create ResumeDocument with status QUEUED
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

    // 5. Audit Log
    await logAuditEvent({
      action: 'APPLICATION_SUBMITTED',
      actorId: 'SYSTEM_USER',
      affectedRecordId: application.id,
      newValues: { jobId: application.jobId, candidateId: application.candidateId }
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
