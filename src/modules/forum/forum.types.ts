import type { ForumPostType } from "@prisma/client";

export type ForumAuthorDto = {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  avatar: string | null;
};

export type ForumPostSummaryDto = {
  id: string;
  title: string;
  contentPreview: string;
  externalLink: string | null;
  linkHost: string | null;
  type: ForumPostType;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  author: ForumAuthorDto;
  likedByMe: boolean;
  problemId: string | null;
};

export type ForumPostDetailDto = ForumPostSummaryDto & {
  content: string;
};

export type ForumPostFeedPage = {
  items: ForumPostSummaryDto[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type ForumHubFeedDto = {
  trending: ForumPostSummaryDto[];
  latest: ForumPostSummaryDto[];
  resources: ForumPostSummaryDto[];
  interviewExperiences: ForumPostSummaryDto[];
  popularTopics: Array<{ label: string; count: number; type: ForumPostType }>;
};

export type ForumCommentDto = {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  likeCount: number;
  createdAt: string;
  author: ForumAuthorDto;
  likedByMe: boolean;
  replyCount: number;
};

export type ForumCommentPage = {
  items: ForumCommentDto[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type ForumLikeResultDto = {
  liked: boolean;
  likeCount: number;
};

const PREVIEW_LEN = 280;

export function previewContent(content: string): string {
  const flat = content.replace(/\s+/g, " ").trim();
  if (flat.length <= PREVIEW_LEN) return flat;
  return `${flat.slice(0, PREVIEW_LEN)}…`;
}
