-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('EMAIL', 'GOOGLE', 'GITHUB');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "name" TEXT,
ADD COLUMN "avatar" TEXT,
ADD COLUMN "provider" "AuthProvider" NOT NULL DEFAULT 'EMAIL',
ADD COLUMN "googleId" TEXT,
ADD COLUMN "githubId" TEXT;

ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
CREATE UNIQUE INDEX "users_githubId_key" ON "users"("githubId");
