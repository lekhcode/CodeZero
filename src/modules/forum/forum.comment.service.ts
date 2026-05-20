import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { commentCursorWhere, decodeForumCursor, encodeForumCursor } from "./forum.cursor.js";
import { toForumComment } from "./forum.mapper.js";
import { assertForumContentAllowed, sanitizeForumText } from "./forum.moderation.js";
import { assertForumRateLimit } from "./forum.rateLimit.js";
import type { ForumCommentPage } from "./forum.types.js";
import type { CreateForumCommentBody, ListForumCommentsQuery } from "./forum.validation.js";

const AUTHOR_SELECT = {
  id: true,
  name: true,
  username: true,
  email: true,
  avatar: true,
} as const;

async function likedCommentIds(userId: string | undefined, ids: string[]): Promise<Set<string>> {
  if (userId === undefined || ids.length === 0) return new Set();
  const rows = await prisma.forumCommentLike.findMany({
    where: { userId, commentId: { in: ids } },
    select: { commentId: true },
  });
  return new Set(rows.map((r) => r.commentId));
}

async function replyCounts(commentIds: string[]): Promise<Map<string, number>> {
  if (commentIds.length === 0) return new Map();
  const grouped = await prisma.forumComment.groupBy({
    by: ["parentId"],
    where: { parentId: { in: commentIds } },
    _count: { parentId: true },
  });
  const map = new Map<string, number>();
  for (const row of grouped) {
    if (row.parentId !== null) {
      map.set(row.parentId, row._count.parentId);
    }
  }
  return map;
}

export async function listForumComments(
  postId: string,
  query: ListForumCommentsQuery,
  viewerId?: string,
): Promise<ForumCommentPage> {
  const post = await prisma.forumPost.findUnique({ where: { id: postId }, select: { id: true } });
  if (post === null) {
    throw ApiError.notFound("Post not found");
  }

  const cursor = decodeForumCursor(query.cursor);
  const limit = query.limit;

  const rows = await prisma.forumComment.findMany({
    where: { postId, ...commentCursorWhere(cursor) },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: limit + 1,
    include: { author: { select: AUTHOR_SELECT } },
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const likes = await likedCommentIds(
    viewerId,
    page.map((c) => c.id),
  );
  const replies = await replyCounts(page.map((c) => c.id));

  const last = page[page.length - 1];
  return {
    items: page.map((c) => toForumComment(c, likes.has(c.id), replies.get(c.id) ?? 0)),
    nextCursor: hasMore && last !== undefined ? encodeForumCursor(last) : null,
    hasMore,
  };
}

export async function createForumComment(
  postId: string,
  authorId: string,
  body: CreateForumCommentBody,
): Promise<ForumCommentPage["items"][number]> {
  assertForumRateLimit(authorId, "comment");

  const post = await prisma.forumPost.findUnique({ where: { id: postId }, select: { id: true } });
  if (post === null) {
    throw ApiError.notFound("Post not found");
  }

  const content = sanitizeForumText(body.content);
  try {
    assertForumContentAllowed("comment", content);
  } catch {
    throw ApiError.badRequest("Content contains disallowed language.");
  }

  if (body.parentId !== undefined) {
    const parent = await prisma.forumComment.findFirst({
      where: { id: body.parentId, postId },
      select: { id: true },
    });
    if (parent === null) {
      throw ApiError.badRequest("Invalid parent comment");
    }
  }

  const comment = await prisma.$transaction(async (tx) => {
    const created = await tx.forumComment.create({
      data: {
        postId,
        authorId,
        content,
        parentId: body.parentId ?? null,
      },
      include: { author: { select: AUTHOR_SELECT } },
    });
    await tx.forumPost.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    });
    return created;
  });

  return toForumComment(comment, false, 0);
}
