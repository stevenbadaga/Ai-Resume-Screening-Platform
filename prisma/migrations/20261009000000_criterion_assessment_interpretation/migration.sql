-- Spec §6.5: each criterion result must show the interpretation alongside the
-- supporting evidence, source location, score contribution, and uncertainty.
ALTER TABLE "CriterionAssessment" ADD COLUMN "interpretation" TEXT;
