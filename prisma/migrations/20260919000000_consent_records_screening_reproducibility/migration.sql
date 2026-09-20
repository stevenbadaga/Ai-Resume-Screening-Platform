-- Spec §6.11: the privacy-notice version accepted, the timestamp of acceptance,
-- and any granular consent choices must be recorded with the candidate record.
ALTER TABLE "Candidate" ADD COLUMN "consentNoticeVersion" TEXT;
ALTER TABLE "Candidate" ADD COLUMN "consentGivenAt" TIMESTAMP(3);
ALTER TABLE "Candidate" ADD COLUMN "consentChoices" TEXT;

-- Spec §6.5/§7: a screening run must record the rubric version, resume version,
-- and full configuration snapshot so results are reproducible and auditable.
ALTER TABLE "ScreeningRun" ADD COLUMN "rubricVersion" INTEGER;
ALTER TABLE "ScreeningRun" ADD COLUMN "resumeVersion" INTEGER;
