import type {
  CreateForumPostInput,
  ForumComment,
  ForumCommentPage,
  ForumHubFeed,
  ForumLikeResult,
  ForumPostDetail,
  ForumPostFeedPage,
  ListForumPostsFilters,
} from "@/types/forum.types";
import { api, unwrap } from "./api";

function buildListParams(filters: ListForumPostsFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.cursor !== undefined) params.cursor = filters.cursor;
  if (filters.limit !== undefined) params.limit = String(filters.limit);
  if (filters.type !== undefined) params.type = filters.type;
  if (filters.sort !== undefined) params.sort = filters.sort;
  return params;
}

export const forumService = {
  getHubFeed() {
    return unwrap<ForumHubFeed>(api.get("/api/v1/forum/feed/hub"));
  },

  listPosts(filters: ListForumPostsFilters = {}) {
    return unwrap<ForumPostFeedPage>(api.get("/api/v1/forum/posts", { params: buildListParams(filters) }));
  },

  getPost(id: string) {
    return unwrap<{ post: ForumPostDetail }>(api.get(`/api/v1/forum/posts/${id}`)).then((d) => d.post);
  },

  createPost(body: CreateForumPostInput) {
    return unwrap<{ post: ForumPostDetail }>(api.post("/api/v1/forum/posts", body)).then((d) => d.post);
  },

  listComments(postId: string, cursor?: string, limit = 50) {
    const params: Record<string, string> = { limit: String(limit) };
    if (cursor !== undefined) params.cursor = cursor;
    return unwrap<ForumCommentPage>(
      api.get(`/api/v1/forum/posts/${postId}/comments`, { params }),
    );
  },

  createComment(postId: string, content: string, parentId?: string) {
    return unwrap<{ comment: ForumComment }>(
      api.post(`/api/v1/forum/posts/${postId}/comments`, { content, parentId }),
    ).then((d) => d.comment);
  },

  togglePostLike(postId: string) {
    return unwrap<ForumLikeResult>(api.post(`/api/v1/forum/posts/${postId}/like`));
  },

  toggleCommentLike(commentId: string) {
    return unwrap<ForumLikeResult>(api.post(`/api/v1/forum/comments/${commentId}/like`));
  },
};
