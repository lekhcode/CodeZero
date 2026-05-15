import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import WbSunnyRoundedIcon from "@mui/icons-material/WbSunnyRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import { Link as RouterLink } from "react-router-dom";
import type { AssignmentStatus, ProblemDetail } from "@/types/api.types";
import { DifficultyChip } from "@/components/ui/DifficultyChip";
import dayjs from "dayjs";

type DailyPotdHeroProps = {
  problem: ProblemDetail | null;
  status: AssignmentStatus;
  challengeDate?: string;
  enrolled: boolean;
};

export function DailyPotdHero({ problem, status, challengeDate, enrolled }: DailyPotdHeroProps) {
  const dateLabel = challengeDate
    ? dayjs(challengeDate).format("MMMM D, YYYY")
    : dayjs().format("MMMM D, YYYY");

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, sm: 3.5 },
        mb: 3,
        borderRadius: 4,
        overflow: "hidden",
        position: "relative",
        border: `1px solid ${alpha("#0ea5e9", 0.25)}`,
        background: `linear-gradient(135deg, ${alpha("#0ea5e9", 0.12)} 0%, ${alpha("#ffffff", 0.95)} 45%, ${alpha("#4f46e5", 0.06)} 100%)`,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 160,
          height: 160,
          borderRadius: "50%",
          bgcolor: alpha("#0ea5e9", 0.15),
        }}
      />
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={3}
        sx={{ alignItems: { md: "center" } }}
      >
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: alpha("#0ea5e9", 0.15),
            color: "#0284c7",
            flexShrink: 0,
          }}
        >
          <WbSunnyRoundedIcon sx={{ fontSize: 40 }} />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap", alignItems: "center" }}>
            <Chip
              icon={<AutoAwesomeRoundedIcon />}
              label="LeetCode Problem of the Day"
              size="small"
              sx={{
                fontWeight: 700,
                bgcolor: alpha("#0ea5e9", 0.15),
                color: "#0369a1",
                "& .MuiChip-icon": { color: "#0284c7" },
              }}
            />
            <Chip label={dateLabel} size="small" variant="outlined" />
          </Stack>

          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: "-0.02em", mb: 1 }}>
            {problem ? problem.title : "Your daily challenge"}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, maxWidth: 640 }}>
            {problem
              ? "This is today’s official LeetCode challenge — the same problem millions of developers solve worldwide. Complete it to keep your streak alive."
              : enrolled
                ? "We couldn’t load today’s challenge yet. Make sure the backend is running, then refresh — or visit Explore if you haven’t enrolled in Daily POTD."
                : "Add the Daily POTD schedule to get one official LeetCode problem every day — a simple habit that compounds into interview readiness."}
          </Typography>

          {problem && (
            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap", alignItems: "center" }}>
              <DifficultyChip difficulty={problem.difficulty} />
              {problem.topics.slice(0, 3).map((t) => (
                <Chip key={t} label={t} size="small" variant="outlined" />
              ))}
            </Stack>
          )}
        </Box>

        <Stack spacing={1} sx={{ flexShrink: 0, width: { xs: "100%", md: "auto" } }}>
          {problem && status === "ready" ? (
            <Button
              component={RouterLink}
              to={`/problems/${problem.slug}`}
              variant="contained"
              size="large"
              endIcon={<OpenInNewRoundedIcon />}
              sx={{
                px: 3,
                background: "linear-gradient(135deg, #0ea5e9, #4f46e5)",
              }}
            >
              Solve today&apos;s POTD
            </Button>
          ) : enrolled ? (
            <Button variant="outlined" size="large" disabled>
              Waiting for sync
            </Button>
          ) : (
            <Button component={RouterLink} to="/templates" variant="contained" size="large">
              Enable Daily POTD
            </Button>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}
