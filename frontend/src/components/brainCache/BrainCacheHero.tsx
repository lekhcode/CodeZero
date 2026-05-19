import { Box, Button, Grid, LinearProgress, Typography } from "@mui/material";
import PsychologyRoundedIcon from "@mui/icons-material/PsychologyRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import type { BrainCacheAnalytics } from "@/types/brainCache.types";
import { AnimatedBanner } from "@/components/ui/AnimatedBanner";
import { bc } from "@/components/brainCache/brainCacheTheme";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { FadeInCard } from "@/components/ui/FadeInCard";
import { dotGridHeroSx, miui, monoStatSx } from "@/theme/theme";

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
  { key: "revisionStreakDays", label: "Day streak", color: miui.warning },
];

export function BrainCacheHero({ stats, loading = false, onNewPlaylist }: BrainCacheHeroProps) {
  const completionPct = stats?.completionRatePct ?? 0;
  const streak = stats?.revisionStreakDays ?? 0;

  return (
    <AnimatedBanner
      accent={bc.accent}
      accentSecondary={miui.primary}
      subtle
      sx={{
        mb: 2,
        p: 2,
        borderRadius: 3,
        ...dotGridHeroSx,
        border: `1px solid ${miui.border}`,
        boxShadow: "none",
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
            <Typography
              variant="h5"
              sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, letterSpacing: "-0.02em" }}
            >
              Brain Cache
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 520 }}>
            Spaced-repetition playlists — pick a list below, open any problem, and keep your retention on track.
          </Typography>
        </Box>
        <Button
          variant="contained"
          className="solve-btn btn-primary"
          startIcon={<AddRoundedIcon />}
          onClick={onNewPlaylist}
        >
          New playlist
        </Button>
      </Box>

      {!loading && stats ? (
        <>
          <Grid container spacing={1.25} sx={{ mt: 2, pt: 2, borderTop: `1px solid ${miui.border}` }}>
            {METRICS.map((m, index) => (
              <Grid key={m.key} size={{ xs: 6, sm: 3 }}>
                <FadeInCard delay={index * 0.08} className="card">
                  <Box
                    className={m.key === "revisionStreakDays" && streak > 0 ? "streak-active" : undefined}
                    sx={{
                      px: 1.25,
                      py: 1,
                      borderRadius: 1,
                      bgcolor: miui.elevated,
                      border: `1px solid ${miui.border}`,
                    }}
                  >
                    <Typography variant="caption" sx={{ display: "block", mb: 0.35 }}>
                      {m.label}
                    </Typography>
                    <Typography
                      component="div"
                      className={m.key === "revisionStreakDays" ? "streak-number" : undefined}
                      sx={{
                        ...monoStatSx,
                        fontSize: "1.375rem",
                        fontWeight: 700,
                        color: m.key === "revisionStreakDays" && streak > 0 ? miui.ember : m.color,
                        lineHeight: 1.1,
                      }}
                    >
                      <AnimatedNumber value={stats[m.key]} />
                    </Typography>
                  </Box>
                </FadeInCard>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${miui.border}` }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75, gap: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <LocalFireDepartmentRoundedIcon sx={{ fontSize: 18, color: miui.warning }} />
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
                bgcolor: miui.elevated,
                "& .MuiLinearProgress-bar": {
                  borderRadius: 2,
                  background: `linear-gradient(90deg, ${bc.accent}, ${miui.primary})`,
                },
              }}
            />
          </Box>
        </>
      ) : null}
    </AnimatedBanner>
  );
}
