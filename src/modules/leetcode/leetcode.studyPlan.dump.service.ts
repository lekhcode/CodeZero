import { logger } from "../../config/logger.js";
import { env } from "../../config/env.js";
import {
  persistStudyPlanJson,
  syncStudyPlanFromEntries,
  type StudyPlanEntry,
} from "../plans/studyPlan.sync.service.js";
import { fetchNeetCode150Entries } from "./neetcode.client.js";
import type { NeetCode150DumpResult } from "./leetcode.types.js";
import type { DumpNeetCode150Body } from "./leetcode.dump.validation.js";

function toStudyPlanEntries(
  rows: Awaited<ReturnType<typeof fetchNeetCode150Entries>>,
): StudyPlanEntry[] {
  return rows.map((row) => ({
    order: row.order,
    slug: row.slug,
    title: row.title,
    difficulty: row.difficulty,
  }));
}

export async function dumpNeetCode150(body: DumpNeetCode150Body): Promise<NeetCode150DumpResult> {
  const started = Date.now();
  const delayMs = body.delayMs ?? env.LEETCODE_DUMP_DELAY_MS;

  const fetched = await fetchNeetCode150Entries();
  const entries = toStudyPlanEntries(fetched);

  let dataFilePath: string | undefined;
  if (body.persistToRepo) {
    dataFilePath = await persistStudyPlanJson("neetcode-150", entries);
    logger.info({ dataFilePath }, "neetcode-150 JSON persisted");
  }

  const sync = await syncStudyPlanFromEntries({
    templateSlug: "neetcode-150",
    entries,
    delayMs,
  });

  logger.info(
    {
      fetched: fetched.length,
      synced: sync.synced,
      stubbed: sync.stubbed,
      linked: sync.linked,
      failed: sync.failed,
    },
    "neetcode-150 dump complete",
  );

  return {
    source: "neetcode.io",
    fetched: fetched.length,
    ...(dataFilePath !== undefined ? { dataFilePath } : {}),
    sync,
    durationMs: Date.now() - started,
  };
}
