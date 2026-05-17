import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import { motion } from "framer-motion";
import { Link as RouterLink } from "react-router-dom";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import type { TrackedAssignment, TrackedAssignmentStatus } from "@/types/api.types";
import { DifficultyChip } from "@/components/ui/DifficultyChip";
import { neonGlow } from "@/theme/theme";

const STATUS_META: Record<
  TrackedAssignmentStatus,
  { label: string; color: string; overdue?: boolean }
> = {
  PENDING: { label: "Pending", color: "#0ea5e9" },
  SOLVED: { label: "Solved", color: "#059669" },
  MISSED: { label: "Overdue", color: "#dc2626", overdue: true },
  SKIPPED: { label: "Skipped", color: "#64748b" },
};

type TrackedAssignmentCardProps = {
  assignment: TrackedAssignment;
  index?: number;
  highlightDue?: boolean;
};

export function TrackedAssignmentCard({
  assignment,
  index = 0,
  highlightDue = false,
}: TrackedAssignmentCardProps) {
  const meta = STATUS_META[assignment.status];
  const isSolved = assignment.status === "SOLVED";
  const isOverdue = meta.overdue === true || highlightDue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -4 }}
    >
      <Card
        sx={{
          height: "100%",
          border: isOverdue
            ? `1px solid ${alpha("#dc2626", 0.35)}`
            : isSolved
              ? `1px solid ${alpha("#059669", 0.25)}`
              : undefined,
          boxShadow: isOverdue ? neonGlow("#dc2626") : isSolved ? neonGlow("#059669") : undefined,
        }}
      >
        <CardContent>
          <Stack spacing={1.5}>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
                {assignment.problem.title}
              </Typography>
              <DifficultyChip difficulty={assignment.problem.difficulty} />
            </Box>

            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              <Chip label={assignment.scheduleName} size="small" variant="outlined" />
              <Chip
                icon={
                  isSolved ? (
                    <CheckCircleRoundedIcon />
                  ) : isOverdue ? (
                    <WarningAmberRoundedIcon />
                  ) : undefined
                }
                label={meta.label}
                size="small"
                sx={{
                  fontWeight: 800,
                  color: meta.color,
                  bgcolor: alpha(meta.color, 0.08),
                  border: `1px solid ${alpha(meta.color, 0.2)}`,
                }}
              />
              {assignment.submissionCount > 0 && (
                <Chip
                  label={`${assignment.submissionCount} attempt${assignment.submissionCount === 1 ? "" : "s"}`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Stack>

            <Button
              component={RouterLink}
              to={`/problems/${assignment.problem.slug}`}
              variant={isSolved ? "outlined" : "contained"}
              size="small"
              startIcon={<PlayArrowRoundedIcon />}
              sx={{ alignSelf: "flex-start", mt: 0.5 }}
            >
              {isSolved ? "Review" : isOverdue ? "Resume now" : "Open problem"}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );
}
