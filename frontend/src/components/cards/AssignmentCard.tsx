import { Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { Link as RouterLink } from "react-router-dom";
import type { AssignmentStatus, ProblemDetail } from "@/types/api.types";
import { DifficultyChip } from "@/components/ui/DifficultyChip";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";

type AssignmentCardProps = {
  problem: ProblemDetail;
  templateName: string;
  status: AssignmentStatus;
  index?: number;
};

const statusLabel: Record<AssignmentStatus, string> = {
  ready: "Ready",
  pending: "Coming soon",
  unavailable: "Unavailable",
  completed: "Plan complete",
};

export function AssignmentCard({ problem, templateName, status, index = 0 }: AssignmentCardProps) {
  const canSolve = status === "ready";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={canSolve ? { y: -3 } : undefined}
    >
    <Card>
      <CardContent>
        <Stack spacing={1.5}>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {problem.title}
            </Typography>
            <DifficultyChip difficulty={problem.difficulty} />
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            <Chip label={templateName} size="small" variant="outlined" />
            <Chip
              label={statusLabel[status]}
              size="small"
              color={status === "ready" ? "success" : "default"}
              variant="outlined"
            />
            {problem.isPremium && <Chip label="Premium" size="small" color="warning" />}
          </Stack>
          {problem.topics.length > 0 && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {problem.topics.slice(0, 4).join(" · ")}
            </Typography>
          )}
          <Button
            component={canSolve ? RouterLink : "button"}
            to={canSolve ? `/problems/${problem.slug}` : undefined}
            variant="contained"
            size="small"
            disabled={!canSolve}
            startIcon={<PlayArrowRoundedIcon />}
            sx={{ alignSelf: "flex-start", mt: 0.5 }}
          >
            {canSolve ? "Open problem" : "Solve (soon)"}
          </Button>
        </Stack>
      </CardContent>
    </Card>
    </motion.div>
  );
}
