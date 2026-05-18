import { BrainCacheRevisionStatus, type Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { mapProblemRowToDetailResponse } from "../leetcode/leetcode.mapper.js";
import { ApiError } from "../../utils/ApiError.js";
import type { CreatePlaylistBody, UpdatePlaylistBody } from "./brainCache.validation.js";
import { countOpenByPlaylist } from "./brainCache.revision.service.js";
import type { BrainCachePlaylistDto, BrainCachePlaylistProblemEntryDto } from "./brainCache.types.js";

function parseCustomDates(raw: Prisma.JsonValue | null): string[] {
  if (raw === null || !Array.isArray(raw)) return [];
  return raw.filter((v): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v));
}

function mapPlaylist(
  row: {
    id: string;
    name: string;
    revisionIntervalDays: number;
    customRevisionDates: Prisma.JsonValue;
    notifyEmail: boolean;
    notifyWhatsapp: boolean;
    notifyInApp: boolean;
    notifyPush: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: { problems: number };
  },
  counts: { due: number; overdue: number },
): BrainCachePlaylistDto {
  return {
    id: row.id,
    name: row.name,
    revisionIntervalDays: row.revisionIntervalDays,
    customRevisionDates: parseCustomDates(row.customRevisionDates),
    notificationPrefs: {
      notifyEmail: row.notifyEmail,
      notifyWhatsapp: row.notifyWhatsapp,
      notifyInApp: row.notifyInApp,
      notifyPush: row.notifyPush,
    },
    problemCount: row._count.problems,
    dueCount: counts.due,
    overdueCount: counts.overdue,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function requireOwnedPlaylist(userId: string, playlistId: string) {
  const row = await prisma.brainCachePlaylist.findFirst({
    where: { id: playlistId, userId },
  });
  if (row === null) {
    throw ApiError.notFound("Playlist not found");
  }
  return row;
}

export async function listPlaylists(userId: string): Promise<BrainCachePlaylistDto[]> {
  const rows = await prisma.brainCachePlaylist.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { problems: true } } },
  });
  const counts = await countOpenByPlaylist(
    userId,
    rows.map((r) => r.id),
  );
  return rows.map((r) => mapPlaylist(r, counts.get(r.id) ?? { due: 0, overdue: 0 }));
}

export async function createPlaylist(
  userId: string,
  body: CreatePlaylistBody,
): Promise<BrainCachePlaylistDto> {
  const prefs = body.notificationPrefs;
  const row = await prisma.brainCachePlaylist.create({
    data: {
      userId,
      name: body.name,
      revisionIntervalDays: body.revisionIntervalDays ?? 7,
      customRevisionDates: body.customRevisionDates ?? [],
      notifyEmail: prefs?.notifyEmail ?? false,
      notifyWhatsapp: prefs?.notifyWhatsapp ?? false,
      notifyInApp: prefs?.notifyInApp ?? true,
      notifyPush: prefs?.notifyPush ?? false,
    },
    include: { _count: { select: { problems: true } } },
  });
  return mapPlaylist(row, { due: 0, overdue: 0 });
}

export async function updatePlaylist(
  userId: string,
  playlistId: string,
  body: UpdatePlaylistBody,
): Promise<BrainCachePlaylistDto> {
  await requireOwnedPlaylist(userId, playlistId);
  const prefs = body.notificationPrefs;
  const row = await prisma.brainCachePlaylist.update({
    where: { id: playlistId },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.revisionIntervalDays !== undefined
        ? { revisionIntervalDays: body.revisionIntervalDays }
        : {}),
      ...(body.customRevisionDates !== undefined
        ? { customRevisionDates: body.customRevisionDates }
        : {}),
      ...(prefs?.notifyEmail !== undefined ? { notifyEmail: prefs.notifyEmail } : {}),
      ...(prefs?.notifyWhatsapp !== undefined ? { notifyWhatsapp: prefs.notifyWhatsapp } : {}),
      ...(prefs?.notifyInApp !== undefined ? { notifyInApp: prefs.notifyInApp } : {}),
      ...(prefs?.notifyPush !== undefined ? { notifyPush: prefs.notifyPush } : {}),
    },
    include: { _count: { select: { problems: true } } },
  });
  const counts = await countOpenByPlaylist(userId, [playlistId]);
  return mapPlaylist(row, counts.get(playlistId) ?? { due: 0, overdue: 0 });
}

export async function deletePlaylist(userId: string, playlistId: string): Promise<void> {
  await requireOwnedPlaylist(userId, playlistId);
  await prisma.brainCachePlaylist.delete({ where: { id: playlistId } });
}

export async function listPlaylistProblems(
  userId: string,
  playlistId: string,
): Promise<BrainCachePlaylistProblemEntryDto[]> {
  await requireOwnedPlaylist(userId, playlistId);

  const rows = await prisma.brainCachePlaylistProblem.findMany({
    where: { playlistId },
    include: { problem: true },
    orderBy: { addedAt: "desc" },
  });

  if (rows.length === 0) return [];

  const playlistProblemIds = rows.map((r) => r.id);
  const openTasks = await prisma.brainCacheRevisionTask.findMany({
    where: {
      userId,
      playlistId,
      playlistProblemId: { in: playlistProblemIds },
      status: {
        in: [
          BrainCacheRevisionStatus.PENDING,
          BrainCacheRevisionStatus.DUE,
          BrainCacheRevisionStatus.OVERDUE,
        ],
      },
    },
    select: { playlistProblemId: true, dueDate: true },
    orderBy: { dueDate: "asc" },
  });

  const nextDueByEntry = new Map<string, string>();
  const openCountByEntry = new Map<string, number>();
  for (const task of openTasks) {
    openCountByEntry.set(
      task.playlistProblemId,
      (openCountByEntry.get(task.playlistProblemId) ?? 0) + 1,
    );
    if (!nextDueByEntry.has(task.playlistProblemId)) {
      nextDueByEntry.set(task.playlistProblemId, task.dueDate.toISOString().slice(0, 10));
    }
  }

  return rows.map((row) => {
    const detail = mapProblemRowToDetailResponse(row.problem);
    return {
      playlistProblemId: row.id,
      problem: {
        id: row.problem.id,
        slug: detail.slug,
        title: detail.title,
        difficulty: row.problem.difficulty,
        topics: detail.topics,
      },
      addedAt: row.addedAt.toISOString(),
      nextDueDate: nextDueByEntry.get(row.id) ?? null,
      openRevisionCount: openCountByEntry.get(row.id) ?? 0,
    };
  });
}
