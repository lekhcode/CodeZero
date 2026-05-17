/**
 * Backfill problems.examples from rawContent; optionally only study-plan slugs.
 * Usage:
 *   npm run refresh:examples
 *   npm run refresh:examples -- --plans blind-75,top-interview-150
 */
import "dotenv/config";
import { Prisma } from "@prisma/client";
import { prisma } from "../src/config/prisma.js";
import { examplesHaveOutput, extractExamplesFromHtml } from "../src/modules/leetcode/leetcode.parser.js";
import { getProblemBySlug } from "../src/modules/leetcode/leetcode.service.js";

const planArg = process.argv.find((a) => a.startsWith("--plans="));
const planSlugs = planArg ? planArg.replace("--plans=", "").split(",").map((s) => s.trim()) : null;

async function problemIdsForPlans(slugs: string[]): Promise<string[]> {
  const templates = await prisma.scheduleTemplate.findMany({
    where: { slug: { in: slugs } },
    select: { templateProblems: { select: { problemId: true } } },
  });
  const ids = new Set<string>();
  for (const t of templates) {
    for (const tp of t.templateProblems) ids.add(tp.problemId);
  }
  return [...ids];
}

async function main(): Promise<void> {
  let where: { rawContent?: { not: null }; id?: { in: string[] } } = { rawContent: { not: null } };
  if (planSlugs && planSlugs.length > 0) {
    const ids = await problemIdsForPlans(planSlugs);
    console.log("Targeting plans:", planSlugs.join(", "), "problems:", ids.length);
    where = { id: { in: ids } };
  }

  const rows = await prisma.problem.findMany({
    where,
    select: { id: true, slug: true, rawContent: true, examples: true },
  });

  let updated = 0;
  let skipped = 0;
  let synced = 0;

  for (const row of rows) {
    let rawContent = row.rawContent;

    if (rawContent === null || rawContent.trim() === "") {
      if (planSlugs) {
        try {
          await getProblemBySlug(row.slug);
          synced++;
          const refetch = await prisma.problem.findUnique({
            where: { id: row.id },
            select: { rawContent: true, examples: true },
          });
          rawContent = refetch?.rawContent ?? null;
          if (refetch?.examples && examplesHaveOutput(refetch.examples as { output: string }[])) {
            updated++;
            console.log(`synced+ok ${row.slug}`);
            continue;
          }
        } catch (e) {
          console.warn(`sync fail ${row.slug}`, e);
          skipped++;
          continue;
        }
      } else {
        skipped++;
        continue;
      }
    }

    if (rawContent === null) {
      skipped++;
      continue;
    }

    const fromHtml = extractExamplesFromHtml(rawContent);
    if (fromHtml.length === 0 || !examplesHaveOutput(fromHtml)) {
      skipped++;
      continue;
    }

    const existing = row.examples;
    if (Array.isArray(existing) && examplesHaveOutput(existing as { output: string }[])) {
      skipped++;
      continue;
    }

    await prisma.problem.update({
      where: { id: row.id },
      data: { examples: fromHtml as Prisma.InputJsonValue },
    });
    updated++;
    console.log(`updated ${row.slug} (${fromHtml.length} examples)`);
  }

  console.log(`Done. updated=${updated} synced=${synced} skipped=${skipped} total=${rows.length}`);
}

void main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
