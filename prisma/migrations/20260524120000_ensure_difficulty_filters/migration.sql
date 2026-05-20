-- Idempotent fix: production DBs that missed 20260520130000_user_schedule_difficulty_filters
ALTER TABLE "user_schedules"
ADD COLUMN IF NOT EXISTS "difficultyFilters" "DifficultyLevel"[] NOT NULL DEFAULT ARRAY[]::"DifficultyLevel"[];
