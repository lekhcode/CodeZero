import { Box, Button, Chip, IconButton, Typography, alpha } from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Link as RouterLink } from "react-router-dom";
import type { BrainCacheRevisionTask } from "@/types/brainCache.types";
import { DifficultyChip } from "@/components/ui/DifficultyChip";
import { bc } from "@/components/brainCache/brainCacheTheme";
import { formatOverdueDayLabel, getUtcDateKey } from "@/utils/date";
import { miui, sectionInsetX } from "@/theme/theme";

const STATUS_COLOR: Record<string, string> = {
  DUE: bc.teal,
  OVERDUE: bc.danger,
  PENDING: miui.textMuted,
};

type BrainCacheRevisionRowProps = {
  task: BrainCacheRevisionTask;
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
  busy?: boolean;
  isLast?: boolean;
};

export function BrainCacheRevisionRow({
  task,
  onComplete,
  onSkip,
  busy = false,
  isLast = false,
}: BrainCacheRevisionRowProps) {
  const accent = STATUS_COLOR[task.status] ?? miui.textMuted;
  const dayLabel = formatOverdueDayLabel(task.dueDate, getUtcDateKey());

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        py: 1,
        px: sectionInsetX,
        borderBottom: isLast ? "none" : `1px solid ${miui.border}`,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          component={RouterLink}
          to={`/problems/${task.problem.slug}`}
          variant="body2"
          sx={{
            fontWeight: 700,
            color: "text.primary",
            textDecoration: "none",
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            "&:hover": { color: bc.accent },
          }}
        >
          {task.problem.title}
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.35, alignItems: "center" }}>
          <Typography variant="caption" color="text.secondary">
            {task.playlistName}
          </Typography>
          <DifficultyChip difficulty={task.problem.difficulty} />
          <Chip
            label={dayLabel}
            size="small"
            sx={{
              height: 20,
              fontSize: "0.62rem",
              fontWeight: 700,
              bgcolor: alpha(accent, 0.1),
              color: accent,
            }}
          />
        </Box>
      </Box>
      <Button
        component={RouterLink}
        to={`/problems/${task.problem.slug}`}
        size="small"
        variant="outlined"
        sx={{ flexShrink: 0, fontWeight: 700, borderColor: bc.accentBorder, color: bc.accent }}
      >
        Solve
      </Button>
      <IconButton size="small" disabled={busy} onClick={() => onSkip(task.id)} aria-label="Skip revision">
        <CloseRoundedIcon fontSize="small" />
      </IconButton>
      <Button
        size="small"
        variant="contained"
        disabled={busy}
        onClick={() => onComplete(task.id)}
        startIcon={<CheckRoundedIcon />}
        sx={{ flexShrink: 0, fontWeight: 700, bgcolor: bc.accent }}
      >
        Done
      </Button>
    </Box>
  );
}
