import { ApiError } from "../../utils/ApiError.js";
import type { DifficultyLevel } from "@prisma/client";

const NEETCODE_PRACTICE_URL = "https://neetcode.io/practice";
const FETCH_TIMEOUT_MS = 20_000;

export type NeetCode150Entry = {
  order: number;
  slug: string;
  title: string;
  pattern: string;
  difficulty: DifficultyLevel;
};

const DIFFICULTY_MAP: Record<string, DifficultyLevel> = {
  Easy: "EASY",
  Medium: "MEDIUM",
  Hard: "HARD",
};

function mapDifficulty(raw: string | undefined): DifficultyLevel {
  const mapped = raw === undefined ? undefined : DIFFICULTY_MAP[raw];
  if (mapped === undefined) {
    throw new ApiError(502, `Unknown NeetCode difficulty: ${raw ?? "(missing)"}`, {
      code: "NEETCODE_PARSE_ERROR",
    });
  }
  return mapped;
}

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "CodeZero/1.0 (+https://github.com)" },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new ApiError(502, `NeetCode returned HTTP ${response.status}`, {
        code: "NEETCODE_UPSTREAM_ERROR",
      });
    }
    return await response.text();
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError(504, "NeetCode request timed out", { code: "NEETCODE_TIMEOUT" });
    }
    throw new ApiError(502, "Failed to fetch from NeetCode", {
      code: "NEETCODE_UPSTREAM_ERROR",
      cause: err,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function resolveMainBundleUrl(practiceHtml: string): string {
  const match = practiceHtml.match(/src="(\/?main\.[a-f0-9]+\.js)"/);
  if (match?.[1] === undefined) {
    throw new ApiError(502, "Could not locate NeetCode main bundle URL", {
      code: "NEETCODE_PARSE_ERROR",
    });
  }
  const path = match[1].startsWith("/") ? match[1] : `/${match[1]}`;
  return `https://neetcode.io${path}`;
}

/**
 * Parses the NeetCode 150 list from neetcode.io's practice page bundle.
 * Source: objects in main.*.js with `neetcode150:!0`.
 */
export async function fetchNeetCode150Entries(): Promise<NeetCode150Entry[]> {
  const practiceHtml = await fetchText(NEETCODE_PRACTICE_URL);
  const bundleUrl = resolveMainBundleUrl(practiceHtml);
  const bundleJs = await fetchText(bundleUrl);

  const re =
    /\{problem:"([^"]+)",pattern:"([^"]+)",link:"([^"]+)"[^}]*neetcode150:!0[^}]*\}/g;

  const entries: NeetCode150Entry[] = [];
  let match: RegExpExecArray | null;
  let order = 0;

  while ((match = re.exec(bundleJs)) !== null) {
    const title = match[1];
    const pattern = match[2];
    const link = match[3];
    if (title === undefined || pattern === undefined || link === undefined) {
      continue;
    }
    order += 1;
    const block = match[0];
    const diffMatch = block.match(/difficulty:"([^"]+)"/);
    const slug = link.replace(/\/$/, "");
    entries.push({
      order,
      slug,
      title,
      pattern,
      difficulty: mapDifficulty(diffMatch?.[1]),
    });
  }

  if (entries.length !== 150) {
    throw new ApiError(502, `Expected 150 NeetCode problems, parsed ${entries.length}`, {
      code: "NEETCODE_PARSE_ERROR",
    });
  }

  const slugs = new Set(entries.map((e) => e.slug));
  if (slugs.size !== entries.length) {
    throw new ApiError(502, "NeetCode 150 list contains duplicate slugs", {
      code: "NEETCODE_PARSE_ERROR",
    });
  }

  return entries;
}
