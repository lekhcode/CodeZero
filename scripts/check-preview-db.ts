import { loadSeedEnv, logDatabaseTarget } from "./load-seed-env.js";
import { prisma } from "../src/config/prisma.js";

loadSeedEnv();
logDatabaseTarget();

const [problems, links, templates] = await Promise.all([
  prisma.problem.count(),
  prisma.templateProblem.count(),
  prisma.scheduleTemplate.count(),
]);

const topInterview = await prisma.scheduleTemplate.findUnique({
  where: { slug: "top-interview-150" },
  include: { _count: { select: { templateProblems: true } } },
});

const dpTopicCount = await prisma.problem.count({
  where: {
    isPremium: false,
    topics: { has: "Dynamic Programming" },
  },
});

console.log(
  JSON.stringify(
    {
      problems,
      templateProblems: links,
      templates,
      topInterview150Links: topInterview?._count.templateProblems ?? 0,
      dynamicProgrammingProblems: dpTopicCount,
    },
    null,
    2,
  ),
);

await prisma.$disconnect();
