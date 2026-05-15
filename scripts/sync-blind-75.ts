/**
 * @deprecated Use `npm run sync:blind-75` (runs sync-study-plan.ts).
 */
import "dotenv/config";
import { prisma } from "../src/config/prisma.js";
import { syncStudyPlan } from "./sync-study-plan.js";

void syncStudyPlan("blind-75")
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
