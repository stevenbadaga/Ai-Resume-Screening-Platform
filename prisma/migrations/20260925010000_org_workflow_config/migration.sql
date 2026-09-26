-- Spec §6.12: workspace-level recruitment workflow configuration
-- (decision reasons, stages, job categories) on Organization.
ALTER TABLE "Organization" ADD COLUMN "workflowConfig" TEXT;
