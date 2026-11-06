-- Candidate self-service profile: skills/experience (JSON strings) plus the
-- candidate's saved default CV, which powers one-click applications.
-- Idempotent (IF NOT EXISTS) because the dev database was synced with
-- `prisma db push` before this migration was recorded.
ALTER TABLE "Candidate" ADD COLUMN IF NOT EXISTS "skills" TEXT;
ALTER TABLE "Candidate" ADD COLUMN IF NOT EXISTS "experience" TEXT;
ALTER TABLE "Candidate" ADD COLUMN IF NOT EXISTS "profileResumeRef" TEXT;
ALTER TABLE "Candidate" ADD COLUMN IF NOT EXISTS "profileResumeName" TEXT;
ALTER TABLE "Candidate" ADD COLUMN IF NOT EXISTS "profileResumeSize" INTEGER;
ALTER TABLE "Candidate" ADD COLUMN IF NOT EXISTS "profileResumeUploadedAt" TIMESTAMP(3);
