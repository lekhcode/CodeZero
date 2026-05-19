import { useState } from "react";
import { Badge, Box, Button } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageContainer } from "@/components/ui/PageContainer";
import { SectionCard } from "@/components/ui/SectionCard";
import { BrainCacheHero } from "@/components/brainCache/BrainCacheHero";
import { BrainCachePlaylistExplorer } from "@/components/brainCache/BrainCachePlaylistExplorer";
import { BrainCachePlaylistDialog } from "@/components/brainCache/BrainCachePlaylistDialog";
import { BrainCacheRevisionsPanel } from "@/components/brainCache/BrainCacheRevisionsPanel";
import { SmartRevisionsTab } from "@/components/smartRevisions/SmartRevisionsTab";
import { brainCacheService } from "@/services/brainCache.service";
import { autoRevisionService } from "@/services/autoRevision.service";
import {
  autoRevisionKeyPrefix,
  brainCacheKeyPrefix,
  dueCalendarDayPrefix,
  dueCalendarSummaryPrefix,
  queryKeys,
} from "@/hooks/queryKeys";
import { getUtcDateKey } from "@/utils/date";
import { getClientTimezone } from "@/utils/timezone";
import { dashNavTabSx, sectionContentSx } from "@/theme/theme";

type BrainCacheSection = "playlists" | "smart";

export function BrainCachePage() {
  const queryClient = useQueryClient();
  const todayKey = getUtcDateKey();
  const tz = getClientTimezone();
  const [section, setSection] = useState<BrainCacheSection>("playlists");
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

  const smartSummaryQuery = useQuery({
    queryKey: queryKeys.autoRevisionSummary(tz),
    queryFn: () => autoRevisionService.summary(tz),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: brainCacheKeyPrefix });
    void queryClient.invalidateQueries({ queryKey: autoRevisionKeyPrefix });
    void queryClient.invalidateQueries({ queryKey: dueCalendarSummaryPrefix });
    void queryClient.invalidateQueries({ queryKey: dueCalendarDayPrefix });
  };

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
  const smartPending = smartSummaryQuery.data?.todayPending ?? 0;

  return (
    <PageContainer sx={{ maxWidth: 1200 }}>
      <BrainCacheHero
        stats={analyticsQuery.data}
        loading={analyticsQuery.isLoading}
        onNewPlaylist={() => setCreateOpen(true)}
      />

      <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
        <Button
          variant={section === "playlists" ? "contained" : "outlined"}
          onClick={() => setSection("playlists")}
          sx={dashNavTabSx(section === "playlists")}
        >
          Playlists
        </Button>
        <Badge
          color="error"
          variant="dot"
          invisible={smartPending <= 0}
          sx={{ "& .MuiBadge-badge": { right: 6, top: 6 } }}
        >
          <Button
            variant={section === "smart" ? "contained" : "outlined"}
            onClick={() => setSection("smart")}
            sx={dashNavTabSx(section === "smart")}
          >
            Smart Revisions
          </Button>
        </Badge>
      </Box>

      {section === "smart" ? (
        <SmartRevisionsTab />
      ) : (
        <>
          <SectionCard title="Your playlists" bodySx={{ ...sectionContentSx, pt: 1.5, pb: 1.5 }}>
            <BrainCachePlaylistExplorer
              playlists={playlists}
              loading={playlistsQuery.isLoading}
              onDelete={(id) => deleteMutation.mutate(id)}
              deleting={deleteMutation.isPending}
            />
          </SectionCard>

          <BrainCacheRevisionsPanel
            variant="today"
            title="Today's revisions"
            tasks={todayQuery.data ?? []}
            onComplete={(id) => revisionMutation.mutate({ id, action: "complete" })}
            onSkip={(id) => revisionMutation.mutate({ id, action: "skip" })}
            busy={busy}
            emptyMessage="Nothing due — you've earned rest."
          />

          <BrainCacheRevisionsPanel
            variant="overdue"
            title="Overdue revisions"
            tasks={overdueQuery.data ?? []}
            onComplete={(id) => revisionMutation.mutate({ id, action: "complete" })}
            onSkip={(id) => revisionMutation.mutate({ id, action: "skip" })}
            busy={busy}
            paginateByDay
            emptyMessage="Backlog clear. Discipline is showing."
          />
        </>
      )}

      <BrainCachePlaylistDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        loading={createMutation.isPending}
        onSubmit={(v) => createMutation.mutate({ name: v.name, revisionIntervalDays: v.revisionIntervalDays })}
      />
    </PageContainer>
  );
}
