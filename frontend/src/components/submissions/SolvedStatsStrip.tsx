import { useMemo, useState } from "react";
import { Box, Skeleton, Tooltip, Typography, alpha } from "@mui/material";
import { motion } from "framer-motion";
import type { DifficultyLevel, SolvedDifficultyStats } from "@/types/api.types";
import { AnimatedBanner } from "@/components/ui/AnimatedBanner";
import { difficultyColor } from "@/utils/difficulty";
import { miui } from "@/theme/theme";
import { transitionFast } from "@/theme/motion";

type SegmentKey = DifficultyLevel | "TOTAL";

type SolvedStatsStripProps = {
  stats: SolvedDifficultyStats | undefined;
  loading?: boolean;
};

export function SolvedStatsStrip({ stats, loading = false }: SolvedStatsStripProps) {
  const [active, setActive] = useState<SegmentKey | null>(null);

  const total = stats?.total ?? 0;
  const easy = stats?.easy ?? 0;
  const medium = stats?.medium ?? 0;
  const hard = stats?.hard ?? 0;
  const breakdownSum = easy + medium + hard;

  const segments = useMemo(
    () => [
      { key: "EASY" as const, label: "Easy", value: easy, color: difficultyColor("EASY") },
      { key: "MEDIUM" as const, label: "Medium", value: medium, color: difficultyColor("MEDIUM") },
      { key: "HARD" as const, label: "Hard", value: hard, color: difficultyColor("HARD") },
    ],
    [easy, medium, hard],
  );

  const pct = (n: number) => (breakdownSum > 0 ? Math.round((n / breakdownSum) * 100) : 0);

  if (loading) {
    return <Skeleton variant="rounded" height={56} sx={{ borderRadius: 2.5, mb: 1, flexShrink: 0 }} />;
  }

  return (
    <AnimatedBanner
      subtle
      sx={{
        flexShrink: 0,
        width: "100%",
        mb: 1,
        p: { xs: 1.25, sm: 1.5 },
        borderRadius: 2.5,
        border: `1px solid ${miui.border}`,
        bgcolor: miui.paper,
        boxShadow: `0 2px 12px ${alpha(miui.text, 0.04)}`,
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: { md: "center" },
        gap: { xs: 1.25, md: 2 },
      }}
    >
      <Box
        component={motion.button}
        type="button"
        onClick={() => setActive((k) => (k === "TOTAL" ? null : "TOTAL"))}
        whileTap={{ scale: 0.98 }}
        sx={{
          m: 0,
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          bgcolor: active === "TOTAL" ? alpha(miui.primary, 0.1) : alpha(miui.bg, 0.8),
          borderRadius: 2,
          px: 1.5,
          py: 1,
          minWidth: { md: 100 },
          transition: "background 0.15s ease",
          outline: active === "TOTAL" ? `2px solid ${alpha(miui.primary, 0.35)}` : "none",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontSize: "0.62rem",
            color: "text.secondary",
          }}
        >
          Solved
        </Typography>
        <Typography
          variant="h5"
          sx={{ fontWeight: 900, lineHeight: 1.1, color: miui.primary, fontVariantNumeric: "tabular-nums" }}
        >
          {total.toLocaleString()}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
          unique accepted
        </Typography>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
        <Box
          sx={{
            display: "flex",
            height: 10,
            borderRadius: 5,
            overflow: "hidden",
            bgcolor: alpha(miui.text, 0.06),
          }}
        >
          {breakdownSum === 0 ? (
            <Box sx={{ flex: 1, bgcolor: alpha(miui.text, 0.08) }} />
          ) : (
            segments.map((seg) => {
              const widthPct = (seg.value / breakdownSum) * 100;
              if (widthPct <= 0) return null;
              const dimmed = active !== null && active !== seg.key && active !== "TOTAL";
              return (
                <Tooltip
                  key={seg.key}
                  title={`${seg.label}: ${seg.value} (${pct(seg.value)}% of breakdown)`}
                  arrow
                >
                  <Box
                    component={motion.div}
                    layout
                    onMouseEnter={() => setActive(seg.key)}
                    onMouseLeave={() => setActive(null)}
                    onClick={() => setActive((k) => (k === seg.key ? null : seg.key))}
                    sx={{
                      width: `${widthPct}%`,
                      minWidth: seg.value > 0 ? 6 : 0,
                      bgcolor: seg.color,
                      opacity: dimmed ? 0.35 : 1,
                      cursor: "pointer",
                      transition: "opacity 0.15s ease",
                    }}
                  />
                </Tooltip>
              );
            })
          )}
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 0.75,
            mt: 1,
          }}
        >
          {segments.map((seg) => {
            const highlighted = active === seg.key || active === "TOTAL";
            const dimmed = active !== null && !highlighted;
            return (
              <Box
                key={seg.key}
                component={motion.button}
                type="button"
                onMouseEnter={() => setActive(seg.key)}
                onMouseLeave={() => setActive(null)}
                onClick={() => setActive((k) => (k === seg.key ? null : seg.key))}
                whileHover={{ y: -1 }}
                transition={transitionFast}
                sx={{
                  m: 0,
                  border: `1px solid ${highlighted ? alpha(seg.color, 0.5) : miui.border}`,
                  borderRadius: 2,
                  px: 1,
                  py: 0.75,
                  cursor: "pointer",
                  textAlign: "left",
                  bgcolor: highlighted ? alpha(seg.color, 0.1) : alpha(miui.bg, 0.5),
                  opacity: dimmed ? 0.5 : 1,
                  transition: "opacity 0.15s ease, border-color 0.15s ease, background 0.15s ease",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.25 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: seg.color }} />
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 800, fontSize: "0.62rem", textTransform: "uppercase" }}
                  >
                    {seg.label}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: "1.1rem",
                    lineHeight: 1,
                    color: seg.color,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {seg.value}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.62rem" }}>
                  {pct(seg.value)}% mix
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </AnimatedBanner>
  );
}
