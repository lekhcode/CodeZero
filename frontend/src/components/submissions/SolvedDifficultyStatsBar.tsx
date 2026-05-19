import { Box } from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import LooksOneRoundedIcon from "@mui/icons-material/LooksOneRounded";
import LooksTwoRoundedIcon from "@mui/icons-material/LooksTwoRounded";
import Looks3RoundedIcon from "@mui/icons-material/Looks3Rounded";
import { motion } from "framer-motion";
import type { SolvedDifficultyStats } from "@/types/api.types";
import { RadialStatRing } from "@/components/ui/RadialStatRing";
import { difficultyColor } from "@/utils/difficulty";
import { miui } from "@/theme/theme";
import { staggerContainer, staggerItem } from "@/theme/motion";

type SolvedDifficultyStatsBarProps = {
  stats: SolvedDifficultyStats | undefined;
  loading?: boolean;
  /** Smaller rings for submissions header */
  compact?: boolean;
};

export function SolvedDifficultyStatsBar({
  stats,
  loading = false,
  compact = false,
}: SolvedDifficultyStatsBarProps) {
  const total = stats?.total ?? 0;
  const easy = stats?.easy ?? 0;
  const medium = stats?.medium ?? 0;
  const hard = stats?.hard ?? 0;
  const ringSize = compact ? 56 : 108;
  const iconSize = compact ? 12 : 14;

  const percentOfSolved = (n: number) => (total > 0 ? (n / total) * 100 : 0);

  const rings = [
    {
      key: "total",
      label: "Solved",
      value: loading ? 0 : total,
      percent: total > 0 ? 100 : 0,
      color: miui.primary,
      icon: <CheckCircleRoundedIcon sx={{ fontSize: iconSize, color: miui.primary }} />,
      active: true,
    },
    {
      key: "EASY",
      label: "Easy",
      value: loading ? 0 : easy,
      percent: percentOfSolved(easy),
      color: difficultyColor("EASY"),
      icon: <LooksOneRoundedIcon sx={{ fontSize: iconSize, color: difficultyColor("EASY") }} />,
      active: true,
    },
    {
      key: "MEDIUM",
      label: "Medium",
      value: loading ? 0 : medium,
      percent: percentOfSolved(medium),
      color: difficultyColor("MEDIUM"),
      icon: <LooksTwoRoundedIcon sx={{ fontSize: iconSize, color: difficultyColor("MEDIUM") }} />,
      active: true,
    },
    {
      key: "HARD",
      label: "Hard",
      value: loading ? 0 : hard,
      percent: percentOfSolved(hard),
      color: difficultyColor("HARD"),
      icon: <Looks3RoundedIcon sx={{ fontSize: iconSize, color: difficultyColor("HARD") }} />,
      active: true,
    },
  ] as const;

  return (
    <Box
      component={motion.div}
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "repeat(4, 1fr)", sm: "repeat(4, minmax(0, 88px))" },
        gap: compact ? 0.75 : 1.5,
        p: compact ? 0.75 : { xs: 1, sm: 1.5 },
        mb: compact ? 1 : 1.5,
        maxWidth: compact ? 400 : undefined,
        borderRadius: compact ? 2.5 : 3,
        bgcolor: miui.paper,
        border: `1px solid ${miui.border}`,
        boxShadow: "none",
      }}
    >
      {rings.map((ring, index) => (
        <Box key={ring.key} component={motion.div} variants={staggerItem}>
          <RadialStatRing
            label={ring.label}
            value={ring.value}
            percent={loading ? 0 : ring.percent}
            color={ring.color}
            icon={ring.icon}
            active={ring.active}
            ringSize={ringSize}
            hideHint
            delay={index * 0.03}
          />
        </Box>
      ))}
    </Box>
  );
}
