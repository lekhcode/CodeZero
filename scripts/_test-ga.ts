import "dotenv/config";
import { prisma } from "../src/config/prisma.js";
import { extractExamplesFromHtml, examplesHaveOutput } from "../src/modules/leetcode/leetcode.parser.js";
const p = await prisma.problem.findUnique({ where: { slug: "group-anagrams" } });
const ex = extractExamplesFromHtml(p!.rawContent!);
console.log(ex.length, examplesHaveOutput(ex), ex[0]);
await prisma.$disconnect();
