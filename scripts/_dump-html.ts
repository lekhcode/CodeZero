import "dotenv/config";
import { prisma } from "../src/config/prisma.js";
const p = await prisma.problem.findUnique({ where: { slug: "group-anagrams" } });
const html = p!.rawContent!;
const i = html.search(/example/i);
console.log(html.slice(i, i + 1200));
await prisma.$disconnect();
