import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { DifficultyLevel } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { getProblemBySlug } from "../leetcode/leetcode.service.js";

export type StudyPlanEntry = {
  order: number;
  slug: string;
  title: string;
  leetcodeId?: number;
  difficulty?: DifficultyLevel;
  isPremium?: boolean;
};

export type StudyPlanSyncResult = {
  templateSlug: string;
  total: number;
  synced: number;
  stubbed: number;
  linked: number;
  failed: number;
  failures: Array<{ order: number; slug: string; reason: string }>;
  durationMs: number;
};

export const STUDY_PLAN_DATA_FILES: Record<string, { dataFile: string; expectedCount: number }> = {
  "blind-75": { dataFile: "blind-75.json", expectedCount: 75 },
  "top-interview-150": { dataFile: "top-interview-150.json", expectedCount: 150 },
  "neetcode-150": { dataFile: "neetcode-150.json", expectedCount: 150 },
};

const DATA_DIR = join(process.cwd(), "prisma", "data");

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

function failureReason(err: unknown): string {
  if (err instanceof ApiError) {
    return `${err.code ?? "ERROR"}: ${err.message}`;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "Unknown error";
}

export async function persistStudyPlanJson(
  templateSlug: string,
  entries: StudyPlanEntry[],
): Promise<string> {
  const plan = STUDY_PLAN_DATA_FILES[templateSlug];
  if (plan === undefined) {
    throw new Error(`No data file configured for plan "${templateSlug}"`);
  }
  const path = join(DATA_DIR, plan.dataFile);
  await writeFile(path, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
  return path;
}

export async function syncStudyPlanFromEntries(params: {
  templateSlug: string;
  entries: StudyPlanEntry[];
  delayMs: number;
}): Promise<StudyPlanSyncResult> {
  const started = Date.now();
  const { templateSlug, entries, delayMs } = params;

  const template = await prisma.scheduleTemplate.findUnique({
    where: { slug: templateSlug },
  });
  if (template === null) {
    throw ApiError.notFound(`Schedule template "${templateSlug}" not found. Run db:seed first.`);
  }

  const total = entries.length;
  let synced = 0;
  let stubbed = 0;
  let linked = 0;
  let failed = 0;
  const failures: StudyPlanSyncResult["failures"] = [];

  for (const entry of entries) {
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
    } catch (err) {
      const canStub =
        err instanceof ApiError &&
        err.code === "LEETCODE_NOT_FOUND" &&
        entry.leetcodeId !== undefined;

      if (canStub) {
        try {
          await linkFromMetadata(template.id, entry);
          stubbed += 1;
          linked += 1;
        } catch (stubErr) {
          failed += 1;
          failures.push({
            order: entry.order,
            slug: entry.slug,
            reason: failureReason(stubErr),
          });
        }
      } else {
        failed += 1;
        failures.push({
          order: entry.order,
          slug: entry.slug,
          reason: failureReason(err),
        });
      }
    }

    if (delayMs > 0) {
      await sleep(delayMs);
    }
  }

  return {
    templateSlug,
    total,
    synced,
    stubbed,
    linked,
    failed,
    failures,
    durationMs: Date.now() - started,
  };
}

export async function loadStudyPlanEntriesFromFile(templateSlug: string): Promise<StudyPlanEntry[]> {
  const plan = STUDY_PLAN_DATA_FILES[templateSlug];
  if (plan === undefined) {
    throw new Error(
      `Unknown plan "${templateSlug}". Supported: ${Object.keys(STUDY_PLAN_DATA_FILES).join(", ")}`,
    );
  }

  const dataPath = join(DATA_DIR, plan.dataFile);
  const raw = await readFile(dataPath, "utf8");
  const entries = JSON.parse(raw) as StudyPlanEntry[];

  if (entries.length !== plan.expectedCount) {
    console.warn(`Expected ${plan.expectedCount} entries for ${templateSlug}, found ${entries.length}`);
  }

  return entries;
}

export async function syncStudyPlan(
  templateSlug: string,
  options?: { delayMs?: number },
): Promise<StudyPlanSyncResult> {
  const delayMs = options?.delayMs ?? Number(process.env["SYNC_DELAY_MS"] ?? 350);
  const entries = await loadStudyPlanEntriesFromFile(templateSlug);
  return syncStudyPlanFromEntries({ templateSlug, entries, delayMs });
}
