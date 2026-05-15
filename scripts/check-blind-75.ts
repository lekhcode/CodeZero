import "dotenv/config";
import { prisma } from "../src/config/prisma.js";

async function main(): Promise<void> {
  const t = await prisma.scheduleTemplate.findUnique({
    where: { slug: "blind-75" },
    include: { _count: { select: { templateProblems: true } } },
  });
  const count = t === null ? 0 : t._count.templateProblems;
  console.log(JSON.stringify({ found: t !== null, name: t?.name, templateProblems: count }));
}

void main()
  .finally(() => prisma.$disconnect());
