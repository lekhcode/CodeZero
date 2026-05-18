import type { ReactNode } from "react";
import { Box, alpha } from "@mui/material";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import LooksOneRoundedIcon from "@mui/icons-material/LooksOneRounded";
import LooksTwoRoundedIcon from "@mui/icons-material/LooksTwoRounded";
import Looks3RoundedIcon from "@mui/icons-material/Looks3Rounded";
import { motion } from "framer-motion";
import type { DifficultyLevel, ProblemCatalogStats } from "@/types/api.types";
import { AnimatedBanner } from "@/components/ui/AnimatedBanner";
import { RadialStatRing } from "@/components/ui/RadialStatRing";
import { difficultyColor, formatDifficulty } from "@/utils/difficulty";
import { miui } from "@/theme/theme";
import { staggerContainer, staggerItem } from "@/theme/motion";

type ProblemCatalogStatsBarProps = {
  stats: ProblemCatalogStats | undefined;
  loading?: boolean;
  difficulty: DifficultyLevel[];
  onDifficultyChange: (next: DifficultyLevel[]) => void;
  filteredTotal?: number;
};

type RingConfig = {
  key: "total" | DifficultyLevel;
  label: string;
  value: number;
  color: string;
  icon: ReactNode;
  difficulty?: DifficultyLevel;
};

export function ProblemCatalogStatsBar({
  stats,
  loading = false,
  difficulty,
  onDifficultyChange,
  filteredTotal,
}: ProblemCatalogStatsBarProps) {
  const total = stats?.total ?? 0;
  const easy = stats?.easy ?? 0;
  const medium = stats?.medium ?? 0;
  const hard = stats?.hard ?? 0;

  const rings: RingConfig[] = [
    {
      key: "total",
      label: "All",
      value: loading ? 0 : total,
      color: miui.primary,
      icon: <GridViewRoundedIcon sx={{ fontSize: 14, color: miui.primary }} />,
    },
    {
      key: "EASY",
      label: "Easy",
      value: loading ? 0 : easy,
      color: difficultyColor("EASY"),
      icon: <LooksOneRoundedIcon sx={{ fontSize: 14, color: difficultyColor("EASY") }} />,
      difficulty: "EASY",
    },
    {
      key: "MEDIUM",
      label: "Medium",
      value: loading ? 0 : medium,
      color: difficultyColor("MEDIUM"),
      icon: <LooksTwoRoundedIcon sx={{ fontSize: 14, color: difficultyColor("MEDIUM") }} />,
      difficulty: "MEDIUM",
    },
    {
      key: "HARD",
      label: "Hard",
      value: loading ? 0 : hard,
      color: difficultyColor("HARD"),
      icon: <Looks3RoundedIcon sx={{ fontSize: 14, color: difficultyColor("HARD") }} />,
      difficulty: "HARD",
    },
  ];

  const percentOfTotal = (n: number) => (total > 0 ? (n / total) * 100 : 0);

  const isActive = (ring: RingConfig) => {
    if (ring.difficulty === undefined) {
      return difficulty.length === 0;
    }
    return difficulty.includes(ring.difficulty);
  };

  const handleClick = (ring: RingConfig) => {
    if (ring.difficulty === undefined) {
      onDifficultyChange([]);
      return;
    }
    if (difficulty.includes(ring.difficulty)) {
      onDifficultyChange(difficulty.filter((d) => d !== ring.difficulty));
    } else {
      onDifficultyChange([...difficulty, ring.difficulty]);
    }
  };

  const filteredPct =
    filteredTotal !== undefined && total > 0 ? (filteredTotal / total) * 100 : 100;

  return (
    <AnimatedBanner
      subtle
      sx={{
        borderRadius: 3,
        background: `linear-gradient(160deg, ${miui.paper} 0%, ${alpha(miui.bg, 0.85)} 100%)`,
        border: `1px solid ${miui.border}`,
        boxShadow: `0 4px 24px ${alpha(miui.primary, 0.06)}`,
        p: { xs: 1, sm: 1.5 },
      }}
    >
      <Box
        component={motion.div}
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" },
          gap: 1.5,
        }}
      >
      {rings.map((ring, index) => {
        const active = isActive(ring);
        const percent =
          ring.key === "total" ? filteredPct : percentOfTotal(ring.value);

        let hint: string | undefined;
        if (ring.key === "total" && filteredTotal !== undefined && filteredTotal !== total) {
          hint = `${filteredTotal.toLocaleString()} match filters`;
        } else if (ring.key === "total" && active) {
          hint = "Full catalog";
        } else if (ring.difficulty && active) {
          hint = "Tap to remove filter";
        } else if (ring.difficulty) {
          hint = `Filter ${formatDifficulty(ring.difficulty).toLowerCase()}`;
        }

        return (
          <Box key={ring.key} component={motion.div} variants={staggerItem}>
            <RadialStatRing
              label={ring.label}
              value={loading ? 0 : ring.value}
              percent={loading ? 0 : percent}
              color={ring.color}
              icon={ring.icon}
              hint={hint}
              active={active}
              interactive
              onClick={() => handleClick(ring)}
              delay={index * 0.04}
            />
          </Box>
        );
      })}
      </Box>
    </AnimatedBanner>
  );
}
