-- Domain claiming (proof of company ownership for the workspace-founder
-- Admin bootstrap). A workspace's identity is its verified email domain;
-- the display name is cosmetic. Verification is a DNS TXT challenge:
-- the founder publishes a TXT record at _recruitai-challenge.<domain> with
-- a random token, then triggers a re-check. Additive and safe on a table
-- with existing rows.

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "verifiedEmailDomain" TEXT;
ALTER TABLE "Organization" ADD COLUMN "pendingEmailDomain" TEXT;
ALTER TABLE "Organization" ADD COLUMN "domainClaimToken" TEXT;
ALTER TABLE "Organization" ADD COLUMN "domainClaimVerifiedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_verifiedEmailDomain_key" ON "Organization"("verifiedEmailDomain");
