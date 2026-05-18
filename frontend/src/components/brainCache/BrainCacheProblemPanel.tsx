import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import PsychologyRoundedIcon from "@mui/icons-material/PsychologyRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { brainCacheService } from "@/services/brainCache.service";
import { brainCacheKeyPrefix, queryKeys } from "@/hooks/queryKeys";
import { BrainCachePlaylistDialog } from "@/components/brainCache/BrainCachePlaylistDialog";
import { bc } from "@/components/brainCache/brainCacheTheme";
import { miui } from "@/theme/theme";

type BrainCacheProblemPanelProps = {
  problemId: string;
  slug: string;
};

export function BrainCacheProblemPanel({ problemId, slug }: BrainCacheProblemPanelProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [targetPlaylistId, setTargetPlaylistId] = useState("");

  const membershipsQuery = useQuery({
    queryKey: queryKeys.brainCacheMemberships(slug),
    queryFn: () => brainCacheService.membershipsBySlug(slug),
  });

  const playlistsQuery = useQuery({
    queryKey: queryKeys.brainCachePlaylists,
    queryFn: brainCacheService.listPlaylists,
    enabled: open || createOpen,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: brainCacheKeyPrefix });
    void queryClient.invalidateQueries({ queryKey: queryKeys.brainCacheMemberships(slug) });
  };

  const addMutation = useMutation({
    mutationFn: (playlistId: string) => brainCacheService.addProblem(playlistId, problemId),
    onSuccess: () => {
      invalidate();
      setOpen(false);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (playlistId: string) => brainCacheService.removeProblem(playlistId, problemId),
    onSuccess: invalidate,
  });

  const moveMutation = useMutation({
    mutationFn: ({ from, to }: { from: string; to: string }) =>
      brainCacheService.moveProblem(from, problemId, to),
    onSuccess: invalidate,
  });

  const createMutation = useMutation({
    mutationFn: brainCacheService.createPlaylist,
    onSuccess: async (playlist) => {
      await brainCacheService.addProblem(playlist.id, problemId);
      invalidate();
      setCreateOpen(false);
      setOpen(false);
    },
  });

  const memberships = membershipsQuery.data ?? [];
  const inCache = memberships.length > 0;

  return (
    <Box sx={{ mb: 1, flexShrink: 0 }}>
      <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", alignItems: "center" }}>
        <Chip
          icon={<PsychologyRoundedIcon sx={{ fontSize: 16 }} />}
          label={inCache ? "In Brain Cache" : "Brain Cache"}
          size="small"
          onClick={() => setOpen(true)}
          sx={{
            fontWeight: 800,
            cursor: "pointer",
            bgcolor: inCache ? bc.accentLight : miui.paper,
            color: inCache ? bc.accent : "text.primary",
            border: `1px solid ${bc.accentBorder}`,
          }}
        />
        {memberships.map((m) => (
          <Chip
            key={m.playlistId}
            label={m.playlistName}
            size="small"
            onDelete={() => removeMutation.mutate(m.playlistId)}
            disabled={removeMutation.isPending}
            sx={{
              fontWeight: 600,
              bgcolor: bc.accentLight,
              color: bc.accent,
            }}
          />
        ))}
      </Stack>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Brain Cache</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add this problem to a revision playlist or move it between lists.
          </Typography>
          {memberships.length > 0 && playlistsQuery.data && playlistsQuery.data.length > 1 ? (
            <Stack spacing={1} sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                Move to playlist
              </Typography>
              <Select
                size="small"
                value={targetPlaylistId}
                displayEmpty
                onChange={(e) => setTargetPlaylistId(e.target.value)}
              >
                <MenuItem value="" disabled>
                  Choose destination
                </MenuItem>
                {playlistsQuery.data
                  .filter((p) => !memberships.some((m) => m.playlistId === p.id))
                  .map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name}
                    </MenuItem>
                  ))}
              </Select>
              <Button
                size="small"
                variant="outlined"
                disabled={!targetPlaylistId || moveMutation.isPending}
                onClick={() => {
                  const from = memberships[0]?.playlistId;
                  if (from && targetPlaylistId) {
                    moveMutation.mutate({ from, to: targetPlaylistId });
                    setTargetPlaylistId("");
                  }
                }}
              >
                Move
              </Button>
            </Stack>
          ) : null}

          <Stack spacing={1}>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              Add to playlist
            </Typography>
            {playlistsQuery.isLoading ? (
              <Typography variant="body2" color="text.secondary">
                Loading playlists…
              </Typography>
            ) : (
              playlistsQuery.data
                ?.filter((p) => !memberships.some((m) => m.playlistId === p.id))
                .map((p) => (
                  <Button
                    key={p.id}
                    variant="outlined"
                    size="small"
                    disabled={addMutation.isPending}
                    onClick={() => addMutation.mutate(p.id)}
                    sx={{ justifyContent: "flex-start" }}
                  >
                    {p.name}
                  </Button>
                ))
            )}
            <Button
              startIcon={<AddRoundedIcon />}
              size="small"
              onClick={() => setCreateOpen(true)}
              sx={{ mt: 0.5 }}
            >
              Create new playlist
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <BrainCachePlaylistDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        loading={createMutation.isPending}
        onSubmit={(v) => createMutation.mutate({ name: v.name, revisionIntervalDays: v.revisionIntervalDays })}
      />
    </Box>
  );
}
