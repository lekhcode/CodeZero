/**
 * Seeds the canonical `ScheduleTemplate` catalog (POTD, topics, study plans).
 * Safe to re-run: upserts by `slug` so names/flags refresh without duplicate rows.
 */
import "dotenv/config";
import { PrismaClient, ScheduleType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env["DATABASE_URL"] });
const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

const IS_SYSTEM = true;

async function main(): Promise<void> {
  const templates: Array<{
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

  for (const t of templates) {
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

  // eslint-disable-next-line no-console -- seed script
  console.log(`Seeded ${templates.length} schedule templates.`);
}

void main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
