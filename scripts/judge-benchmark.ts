/**
 * Judge benchmark — runs the same solution N times and prints phase timing stats.
 *
 * Usage: npm run judge:benchmark -- <problemSlug> <language> [iterations]
 * Requires: DATABASE_URL, Redis, Docker images, seeded problem with judge templates.
 */
import { JudgeMode, SubmissionStatus } from "@prisma/client";
import { prisma } from "../src/config/prisma.js";
import { executeJudgeInDocker } from "../src/compiler/judge/executorJudge.js";
import { parseJudgeArgHints } from "../src/compiler/judge/argCodegen.js";
import { assertSupportedLanguage } from "../src/compiler/services/submission.service.js";

const slug = process.argv[2];
const languageRaw = process.argv[3];
const iterations = Math.min(20, Math.max(1, Number(process.argv[4] ?? 3)));

if (!slug || !languageRaw) {
  console.error("Usage: npm run judge:benchmark -- <problemSlug> <language> [iterations]");
  process.exit(1);
}

const language = assertSupportedLanguage(languageRaw);

async function main(): Promise<void> {
  const problem = await prisma.problem.findUnique({ where: { slug }, select: { id: true, title: true } });
  if (problem === null) {
    console.error(`Problem not found: ${slug}`);
    process.exit(1);
  }

  const template = await prisma.problemCodeTemplate.findUnique({
    where: { problemId_language: { problemId: problem.id, language } },
  });
  if (template === null) {
    console.error(`No template for ${language}`);
    process.exit(1);
  }

  const tests = await prisma.problemTestcase.findMany({
    where: { problemId: problem.id, isHidden: false },
    orderBy: { orderIndex: "asc" },
    take: 5,
  });
  if (tests.length === 0) {
    console.error("No visible testcases");
    process.exit(1);
  }

  const user = await prisma.user.findFirst({ select: { id: true } });
  if (user === null) {
    console.error("No users in DB — seed first");
    process.exit(1);
  }

  const cases = tests.map((t) => ({
    input: t.input,
    expected: t.expectedOutput,
    hidden: t.isHidden,
  }));

  const cppHints = language === "cpp" ? parseJudgeArgHints(template.judgeArgHints) : null;
  if (language === "cpp" && cppHints === null) {
    console.error("C++ requires judgeArgHints on template");
    process.exit(1);
  }

  console.log(`Benchmark: ${problem.title} (${slug}) · ${language} · ${iterations} runs · ${cases.length} sample cases\n`);

  const executionSamples: number[] = [];
  const compileSamples: number[] = [];
  const sandboxSamples: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const jobId = `bench-${Date.now()}-${i}`;
    const t0 = Date.now();
    const summary = await executeJudgeInDocker({
      jobId,
      language,
      userCode: template.starterCode,
      functionName: template.functionName,
      cases,
      cppHints,
    });
    const wall = Date.now() - t0;

    executionSamples.push(summary.executionTimeMs);
    compileSamples.push(summary.compileTimeMs);
    sandboxSamples.push(summary.sandboxWallMs);

    console.log(
      `#${i + 1} ${summary.status} | exec ${summary.executionTimeMs}ms | compile ${summary.compileTimeMs}ms | sandbox ${summary.sandboxWallMs}ms | workspace ${summary.workspaceMs}ms | local wall ${wall}ms`,
    );

    await prisma.judgeSubmission.create({
      data: {
        userId: user.id,
        problemId: problem.id,
        language,
        code: template.starterCode,
        mode: JudgeMode.RUN_SAMPLE,
        status: summary.status as SubmissionStatus,
        runtimeMs: summary.executionTimeMs,
        executionTimeMs: summary.executionTimeMs,
        compileTimeMs: summary.compileTimeMs,
        sandboxWallMs: summary.sandboxWallMs,
        totalTimeMs: wall,
        queueTimeMs: 0,
        testResults: summary.testResults as object,
        stdout: summary.stdout,
        stderr: summary.stderr,
        exitCode: summary.exitCode,
      },
    });
  }

  const avg = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  console.log("\n--- Summary ---");
  console.log(`executionTimeMs  min ${Math.min(...executionSamples)}  max ${Math.max(...executionSamples)}  avg ${avg(executionSamples)}`);
  console.log(`compileTimeMs    min ${Math.min(...compileSamples)}  max ${Math.max(...compileSamples)}  avg ${avg(compileSamples)}`);
  console.log(`sandboxWallMs    min ${Math.min(...sandboxSamples)}  max ${Math.max(...sandboxSamples)}  avg ${avg(sandboxSamples)}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
