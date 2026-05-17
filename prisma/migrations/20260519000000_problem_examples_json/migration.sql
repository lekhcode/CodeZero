-- Persist structured problem examples (input/output/explanation) for reliable API/UI round-trips.
ALTER TABLE "problems" ADD COLUMN "examples" JSONB;
