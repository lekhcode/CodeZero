import { Box, Button, Grid, LinearProgress, Typography, alpha } from "@mui/material";
import PsychologyRoundedIcon from "@mui/icons-material/PsychologyRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import type { BrainCacheAnalytics } from "@/types/brainCache.types";
import { AnimatedBanner } from "@/components/ui/AnimatedBanner";
import { bc } from "@/components/brainCache/brainCacheTheme";
import { miui } from "@/theme/theme";

type BrainCacheHeroProps = {
  stats: BrainCacheAnalytics | undefined;
  loading?: boolean;
  onNewPlaylist: () => void;
};

const METRICS: Array<{
  key: keyof Pick<BrainCacheAnalytics, "totalCompleted" | "dueTodayCount" | "overdueCount" | "revisionStreakDays">;
  label: string;
  color: string;
}> = [
  { key: "totalCompleted", label: "Completed", color: bc.success },
  { key: "dueTodayCount", label: "Due today", color: bc.teal },
  { key: "overdueCount", label: "Overdue", color: bc.danger },
  { key: "revisionStreakDays", label: "Day streak", color: "#F59E0B" },
];

export function BrainCacheHero({ stats, loading = false, onNewPlaylist }: BrainCacheHeroProps) {
  const completionPct = stats?.completionRatePct ?? 0;

  return (
    <AnimatedBanner
      accent={bc.accent}
      accentSecondary={miui.accent}
      sx={{
        mb: 2,
        p: 2,
        borderRadius: 3,
        background: `linear-gradient(120deg, ${alpha(bc.accent, 0.1)} 0%, ${alpha(miui.accent, 0.05)} 45%, ${miui.paper} 100%)`,
        border: `1px solid ${miui.border}`,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PsychologyRoundedIcon sx={{ color: bc.accent, fontSize: 26 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: "-0.03em" }}>
              Brain Cache
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 520 }}>
            Spaced-repetition playlists — pick a list below, open any problem, and keep your retention on track.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={onNewPlaylist}>
          New playlist
        </Button>
      </Box>

      {!loading && stats ? (
        <>
          <Grid
            container
            spacing={0}
            sx={{
              mt: 2,
              pt: 2,
              borderTop: `1px solid ${miui.border}`,
            }}
          >
            {METRICS.map((m, i) => (
              <Grid
                key={m.key}
                size={{ xs: 6, sm: 3 }}
                sx={{
                  borderRight: i < METRICS.length - 1 ? { sm: `1px solid ${miui.border}` } : undefined,
                  py: { xs: 1, sm: 0 },
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block" }}>
                  {m.label}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: m.color, lineHeight: 1.2 }}>
                  {stats[m.key]}
                </Typography>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${miui.border}` }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75, gap: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <LocalFireDepartmentRoundedIcon sx={{ fontSize: 18, color: "#F59E0B" }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  30-day revision completion
                </Typography>
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: bc.accent }}>
                {completionPct}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={completionPct}
              sx={{
                height: 8,
                borderRadius: 2,
                bgcolor: alpha(bc.accent, 0.1),
                "& .MuiLinearProgress-bar": {
                  borderRadius: 2,
                  background: `linear-gradient(90deg, ${bc.accent}, ${miui.accent})`,
                },
              }}
            />
          </Box>
        </>
      ) : null}
    </AnimatedBanner>
  );
}
