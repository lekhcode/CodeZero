import { Box, Typography, alpha } from "@mui/material";
import PsychologyRoundedIcon from "@mui/icons-material/PsychologyRounded";
import { Link as RouterLink } from "react-router-dom";
import type { BrainCacheRevisionTask } from "@/types/brainCache.types";
import { sectionInsetX } from "@/theme/theme";

type BrainCacheCompactRevisionRowProps = {
  task: BrainCacheRevisionTask;
  isLast?: boolean;
};

export function BrainCacheCompactRevisionRow({ task, isLast = false }: BrainCacheCompactRevisionRowProps) {
  return (
    <Box
      component={RouterLink}
      to={`/problems/${task.problem.slug}`}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: sectionInsetX,
        py: 1,
        minHeight: 48,
        textDecoration: "none",
        color: "inherit",
        borderBottom: isLast ? "none" : `1px solid ${alpha("#0f172a", 0.06)}`,
        "&:hover": { bgcolor: alpha("#7C3AED", 0.06) },
      }}
    >
      <PsychologyRoundedIcon sx={{ fontSize: 18, color: "#7C3AED", flexShrink: 0 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {task.problem.title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {task.playlistName}
        </Typography>
      </Box>
      <Typography variant="caption" sx={{ fontWeight: 700, color: task.status === "OVERDUE" ? "#ef4444" : "#7C3AED" }}>
        Revise
      </Typography>
    </Box>
  );
}
