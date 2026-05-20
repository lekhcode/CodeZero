import { ForumPostType } from "@prisma/client";
import { z } from "zod";

const forumPostTypeSchema = z.nativeEnum(ForumPostType);

const titleSchema = z.string().trim().min(4).max(200);
const contentSchema = z.string().trim().min(8).max(50_000);
const externalLinkSchema = z.string().url().max(2048).optional().or(z.literal(""));

export const createForumPostBodySchema = z.object({
  title: titleSchema,
  content: contentSchema,
  externalLink: externalLinkSchema,
  type: forumPostTypeSchema,
  problemId: z.string().uuid().optional(),
});

export const updateForumPostBodySchema = z
  .object({
    title: titleSchema.optional(),
    content: contentSchema.optional(),
    externalLink: externalLinkSchema.nullable().optional(),
    type: forumPostTypeSchema.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "At least one field required" });

export const listForumPostsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  type: forumPostTypeSchema.optional(),
  sort: z.enum(["latest", "trending"]).optional().default("latest"),
  authorId: z.string().uuid().optional(),
  problemId: z.string().uuid().optional(),
});

export const forumPostIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const forumCommentIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createForumCommentBodySchema = z.object({
  content: z.string().trim().min(1).max(10_000),
  parentId: z.string().uuid().optional(),
});

export const listForumCommentsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(30),
});

export type CreateForumPostBody = z.infer<typeof createForumPostBodySchema>;
export type UpdateForumPostBody = z.infer<typeof updateForumPostBodySchema>;
export type ListForumPostsQuery = z.infer<typeof listForumPostsQuerySchema>;
export type CreateForumCommentBody = z.infer<typeof createForumCommentBodySchema>;
export type ListForumCommentsQuery = z.infer<typeof listForumCommentsQuerySchema>;
export type ForumPostIdParams = z.infer<typeof forumPostIdParamsSchema>;
