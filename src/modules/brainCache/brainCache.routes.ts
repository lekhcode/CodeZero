import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validateBody, validateParams } from "../../middleware/validate.middleware.js";
import {
  addProblemBodySchema,
  createPlaylistBodySchema,
  moveProblemBodySchema,
  playlistIdParamsSchema,
  playlistProblemParamsSchema,
  problemIdParamsSchema,
  revisionIdParamsSchema,
  slugParamsSchema,
  updatePlaylistBodySchema,
} from "./brainCache.validation.js";
import * as brainCacheController from "./brainCache.controller.js";

export const brainCacheRouter = Router();
brainCacheRouter.use(requireAuth);

brainCacheRouter.get("/analytics", asyncHandler(brainCacheController.analytics));

brainCacheRouter.get("/playlists", asyncHandler(brainCacheController.listPlaylists));
brainCacheRouter.post(
  "/playlists",
  validateBody(createPlaylistBodySchema),
  asyncHandler(brainCacheController.createPlaylist),
);
brainCacheRouter.patch(
  "/playlists/:id",
  validateParams(playlistIdParamsSchema),
  validateBody(updatePlaylistBodySchema),
  asyncHandler(brainCacheController.updatePlaylist),
);
brainCacheRouter.delete(
  "/playlists/:id",
  validateParams(playlistIdParamsSchema),
  asyncHandler(brainCacheController.deletePlaylist),
);
brainCacheRouter.get(
  "/playlists/:id/problems",
  validateParams(playlistIdParamsSchema),
  asyncHandler(brainCacheController.listPlaylistProblems),
);

brainCacheRouter.post(
  "/playlists/:id/problems",
  validateParams(playlistIdParamsSchema),
  validateBody(addProblemBodySchema),
  asyncHandler(brainCacheController.addProblem),
);
brainCacheRouter.delete(
  "/playlists/:id/problems/:problemId",
  validateParams(playlistProblemParamsSchema),
  asyncHandler(brainCacheController.removeProblem),
);
brainCacheRouter.post(
  "/playlists/:id/problems/:problemId/move",
  validateParams(playlistProblemParamsSchema),
  validateBody(moveProblemBodySchema),
  asyncHandler(brainCacheController.moveProblem),
);

brainCacheRouter.get(
  "/problems/:problemId/playlists",
  validateParams(problemIdParamsSchema),
  asyncHandler(brainCacheController.problemMemberships),
);
brainCacheRouter.get(
  "/problems/by-slug/:slug/playlists",
  validateParams(slugParamsSchema),
  asyncHandler(brainCacheController.problemMembershipsBySlug),
);

brainCacheRouter.get("/revisions/today", asyncHandler(brainCacheController.todayRevisions));
brainCacheRouter.get("/revisions/overdue", asyncHandler(brainCacheController.overdueRevisions));
brainCacheRouter.get("/revisions/solved-today", asyncHandler(brainCacheController.solvedTodayRevisions));
brainCacheRouter.patch(
  "/revisions/:id/complete",
  validateParams(revisionIdParamsSchema),
  asyncHandler(brainCacheController.completeRevision),
);
brainCacheRouter.patch(
  "/revisions/:id/skip",
  validateParams(revisionIdParamsSchema),
  asyncHandler(brainCacheController.skipRevision),
);
