import { useState } from "react";
import { Grid } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageContainer } from "@/components/ui/PageContainer";
import { SectionCard } from "@/components/ui/SectionCard";
import { BrainCacheHero } from "@/components/brainCache/BrainCacheHero";
import { BrainCachePlaylistExplorer } from "@/components/brainCache/BrainCachePlaylistExplorer";
import { BrainCachePlaylistDialog } from "@/components/brainCache/BrainCachePlaylistDialog";
import { BrainCacheRevisionsPanel } from "@/components/brainCache/BrainCacheRevisionsPanel";
import { brainCacheService } from "@/services/brainCache.service";
import { brainCacheKeyPrefix, queryKeys } from "@/hooks/queryKeys";
import { getUtcDateKey } from "@/utils/date";
import { sectionContentSx } from "@/theme/theme";

export function BrainCachePage() {
  const queryClient = useQueryClient();
  const todayKey = getUtcDateKey();
  const [createOpen, setCreateOpen] = useState(false);

  const playlistsQuery = useQuery({
    queryKey: queryKeys.brainCachePlaylists,
    queryFn: brainCacheService.listPlaylists,
  });

  const todayQuery = useQuery({
    queryKey: queryKeys.brainCacheToday(todayKey),
    queryFn: brainCacheService.todayRevisions,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const overdueQuery = useQuery({
    queryKey: queryKeys.brainCacheOverdue(todayKey),
    queryFn: brainCacheService.overdueRevisions,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const analyticsQuery = useQuery({
    queryKey: queryKeys.brainCacheAnalytics,
    queryFn: brainCacheService.getAnalytics,
  });

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: brainCacheKeyPrefix });

  const createMutation = useMutation({
    mutationFn: brainCacheService.createPlaylist,
    onSuccess: () => {
      invalidate();
      setCreateOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: brainCacheService.deletePlaylist,
    onSuccess: invalidate,
  });

  const revisionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "complete" | "skip" }) =>
      action === "complete"
        ? brainCacheService.completeRevision(id)
        : brainCacheService.skipRevision(id),
    onSuccess: invalidate,
  });

  const busy = revisionMutation.isPending;
  const playlists = playlistsQuery.data ?? [];

  return (
    <PageContainer sx={{ maxWidth: 1200 }}>
      <BrainCacheHero
        stats={analyticsQuery.data}
        loading={analyticsQuery.isLoading}
        onNewPlaylist={() => setCreateOpen(true)}
      />

      <SectionCard title="Your playlists" bodySx={{ ...sectionContentSx, pt: 1.5, pb: 1.5 }}>
        <BrainCachePlaylistExplorer
          playlists={playlists}
          loading={playlistsQuery.isLoading}
          onDelete={(id) => deleteMutation.mutate(id)}
          deleting={deleteMutation.isPending}
        />
      </SectionCard>

      <Grid container spacing={2} sx={{ mt: 0 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <BrainCacheRevisionsPanel
            title="Today's revisions"
            tasks={todayQuery.data ?? []}
            onComplete={(id) => revisionMutation.mutate({ id, action: "complete" })}
            onSkip={(id) => revisionMutation.mutate({ id, action: "skip" })}
            busy={busy}
            emptyMessage="Nothing due today — great retention."
            accentBorder="#14B8A6"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <BrainCacheRevisionsPanel
            title="Overdue revisions"
            tasks={overdueQuery.data ?? []}
            onComplete={(id) => revisionMutation.mutate({ id, action: "complete" })}
            onSkip={(id) => revisionMutation.mutate({ id, action: "skip" })}
            busy={busy}
            paginateByDay
            emptyMessage="No overdue revisions."
            accentBorder="#EF4444"
          />
        </Grid>
      </Grid>

      <BrainCachePlaylistDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        loading={createMutation.isPending}
        onSubmit={(v) => createMutation.mutate({ name: v.name, revisionIntervalDays: v.revisionIntervalDays })}
      />
    </PageContainer>
  );
}
