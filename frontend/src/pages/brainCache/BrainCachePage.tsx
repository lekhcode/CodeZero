import { useState } from "react";
import { Badge, Box, Button, Stack, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FixedPageShell, ScrollRegion } from "@/components/layout/FixedPageShell";
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
import { dashNavTabSx, miui, sectionContentSx } from "@/theme/theme";

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
    <FixedPageShell>
      <Box
        sx={{
          flexShrink: 0,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 1,
          mb: 1,
          minWidth: 0,
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            Brain Cache
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Spaced-repetition playlists and revision queue
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="small"
          className="solve-btn btn-primary"
          startIcon={<AddRoundedIcon sx={{ fontSize: 18 }} />}
          onClick={() => setCreateOpen(true)}
          sx={{ flexShrink: 0, textTransform: "none", fontWeight: 600 }}
        >
          New playlist
        </Button>
      </Box>

      <Stack
        direction="row"
        spacing={0.5}
        sx={{ flexShrink: 0, mb: 1.5, borderBottom: `1px solid ${miui.border}` }}
      >
        <Button
          variant="text"
          size="small"
          onClick={() => setSection("playlists")}
          sx={dashNavTabSx(section === "playlists")}
        >
          Playlists
        </Button>
        <Badge
          color="error"
          variant="dot"
          invisible={smartPending <= 0}
          sx={{ "& .MuiBadge-badge": { right: 4, top: 4 } }}
        >
          <Button
            variant="text"
            size="small"
            onClick={() => setSection("smart")}
            sx={dashNavTabSx(section === "smart")}
          >
            Smart Revisions
          </Button>
        </Badge>
      </Stack>

      <ScrollRegion sx={{ pb: 0.5 }}>
        <BrainCacheHero stats={analyticsQuery.data} loading={analyticsQuery.isLoading} embedded />

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
      </ScrollRegion>

      <BrainCachePlaylistDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        loading={createMutation.isPending}
        onSubmit={(v) => createMutation.mutate({ name: v.name, revisionIntervalDays: v.revisionIntervalDays })}
      />
    </FixedPageShell>
  );
}
