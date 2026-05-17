import "dotenv/config";
import { prisma } from "../src/config/prisma.js";
import { extractExamplesFromHtml, examplesHaveOutput } from "../src/modules/leetcode/leetcode.parser.js";
const p = await prisma.problem.findUnique({ where: { slug: "min-stack" } });
const ex = extractExamplesFromHtml(p!.rawContent!);
console.log(examplesHaveOutput(ex), ex[0]?.input?.slice(0,40), ex[0]?.output?.slice(0,40));
await prisma.$disconnect();
