import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import type { PlanProblemsResponse } from "./plans.types.js";

/** Study plans with a static JSON list + sync script. */
export const STUDY_PLAN_SLUGS = ["blind-75", "top-interview-150", "neetcode-150"] as const;
export type StudyPlanSlug = (typeof STUDY_PLAN_SLUGS)[number];

function isStudyPlanSlug(slug: string): slug is StudyPlanSlug {
  return (STUDY_PLAN_SLUGS as readonly string[]).includes(slug);
}

export async function getPlanProblems(planSlug: string): Promise<PlanProblemsResponse> {
  if (!isStudyPlanSlug(planSlug)) {
    throw ApiError.notFound(`Study plan "${planSlug}" is not supported.`);
  }

  const template = await prisma.scheduleTemplate.findUnique({
    where: { slug: planSlug },
    include: {
      templateProblems: {
        orderBy: { order: "asc" },
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
      },
    },
  });

  if (template === null) {
    throw ApiError.notFound(`${planSlug} plan not found. Run seed and sync first.`);
  }

  return {
    templateSlug: template.slug,
    templateName: template.name,
    total: template.templateProblems.length,
    problems: template.templateProblems.map((row) => ({
      order: row.order,
      slug: row.problem.slug,
      title: row.problem.title,
      difficulty: row.problem.difficulty,
      topics: row.problem.topics,
      isPremium: row.problem.isPremium,
      hasDetail:
        row.problem.parsedStatement !== null && row.problem.parsedStatement.trim().length > 0,
    })),
  };
}

export async function getBlind75PlanProblems(): Promise<PlanProblemsResponse> {
  return getPlanProblems("blind-75");
}

export async function getTopInterview150PlanProblems(): Promise<PlanProblemsResponse> {
  return getPlanProblems("top-interview-150");
}

export async function getNeetCode150PlanProblems(): Promise<PlanProblemsResponse> {
  return getPlanProblems("neetcode-150");
}
