import type { ForumComment, ForumPost, User } from "@prisma/client";
import { extractLinkHost } from "./forum.moderation.js";
import { previewContent } from "./forum.types.js";
import type {
  ForumAuthorDto,
  ForumCommentDto,
  ForumPostDetailDto,
  ForumPostSummaryDto,
} from "./forum.types.js";

type AuthorPick = Pick<User, "id" | "name" | "username" | "email" | "avatar">;

export function toForumAuthor(user: AuthorPick): ForumAuthorDto {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
  };
}

export function toForumPostSummary(
  post: ForumPost & { author: AuthorPick },
  likedByMe: boolean,
): ForumPostSummaryDto {
  const externalLink = post.externalLink;
  return {
    id: post.id,
    title: post.title,
    contentPreview: previewContent(post.content),
    externalLink,
    linkHost: externalLink ? extractLinkHost(externalLink) : null,
    type: post.type,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    author: toForumAuthor(post.author),
    likedByMe,
    problemId: post.problemId,
  };
}

export function toForumPostDetail(
  post: ForumPost & { author: AuthorPick },
  likedByMe: boolean,
): ForumPostDetailDto {
  return {
    ...toForumPostSummary(post, likedByMe),
    content: post.content,
  };
}

export function toForumComment(
  row: ForumComment & { author: AuthorPick },
  likedByMe: boolean,
  replyCount: number,
): ForumCommentDto {
  return {
    id: row.id,
    postId: row.postId,
    parentId: row.parentId,
    content: row.content,
    likeCount: row.likeCount,
    createdAt: row.createdAt.toISOString(),
    author: toForumAuthor(row.author),
    likedByMe,
    replyCount,
  };
}
