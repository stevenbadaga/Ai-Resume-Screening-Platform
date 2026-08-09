import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const file: File | null = data.get('resume') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
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

    // TODO: In a real environment, we would save to Prisma here:
    // 1. Create Application
    // 2. Create ResumeDocument with status QUEUED
    // 3. Trigger background worker

    // For now, we simulate success
    return NextResponse.json({ 
      success: true, 
      message: 'File uploaded successfully',
      fileReference: path 
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: 'Server error during upload' }, { status: 500 });
  }
}
