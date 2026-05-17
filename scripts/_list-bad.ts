import "dotenv/config";
import { prisma } from "../src/config/prisma.js";
import { examplesHaveOutput, extractExamplesFromHtml } from "../src/modules/leetcode/leetcode.parser.js";

const t = await prisma.scheduleTemplate.findUnique({
  where: { slug: "blind-75" },
  include: { templateProblems: { include: { problem: true } } },
});
const bad = [];
for (const tp of t!.templateProblems) {
  const p = tp.problem;
  const ex = Array.isArray(p.examples) ? p.examples : [];
  const hasOut = examplesHaveOutput(ex as {output:string}[]);
  if (p.rawContent && !hasOut) {
    const fromHtml = extractExamplesFromHtml(p.rawContent);
    bad.push({ slug: p.slug, htmlLen: p.rawContent.length, htmlExamples: fromHtml.length, stored: ex.length });
  }
}
console.log("bad count", bad.length);
console.log(bad.slice(0, 8));
await prisma.$disconnect();
