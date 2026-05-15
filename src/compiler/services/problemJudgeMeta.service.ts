import { JudgeMode } from "@prisma/client";
import { prisma } from "../../config/prisma.js";

export async function getJudgeMetaBySlug(slug: string, userId?: string | null) {
  const problem = await prisma.problem.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      constraints: true,
      parsedStatement: true,
      difficulty: true,
      topics: true,
      isPremium: true,
      codeTemplates: {
        select: {
          language: true,
          starterCode: true,
          functionName: true,
          judgeArgHints: true,
        },
        orderBy: { language: "asc" },
      },
      judgeTestcases: {
        where: { isHidden: false },
        orderBy: { orderIndex: "asc" },
        select: { orderIndex: true, input: true, expectedOutput: true, isHidden: true },
      },
    },
  });

  if (problem === null) return null;

  const hasVisibleTc = problem.judgeTestcases.length > 0;
  const hasTemplates = problem.codeTemplates.length > 0;
  const locked = !hasVisibleTc || !hasTemplates;
  let reason: string | null = null;
  if (locked) {
    reason = !hasTemplates
      ? "No code templates configured for this problem."
      : "No visible testcases configured — judge is locked.";
  }

  const base = {
    problemId: problem.id,
    slug: problem.slug,
    title: problem.title,
    difficulty: problem.difficulty,
    topics: problem.topics,
    isPremium: problem.isPremium,
    statement: problem.parsedStatement ?? "",
    constraints: problem.constraints,
    locked,
    lockReason: reason,
    languages: problem.codeTemplates.map((t) => ({
      id: t.language,
      starterCode: t.starterCode,
      functionName: t.functionName,
      judgeReadyForLanguage:
        hasVisibleTc &&
        !(t.language === "cpp" && (t.judgeArgHints === null || t.judgeArgHints.trim() === "")),
    })),
    visibleTestcases: problem.judgeTestcases.map((tc) => ({
      orderIndex: tc.orderIndex,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
    })),
  };

  if (userId === undefined || userId === null || userId === "") {
    return {
      ...base,
      solved: false,
      solvedAt: null as string | null,
      recentSubmissions: [] as Array<{
        id: string;
        status: string;
        mode: string;
        language: string;
        runtimeMs: number | null;
        codingDurationMs?: number | null;
        createdAt: string;
      }>,
    };
  }

  const [solveRow, recentSubmissions] = await Promise.all([
    prisma.userProblemSolve.findUnique({
      where: { userId_problemId: { userId, problemId: problem.id } },
      select: { solvedAt: true },
    }),
    prisma.judgeSubmission.findMany({
      where: { userId, problemId: problem.id, mode: JudgeMode.FULL_JUDGE },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        status: true,
        mode: true,
        language: true,
        runtimeMs: true,
        codingDurationMs: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    ...base,
    solved: solveRow !== null,
    solvedAt: solveRow?.solvedAt.toISOString() ?? null,
    recentSubmissions: recentSubmissions.map((s) => ({
      id: s.id,
      status: s.status,
      mode: s.mode,
      language: s.language,
      runtimeMs: s.runtimeMs,
      codingDurationMs: s.codingDurationMs ?? null,
      createdAt: s.createdAt.toISOString(),
    })),
  };
}
