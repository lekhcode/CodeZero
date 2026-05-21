-- Replace onboardingCompletedAt with firstTimeLogin (simpler first-run flag)
ALTER TABLE "users" ADD COLUMN "firstTimeLogin" BOOLEAN NOT NULL DEFAULT true;

-- Existing accounts: do not show walkthrough again
UPDATE "users" SET "firstTimeLogin" = false;

ALTER TABLE "users" DROP COLUMN IF EXISTS "onboardingCompletedAt";
