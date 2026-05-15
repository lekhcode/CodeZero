-- AlterTable: full question detail fields for LeetCode sync
ALTER TABLE "problems" ADD COLUMN     "rawContent" TEXT,
ADD COLUMN     "parsedStatement" TEXT,
ADD COLUMN     "exampleTestcases" TEXT,
ADD COLUMN     "constraints" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "hints" TEXT[] DEFAULT ARRAY[]::TEXT[];
