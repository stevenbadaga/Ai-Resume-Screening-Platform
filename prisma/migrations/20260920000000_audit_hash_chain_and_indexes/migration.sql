-- Tamper-evident audit hash chain (spec §6.1) + performance indexes (spec §9).

-- Audit chain columns: `hash` commits to the event content plus the previous
-- event's hash. Existing rows keep NULL (grandfathered; the verifier reports
-- them as informational, not tampering).
ALTER TABLE "AuditEvent" ADD COLUMN "previousHash" TEXT;
ALTER TABLE "AuditEvent" ADD COLUMN "hash" TEXT;

-- Performance indexes for the hot query paths.
CREATE INDEX "AuditEvent_organizationId_timestamp_idx" ON "AuditEvent"("organizationId", "timestamp");
CREATE INDEX "AuditEvent_action_idx" ON "AuditEvent"("action");

CREATE INDEX "JobRequisition_organizationId_status_idx" ON "JobRequisition"("organizationId", "status");

CREATE INDEX "Candidate_email_idx" ON "Candidate"("email");

CREATE INDEX "Application_jobId_idx" ON "Application"("jobId");
CREATE INDEX "Application_candidateId_idx" ON "Application"("candidateId");
CREATE INDEX "Application_stage_idx" ON "Application"("stage");

CREATE INDEX "ResumeDocument_processingStatus_idx" ON "ResumeDocument"("processingStatus");

CREATE INDEX "ScreeningRun_applicationId_idx" ON "ScreeningRun"("applicationId");
CREATE INDEX "CriterionAssessment_screeningRunId_idx" ON "CriterionAssessment"("screeningRunId");

CREATE INDEX "Interview_applicationId_idx" ON "Interview"("applicationId");

CREATE INDEX "Communication_deliveryState_idx" ON "Communication"("deliveryState");
CREATE INDEX "Communication_applicationId_idx" ON "Communication"("applicationId");
