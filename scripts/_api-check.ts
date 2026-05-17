import "dotenv/config";
import { prisma } from "../src/config/prisma.js";
import { examplesHaveOutput, extractExamplesFromHtml } from "../src/modules/leetcode/leetcode.parser.js";
import { mapProblemRowToDetailResponse } from "../src/modules/leetcode/leetcode.mapper.js";
for (const plan of ["blind-75", "top-interview-150"]) {
  const t = await prisma.scheduleTemplate.findUnique({
    where: { slug: plan },
    include: { templateProblems: { include: { problem: true } } },
  });
  const bad: string[] = [];
  for (const tp of t!.templateProblems) {
    const p = tp.problem;
    const api = mapProblemRowToDetailResponse(p);
    if (!examplesHaveOutput(api.examples)) bad.push(p.slug);
  }
  console.log(plan, "API still missing output:", bad.length, bad.slice(0, 8));
}
await prisma.$disconnect();
