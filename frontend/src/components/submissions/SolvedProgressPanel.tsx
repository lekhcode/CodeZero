import { useMemo, useState } from "react";
import { Box, Skeleton, Typography } from "@mui/material";
import { motion } from "framer-motion";
import type { DifficultyLevel, ProblemCatalogStats, SolvedDifficultyStats } from "@/types/api.types";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { miui, monoStatSx } from "@/theme/theme";
import { transitionFast } from "@/theme/motion";
import { SolvedProgressRing } from "@/components/submissions/SolvedProgressRing";

type SolvedProgressPanelProps = {
  solved: SolvedDifficultyStats | undefined;
  catalog: ProblemCatalogStats | undefined;
  loading?: boolean;
};

type DifficultyRow = {
  key: DifficultyLevel;
  label: string;
  solved: number;
  total: number;
  color: string;
};

export function SolvedProgressPanel({ solved, catalog, loading = false }: SolvedProgressPanelProps) {
  const [hovered, setHovered] = useState<DifficultyLevel | null>(null);

  const rows: DifficultyRow[] = useMemo(
    () => [
      {
        key: "EASY",
        label: "Easy",
        solved: solved?.easy ?? 0,
        total: catalog?.easy ?? 0,
        color: miui.success,
      },
      {
        key: "MEDIUM",
        label: "Medium",
        solved: solved?.medium ?? 0,
        total: catalog?.medium ?? 0,
        color: miui.caution,
      },
      {
        key: "HARD",
        label: "Hard",
        solved: solved?.hard ?? 0,
        total: catalog?.hard ?? 0,
        color: miui.danger,
      },
    ],
    [solved, catalog],
  );

  if (loading) {
    return <Skeleton variant="rounded" height={180} sx={{ borderRadius: 2.5, width: "100%" }} />;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: "center",
        gap: 4,
        minWidth: 0,
      }}
    >
      <SolvedProgressRing solved={solved} catalog={catalog} />

      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1.25, width: "100%" }}>
        {rows.map((row) => {
          const active = hovered === row.key;
          const dimmed = hovered !== null && !active;
          const pct = row.total > 0 ? Math.round((row.solved / row.total) * 100) : 0;

          return (
            <Box
              key={row.key}
              component={motion.button}
              type="button"
              onMouseEnter={() => setHovered(row.key)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setHovered((k) => (k === row.key ? null : row.key))}
              whileHover={{ scale: 1.01 }}
              transition={transitionFast}
              sx={{
                m: 0,
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
                border: "none",
                background: "transparent",
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                opacity: dimmed ? 0.45 : 1,
                transition: "opacity 150ms ease",
                p: 0,
              }}
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "2px",
                  bgcolor: row.color,
                  flexShrink: 0,
                }}
              />
              <Typography sx={{ fontSize: "13px", fontWeight: 400, color: miui.textMuted, flex: 1 }}>
                {row.label}
              </Typography>
              <Box sx={{ textAlign: "right" }}>
                <Typography
                  sx={{
                    ...monoStatSx,
                    fontSize: "13px",
                    fontWeight: 500,
                    color: miui.text,
                  }}
                >
                  <AnimatedNumber value={row.solved} duration={500} /> /{" "}
                  <AnimatedNumber value={row.total} duration={500} />
                </Typography>
                <Typography
                  sx={{
                    ...monoStatSx,
                    fontSize: "11px",
                    fontWeight: 400,
                    color: miui.textDim,
                    display: "block",
                  }}
                >
                  {pct}%
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
