-- Email verification (spec §6.1: only valid, deliverable email addresses may
-- sign up or log in). Two additive changes, safe on a database with rows.
--
-- 1. `User.emailVerifiedAt` — NULL means the address is not yet proven. New
--    signups must click the emailed verification link before they can log in.
--
-- 2. `EmailVerificationToken` — single-use, hashed, time-limited tokens (same
--    threat model as PasswordResetToken).
--
-- Grandfathering: existing accounts get emailVerifiedAt = createdAt so a
-- policy introduced after registration never locks anyone out. Invited staff
-- (created by an Admin before ever logging in) are covered by the same update.

-- AlterTable
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

-- Grandfather existing accounts
UPDATE "User" SET "emailVerifiedAt" = "createdAt" WHERE "emailVerifiedAt" IS NULL;

-- CreateTable
CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId");

-- AddForeignKey
ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
