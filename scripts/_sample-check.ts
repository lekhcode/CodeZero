import "dotenv/config";
import { prisma } from "../src/config/prisma.js";
import { extractExamplesFromHtml, examplesHaveOutput } from "../src/modules/leetcode/leetcode.parser.js";
import { mapProblemRowToDetailResponse } from "../src/modules/leetcode/leetcode.mapper.js";

const t = await prisma.scheduleTemplate.findUnique({
  where: { slug: "blind-75" },
  include: { templateProblems: { take: 5, include: { problem: true } } },
});
for (const tp of t!.templateProblems) {
  const p = tp.problem;
  const fromHtml = p.rawContent ? extractExamplesFromHtml(p.rawContent) : [];
  const api = mapProblemRowToDetailResponse(p);
  console.log(p.slug, "| stored out:", examplesHaveOutput((p.examples as []) || []), "| html out:", examplesHaveOutput(fromHtml), "| api out:", examplesHaveOutput(api.examples));
}
await prisma.$disconnect();
