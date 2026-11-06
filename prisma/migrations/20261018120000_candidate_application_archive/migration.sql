-- Spec §6.3: archive action for candidate and application records.
-- Archived records remain in the database for audit/preferences history but
-- leave the active pipeline and dashboard surfaces until a recruiter restores
-- them. The column is nullable: NULL = active (default for existing rows).
ALTER TABLE "Candidate"   ADD COLUMN "archivedAt" TIMESTAMP(3);
ALTER TABLE "Application" ADD COLUMN "archivedAt" TIMESTAMP(3);
