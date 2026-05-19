import { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import type { ProblemCatalogStats, SolvedDifficultyStats } from "@/types/api.types";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { miui, monoStatSx } from "@/theme/theme";

const SIZE = 120;
const CX = 60;
const CY = 60;
const R = 46;
const STROKE = 8;
const CIRC = 2 * Math.PI * R;

const ARC_EASE = [0.4, 0, 0.2, 1] as const;

type ArcSpec = {
  key: string;
  color: string;
  fraction: number;
  dashOffset: number;
  delay: number;
};

type SolvedProgressRingProps = {
  solved: SolvedDifficultyStats | undefined;
  catalog: ProblemCatalogStats | undefined;
};

export function SolvedProgressRing({ solved, catalog }: SolvedProgressRingProps) {
  const solvedTotal = solved?.total ?? 0;
  const catalogTotal = catalog?.total ?? 0;

  const arcs = useMemo(() => {
    const easy = {
      solved: solved?.easy ?? 0,
      total: catalog?.easy ?? 0,
    };
    const medium = {
      solved: solved?.medium ?? 0,
      total: catalog?.medium ?? 0,
    };
    const hard = {
      solved: solved?.hard ?? 0,
      total: catalog?.hard ?? 0,
    };

    const easyFrac = easy.total > 0 ? easy.solved / easy.total : 0;
    const medFrac = medium.total > 0 ? medium.solved / medium.total : 0;
    const hardFrac = hard.total > 0 ? hard.solved / hard.total : 0;

    const medFilled = CIRC * medFrac;
    const hardFilled = CIRC * hardFrac;

    const specs: ArcSpec[] = [
      {
        key: "hard",
        color: miui.danger,
        fraction: hardFrac,
        dashOffset: 0,
        delay: 0.2,
      },
      {
        key: "medium",
        color: miui.caution,
        fraction: medFrac,
        dashOffset: -hardFilled,
        delay: 0.1,
      },
      {
        key: "easy",
        color: miui.success,
        fraction: easyFrac,
        dashOffset: -(hardFilled + medFilled),
        delay: 0,
      },
    ];

    return specs;
  }, [solved, catalog]);

  return (
    <Box
      sx={{
        position: "relative",
        width: SIZE,
        height: SIZE,
        flexShrink: 0,
      }}
    >
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden>
        <g transform={`rotate(-90 ${CX} ${CY})`}>
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke={miui.elevated}
            strokeWidth={STROKE}
          />
          {arcs.map((arc) => {
            const filled = CIRC * arc.fraction;
            const gap = CIRC - filled;
            return (
              <motion.circle
                key={arc.key}
                cx={CX}
                cy={CY}
                r={R}
                fill="none"
                stroke={arc.color}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={`${filled} ${gap}`}
                initial={{ strokeDashoffset: CIRC + arc.dashOffset }}
                animate={{ strokeDashoffset: arc.dashOffset }}
                transition={{
                  duration: 0.8,
                  ease: ARC_EASE,
                  delay: arc.delay,
                }}
              />
            );
          })}
        </g>
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
          pointerEvents: "none",
        }}
      >
        <Typography
          sx={{
            ...monoStatSx,
            fontSize: "22px",
            fontWeight: 700,
            lineHeight: 1.1,
            color: miui.text,
          }}
        >
          <AnimatedNumber value={solvedTotal} />
        </Typography>
        <Typography
          sx={{
            ...monoStatSx,
            fontSize: "11px",
            fontWeight: 400,
            color: miui.textDim,
            mt: 0.25,
          }}
        >
          / <AnimatedNumber value={catalogTotal} duration={500} /> solved
        </Typography>
      </Box>
    </Box>
  );
}
