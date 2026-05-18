import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { generateInitialRevisionTasks } from "./brainCache.revision.service.js";
import type { BrainCacheProblemMembershipDto } from "./brainCache.types.js";

async function requireOwnedPlaylist(userId: string, playlistId: string) {
  const row = await prisma.brainCachePlaylist.findFirst({
    where: { id: playlistId, userId },
  });
  if (row === null) {
    throw ApiError.notFound("Playlist not found");
  }
  return row;
}

export async function addProblemToPlaylist(
  userId: string,
  playlistId: string,
  problemId: string,
): Promise<{ playlistProblemId: string }> {
  const playlist = await requireOwnedPlaylist(userId, playlistId);
  const problem = await prisma.problem.findUnique({ where: { id: problemId }, select: { id: true } });
  if (problem === null) {
    throw ApiError.notFound("Problem not found");
  }

  const existing = await prisma.brainCachePlaylistProblem.findUnique({
    where: { playlistId_problemId: { playlistId, problemId } },
  });
  if (existing !== null) {
    throw ApiError.conflict("Problem already in this playlist");
  }

  const entry = await prisma.brainCachePlaylistProblem.create({
    data: { playlistId, problemId },
  });

  await generateInitialRevisionTasks({
    userId,
    playlist,
    playlistProblemId: entry.id,
    problemId,
  });

  return { playlistProblemId: entry.id };
}

export async function removeProblemFromPlaylist(
  userId: string,
  playlistId: string,
  problemId: string,
): Promise<void> {
  await requireOwnedPlaylist(userId, playlistId);
  const deleted = await prisma.brainCachePlaylistProblem.deleteMany({
    where: { playlistId, problemId },
  });
  if (deleted.count === 0) {
    throw ApiError.notFound("Problem not in playlist");
  }
}

export async function moveProblemBetweenPlaylists(
  userId: string,
  fromPlaylistId: string,
  problemId: string,
  toPlaylistId: string,
): Promise<{ playlistProblemId: string }> {
  if (fromPlaylistId === toPlaylistId) {
    throw ApiError.badRequest("Source and destination playlists must differ");
  }
  await removeProblemFromPlaylist(userId, fromPlaylistId, problemId);
  return addProblemToPlaylist(userId, toPlaylistId, problemId);
}

export async function listProblemMemberships(
  userId: string,
  problemId: string,
): Promise<BrainCacheProblemMembershipDto[]> {
  const rows = await prisma.brainCachePlaylistProblem.findMany({
    where: { problemId, playlist: { userId } },
    include: { playlist: { select: { id: true, name: true } } },
  });
  return rows.map((r) => ({
    playlistId: r.playlist.id,
    playlistName: r.playlist.name,
    playlistProblemId: r.id,
  }));
}

export async function listProblemMembershipsBySlug(
  userId: string,
  slug: string,
): Promise<BrainCacheProblemMembershipDto[]> {
  const problem = await prisma.problem.findUnique({ where: { slug }, select: { id: true } });
  if (problem === null) {
    throw ApiError.notFound("Problem not found");
  }
  return listProblemMemberships(userId, problem.id);
}
