/*
  Upgrade `problems` for LeetCode POTD sync.
  Early-stage catalog: drop legacy rows/columns and recreate shape (no production data assumed).
*/

-- DropEnum only if exists after table migration
DROP TABLE IF EXISTS "problems";

CREATE TABLE "problems" (
    "id" UUID NOT NULL,
    "leetcodeId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "difficulty" "DifficultyLevel" NOT NULL,
    "topics" TEXT[],
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "problems_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "problems_leetcodeId_key" ON "problems"("leetcodeId");
CREATE UNIQUE INDEX "problems_slug_key" ON "problems"("slug");

DROP TYPE IF EXISTS "ProblemDifficulty";
