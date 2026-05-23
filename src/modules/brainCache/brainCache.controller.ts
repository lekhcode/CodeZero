import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import type {
  CreatePlaylistBody,
  MoveProblemBody,
  UpdatePlaylistBody,
} from "./brainCache.validation.js";
import * as playlistsService from "./brainCache.playlists.service.js";
import * as problemsService from "./brainCache.problems.service.js";
import * as revisionService from "./brainCache.revision.service.js";
import * as analyticsService from "./brainCache.analytics.service.js";

function requireUserId(req: Request): string {
  const u = req.user;
  if (u === undefined) throw ApiError.unauthorized("Not authenticated");
  return u.id;
}

function mapRevisionError(err: unknown): never {
  if (err instanceof Error) {
    if (err.message === "NOT_FOUND") throw ApiError.notFound("Revision task not found");
    if (err.message === "ALREADY_CLOSED") throw ApiError.badRequest("Revision already closed");
  }
  throw err;
}

export async function listPlaylists(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const playlists = await playlistsService.listPlaylists(userId);
  ApiResponse.success(res, { playlists });
}

export async function createPlaylist(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const body = req.body as CreatePlaylistBody;
  const playlist = await playlistsService.createPlaylist(userId, body);
  ApiResponse.created(res, { playlist });
}

export async function updatePlaylist(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const { id } = req.params as { id: string };
  const body = req.body as UpdatePlaylistBody;
  const playlist = await playlistsService.updatePlaylist(userId, id, body);
  ApiResponse.success(res, { playlist });
}

export async function deletePlaylist(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const { id } = req.params as { id: string };
  await playlistsService.deletePlaylist(userId, id);
  ApiResponse.success(res, { deleted: true });
}

export async function listPlaylistProblems(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const { id } = req.params as { id: string };
  const problems = await playlistsService.listPlaylistProblems(userId, id);
  ApiResponse.success(res, { problems });
}

export async function addProblem(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const { id } = req.params as { id: string };
  const { problemId } = req.body as { problemId: string };
  const result = await problemsService.addProblemToPlaylist(userId, id, problemId);
  ApiResponse.created(res, result);
}

export async function removeProblem(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const { id, problemId } = req.params as { id: string; problemId: string };
  await problemsService.removeProblemFromPlaylist(userId, id, problemId);
  ApiResponse.success(res, { removed: true });
}

export async function moveProblem(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const { id, problemId } = req.params as { id: string; problemId: string };
  const { toPlaylistId } = req.body as MoveProblemBody;
  const result = await problemsService.moveProblemBetweenPlaylists(
    userId,
    id,
    problemId,
    toPlaylistId,
  );
  ApiResponse.success(res, result);
}

export async function problemMemberships(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const { problemId } = req.params as { problemId: string };
  const memberships = await problemsService.listProblemMemberships(userId, problemId);
  ApiResponse.success(res, { memberships });
}

export async function problemMembershipsBySlug(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const { slug } = req.params as { slug: string };
  const memberships = await problemsService.listProblemMembershipsBySlug(userId, slug);
  ApiResponse.success(res, { memberships });
}

export async function todayRevisions(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const revisions = await revisionService.listTodayRevisions(userId);
  ApiResponse.success(res, { revisions });
}

export async function overdueRevisions(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const revisions = await revisionService.listOverdueRevisions(userId);
  ApiResponse.success(res, { revisions });
}

export async function solvedTodayRevisions(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const revisions = await revisionService.listSolvedTodayRevisions(userId);
  ApiResponse.success(res, { revisions });
}

export async function completeRevision(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const { id } = req.params as { id: string };
  try {
    const revision = await revisionService.completeRevision(userId, id);
    ApiResponse.success(res, { revision });
  } catch (err) {
    mapRevisionError(err);
  }
}

export async function skipRevision(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const { id } = req.params as { id: string };
  try {
    const revision = await revisionService.skipRevision(userId, id);
    ApiResponse.success(res, { revision });
  } catch (err) {
    mapRevisionError(err);
  }
}

export async function analytics(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const stats = await analyticsService.getAnalytics(userId);
  ApiResponse.success(res, stats);
}
