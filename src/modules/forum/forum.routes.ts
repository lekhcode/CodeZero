import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { optionalAuth } from "../../middleware/optionalAuth.middleware.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validateBody, validateParams, validateQuery } from "../../middleware/validate.middleware.js";
import * as forumController from "./forum.controller.js";
import {
  createForumCommentBodySchema,
  createForumPostBodySchema,
  forumCommentIdParamsSchema,
  forumPostIdParamsSchema,
  listForumCommentsQuerySchema,
  listForumPostsQuerySchema,
  updateForumPostBodySchema,
} from "./forum.validation.js";

/**
 * Community forum — text/link posts, threaded comments, likes.
 * Public read; writes require auth.
 */
export const forumRouter = Router();

forumRouter.get("/feed/hub", optionalAuth, asyncHandler(forumController.getHubFeed));

forumRouter.get(
  "/posts",
  optionalAuth,
  validateQuery(listForumPostsQuerySchema),
  asyncHandler(forumController.listPosts),
);

forumRouter.get(
  "/posts/:id",
  optionalAuth,
  validateParams(forumPostIdParamsSchema),
  asyncHandler(forumController.getPost),
);

forumRouter.post(
  "/posts",
  requireAuth,
  validateBody(createForumPostBodySchema),
  asyncHandler(forumController.createPost),
);

forumRouter.patch(
  "/posts/:id",
  requireAuth,
  validateParams(forumPostIdParamsSchema),
  validateBody(updateForumPostBodySchema),
  asyncHandler(forumController.updatePost),
);

forumRouter.delete(
  "/posts/:id",
  requireAuth,
  validateParams(forumPostIdParamsSchema),
  asyncHandler(forumController.deletePost),
);

forumRouter.get(
  "/posts/:id/comments",
  optionalAuth,
  validateParams(forumPostIdParamsSchema),
  validateQuery(listForumCommentsQuerySchema),
  asyncHandler(forumController.listComments),
);

forumRouter.post(
  "/posts/:id/comments",
  requireAuth,
  validateParams(forumPostIdParamsSchema),
  validateBody(createForumCommentBodySchema),
  asyncHandler(forumController.createComment),
);

forumRouter.post(
  "/posts/:id/like",
  requireAuth,
  validateParams(forumPostIdParamsSchema),
  asyncHandler(forumController.likePost),
);

forumRouter.post(
  "/comments/:id/like",
  requireAuth,
  validateParams(forumCommentIdParamsSchema),
  asyncHandler(forumController.likeComment),
);
