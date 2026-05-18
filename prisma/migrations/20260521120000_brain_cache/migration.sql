-- Brain Cache: revision playlists and tasks (independent from assignments).

CREATE TYPE "BrainCacheRevisionStatus" AS ENUM ('PENDING', 'DUE', 'OVERDUE', 'COMPLETED', 'SKIPPED');

CREATE TABLE "brain_cache_playlists" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "revisionIntervalDays" INTEGER NOT NULL DEFAULT 7,
    "customRevisionDates" JSONB,
    "notifyEmail" BOOLEAN NOT NULL DEFAULT false,
    "notifyWhatsapp" BOOLEAN NOT NULL DEFAULT false,
    "notifyInApp" BOOLEAN NOT NULL DEFAULT true,
    "notifyPush" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brain_cache_playlists_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "brain_cache_playlist_problems" (
    "id" UUID NOT NULL,
    "playlistId" UUID NOT NULL,
    "problemId" UUID NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brain_cache_playlist_problems_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "brain_cache_revision_tasks" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "playlistId" UUID NOT NULL,
    "playlistProblemId" UUID NOT NULL,
    "problemId" UUID NOT NULL,
    "dueDate" DATE NOT NULL,
    "completedAt" TIMESTAMP(3),
    "status" "BrainCacheRevisionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brain_cache_revision_tasks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "brain_cache_playlist_problems_playlistId_problemId_key" ON "brain_cache_playlist_problems"("playlistId", "problemId");
CREATE INDEX "brain_cache_playlist_problems_playlistId_idx" ON "brain_cache_playlist_problems"("playlistId");
CREATE INDEX "brain_cache_playlist_problems_problemId_idx" ON "brain_cache_playlist_problems"("problemId");

CREATE UNIQUE INDEX "brain_cache_revision_tasks_playlistProblemId_dueDate_key" ON "brain_cache_revision_tasks"("playlistProblemId", "dueDate");
CREATE INDEX "brain_cache_revision_tasks_userId_idx" ON "brain_cache_revision_tasks"("userId");
CREATE INDEX "brain_cache_revision_tasks_userId_dueDate_idx" ON "brain_cache_revision_tasks"("userId", "dueDate");
CREATE INDEX "brain_cache_revision_tasks_userId_status_idx" ON "brain_cache_revision_tasks"("userId", "status");
CREATE INDEX "brain_cache_revision_tasks_playlistId_idx" ON "brain_cache_revision_tasks"("playlistId");
CREATE INDEX "brain_cache_revision_tasks_dueDate_idx" ON "brain_cache_revision_tasks"("dueDate");
CREATE INDEX "brain_cache_revision_tasks_status_idx" ON "brain_cache_revision_tasks"("status");

CREATE INDEX "brain_cache_playlists_userId_idx" ON "brain_cache_playlists"("userId");

ALTER TABLE "brain_cache_playlists" ADD CONSTRAINT "brain_cache_playlists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "brain_cache_playlist_problems" ADD CONSTRAINT "brain_cache_playlist_problems_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "brain_cache_playlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "brain_cache_playlist_problems" ADD CONSTRAINT "brain_cache_playlist_problems_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "brain_cache_revision_tasks" ADD CONSTRAINT "brain_cache_revision_tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "brain_cache_revision_tasks" ADD CONSTRAINT "brain_cache_revision_tasks_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "brain_cache_playlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "brain_cache_revision_tasks" ADD CONSTRAINT "brain_cache_revision_tasks_playlistProblemId_fkey" FOREIGN KEY ("playlistProblemId") REFERENCES "brain_cache_playlist_problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "brain_cache_revision_tasks" ADD CONSTRAINT "brain_cache_revision_tasks_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
