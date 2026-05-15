import { Prisma, ScheduleType } from "@prisma/client";
import type { DifficultyLevel } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import type { CreateUserScheduleBody } from "./userSchedules.validation.js";

/** Product rule: cap concurrent active streams per learner (POTD + topics + plans). */
const MAX_ACTIVE_SCHEDULES = 5;

type TemplateRuleRow = {
  id: string;
  type: ScheduleType;
  allowsDifficulty: boolean;
  allowsCount: boolean;
  defaultCount: number | null;
};

/**
 * Maps template flags + schedule type into persisted `dailyQuestions` / `difficulty`.
 * POTD is special-cased globally (no per-user count/difficulty knobs).
 */
function resolveScheduleFields(
  template: TemplateRuleRow,
  input: CreateUserScheduleBody,
): { dailyQuestions: number | null; difficulty: DifficultyLevel | null } {
  if (template.type === ScheduleType.DAILY_POTD) {
    if (input.dailyQuestions !== undefined) {
      throw ApiError.badRequest("This schedule does not support dailyQuestions");
    }
    if (input.difficulty !== undefined) {
      throw ApiError.badRequest("This schedule does not support difficulty");
    }
    return {
      dailyQuestions: template.defaultCount ?? 1,
      difficulty: null,
    };
  }

  if (!template.allowsDifficulty && input.difficulty !== undefined) {
    throw ApiError.badRequest("This template does not support difficulty");
  }
  if (!template.allowsCount && input.dailyQuestions !== undefined) {
    throw ApiError.badRequest("This template does not support dailyQuestions");
  }

  let dailyQuestions: number | null = null;
  if (template.allowsCount) {
    if (input.dailyQuestions === undefined) {
      throw ApiError.badRequest("dailyQuestions is required for this template (1–5)");
    }
    dailyQuestions = input.dailyQuestions;
  } else {
    dailyQuestions = template.defaultCount ?? null;
  }

  const difficulty: DifficultyLevel | null = template.allowsDifficulty
    ? (input.difficulty ?? null)
    : null;

  return { dailyQuestions, difficulty };
}

export async function listForUser(userId: string) {
  return prisma.userSchedule.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      template: {
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          allowsDifficulty: true,
          allowsCount: true,
          defaultCount: true,
        },
      },
    },
  });
}

export async function createForUser(userId: string, input: CreateUserScheduleBody) {
  const template = await prisma.scheduleTemplate.findUnique({
    where: { slug: input.templateSlug },
  });
  if (template === null) {
    throw ApiError.notFound("Schedule template not found");
  }

  const { dailyQuestions, difficulty } = resolveScheduleFields(template, input);

  const existing = await prisma.userSchedule.findUnique({
    where: { userId_templateId: { userId, templateId: template.id } },
  });
  if (existing !== null) {
    throw ApiError.conflict("You already have this schedule");
  }

  const activeCount = await prisma.userSchedule.count({
    where: { userId, active: true },
  });
  if (activeCount >= MAX_ACTIVE_SCHEDULES) {
    throw ApiError.conflict(`You can have at most ${MAX_ACTIVE_SCHEDULES} active schedules`);
  }

  try {
    return await prisma.userSchedule.create({
      data: {
        userId,
        templateId: template.id,
        active: true,
        dailyQuestions,
        difficulty,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            allowsDifficulty: true,
            allowsCount: true,
            defaultCount: true,
          },
        },
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw ApiError.conflict("You already have this schedule");
    }
    throw err;
  }
}

export async function toggleActive(userId: string, scheduleId: string) {
  const row = await prisma.userSchedule.findUnique({
    where: { id: scheduleId },
  });
  if (row === null) {
    throw ApiError.notFound("Schedule not found");
  }
  if (row.userId !== userId) {
    throw ApiError.forbidden("You do not own this schedule");
  }

  const nextActive = !row.active;
  if (nextActive) {
    const otherActiveCount = await prisma.userSchedule.count({
      where: { userId, active: true, id: { not: scheduleId } },
    });
    if (otherActiveCount >= MAX_ACTIVE_SCHEDULES) {
      throw ApiError.conflict(`You can have at most ${MAX_ACTIVE_SCHEDULES} active schedules`);
    }
  }

  return prisma.userSchedule.update({
    where: { id: scheduleId },
    data: { active: nextActive },
    select: { id: true, active: true },
  });
}

export async function removeForUser(userId: string, scheduleId: string) {
  const row = await prisma.userSchedule.findUnique({
    where: { id: scheduleId },
    select: { id: true, userId: true },
  });
  if (row === null) {
    throw ApiError.notFound("Schedule not found");
  }
  if (row.userId !== userId) {
    throw ApiError.forbidden("You do not own this schedule");
  }
  await prisma.userSchedule.delete({ where: { id: scheduleId } });
}
