-- Multi-difficulty schedule filters (e.g. Easy + Medium)
ALTER TABLE "user_schedules" ADD COLUMN "difficultyFilters" "DifficultyLevel"[] NOT NULL DEFAULT ARRAY[]::"DifficultyLevel"[];
