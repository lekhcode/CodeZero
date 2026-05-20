import { PrismaClient, ScheduleType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const IS_SYSTEM = true;

const TEMPLATES: Array<{
  name: string;
  slug: string;
  type: ScheduleType;
  isSystem: boolean;
  allowsDifficulty?: boolean;
  allowsCount?: boolean;
  defaultCount?: number | null;
}> = [
  {
    name: "Daily LeetCode POTD",
    slug: "daily-potd",
    type: ScheduleType.DAILY_POTD,
    isSystem: IS_SYSTEM,
    allowsDifficulty: false,
    allowsCount: false,
    defaultCount: 1,
  },
  { name: "Binary Search", slug: "binary-search", type: ScheduleType.TOPIC, isSystem: IS_SYSTEM },
  {
    name: "Dynamic Programming",
    slug: "dynamic-programming",
    type: ScheduleType.TOPIC,
    isSystem: IS_SYSTEM,
  },
  { name: "Graphs", slug: "graphs", type: ScheduleType.TOPIC, isSystem: IS_SYSTEM },
  {
    name: "Sliding Window",
    slug: "sliding-window",
    type: ScheduleType.TOPIC,
    isSystem: IS_SYSTEM,
  },
  {
    name: "NeetCode 150",
    slug: "neetcode-150",
    type: ScheduleType.STUDY_PLAN,
    isSystem: IS_SYSTEM,
  },
  {
    name: "Top Interview 150",
    slug: "top-interview-150",
    type: ScheduleType.STUDY_PLAN,
    isSystem: IS_SYSTEM,
    defaultCount: 2,
  },
  {
    name: "Blind 75",
    slug: "blind-75",
    type: ScheduleType.STUDY_PLAN,
    isSystem: IS_SYSTEM,
    defaultCount: 2,
  },
];

export async function seedScheduleTemplates(prisma: PrismaClient): Promise<number> {
  for (const t of TEMPLATES) {
    await prisma.scheduleTemplate.upsert({
      where: { slug: t.slug },
      create: {
        name: t.name,
        slug: t.slug,
        type: t.type,
        isSystem: t.isSystem,
        allowsDifficulty: t.allowsDifficulty ?? true,
        allowsCount: t.allowsCount ?? true,
        defaultCount: t.defaultCount ?? null,
      },
      update: {
        name: t.name,
        type: t.type,
        isSystem: t.isSystem,
        allowsDifficulty: t.allowsDifficulty ?? true,
        allowsCount: t.allowsCount ?? true,
        defaultCount: t.defaultCount ?? null,
      },
    });
  }
  return TEMPLATES.length;
}

export function createSeedPrisma(): { prisma: PrismaClient; pool: pg.Pool } {
  const connectionString = process.env["DATABASE_URL"];
  if (connectionString === undefined || connectionString === "") {
    throw new Error("DATABASE_URL is required");
  }
  const pool = new pg.Pool({ connectionString });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  return { prisma, pool };
}
