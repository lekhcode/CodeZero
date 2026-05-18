import type {
  BrainCacheAnalytics,
  BrainCachePlaylist,
  BrainCachePlaylistProblemEntry,
  BrainCacheProblemMembership,
  BrainCacheRevisionTask,
  CreateBrainCachePlaylistInput,
  UpdateBrainCachePlaylistInput,
} from "@/types/brainCache.types";
import { api, unwrap } from "./api";

export const brainCacheService = {
  async listPlaylists(): Promise<BrainCachePlaylist[]> {
    const data = await unwrap<{ playlists: BrainCachePlaylist[] }>(
      api.get("/api/v1/brain-cache/playlists"),
    );
    return data.playlists;
  },

  createPlaylist(input: CreateBrainCachePlaylistInput) {
    return unwrap<{ playlist: BrainCachePlaylist }>(
      api.post("/api/v1/brain-cache/playlists", input),
    ).then((d) => d.playlist);
  },

  updatePlaylist(id: string, input: UpdateBrainCachePlaylistInput) {
    return unwrap<{ playlist: BrainCachePlaylist }>(
      api.patch(`/api/v1/brain-cache/playlists/${id}`, input),
    ).then((d) => d.playlist);
  },

  deletePlaylist(id: string) {
    return unwrap<{ deleted: boolean }>(api.delete(`/api/v1/brain-cache/playlists/${id}`));
  },

  async listPlaylistProblems(playlistId: string): Promise<BrainCachePlaylistProblemEntry[]> {
    const data = await unwrap<{ problems: BrainCachePlaylistProblemEntry[] }>(
      api.get(`/api/v1/brain-cache/playlists/${playlistId}/problems`),
    );
    return data.problems;
  },

  addProblem(playlistId: string, problemId: string) {
    return unwrap<{ playlistProblemId: string }>(
      api.post(`/api/v1/brain-cache/playlists/${playlistId}/problems`, { problemId }),
    );
  },

  removeProblem(playlistId: string, problemId: string) {
    return unwrap<{ removed: boolean }>(
      api.delete(`/api/v1/brain-cache/playlists/${playlistId}/problems/${problemId}`),
    );
  },

  moveProblem(fromPlaylistId: string, problemId: string, toPlaylistId: string) {
    return unwrap<{ playlistProblemId: string }>(
      api.post(
        `/api/v1/brain-cache/playlists/${fromPlaylistId}/problems/${problemId}/move`,
        { toPlaylistId },
      ),
    );
  },

  async membershipsBySlug(slug: string): Promise<BrainCacheProblemMembership[]> {
    const data = await unwrap<{ memberships: BrainCacheProblemMembership[] }>(
      api.get(`/api/v1/brain-cache/problems/by-slug/${encodeURIComponent(slug)}/playlists`),
    );
    return data.memberships;
  },

  async todayRevisions(): Promise<BrainCacheRevisionTask[]> {
    const data = await unwrap<{ revisions: BrainCacheRevisionTask[] }>(
      api.get("/api/v1/brain-cache/revisions/today"),
    );
    return data.revisions;
  },

  async overdueRevisions(): Promise<BrainCacheRevisionTask[]> {
    const data = await unwrap<{ revisions: BrainCacheRevisionTask[] }>(
      api.get("/api/v1/brain-cache/revisions/overdue"),
    );
    return data.revisions;
  },

  completeRevision(id: string) {
    return unwrap<{ revision: BrainCacheRevisionTask }>(
      api.patch(`/api/v1/brain-cache/revisions/${id}/complete`),
    ).then((d) => d.revision);
  },

  skipRevision(id: string) {
    return unwrap<{ revision: BrainCacheRevisionTask }>(
      api.patch(`/api/v1/brain-cache/revisions/${id}/skip`),
    ).then((d) => d.revision);
  },

  getAnalytics() {
    return unwrap<BrainCacheAnalytics>(api.get("/api/v1/brain-cache/analytics"));
  },
};
