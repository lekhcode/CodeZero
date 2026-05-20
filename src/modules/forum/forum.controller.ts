import type { Request, Response } from "express";
import { readValidatedQuery } from "../../middleware/validate.middleware.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import * as commentService from "./forum.comment.service.js";
import * as likeService from "./forum.like.service.js";
import * as forumService from "./forum.service.js";
import type {
  CreateForumCommentBody,
  CreateForumPostBody,
  ListForumCommentsQuery,
  ListForumPostsQuery,
  UpdateForumPostBody,
} from "./forum.validation.js";
import type { ForumPostIdParams } from "./forum.validation.js";

function viewerId(req: Request): string | undefined {
  return req.user?.id;
}

export async function getHubFeed(req: Request, res: Response): Promise<void> {
  const feed = await forumService.getForumHubFeed(viewerId(req));
  ApiResponse.success(res, feed);
}

export async function listPosts(req: Request, res: Response): Promise<void> {
  const query = readValidatedQuery<ListForumPostsQuery>(req);
  const page = await forumService.listForumPosts(query, viewerId(req));
  ApiResponse.success(res, page);
}

export async function getPost(req: Request, res: Response): Promise<void> {
  const { id } = req.params as ForumPostIdParams;
  const post = await forumService.getForumPostById(id, viewerId(req));
  ApiResponse.success(res, { post });
}

export async function createPost(req: Request, res: Response): Promise<void> {
  const body = req.body as CreateForumPostBody;
  const post = await forumService.createForumPost(req.user!.id, body);
  ApiResponse.created(res, { post });
}

export async function updatePost(req: Request, res: Response): Promise<void> {
  const { id } = req.params as ForumPostIdParams;
  const body = req.body as UpdateForumPostBody;
  const post = await forumService.updateForumPost(id, req.user!.id, body);
  ApiResponse.success(res, { post });
}

export async function deletePost(req: Request, res: Response): Promise<void> {
  const { id } = req.params as ForumPostIdParams;
  await forumService.deleteForumPost(id, req.user!.id);
  ApiResponse.success(res, { deleted: true });
}

export async function listComments(req: Request, res: Response): Promise<void> {
  const { id } = req.params as ForumPostIdParams;
  const query = readValidatedQuery<ListForumCommentsQuery>(req);
  const page = await commentService.listForumComments(id, query, viewerId(req));
  ApiResponse.success(res, page);
}

export async function createComment(req: Request, res: Response): Promise<void> {
  const { id } = req.params as ForumPostIdParams;
  const body = req.body as CreateForumCommentBody;
  const comment = await commentService.createForumComment(id, req.user!.id, body);
  ApiResponse.created(res, { comment });
}

export async function likePost(req: Request, res: Response): Promise<void> {
  const { id } = req.params as ForumPostIdParams;
  const result = await likeService.toggleForumPostLike(id, req.user!.id);
  ApiResponse.success(res, result);
}

export async function likeComment(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const result = await likeService.toggleForumCommentLike(id, req.user!.id);
  ApiResponse.success(res, result);
}
