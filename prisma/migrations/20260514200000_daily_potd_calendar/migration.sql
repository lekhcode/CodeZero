-- CreateTable: one LeetCode POTD row per calendar date (no duplicate dates)
CREATE TABLE "daily_potd" (
    "id" UUID NOT NULL,
    "challengeDate" DATE NOT NULL,
    "problemId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_potd_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "daily_potd_challengeDate_key" ON "daily_potd"("challengeDate");

CREATE INDEX "daily_potd_problemId_idx" ON "daily_potd"("problemId");

ALTER TABLE "daily_potd" ADD CONSTRAINT "daily_potd_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
