import { DifficultyLevel, ScheduleType, type Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";

/** Maps explore topic template slugs → LeetCode `Problem.topics` tag names (any match). */
export const TOPIC_LEETCODE_TAGS: Record<string, string[]> = {
  "binary-search": ["Binary Search"],
  "dynamic-programming": ["Dynamic Programming"],
  "graphs": [
    "Graph",
    "Depth-First Search",
    "Breadth-First Search",
    "Topological Sort",
    "Union Find",
    "Shortest Path",
  ],
  "sliding-window": ["Sliding Window", "Two Pointers"],
};

const MAX_PREVIEW_PROBLEMS = 500;

export type TemplatePreviewProblem = {
  order: number;
  slug: string;
  title: string;
  difficulty: DifficultyLevel;
  topics: string[];
  isPremium: boolean;
  hasDetail: boolean;
};

export type TemplatePreviewResponse = {
  templateSlug: string;
  templateName: string;
  templateType: ScheduleType;
  allowsDifficulty: boolean;
  allowsCount: boolean;
  defaultCount: number | null;
  total: number;
  stats: { easy: number; medium: number; hard: number };
  problems: TemplatePreviewProblem[];
};

function countByDifficulty(problems: TemplatePreviewProblem[]): {
  easy: number;
  medium: number;
  hard: number;
} {
  let easy = 0;
  let medium = 0;
  let hard = 0;
  for (const p of problems) {
    if (p.difficulty === DifficultyLevel.EASY) easy += 1;
    else if (p.difficulty === DifficultyLevel.MEDIUM) medium += 1;
    else if (p.difficulty === DifficultyLevel.HARD) hard += 1;
  }
  return { easy, medium, hard };
}

function mapProblemRow(
  row: {
    slug: string;
    title: string;
    difficulty: DifficultyLevel;
    topics: string[];
    isPremium: boolean;
    parsedStatement: string | null;
  },
  order: number,
): TemplatePreviewProblem {
  return {
    order,
    slug: row.slug,
    title: row.title,
    difficulty: row.difficulty,
    topics: row.topics,
    isPremium: row.isPremium,
    hasDetail: row.parsedStatement !== null && row.parsedStatement.trim().length > 0,
  };
}

async function previewFromTemplateProblems(templateId: string): Promise<TemplatePreviewProblem[]> {
  const rows = await prisma.templateProblem.findMany({
    where: { templateId },
    orderBy: { order: "asc" },
    take: MAX_PREVIEW_PROBLEMS,
    include: {
      problem: {
        select: {
          slug: true,
          title: true,
          difficulty: true,
          topics: true,
          isPremium: true,
          parsedStatement: true,
        },
      },
    },
  });

  return rows.map((row) => mapProblemRow(row.problem, row.order));
}

async function previewFromTopicTags(topicTags: string[]): Promise<TemplatePreviewProblem[]> {
  if (topicTags.length === 0) {
    return [];
  }

  const where: Prisma.ProblemWhereInput = {
    isPremium: false,
    OR: topicTags.map((tag) => ({ topics: { has: tag } })),
  };

  const rows = await prisma.problem.findMany({
    where,
    orderBy: [{ difficulty: "asc" }, { title: "asc" }],
    take: MAX_PREVIEW_PROBLEMS,
    select: {
      slug: true,
      title: true,
      difficulty: true,
      topics: true,
      isPremium: true,
      parsedStatement: true,
    },
  });

  return rows.map((row, index) => mapProblemRow(row, index + 1));
}

export async function getTemplatePreview(templateSlug: string): Promise<TemplatePreviewResponse> {
  const template = await prisma.scheduleTemplate.findUnique({
    where: { slug: templateSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      allowsDifficulty: true,
      allowsCount: true,
      defaultCount: true,
    },
  });

  if (template === null) {
    throw ApiError.notFound("Schedule template not found");
  }

  let problems: TemplatePreviewProblem[] = [];

  if (template.type === ScheduleType.TOPIC) {
    const tags = TOPIC_LEETCODE_TAGS[template.slug];
    if (tags === undefined) {
      throw ApiError.notFound(`Topic preview is not configured for "${template.slug}"`);
    }
    problems = await previewFromTopicTags(tags);
  } else if (template.type === ScheduleType.STUDY_PLAN) {
    problems = await previewFromTemplateProblems(template.id);
  } else if (template.type === ScheduleType.DAILY_POTD) {
    problems = [];
  } else {
    problems = await previewFromTemplateProblems(template.id);
  }

  const stats = countByDifficulty(problems);

  return {
    templateSlug: template.slug,
    templateName: template.name,
    templateType: template.type,
    allowsDifficulty: template.allowsDifficulty,
    allowsCount: template.allowsCount,
    defaultCount: template.defaultCount,
    total: problems.length,
    stats,
    problems,
  };
}
