import { useMemo, useState } from "react";
import { Box, Skeleton, Typography, alpha } from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { motion } from "framer-motion";
import type { DifficultyLevel, ProblemCatalogStats, SolvedDifficultyStats } from "@/types/api.types";
import { difficultyColor } from "@/utils/difficulty";
import { miui } from "@/theme/theme";
import { transitionFast } from "@/theme/motion";

type SolvedProgressPanelProps = {
  solved: SolvedDifficultyStats | undefined;
  catalog: ProblemCatalogStats | undefined;
  loading?: boolean;
};

type DifficultyRow = {
  key: DifficultyLevel;
  label: string;
  shortLabel: string;
  solved: number;
  total: number;
  color: string;
};

const RING_SIZE = 152;
const STROKE = 11;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

function RingSegment({
  rotationDeg,
  sweepDeg,
  progress,
  color,
  dimmed,
}: {
  rotationDeg: number;
  sweepDeg: number;
  progress: number;
  color: string;
  dimmed: boolean;
}) {
  if (sweepDeg <= 0.5) return null;
  const segLen = (sweepDeg / 360) * CIRC;
  const filled = Math.max(0, Math.min(1, progress)) * segLen;
  const cx = RING_SIZE / 2;
  const cy = RING_SIZE / 2;

  return (
    <g
      opacity={dimmed ? 0.28 : 1}
      style={{ transition: "opacity 0.18s ease" }}
      transform={`rotate(${rotationDeg - 90} ${cx} ${cy})`}
    >
      <circle
        cx={cx}
        cy={cy}
        r={RADIUS}
        fill="none"
        stroke={alpha(miui.text, 0.1)}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={`${segLen} ${CIRC - segLen}`}
      />
      <circle
        cx={cx}
        cy={cy}
        r={RADIUS}
        fill="none"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={`${filled} ${CIRC - filled}`}
        style={{ transition: "stroke-dasharray 0.45s ease" }}
      />
    </g>
  );
}

export function SolvedProgressPanel({ solved, catalog, loading = false }: SolvedProgressPanelProps) {
  const [hovered, setHovered] = useState<DifficultyLevel | "ALL" | null>(null);

  const solvedTotal = solved?.total ?? 0;
  const catalogTotal = catalog?.total ?? 0;

  const rows: DifficultyRow[] = useMemo(
    () => [
      {
        key: "EASY",
        label: "Easy",
        shortLabel: "Easy",
        solved: solved?.easy ?? 0,
        total: catalog?.easy ?? 0,
        color: difficultyColor("EASY"),
      },
      {
        key: "MEDIUM",
        label: "Medium",
        shortLabel: "Med.",
        solved: solved?.medium ?? 0,
        total: catalog?.medium ?? 0,
        color: difficultyColor("MEDIUM"),
      },
      {
        key: "HARD",
        label: "Hard",
        shortLabel: "Hard",
        solved: solved?.hard ?? 0,
        total: catalog?.hard ?? 0,
        color: difficultyColor("HARD"),
      },
    ],
    [solved, catalog],
  );

  const catalogSum = rows.reduce((s, r) => s + r.total, 0) || 1;

  let cursor = 0;
  const segments = rows.map((row) => {
    const sweep = (row.total / catalogSum) * 360;
    const seg = {
      ...row,
      startDeg: cursor,
      sweepDeg: sweep,
      progress: row.total > 0 ? row.solved / row.total : 0,
    };
    cursor += sweep;
    return seg;
  });

  if (loading) {
    return <Skeleton variant="rounded" height={180} sx={{ borderRadius: 2.5, width: "100%" }} />;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { sm: "center" },
        gap: 2,
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: RING_SIZE,
          height: RING_SIZE,
          flexShrink: 0,
          mx: { xs: "auto", sm: 0 },
        }}
        onMouseLeave={() => setHovered(null)}
      >
        <svg width={RING_SIZE} height={RING_SIZE}>
          {segments.map((seg) => (
            <RingSegment
              key={seg.key}
              rotationDeg={seg.startDeg}
              sweepDeg={seg.sweepDeg}
              progress={seg.progress}
              color={seg.color}
              dimmed={hovered !== null && hovered !== "ALL" && hovered !== seg.key}
            />
          ))}
        </svg>

        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            px: 1,
          }}
        >
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: "1.35rem",
              lineHeight: 1.1,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.02em",
            }}
          >
            {solvedTotal.toLocaleString()}
            <Typography
              component="span"
              sx={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "text.secondary",
                ml: 0.25,
              }}
            >
              /{catalogTotal.toLocaleString()}
            </Typography>
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.35, mt: 0.35 }}>
            <CheckCircleRoundedIcon sx={{ fontSize: 14, color: difficultyColor("EASY") }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", fontSize: "0.72rem" }}>
              Solved
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 0.75, width: "100%" }}>
        {rows.map((row) => {
          const active = hovered === row.key || hovered === "ALL";
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
                border: `1px solid ${active ? alpha(row.color, 0.45) : miui.border}`,
                borderRadius: 2,
                px: 1.5,
                py: 1,
                bgcolor: active ? alpha(row.color, 0.08) : alpha(miui.bg, 0.65),
                opacity: dimmed ? 0.45 : 1,
                transition: "opacity 0.15s ease, border-color 0.15s ease, background 0.15s ease",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 1 }}>
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.8rem",
                    color: row.color,
                    letterSpacing: "0.02em",
                  }}
                >
                  {row.shortLabel}
                </Typography>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    fontVariantNumeric: "tabular-nums",
                    color: "text.primary",
                  }}
                >
                  {row.solved}/{row.total}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem", mt: 0.25 }}>
                {pct}% of {row.label.toLowerCase()} catalog
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
