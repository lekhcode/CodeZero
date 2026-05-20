import { ForumPostType, type Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { decodeForumCursor, encodeForumCursor, postCursorWhere } from "./forum.cursor.js";
import { toForumPostDetail, toForumPostSummary } from "./forum.mapper.js";
import {
  assertForumContentAllowed,
  countUrls,
  sanitizeForumText,
} from "./forum.moderation.js";
import { assertForumRateLimit } from "./forum.rateLimit.js";
import type {
  ForumHubFeedDto,
  ForumPostDetailDto,
  ForumPostFeedPage,
} from "./forum.types.js";
import type { CreateForumPostBody, ListForumPostsQuery, UpdateForumPostBody } from "./forum.validation.js";

const AUTHOR_SELECT = {
  id: true,
  name: true,
  username: true,
  email: true,
  avatar: true,
} as const;

const TRENDING_WINDOW_DAYS = 14;

async function likedPostIds(userId: string | undefined, postIds: string[]): Promise<Set<string>> {
  if (userId === undefined || postIds.length === 0) return new Set();
  const rows = await prisma.forumPostLike.findMany({
    where: { userId, postId: { in: postIds } },
    select: { postId: true },
  });
  return new Set(rows.map((r) => r.postId));
}

function normalizeExternalLink(raw: string | undefined): string | null {
  if (raw === undefined || raw.trim() === "") return null;
  return raw.trim();
}

function mapModerationError(err: unknown): never {
  if (err instanceof Error) {
    if (err.message === "PROFANITY") {
      throw ApiError.badRequest("Content contains disallowed language.");
    }
    if (err.message === "UNSAFE_CONTENT") {
      throw ApiError.badRequest("Content contains unsafe markup.");
    }
  }
  throw err;
}

export async function listForumPosts(
  query: ListForumPostsQuery,
  viewerId?: string,
): Promise<ForumPostFeedPage> {
  const cursor = decodeForumCursor(query.cursor);
  const limit = query.limit;

  const and: Prisma.ForumPostWhereInput[] = [];
  if (query.type !== undefined) and.push({ type: query.type });
  if (query.authorId !== undefined) and.push({ authorId: query.authorId });
  if (query.problemId !== undefined) and.push({ problemId: query.problemId });
  if (query.sort === "trending") {
    const since = new Date();
    since.setDate(since.getDate() - TRENDING_WINDOW_DAYS);
    and.push({ createdAt: { gte: since } });
  }
  const cursorFilter = postCursorWhere(cursor);
  if (cursorFilter.OR !== undefined) and.push(cursorFilter);

  const where: Prisma.ForumPostWhereInput = and.length > 0 ? { AND: and } : {};

  const orderBy: Prisma.ForumPostOrderByWithRelationInput[] =
    query.sort === "trending"
      ? [{ likeCount: "desc" }, { commentCount: "desc" }, { createdAt: "desc" }, { id: "desc" }]
      : [{ createdAt: "desc" }, { id: "desc" }];

  const rows = await prisma.forumPost.findMany({
    where,
    orderBy,
    take: limit + 1,
    include: { author: { select: AUTHOR_SELECT } },
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const likes = await likedPostIds(
    viewerId,
    page.map((p) => p.id),
  );

  const last = page[page.length - 1];
  return {
    items: page.map((p) => toForumPostSummary(p, likes.has(p.id))),
    nextCursor: hasMore && last !== undefined ? encodeForumCursor(last) : null,
    hasMore,
  };
}

export async function getForumHubFeed(viewerId?: string): Promise<ForumHubFeedDto> {
  const [trending, latest, resources, interviewExperiences, typeCounts] = await Promise.all([
    listForumPosts({ limit: 6, sort: "trending" }, viewerId),
    listForumPosts({ limit: 8, sort: "latest" }, viewerId),
    listForumPosts({ limit: 6, sort: "latest", type: ForumPostType.RESOURCE }, viewerId),
    listForumPosts(
      { limit: 6, sort: "latest", type: ForumPostType.INTERVIEW_EXPERIENCE },
      viewerId,
    ),
    prisma.forumPost.groupBy({
      by: ["type"],
      _count: { type: true },
      orderBy: { _count: { type: "desc" } },
    }),
  ]);

  const topicLabels: Record<ForumPostType, string> = {
    DISCUSSION: "Discussions",
    QUESTION: "Questions",
    RESOURCE: "Resources",
    GUIDE: "Guides",
    INTERVIEW_EXPERIENCE: "Interview stories",
  };

  return {
    trending: trending.items,
    latest: latest.items,
    resources: resources.items,
    interviewExperiences: interviewExperiences.items,
    popularTopics: typeCounts.map((row) => ({
      label: topicLabels[row.type],
      count: row._count.type,
      type: row.type,
    })),
  };
}

export async function getForumPostById(id: string, viewerId?: string): Promise<ForumPostDetailDto> {
  const post = await prisma.forumPost.findUnique({
    where: { id },
    include: { author: { select: AUTHOR_SELECT } },
  });
  if (post === null) {
    throw ApiError.notFound("Post not found");
  }
  const liked =
    viewerId !== undefined
      ? (await prisma.forumPostLike.findUnique({
          where: { userId_postId: { userId: viewerId, postId: id } },
        })) !== null
      : false;
  return toForumPostDetail(post, liked);
}

export async function createForumPost(
  authorId: string,
  body: CreateForumPostBody,
): Promise<ForumPostDetailDto> {
  assertForumRateLimit(authorId, "post");

  const title = sanitizeForumText(body.title);
  const content = sanitizeForumText(body.content);
  const externalLink = normalizeExternalLink(body.externalLink);

  try {
    assertForumContentAllowed(title, content);
  } catch (err) {
    mapModerationError(err);
  }

  if (countUrls(content) > 8) {
    throw ApiError.badRequest("Too many links in post body.");
  }

  if (body.problemId !== undefined) {
    const problem = await prisma.problem.findUnique({
      where: { id: body.problemId },
      select: { id: true },
    });
    if (problem === null) {
      throw ApiError.badRequest("Invalid problemId");
    }
  }

  const post = await prisma.forumPost.create({
    data: {
      authorId,
      title,
      content,
      externalLink,
      type: body.type,
      problemId: body.problemId ?? null,
    },
    include: { author: { select: AUTHOR_SELECT } },
  });

  return toForumPostDetail(post, false);
}

export async function updateForumPost(
  postId: string,
  authorId: string,
  body: UpdateForumPostBody,
): Promise<ForumPostDetailDto> {
  const existing = await prisma.forumPost.findUnique({ where: { id: postId } });
  if (existing === null) {
    throw ApiError.notFound("Post not found");
  }
  if (existing.authorId !== authorId) {
    throw ApiError.forbidden("You can only edit your own posts");
  }

  const title = body.title !== undefined ? sanitizeForumText(body.title) : existing.title;
  const content = body.content !== undefined ? sanitizeForumText(body.content) : existing.content;

  try {
    assertForumContentAllowed(title, content);
  } catch (err) {
    mapModerationError(err);
  }

  const externalLink =
    body.externalLink === undefined
      ? existing.externalLink
      : body.externalLink === null || body.externalLink === ""
        ? null
        : normalizeExternalLink(body.externalLink);

  const post = await prisma.forumPost.update({
    where: { id: postId },
    data: {
      ...(body.title !== undefined ? { title } : {}),
      ...(body.content !== undefined ? { content } : {}),
      ...(body.externalLink !== undefined ? { externalLink } : {}),
      ...(body.type !== undefined ? { type: body.type } : {}),
    },
    include: { author: { select: AUTHOR_SELECT } },
  });

  const liked =
    (await prisma.forumPostLike.findUnique({
      where: { userId_postId: { userId: authorId, postId } },
    })) !== null;

  return toForumPostDetail(post, liked);
}

export async function deleteForumPost(postId: string, authorId: string): Promise<void> {
  const existing = await prisma.forumPost.findUnique({ where: { id: postId } });
  if (existing === null) {
    throw ApiError.notFound("Post not found");
  }
  if (existing.authorId !== authorId) {
    throw ApiError.forbidden("You can only delete your own posts");
  }
  await prisma.forumPost.delete({ where: { id: postId } });
}
