-- AlterTable: honest email delivery tracking (spec §6.9).
-- Additive and nullable — safe on a table with existing rows.
ALTER TABLE "Communication" ADD COLUMN "failureInfo" TEXT;
ALTER TABLE "Communication" ADD COLUMN "lastError" TEXT;
