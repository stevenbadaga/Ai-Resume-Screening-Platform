-- Spec §6.2: job requisitions carry an application window (open/close dates).
ALTER TABLE "JobRequisition" ADD COLUMN "opensAt" TIMESTAMP(3);
ALTER TABLE "JobRequisition" ADD COLUMN "closesAt" TIMESTAMP(3);
