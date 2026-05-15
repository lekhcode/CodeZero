/**
 * Sync a study plan's problem list from LeetCode into `problems` + `template_problems`.
 *
 * Usage: tsx scripts/sync-study-plan.ts <template-slug>
 *   npm run sync:blind-75
 *   npm run sync:top-interview-150
 *
 * Optional: SYNC_DELAY_MS=400 (default 350) between LeetCode requests.
 */
import "dotenv/config";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { DifficultyLevel } from "@prisma/client";
import { prisma } from "../src/config/prisma.js";
import { getProblemBySlug } from "../src/modules/leetcode/leetcode.service.js";
import { ApiError } from "../src/utils/ApiError.js";

type StudyPlanEntry = {
  order: number;
  slug: string;
  title: string;
  leetcodeId?: number;
  difficulty?: DifficultyLevel;
  isPremium?: boolean;
};

const PLANS: Record<string, { dataFile: string; expectedCount: number }> = {
  "blind-75": { dataFile: "blind-75.json", expectedCount: 75 },
  "top-interview-150": { dataFile: "top-interview-150.json", expectedCount: 150 },
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "prisma", "data");

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function linkToTemplate(
  templateId: string,
  problemId: string,
  order: number,
): Promise<void> {
  await prisma.templateProblem.upsert({
    where: {
      templateId_problemId: {
        templateId,
        problemId,
      },
    },
    create: {
      templateId,
      problemId,
      order,
    },
    update: { order },
  });
}

async function linkFromMetadata(
  templateId: string,
  entry: StudyPlanEntry,
): Promise<string> {
  if (entry.leetcodeId === undefined || entry.difficulty === undefined) {
    throw new Error(`Missing leetcodeId/difficulty for metadata fallback: ${entry.slug}`);
  }

  const problem = await prisma.problem.upsert({
    where: { leetcodeId: entry.leetcodeId },
    create: {
      leetcodeId: entry.leetcodeId,
      title: entry.title,
      slug: entry.slug,
      difficulty: entry.difficulty,
      topics: [],
      isPremium: entry.isPremium ?? true,
    },
    update: {
      title: entry.title,
      slug: entry.slug,
      difficulty: entry.difficulty,
      isPremium: entry.isPremium ?? true,
    },
  });

  await linkToTemplate(templateId, problem.id, entry.order);
  return problem.slug;
}

export async function syncStudyPlan(templateSlug: string): Promise<void> {
  const plan = PLANS[templateSlug];
  if (plan === undefined) {
    throw new Error(
      `Unknown plan "${templateSlug}". Supported: ${Object.keys(PLANS).join(", ")}`,
    );
  }

  const delayMs = Number(process.env["SYNC_DELAY_MS"] ?? 350);
  const dataPath = join(DATA_DIR, plan.dataFile);
  const raw = await readFile(dataPath, "utf8");
  const entries = JSON.parse(raw) as StudyPlanEntry[];

  if (entries.length !== plan.expectedCount) {
    console.warn(`Expected ${plan.expectedCount} entries, found ${entries.length}`);
  }

  const template = await prisma.scheduleTemplate.findUnique({
    where: { slug: templateSlug },
  });
  if (template === null) {
    throw new Error(`Schedule template "${templateSlug}" not found. Run: npm run db:seed`);
  }

  const total = entries.length;
  let synced = 0;
  let stubbed = 0;
  let linked = 0;
  let failed = 0;

  for (const entry of entries) {
    const label = `[${entry.order}/${total}]`;
    try {
      await getProblemBySlug(entry.slug);
      synced += 1;

      const problem = await prisma.problem.findUnique({
        where: { slug: entry.slug },
        select: { id: true },
      });
      if (problem === null) {
        throw new Error(`Problem row missing after sync: ${entry.slug}`);
      }

      await linkToTemplate(template.id, problem.id, entry.order);
      linked += 1;

      console.log(`${label} OK ${entry.slug}`);
    } catch (err) {
      const canStub =
        err instanceof ApiError &&
        err.code === "LEETCODE_NOT_FOUND" &&
        entry.leetcodeId !== undefined;

      if (canStub) {
        try {
          const slug = await linkFromMetadata(template.id, entry);
          stubbed += 1;
          linked += 1;
          console.log(`${label} STUB ${slug} (premium / no public API)`);
        } catch (stubErr) {
          failed += 1;
          console.error(`${label} FAIL ${entry.slug}`, stubErr);
        }
      } else {
        failed += 1;
        console.error(`${label} FAIL ${entry.slug}`, err);
      }
    }

    await sleep(delayMs);
  }

  console.log(
    `Done (${templateSlug}). synced=${synced} stubbed=${stubbed} linked=${linked} failed=${failed}`,
  );
}

async function main(): Promise<void> {
  const templateSlug = process.argv[2];
  if (templateSlug === undefined || templateSlug.length === 0) {
    throw new Error("Usage: tsx scripts/sync-study-plan.ts <template-slug>");
  }
  await syncStudyPlan(templateSlug);
}

void main()
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
