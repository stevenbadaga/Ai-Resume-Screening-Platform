-- Spec §6.9: store the template payload at send time so failed deliveries
-- can be retried with faithful (not generic) content.
ALTER TABLE "Communication" ADD COLUMN "payloadSnapshot" TEXT;
