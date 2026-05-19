import {
  Box,
  Button,
  IconButton,
  Typography,
  alpha,
} from "@mui/material";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { Link as RouterLink } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BrainCachePlaylist } from "@/types/brainCache.types";
import { DifficultyChip } from "@/components/ui/DifficultyChip";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { brainCacheService } from "@/services/brainCache.service";
import { brainCacheKeyPrefix, queryKeys } from "@/hooks/queryKeys";
import { formatOverdueDayLabel, getUtcDateKey } from "@/utils/date";
import { miui, sectionInsetX } from "@/theme/theme";

type BrainCachePlaylistProblemsListProps = {
  playlist: BrainCachePlaylist;
};

export function BrainCachePlaylistProblemsList({ playlist }: BrainCachePlaylistProblemsListProps) {
  const queryClient = useQueryClient();
  const todayKey = getUtcDateKey();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.brainCachePlaylistProblems(playlist.id),
    queryFn: () => brainCacheService.listPlaylistProblems(playlist.id),
  });

  const removeMutation = useMutation({
    mutationFn: (problemId: string) => brainCacheService.removeProblem(playlist.id, problemId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: brainCacheKeyPrefix }),
  });

  const problems = data ?? [];

  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <LoadingSkeleton variant="list" count={4} />
      </Box>
    );
  }

  if (problems.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 4, px: sectionInsetX, textAlign: "center" }}>
        This playlist is empty. Open a problem and tap Brain Cache to add it here.
      </Typography>
    );
  }

  return (
    <Box>
      {problems.map((entry, i) => (
        <Box
          key={entry.playlistProblemId}
          component={RouterLink}
          to={`/problems/${entry.problem.slug}`}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            px: sectionInsetX,
            py: 1.15,
            minHeight: 52,
            textDecoration: "none",
            color: "inherit",
            borderBottom: i < problems.length - 1 ? `1px solid ${miui.border}` : "none",
            "&:hover": { bgcolor: alpha(miui.primary, 0.04) },
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                {entry.problem.title}
              </Typography>
              <DifficultyChip difficulty={entry.problem.difficulty} />
            </Box>
            <Typography variant="caption" color="text.secondary">
              {entry.nextDueDate !== null
                ? `Next revision: ${formatOverdueDayLabel(entry.nextDueDate, todayKey)}`
                : "On interval schedule"}
            </Typography>
          </Box>
          <Button
            component="span"
            size="small"
            variant="contained"
            className="solve-btn btn-primary"
            tabIndex={-1}
            endIcon={<PlayArrowRoundedIcon />}
            sx={{ flexShrink: 0, fontWeight: 700, pointerEvents: "none" }}
          >
            Solve
          </Button>
          <IconButton
            size="small"
            component="span"
            aria-label="Remove"
            disabled={removeMutation.isPending}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              removeMutation.mutate(entry.problem.id);
            }}
            sx={{ flexShrink: 0, color: "text.secondary" }}
          >
            <DeleteOutlineRoundedIcon fontSize="small" />
          </IconButton>
          <ChevronRightRoundedIcon sx={{ fontSize: 18, color: alpha(miui.text, 0.2), flexShrink: 0 }} />
        </Box>
      ))}
    </Box>
  );
}
