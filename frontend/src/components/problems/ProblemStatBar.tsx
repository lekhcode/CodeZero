import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import type { DifficultyLevel, ProblemCatalogStats } from "@/types/api.types";
import { difficultyColor } from "@/utils/difficulty";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { FadeInCard } from "@/components/ui/FadeInCard";
import { miui, monoStatSx } from "@/theme/theme";
import { HalfArcGauge } from "@/components/problems/HalfArcGauge";

type ProblemStatBarProps = {
  stats: ProblemCatalogStats | undefined;
  loading?: boolean;
  difficulty: DifficultyLevel[];
  onDifficultyChange: (next: DifficultyLevel[]) => void;
  filteredTotal?: number;
};

type SectionKey = "total" | DifficultyLevel;

type SectionConfig = {
  key: SectionKey;
  label: string;
  value: number;
  color: string;
  difficulty?: DifficultyLevel;
};

export function ProblemStatBar({
  stats,
  loading = false,
  difficulty,
  onDifficultyChange,
  filteredTotal,
}: ProblemStatBarProps) {
  const total = stats?.total ?? 0;
  const easy = stats?.easy ?? 0;
  const medium = stats?.medium ?? 0;
  const hard = stats?.hard ?? 0;

  const sections: SectionConfig[] = [
    { key: "total", label: "ALL", value: loading ? 0 : total, color: miui.accent },
    { key: "EASY", label: "EASY", value: loading ? 0 : easy, color: difficultyColor("EASY"), difficulty: "EASY" },
    {
      key: "MEDIUM",
      label: "MEDIUM",
      value: loading ? 0 : medium,
      color: difficultyColor("MEDIUM"),
      difficulty: "MEDIUM",
    },
    { key: "HARD", label: "HARD", value: loading ? 0 : hard, color: difficultyColor("HARD"), difficulty: "HARD" },
  ];

  const percentOfTotal = (n: number) => (total > 0 ? (n / total) * 100 : 0);
  const filteredPct =
    filteredTotal !== undefined && total > 0 ? (filteredTotal / total) * 100 : 100;

  const isActive = (section: SectionConfig) => {
    if (section.difficulty === undefined) {
      return difficulty.length === 0;
    }
    return difficulty.includes(section.difficulty);
  };

  const handleClick = (section: SectionConfig) => {
    if (section.difficulty === undefined) {
      onDifficultyChange([]);
      return;
    }
    if (difficulty.includes(section.difficulty)) {
      onDifficultyChange(difficulty.filter((d) => d !== section.difficulty));
    } else {
      onDifficultyChange([...difficulty, section.difficulty]);
    }
  };

  const sectionPercent = (section: SectionConfig) =>
    section.key === "total" ? filteredPct : percentOfTotal(section.value);

  const bottomLabel = (section: SectionConfig): string => {
    if (section.key === "total" && filteredTotal !== undefined && filteredTotal !== total) {
      return `${filteredTotal.toLocaleString()} match filters`;
    }
    return `${section.value.toLocaleString()} in catalog`;
  };

  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        bgcolor: miui.paper,
        border: `1px solid ${miui.border}`,
        borderRadius: "12px",
        py: "20px",
        overflow: "hidden",
      }}
    >
      {sections.map((section, index) => {
        const active = isActive(section);
        const pct = sectionPercent(section);
        return (
          <FadeInCard
            key={section.key}
            delay={index * 0.06}
            className="problem-stat-section"
          >
          <SectionCell
            active={active}
            color={section.color}
            showDivider={index > 0}
            onClick={() => handleClick(section)}
          >
            <Typography
              sx={{
                fontFamily: monoStatSx.fontFamily,
                fontSize: "10px",
                fontWeight: 400,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: miui.textDim,
                mb: 0.75,
              }}
            >
              {section.label}
            </Typography>

            <HalfArcGauge percent={pct} color={section.color} />

            <Box sx={{ textAlign: "center", mt: -0.5 }}>
              <Typography
                sx={{
                  ...monoStatSx,
                  fontSize: "22px",
                  fontWeight: 700,
                  lineHeight: 1.1,
                  color: active ? section.color : miui.text,
                }}
              >
                <AnimatedNumber value={section.value} />
              </Typography>
              <Typography
                sx={{
                  ...monoStatSx,
                  fontSize: "11px",
                  fontWeight: 400,
                  color: miui.textMuted,
                }}
              >
                {Math.round(pct)}%
              </Typography>
            </Box>

            <Typography
              sx={{
                ...monoStatSx,
                fontSize: "11px",
                fontWeight: 400,
                color: miui.textMuted,
                mt: 0.75,
                textAlign: "center",
                px: 1,
              }}
            >
              {bottomLabel(section)}
            </Typography>
          </SectionCell>
          </FadeInCard>
        );
      })}
    </Box>
  );
}

function SectionCell({
  children,
  active,
  color,
  showDivider,
  onClick,
}: {
  children: ReactNode;
  active: boolean;
  color: string;
  showDivider: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        flex: 1,
        minWidth: 0,
        border: "none",
        background: active ? miui.active : "transparent",
        borderTop: active ? `2px solid ${color}` : "2px solid transparent",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        py: 0.5,
        transition:
          "background-color 150ms ease, border-color 150ms ease, color 150ms ease",
        "@media (prefers-reduced-motion: no-preference)": {
          "&:hover": {
            bgcolor: active ? miui.active : miui.hover,
          },
        },
      }}
    >
      {showDivider ? (
        <Box
          sx={{
            position: "absolute",
            left: 0,
            top: "20%",
            height: "60%",
            width: "1px",
            bgcolor: miui.border,
          }}
        />
      ) : null}
      {children}
    </Box>
  );
}
