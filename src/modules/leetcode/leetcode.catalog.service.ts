import { DifficultyLevel, type Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import type { ListProblemsQuery } from "./leetcode.catalog.validation.js";

export type ProblemCatalogItem = {
  id: string;
  leetcodeId: number;
  title: string;
  slug: string;
  difficulty: DifficultyLevel;
  topics: string[];
  isPremium: boolean;
  hasDetail: boolean;
};

export type ProblemCatalogPage = {
  items: ProblemCatalogItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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

  if (query.search !== undefined && query.search.length > 0) {
    const term = query.search;
    and.push({
      OR: [
        { title: { contains: term, mode: "insensitive" } },
        { slug: { contains: term, mode: "insensitive" } },
      ],
    });
  }

  return and.length > 0 ? { AND: and } : {};
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

function mapRowToCatalogItem(row: {
  id: string;
  leetcodeId: number;
  title: string;
  slug: string;
  difficulty: DifficultyLevel;
  topics: string[];
  isPremium: boolean;
  parsedStatement: string | null;
  examples: unknown;
}): ProblemCatalogItem {
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
  };
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
  const items = pickedIds
    .map((id) => byId.get(id))
    .filter((row): row is NonNullable<typeof row> => row !== undefined)
    .map(mapRowToCatalogItem);

  return {
    items,
    page: 1,
    limit,
    total,
    totalPages: 1,
  };
}

export async function listProblemCatalog(query: ListProblemsQuery): Promise<ProblemCatalogPage> {
  const where = buildWhere(query);

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
    return listShuffledProblemCatalog(where, query.limit);
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

  const items: ProblemCatalogItem[] = rows.map(mapRowToCatalogItem);

  return {
    items,
    page: query.page,
    limit: query.limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
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
