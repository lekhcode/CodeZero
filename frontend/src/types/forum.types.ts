export type ForumPostType =
  | "DISCUSSION"
  | "QUESTION"
  | "RESOURCE"
  | "GUIDE"
  | "INTERVIEW_EXPERIENCE";

export type ForumAuthor = {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  avatar: string | null;
};

export type ForumPostSummary = {
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
  author: ForumAuthor;
  likedByMe: boolean;
  problemId: string | null;
};

export type ForumPostDetail = ForumPostSummary & {
  content: string;
};

export type ForumPostFeedPage = {
  items: ForumPostSummary[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type ForumHubFeed = {
  trending: ForumPostSummary[];
  latest: ForumPostSummary[];
  resources: ForumPostSummary[];
  interviewExperiences: ForumPostSummary[];
  popularTopics: Array<{ label: string; count: number; type: ForumPostType }>;
};

export type ForumComment = {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  likeCount: number;
  createdAt: string;
  author: ForumAuthor;
  likedByMe: boolean;
  replyCount: number;
};

export type ForumCommentPage = {
  items: ForumComment[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type ForumLikeResult = {
  liked: boolean;
  likeCount: number;
};

export type CreateForumPostInput = {
  title: string;
  content: string;
  externalLink?: string;
  type: ForumPostType;
  problemId?: string;
};

export type ListForumPostsFilters = {
  cursor?: string;
  limit?: number;
  type?: ForumPostType;
  sort?: "latest" | "trending";
};
