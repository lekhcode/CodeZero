import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { assertForumRateLimit } from "./forum.rateLimit.js";
import type { ForumLikeResultDto } from "./forum.types.js";

export async function toggleForumPostLike(
  postId: string,
  userId: string,
): Promise<ForumLikeResultDto> {
  assertForumRateLimit(userId, "like");

  const post = await prisma.forumPost.findUnique({ where: { id: postId }, select: { id: true } });
  if (post === null) {
    throw ApiError.notFound("Post not found");
  }

  const existing = await prisma.forumPostLike.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  if (existing !== null) {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.forumPostLike.delete({ where: { userId_postId: { userId, postId } } });
      return tx.forumPost.update({
        where: { id: postId },
        data: { likeCount: { decrement: 1 } },
        select: { likeCount: true },
      });
    });
    return { liked: false, likeCount: Math.max(0, updated.likeCount) };
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.forumPostLike.create({ data: { userId, postId } });
    return tx.forumPost.update({
      where: { id: postId },
      data: { likeCount: { increment: 1 } },
      select: { likeCount: true },
    });
  });
  return { liked: true, likeCount: updated.likeCount };
}

export async function toggleForumCommentLike(
  commentId: string,
  userId: string,
): Promise<ForumLikeResultDto> {
  assertForumRateLimit(userId, "like");

  const comment = await prisma.forumComment.findUnique({
    where: { id: commentId },
    select: { id: true },
  });
  if (comment === null) {
    throw ApiError.notFound("Comment not found");
  }

  const existing = await prisma.forumCommentLike.findUnique({
    where: { userId_commentId: { userId, commentId } },
  });

  if (existing !== null) {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.forumCommentLike.delete({ where: { userId_commentId: { userId, commentId } } });
      return tx.forumComment.update({
        where: { id: commentId },
        data: { likeCount: { decrement: 1 } },
        select: { likeCount: true },
      });
    });
    return { liked: false, likeCount: Math.max(0, updated.likeCount) };
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.forumCommentLike.create({ data: { userId, commentId } });
    return tx.forumComment.update({
      where: { id: commentId },
      data: { likeCount: { increment: 1 } },
      select: { likeCount: true },
    });
  });
  return { liked: true, likeCount: updated.likeCount };
}
