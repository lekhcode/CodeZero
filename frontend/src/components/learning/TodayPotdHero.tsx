import {
  Box,
  Button,
  Chip,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import WbSunnyRoundedIcon from "@mui/icons-material/WbSunnyRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import { Link as RouterLink } from "react-router-dom";
import type { TrackedAssignment } from "@/types/api.types";
import { AnimatedBanner } from "@/components/ui/AnimatedBanner";
import { DifficultyChip } from "@/components/ui/DifficultyChip";
import dayjs from "dayjs";

type TodayPotdHeroProps = {
  assignment: TrackedAssignment;
};

const POTD_ACCENT = "#0ea5e9";
const POTD_ACCENT_2 = "#4f46e5";

export function TodayPotdHero({ assignment }: TodayPotdHeroProps) {
  const { problem } = assignment;
  const dateLabel = dayjs(assignment.assignedDate).format("dddd, MMM D");

  return (
    <AnimatedBanner
      accent={POTD_ACCENT}
      accentSecondary={POTD_ACCENT_2}
      sx={{
        mb: 2,
        borderRadius: 3,
        border: `1px solid ${alpha(POTD_ACCENT, 0.35)}`,
        background: `linear-gradient(145deg, ${alpha(POTD_ACCENT, 0.18)} 0%, ${alpha("#fff", 0.98)} 42%, ${alpha(POTD_ACCENT_2, 0.08)} 100%)`,
        boxShadow: `0 8px 32px ${alpha(POTD_ACCENT, 0.12)}`,
      }}
    >
      <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack direction="row" spacing={1} sx={{ mb: 1.25, flexWrap: "wrap", alignItems: "center" }}>
          <Chip
            icon={<AutoAwesomeRoundedIcon sx={{ fontSize: 16 }} />}
            label="Today's LeetCode challenge"
            size="small"
            sx={{
              fontWeight: 800,
              bgcolor: alpha(POTD_ACCENT, 0.16),
              color: "#0369a1",
              "& .MuiChip-icon": { color: "#0284c7" },
            }}
          />
          <Chip label={dateLabel} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" } }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: alpha(POTD_ACCENT, 0.2),
              color: "#0284c7",
              flexShrink: 0,
            }}
          >
            <WbSunnyRoundedIcon sx={{ fontSize: 32 }} />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.25, mb: 0.5 }}>
              {problem.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55, mb: 1.25 }}>
              Official problem of the day — complete it to stay on track with the global daily challenge.
            </Typography>
            <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap" }}>
              <DifficultyChip difficulty={problem.difficulty} />
              {problem.topics.slice(0, 4).map((t) => (
                <Chip key={t} label={t} size="small" variant="outlined" sx={{ height: 24 }} />
              ))}
            </Stack>
          </Box>

          <Button
            component={RouterLink}
            to={`/problems/${problem.slug}`}
            variant="contained"
            size="large"
            endIcon={<PlayArrowRoundedIcon />}
            sx={{
              flexShrink: 0,
              px: 2.5,
              py: 1.1,
              fontWeight: 800,
              whiteSpace: "nowrap",
              background: `linear-gradient(135deg, ${POTD_ACCENT}, ${POTD_ACCENT_2})`,
              boxShadow: `0 4px 14px ${alpha(POTD_ACCENT, 0.35)}`,
            }}
          >
            Start POTD
          </Button>
        </Stack>
      </Box>
    </AnimatedBanner>
  );
}

type TodayPotdEnrollProps = {
  enrolled: boolean;
};

export function TodayPotdEnrollBanner({ enrolled }: TodayPotdEnrollProps) {
  if (enrolled) return null;

  return (
    <AnimatedBanner
      accent={POTD_ACCENT}
      accentSecondary={POTD_ACCENT_2}
      subtle
      sx={{
        mb: 2,
        p: 2,
        borderRadius: 3,
        border: `1px dashed ${alpha(POTD_ACCENT, 0.45)}`,
        bgcolor: alpha(POTD_ACCENT, 0.04),
      }}
    >
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" } }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.35 }}>
            Daily LeetCode challenge
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enroll in Daily POTD to see today&apos;s official problem here every morning.
          </Typography>
        </Box>
        <Button component={RouterLink} to="/templates" variant="contained" size="medium">
          Enable Daily POTD
        </Button>
      </Stack>
    </AnimatedBanner>
  );
}
