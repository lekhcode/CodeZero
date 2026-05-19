import { DifficultyLevel, type Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import type { ListProblemsQuery } from "./leetcode.catalog.validation.js";
import {
  expandTokenVariants,
  matchesFlexibleProblemSearch,
  scoreFlexibleProblemSearch,
  tokenizeSearchQuery,
} from "./problemSearch.utils.js";

export type ProblemCatalogItem = {
  id: string;
  leetcodeId: number;
  title: string;
  slug: string;
  difficulty: DifficultyLevel;
  topics: string[];
  isPremium: boolean;
  hasDetail: boolean;
  solved: boolean;
};

export type ProblemCatalogPage = {
  items: ProblemCatalogItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  /** Problems matching current filters that the user has solved (when authenticated). */
  solvedCount?: number;
};

function buildWhere(query: ListProblemsQuery): Prisma.ProblemWhereInput {
  const and: Prisma.ProblemWhereInput[] = [];

  if (!query.includePremium) {
    and.push({ isPremium: false });
  }

  if (query.difficulty !== undefined && query.difficulty.length > 0) {
    and.push({ difficulty: { in: query.difficulty } });
  }

  if (query.topics !== undefined && query.topics.length > 0) {
    and.push({ topics: { hasEvery: query.topics } });
  }

  return and.length > 0 ? { AND: and } : {};
}

/** Broad DB pre-filter so flexible in-memory match has a candidate set. */
function buildSearchPrefetchWhere(
  baseWhere: Prisma.ProblemWhereInput,
  search: string,
): Prisma.ProblemWhereInput {
  const tokens = tokenizeSearchQuery(search);
  const or: Prisma.ProblemWhereInput[] = [
    { title: { contains: search.trim(), mode: "insensitive" } },
    { slug: { contains: search.trim(), mode: "insensitive" } },
  ];

  for (const token of tokens) {
    for (const variant of expandTokenVariants(token)) {
      if (variant.length >= 1) {
        or.push({ title: { contains: variant, mode: "insensitive" } });
        or.push({ slug: { contains: variant, mode: "insensitive" } });
      }
      const asNum = Number(variant);
      if (Number.isInteger(asNum) && asNum > 0) {
        or.push({ leetcodeId: asNum });
      }
    }
  }

  const compact = search.replace(/\s+/g, "");
  if (compact.length >= 2 && compact !== search.trim()) {
    or.push({ title: { contains: compact, mode: "insensitive" } });
    or.push({ slug: { contains: compact.replace(/\s+/g, "-"), mode: "insensitive" } });
  }

  return { AND: [baseWhere, { OR: or }] };
}

type ProblemSearchRow = {
  id: string;
  leetcodeId: number;
  title: string;
  slug: string;
};

async function listProblemCatalogWithFlexibleSearch(
  query: ListProblemsQuery,
  baseWhere: Prisma.ProblemWhereInput,
  userId?: string,
): Promise<ProblemCatalogPage> {
  const search = query.search!.trim();
  const prefetchWhere = buildSearchPrefetchWhere(baseWhere, search);

  const candidates = await prisma.problem.findMany({
    where: prefetchWhere,
    select: {
      id: true,
      leetcodeId: true,
      title: true,
      slug: true,
    },
    orderBy: { leetcodeId: "asc" },
  });

  const matched = (candidates as ProblemSearchRow[])
    .filter((row) => matchesFlexibleProblemSearch(row.title, row.slug, row.leetcodeId, search))
    .sort((a, b) => {
      const diff =
        scoreFlexibleProblemSearch(b.title, b.slug, b.leetcodeId, search) -
        scoreFlexibleProblemSearch(a.title, a.slug, a.leetcodeId, search);
      if (diff !== 0) return diff;
      return a.leetcodeId - b.leetcodeId;
    });

  const total = matched.length;
  const skip = (query.page - 1) * query.limit;
  const pageIds = matched.slice(skip, skip + query.limit).map((r) => r.id);

  if (pageIds.length === 0) {
    return {
      items: [],
      page: query.page,
      limit: query.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
    };
  }

  const rows = await prisma.problem.findMany({
    where: { id: { in: pageIds } },
    select: problemCatalogSelect,
  });

  const byId = new Map(rows.map((row) => [row.id, row]));
  const baseItems = mapRowsToCatalogItems(
    pageIds
      .map((id) => byId.get(id))
      .filter((row): row is NonNullable<typeof row> => row !== undefined),
  );

  const searchWhere: Prisma.ProblemWhereInput = {
    AND: [baseWhere, { id: { in: matched.map((r) => r.id) } }],
  };
  const enriched = await enrichCatalogPage(userId, searchWhere, baseItems);

  return {
    items: enriched.items,
    page: query.page,
    limit: query.limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
    ...(enriched.solvedCount !== undefined ? { solvedCount: enriched.solvedCount } : {}),
  };
}

const problemCatalogSelect = {
  id: true,
  leetcodeId: true,
  title: true,
  slug: true,
  difficulty: true,
  topics: true,
  isPremium: true,
  parsedStatement: true,
  examples: true,
} as const;

function mapRowToCatalogItem(
  row: {
    id: string;
    leetcodeId: number;
    title: string;
    slug: string;
    difficulty: DifficultyLevel;
    topics: string[];
    isPremium: boolean;
    parsedStatement: string | null;
    examples: unknown;
  },
  solved: boolean,
): ProblemCatalogItem {
  return {
    id: row.id,
    leetcodeId: row.leetcodeId,
    title: row.title,
    slug: row.slug,
    difficulty: row.difficulty,
    topics: row.topics,
    isPremium: row.isPremium,
    hasDetail:
      row.parsedStatement !== null &&
      row.parsedStatement.trim().length > 0 &&
      row.examples !== null,
    solved,
  };
}

async function enrichCatalogPage(
  userId: string | undefined,
  where: Prisma.ProblemWhereInput,
  items: ProblemCatalogItem[],
): Promise<{ items: ProblemCatalogItem[]; solvedCount?: number }> {
  if (userId === undefined) {
    return { items };
  }

  const problemIds = items.map((item) => item.id);
  const [solvedCount, solves] = await Promise.all([
    prisma.problem.count({
      where: { ...where, userSolves: { some: { userId } } },
    }),
    problemIds.length > 0
      ? prisma.userProblemSolve.findMany({
          where: { userId, problemId: { in: problemIds } },
          select: { problemId: true },
        })
      : Promise.resolve([]),
  ]);

  const solvedIds = new Set(solves.map((row) => row.problemId));
  return {
    solvedCount,
    items: items.map((item) => ({ ...item, solved: solvedIds.has(item.id) })),
  };
}

function mapRowsToCatalogItems(
  rows: Array<{
    id: string;
    leetcodeId: number;
    title: string;
    slug: string;
    difficulty: DifficultyLevel;
    topics: string[];
    isPremium: boolean;
    parsedStatement: string | null;
    examples: unknown;
  }>,
): ProblemCatalogItem[] {
  return rows.map((row) => mapRowToCatalogItem(row, false));
}

function shuffleInPlace<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = array[i];
    array[i] = array[j]!;
    array[j] = tmp!;
  }
}

/** Random sample of `limit` problems matching filters (dashboard preview). */
async function listShuffledProblemCatalog(
  where: Prisma.ProblemWhereInput,
  limit: number,
  userId?: string,
): Promise<ProblemCatalogPage> {
  const [total, idRows] = await Promise.all([
    prisma.problem.count({ where }),
    prisma.problem.findMany({
      where,
      select: { id: true },
    }),
  ]);

  if (total === 0 || idRows.length === 0) {
    return { items: [], page: 1, limit, total: 0, totalPages: 0 };
  }

  shuffleInPlace(idRows);
  const pickedIds = idRows.slice(0, limit).map((r) => r.id);

  const rows = await prisma.problem.findMany({
    where: { id: { in: pickedIds } },
    select: problemCatalogSelect,
  });

  const byId = new Map(rows.map((row) => [row.id, row]));
  const baseItems = mapRowsToCatalogItems(
    pickedIds
      .map((id) => byId.get(id))
      .filter((row): row is NonNullable<typeof row> => row !== undefined),
  );
  const enriched = await enrichCatalogPage(userId, where, baseItems);

  return {
    items: enriched.items,
    page: 1,
    limit,
    total,
    totalPages: 1,
    ...(enriched.solvedCount !== undefined ? { solvedCount: enriched.solvedCount } : {}),
  };
}

export async function listProblemCatalog(
  query: ListProblemsQuery,
  userId?: string,
): Promise<ProblemCatalogPage> {
  const where = buildWhere(query);
  const hasSearch = query.search !== undefined && query.search.trim().length > 0;

  if (hasSearch && !query.shuffle) {
    return listProblemCatalogWithFlexibleSearch(query, where, userId);
  }

  if (query.shuffle) {
    if (query.page > 1) {
      const total = await prisma.problem.count({ where });
      return {
        items: [],
        page: query.page,
        limit: query.limit,
        total,
        totalPages: 1,
      };
    }
    return listShuffledProblemCatalog(where, query.limit, userId);
  }

  const skip = (query.page - 1) * query.limit;

  const [rows, total] = await Promise.all([
    prisma.problem.findMany({
      where,
      orderBy: { leetcodeId: "asc" },
      skip,
      take: query.limit,
      select: problemCatalogSelect,
    }),
    prisma.problem.count({ where }),
  ]);

  const enriched = await enrichCatalogPage(userId, where, mapRowsToCatalogItems(rows));

  return {
    items: enriched.items,
    page: query.page,
    limit: query.limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
    ...(enriched.solvedCount !== undefined ? { solvedCount: enriched.solvedCount } : {}),
  };
}

export type ProblemTopicTag = {
  name: string;
  count: number;
};

export type CatalogStats = {
  total: number;
  easy: number;
  medium: number;
  hard: number;
};

function premiumWhere(includePremium: boolean): Prisma.ProblemWhereInput {
  return includePremium ? {} : { isPremium: false };
}

export async function getCatalogStats(includePremium: boolean): Promise<CatalogStats> {
  const base = premiumWhere(includePremium);
  const [total, easy, medium, hard] = await Promise.all([
    prisma.problem.count({ where: base }),
    prisma.problem.count({ where: { ...base, difficulty: DifficultyLevel.EASY } }),
    prisma.problem.count({ where: { ...base, difficulty: DifficultyLevel.MEDIUM } }),
    prisma.problem.count({ where: { ...base, difficulty: DifficultyLevel.HARD } }),
  ]);
  return { total, easy, medium, hard };
}

export async function listProblemTopicsWithCounts(includePremium: boolean): Promise<ProblemTopicTag[]> {
  const rows = await prisma.problem.findMany({
    where: {
      ...premiumWhere(includePremium),
      topics: { isEmpty: false },
    },
    select: { topics: true },
  });

  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const topic of row.topics) {
      const name = topic.trim();
      if (name.length > 0) {
        counts.set(name, (counts.get(name) ?? 0) + 1);
      }
    }
  }

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** @deprecated Use listProblemTopicsWithCounts — kept for simple string list if needed */
export async function listProblemTopics(): Promise<string[]> {
  const tags = await listProblemTopicsWithCounts(false);
  return tags.map((t) => t.name);
}
