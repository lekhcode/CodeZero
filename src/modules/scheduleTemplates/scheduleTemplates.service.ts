import { prisma } from "../../config/prisma.js";
import type { ScheduleTemplateDto } from "./scheduleTemplates.types.js";

/**
 * Read-only catalog for clients to build enrollment UIs (topics, POTD, study plans, future AI rows).
 */
export async function listAllTemplates(): Promise<ScheduleTemplateDto[]> {
  return prisma.scheduleTemplate.findMany({
    orderBy: [{ type: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      isSystem: true,
      allowsDifficulty: true,
      allowsCount: true,
      defaultCount: true,
      createdAt: true,
    },
  });
}
