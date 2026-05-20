import { Box, Button, IconButton, Typography } from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Link as RouterLink } from "react-router-dom";
import type { BrainCacheRevisionTask } from "@/types/brainCache.types";
import { DifficultyChip } from "@/components/ui/DifficultyChip";
import { miui, sectionInsetX } from "@/theme/theme";

type BrainCacheRevisionRowProps = {
  task: BrainCacheRevisionTask;
  variant: "today" | "overdue";
  daysOverdue?: number;
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
  busy?: boolean;
  isLast?: boolean;
};

export function BrainCacheRevisionRow({
  task,
  variant,
  daysOverdue,
  onComplete,
  onSkip,
  busy = false,
  isLast = false,
}: BrainCacheRevisionRowProps) {
  const ctaLabel = variant === "today" ? "Revise →" : "Solve →";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        py: 1.25,
        px: sectionInsetX,
        borderBottom: isLast ? "none" : `1px solid ${miui.border}`,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          component={RouterLink}
          to={`/problems/${task.problem.slug}`}
          sx={{
            fontSize: "14px",
            fontWeight: 500,
            fontFamily: '"Space Grotesk", sans-serif',
            color: miui.text,
            textDecoration: "none",
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            "&:hover": { color: miui.primary },
          }}
        >
          {task.problem.title}
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 0.5, alignItems: "center" }}>
          <DifficultyChip difficulty={task.problem.difficulty} />
          <Typography
            sx={{
              fontSize: "12px",
              color: miui.textMuted,
              fontFamily: "var(--font-number)",
              fontWeight: 400,
            }}
          >
            {task.playlistName}
          </Typography>
          {variant === "overdue" && daysOverdue !== undefined && daysOverdue > 0 ? (
            <Typography sx={{ fontSize: "12px", color: miui.danger, fontWeight: 400 }}>
              {daysOverdue} day{daysOverdue === 1 ? "" : "s"} overdue
            </Typography>
          ) : null}
        </Box>
      </Box>

      <Button
        component={RouterLink}
        to={`/problems/${task.problem.slug}`}
        size="small"
        variant="outlined"
        sx={{ flexShrink: 0, fontSize: "0.75rem", fontWeight: 500, py: 0.35 }}
      >
        {ctaLabel}
      </Button>

      <IconButton
        size="small"
        disabled={busy}
        onClick={() => onSkip(task.id)}
        aria-label="Skip revision"
        sx={{ color: miui.textMuted, "&:hover": { color: miui.text } }}
      >
        <CloseRoundedIcon fontSize="small" />
      </IconButton>
      <Button
        size="small"
        variant="contained"
        disabled={busy}
        onClick={() => onComplete(task.id)}
        startIcon={<CheckRoundedIcon sx={{ fontSize: "16px !important" }} />}
        sx={{ flexShrink: 0, fontWeight: 500, minWidth: 0, px: 1.25 }}
      >
        Done
      </Button>
    </Box>
  );
}
