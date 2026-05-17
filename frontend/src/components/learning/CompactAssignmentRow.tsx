import { Box, Typography, alpha } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CircleRoundedIcon from "@mui/icons-material/CircleRounded";
import type { TrackedAssignment, TrackedAssignmentStatus } from "@/types/api.types";
import { sectionInsetX } from "@/theme/theme";

const DOT_COLOR: Record<TrackedAssignmentStatus, string> = {
  PENDING: "#0ea5e9",
  SOLVED: "#22c55e",
  MISSED: "#ef4444",
  SKIPPED: "#94a3b8",
};

type CompactAssignmentRowProps = {
  assignment: TrackedAssignment;
  isLast?: boolean;
};

export function CompactAssignmentRow({ assignment, isLast = false }: CompactAssignmentRowProps) {
  const dot = DOT_COLOR[assignment.status];

  return (
    <Box
      component={RouterLink}
      to={`/problems/${assignment.problem.slug}`}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        px: sectionInsetX,
        py: 1,
        minHeight: 48,
        textDecoration: "none",
        color: "inherit",
        borderBottom: isLast ? "none" : `1px solid ${alpha("#0f172a", 0.06)}`,
        "&:hover": { bgcolor: alpha("#4f46e5", 0.04) },
      }}
    >
      <CircleRoundedIcon sx={{ fontSize: 8, color: dot, flexShrink: 0 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            lineHeight: 1.25,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {assignment.problem.title}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.68rem" }}>
          {assignment.scheduleName}
        </Typography>
      </Box>
      <Typography variant="caption" sx={{ fontWeight: 700, color: dot, fontSize: "0.65rem", flexShrink: 0 }}>
        {assignment.status === "PENDING" ? "Start" : assignment.status === "SOLVED" ? "Done" : "Due"}
      </Typography>
      <ChevronRightRoundedIcon sx={{ fontSize: 16, color: alpha("#0f172a", 0.28) }} />
    </Box>
  );
}
