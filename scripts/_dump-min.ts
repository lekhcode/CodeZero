import "dotenv/config";
import { prisma } from "../src/config/prisma.js";
const p = await prisma.problem.findUnique({ where: { slug: "min-stack" } });
const html = p!.rawContent!;
const i = html.search(/example/i);
console.log(html.slice(i, Math.min(i+1500, html.length)));
await prisma.$disconnect();
